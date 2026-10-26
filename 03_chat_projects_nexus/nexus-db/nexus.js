// Nexus DB - SQLite Cross-Tag & Autonomous Task Queue Engine
// Zero external dependencies, uses Node.js native node:sqlite DatabaseSync

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'nexus.db');

export class NexusDB {
  constructor(dbPath = DB_PATH) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS history_cross_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT,
        studio TEXT,
        tags TEXT,
        title TEXT,
        content TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS autonomous_goals (
        id TEXT PRIMARY KEY,
        project_id TEXT DEFAULT 'space_tide',
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('PENDING', 'IN_PROGRESS', 'HIBERNATING', 'DONE', 'FAILED')) DEFAULT 'PENDING',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id TEXT NOT NULL,
        step_order INTEGER NOT NULL,
        self_prompt TEXT NOT NULL,
        status TEXT CHECK(status IN ('PENDING', 'IN_PROGRESS', 'HIBERNATING', 'DONE', 'FAILED')) DEFAULT 'PENDING',
        checkpoint_data TEXT,
        last_error TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (goal_id) REFERENCES autonomous_goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS token_hibernation (
        provider TEXT PRIMARY KEY,
        hibernating_until INTEGER NOT NULL,
        reason TEXT,
        retry_after_seconds INTEGER,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        provider TEXT,
        tier TEXT,
        model TEXT,
        tool_results TEXT,
        is_gold INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      DELETE FROM chat_messages WHERE LENGTH(TRIM(text)) = 0 OR text IS NULL;
    `);
  }

  // Projects
  getProjects() {
    return this.db.prepare('SELECT * FROM projects ORDER BY created_at ASC').all();
  }

  // Cross-tag History
  addHistory(projectId, studio, tags, title, content, metadata = {}) {
    const stmt = this.db.prepare(`
      INSERT INTO history_cross_tags (project_id, studio, tags, title, content, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(projectId, studio, tags, title, content, JSON.stringify(metadata));
  }

  queryHistoryByTag(tag) {
    const stmt = this.db.prepare(`
      SELECT * FROM history_cross_tags WHERE tags LIKE ? ORDER BY created_at DESC
    `);
    return stmt.all(`%${tag}%`);
  }

  // Autonomous Goals
  createGoal(id, title, description = '', projectId = 'space_tide') {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO autonomous_goals (id, project_id, title, description, status, updated_at)
      VALUES (?, ?, ?, ?, 'PENDING', datetime('now'))
    `);
    stmt.run(id, projectId, title, description);
    return id;
  }

  getGoal(id) {
    return this.db.prepare('SELECT * FROM autonomous_goals WHERE id = ?').get(id);
  }

  updateGoalStatus(id, status) {
    const stmt = this.db.prepare(`
      UPDATE autonomous_goals SET status = ?, updated_at = datetime('now') WHERE id = ?
    `);
    return stmt.run(status, id);
  }

  // Task Queue
  enqueueTask(goalId, stepOrder, selfPrompt, checkpointData = null) {
    const stmt = this.db.prepare(`
      INSERT INTO task_queue (goal_id, step_order, self_prompt, status, checkpoint_data)
      VALUES (?, ?, ?, 'PENDING', ?)
    `);
    return stmt.run(goalId, stepOrder, selfPrompt, checkpointData ? JSON.stringify(checkpointData) : null);
  }

  getNextPendingTask() {
    return this.db.prepare(`
      SELECT * FROM task_queue 
      WHERE status IN ('PENDING', 'HIBERNATING')
      ORDER BY step_order ASC, id ASC 
      LIMIT 1
    `).get();
  }

  getTasksByGoal(goalId) {
    return this.db.prepare('SELECT * FROM task_queue WHERE goal_id = ? ORDER BY step_order ASC').all(goalId);
  }

  updateTaskStatus(taskId, status, checkpointData = null, lastError = null) {
    const stmt = this.db.prepare(`
      UPDATE task_queue 
      SET status = ?, 
          checkpoint_data = COALESCE(?, checkpoint_data), 
          last_error = ?, 
          updated_at = datetime('now')
      WHERE id = ?
    `);
    return stmt.run(status, checkpointData ? JSON.stringify(checkpointData) : null, lastError, taskId);
  }

  // Hibernation Management
  setHibernation(provider, durationMs, reason = 'Rate limit 429', retryAfterSec = 65) {
    const until = Date.now() + durationMs;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO token_hibernation (provider, hibernating_until, reason, retry_after_seconds, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(provider, until, reason, retryAfterSec);
    return until;
  }

  isProviderHibernating(provider) {
    const record = this.db.prepare('SELECT * FROM token_hibernation WHERE provider = ?').get(provider);
    if (!record) return false;
    if (Date.now() < record.hibernating_until) {
      return { hibernating: true, remainingMs: record.hibernating_until - Date.now(), reason: record.reason };
    }
    this.clearHibernation(provider);
    return false;
  }

  clearHibernation(provider) {
    this.db.prepare('DELETE FROM token_hibernation WHERE provider = ?').run(provider);
  }

  getAllHibernations() {
    return this.db.prepare('SELECT * FROM token_hibernation').all();
  }

  // Persistent Chat History
  saveChatMessage({ projectId = 'global', sender, text, provider = null, tier = null, model = null, toolResults = [] }) {
    if (!text || typeof text !== 'string' || !text.trim()) return null;
    const stmt = this.db.prepare(`
      INSERT INTO chat_messages (project_id, sender, text, provider, tier, model, tool_results)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      projectId,
      sender,
      text,
      provider,
      tier,
      model,
      toolResults && toolResults.length > 0 ? JSON.stringify(toolResults) : null
    );
  }

  getChatMessages(projectId = 'global', limit = 100) {
    const stmt = this.db.prepare(`
      SELECT id, project_id, sender, text, provider, tier, model, tool_results, is_gold, created_at
      FROM chat_messages
      WHERE project_id = ? AND LENGTH(TRIM(text)) > 0
      ORDER BY id ASC
      LIMIT ?
    `);
    const rows = stmt.all(projectId, limit);
    return rows.map(r => ({
      ...r,
      tool_results: r.tool_results ? JSON.parse(r.tool_results) : []
    }));
  }

  markLastMessageGold(projectId = 'global') {
    const last = this.db.prepare('SELECT id FROM chat_messages WHERE project_id = ? ORDER BY id DESC LIMIT 1').get(projectId);
    if (last) {
      this.db.prepare('UPDATE chat_messages SET is_gold = 1 WHERE id = ?').run(last.id);
    }
    return last;
  }
}

export const nexus = new NexusDB();
