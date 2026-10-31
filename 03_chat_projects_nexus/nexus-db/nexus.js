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
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
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

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        session_id TEXT DEFAULT 'default',
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

    try {
      this.db.exec("ALTER TABLE chat_messages ADD COLUMN session_id TEXT DEFAULT 'default'");
    } catch {}

    try {
      this.db.exec("INSERT OR IGNORE INTO projects (id, name, description) VALUES ('space_tide', 'Space Tide', 'Projeto Mestre do Jogo Space Tide')");
    } catch {}
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

  // Chat Sessions Management
  getSessions(projectId = 'global') {
    const normProj = (projectId || 'global').toLowerCase();
    return this.db.prepare('SELECT * FROM chat_sessions WHERE LOWER(project_id) = ? ORDER BY updated_at DESC').all(normProj);
  }

  createSession(projectId = 'global', title = 'Nova Conversa') {
    const normProj = (projectId || 'global').toLowerCase();
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.db.prepare(`
      INSERT INTO chat_sessions (id, project_id, title)
      VALUES (?, ?, ?)
    `).run(id, normProj, title);
    return { id, project_id: normProj, title };
  }

  deleteSession(sessionId) {
    this.db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(sessionId);
    this.db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(sessionId);
    return true;
  }

  // Persistent Chat History
  saveChatMessage({ projectId = 'global', sessionId = 'default', sender, text, provider = null, tier = null, model = null, toolResults = [] }) {
    if (!text || typeof text !== 'string' || !text.trim()) return null;
    const normProj = (projectId || 'global').toLowerCase();

    // Garante que a sessão existe e atualiza timestamp
    try {
      const sess = this.db.prepare('SELECT id FROM chat_sessions WHERE id = ?').get(sessionId);
      if (!sess) {
        const title = text.replace(/[\r\n]+/g, ' ').slice(0, 32) + (text.length > 32 ? '...' : '');
        this.db.prepare("INSERT OR IGNORE INTO chat_sessions (id, project_id, title) VALUES (?, ?, ?)").run(sessionId, normProj, title);
      } else {
        this.db.prepare("UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?").run(sessionId);
      }
    } catch {}

    const stmt = this.db.prepare(`
      INSERT INTO chat_messages (project_id, session_id, sender, text, provider, tier, model, tool_results)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      normProj,
      sessionId,
      sender,
      text,
      provider,
      tier,
      model,
      toolResults && toolResults.length > 0 ? JSON.stringify(toolResults) : null
    );
  }

  getChatMessages(projectId = 'global', sessionId = null, limit = 100) {
    const normProj = (projectId || 'global').toLowerCase();
    let query = 'SELECT id, project_id, session_id, sender, text, provider, tier, model, tool_results, is_gold, created_at FROM chat_messages WHERE LOWER(project_id) = ? AND LENGTH(TRIM(text)) > 0';
    const params = [normProj];
    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }
    query += ' ORDER BY id ASC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(r => ({
      ...r,
      tool_results: r.tool_results ? JSON.parse(r.tool_results) : []
    }));
  }

  markLastMessageGold(projectId = 'global') {
    const normProj = (projectId || 'global').toLowerCase();
    const last = this.db.prepare('SELECT id FROM chat_messages WHERE LOWER(project_id) = ? ORDER BY id DESC LIMIT 1').get(normProj);
    if (last) {
      this.db.prepare('UPDATE chat_messages SET is_gold = 1 WHERE id = ?').run(last.id);
    }
    return last;
  }
}

export const nexus = new NexusDB();
