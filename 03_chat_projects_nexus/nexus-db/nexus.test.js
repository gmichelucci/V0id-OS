import { nexus } from './nexus.js';
import assert from 'node:assert';

console.log('[TEST] Initializing Nexus DB verification...');

// 1. Projects
const projs = nexus.getProjects();
console.log(`[TEST] Projects found: ${projs.length}`);
assert(projs.some(p => p.id === 'space_tide'), 'Space Tide must be pre-registered');

// 2. Cross-tags history
nexus.addHistory('space_tide', 'game-studio', '#SpaceTide #GameStudio #Combat', 'Player Ship Spec', 'Ship speed and shield stats');
const foundHistory = nexus.queryHistoryByTag('SpaceTide');
assert(foundHistory.length > 0, 'Cross tag history query failed');
console.log(`[TEST] Cross-tag history test passed (${foundHistory.length} items found).`);

// 3. Goals & Task Queue
const goalId = 'test_bootstrap_' + Date.now();
nexus.createGoal(goalId, 'Test Bootstrap Goal', 'Testing goal queue execution');
nexus.enqueueTask(goalId, 1, 'Verify filesystem');
nexus.enqueueTask(goalId, 2, 'Build router');

let nextTask = nexus.getNextPendingTask();
assert(nextTask !== undefined && nextTask.self_prompt === 'Verify filesystem', 'Next task must be step 1');

nexus.updateTaskStatus(nextTask.id, 'DONE', { result: 'verified' });

nextTask = nexus.getNextPendingTask();
assert(nextTask !== undefined && nextTask.self_prompt === 'Build router', 'Next task must be step 2');
nexus.updateTaskStatus(nextTask.id, 'DONE');

// 4. Hibernation
nexus.setHibernation('gemini', 5000, '429 Rate Limit', 5);
const hibState = nexus.isProviderHibernating('gemini');
assert(hibState && hibState.hibernating === true, 'Provider should be hibernating');
nexus.clearHibernation('gemini');
assert(nexus.isProviderHibernating('gemini') === false, 'Hibernation should be cleared');

console.log('[TEST] Nexus DB fully verified and operational!');
