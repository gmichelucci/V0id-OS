import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { tools, compressOutput } from './tools.js';
import { V0idAgent } from './agent.js';
import { V0idWSServer } from './ws_server.js';
import { nexus } from '../../03_chat_projects_nexus/nexus-db/nexus.js';

console.log('[TEST] Starting V0id Agent & Tools verification...');

// 1. Test Tools
// a) write_file & read_file with normalized parameters
const testFile = 'test_tmp_tool.txt';
tools.write_file({ path: testFile, text: 'Line 1\nLine 2\nLine 3\nLine 4' });
const readContent = tools.read_file({ file: testFile, startLine: 2, endLine: 3 });
assert(readContent.includes('Line 2') && readContent.includes('Line 3'), 'read_file failed');
assert(!readContent.includes('Line 1'), 'Line 1 should be excluded by line bounds');

// b) apply_diff
tools.apply_diff({ file: testFile, target: 'Line 2', replacement: 'Line TWO' });
const diffContent = tools.read_file({ filePath: testFile });
assert(diffContent.includes('Line TWO'), 'apply_diff failed');

// c) list_dir
const dirList = tools.list_dir({ dir: '.' });
assert(dirList.includes('V0ID_SPEC.md'), 'list_dir failed');

// d) run_command
const cmdOut = tools.run_command({ cmd: 'node -v' });
assert(cmdOut.startsWith('v22'), 'run_command node -v failed');

// e) compressOutput
const bigText = Array.from({ length: 100 }, (_, i) => `Line ${i}`).join('\n');
const compressed = compressOutput(bigText, 40);
assert(compressed.includes('linhas comprimidas'), 'RTK compression failed');

// Clean temp test file
fs.unlinkSync(path.resolve(process.cwd(), testFile));
console.log('[TEST] Real tools (write, read, diff, list, run_command, RTK) verified!');

// 2. Test WebSocket Server
const testWs = new V0idWSServer(7780);
const started = testWs.start();
assert(started === true, 'WebSocket Server start failed');
testWs.stop();
console.log('[TEST] WebSocket Server lifecycle verified!');

// 3. Test Agent Tool Parsing (Native, JSON, Array, Markdown File Annotations)
const agent = new V0idAgent();

// 3a. Native tool calls
const nativeCalls = [{ tool: 'run_command', args: { command: 'node -v' } }];
const parsedNative = agent.parseTools('', nativeCalls);
assert(parsedNative.length === 1 && parsedNative[0].tool === 'run_command');

// 3b. JSON block
const jsonBlock = '```json\n{"tool": "write_file", "args": {"filePath": "test.txt", "content": "123"}}\n```';
const parsedJson = agent.parseTools(jsonBlock);
assert(parsedJson.length === 1 && parsedJson[0].tool === 'write_file');

// 3c. Markdown code block with filepath comment (Rescue parser)
const mdCommentBlock = '```html\n<!-- filepath: ui-launcher/index.html -->\n<!DOCTYPE html><html><body>Test</body></html>\n```';
const parsedRescue = agent.parseTools(mdCommentBlock, [], { allowGhostWrite: true });
assert(parsedRescue.length === 1 && parsedRescue[0].tool === 'write_file');
assert(parsedRescue[0].args.filePath === 'ui-launcher/index.html');
console.log('[TEST] Tool parsing (native, JSON, rescue markdown) verified!');

// 4. Test Anti-Ghost-Write & Real File Writing Enforcement
console.log('[TEST] Verifying Anti-Ghost-Write and Real File Creation...');

const targetRealFile = 'ui-launcher/test_real_output.html';
if (fs.existsSync(targetRealFile)) fs.unlinkSync(targetRealFile);

let ghostAttempts = 0;
const ghostRouter = {
  async route(prompt) {
    if (prompt.includes('micro-tarefas sequenciais')) {
      return {
        text: JSON.stringify([
          { step: 1, prompt: 'Criar arquivo real ui-launcher/test_real_output.html com HTML do estúdio' }
        ])
      };
    }
    ghostAttempts++;
    if (ghostAttempts === 1) {
      // Attempt 1: Ghost Write (Model returns only text without invoking tools)
      return {
        text: 'Claro! Eu criei o arquivo ui-launcher/test_real_output.html com sucesso. Tudo está pronto.',
        toolCalls: []
      };
    }
    // Attempt 2: After being rejected and re-prompted, model calls write_file
    return {
      text: 'Entendido. Gravando agora o arquivo real via write_file.',
      toolCalls: [
        {
          tool: 'write_file',
          args: {
            filePath: targetRealFile,
            content: '<!DOCTYPE html><h1>V0id Real UI</h1>'
          }
        }
      ]
    };
  }
};

const antiGhostAgent = new V0idAgent({ router: ghostRouter });
const ghostGoalId = await antiGhostAgent.planGoal('Teste Anti-Ghost-Write');
await antiGhostAgent.runLoop();

// Verify that Ghost Attempt 1 was rejected and Attempt 2 actually wrote to disk!
assert(ghostAttempts >= 2, 'Agent should have re-prompted model after Ghost Write attempt');
assert(fs.existsSync(path.resolve(process.cwd(), targetRealFile)), 'File MUST exist on disk before task is done');
const fileContents = fs.readFileSync(path.resolve(process.cwd(), targetRealFile), 'utf8');
assert(fileContents.includes('V0id Real UI'), 'File contents on disk must match tool args');

// Verify task status in SQLite is DONE and recorded toolsExecuted >= 1
const ghostTasks = nexus.getTasksByGoal(ghostGoalId);
assert(ghostTasks[0].status === 'DONE', 'Task should be DONE after real write');
const checkpoint = JSON.parse(ghostTasks[0].checkpoint_data);
assert(checkpoint.toolsExecuted >= 1, 'Checkpoint must record toolsExecuted >= 1');

// Clean up
fs.unlinkSync(path.resolve(process.cwd(), targetRealFile));
console.log('[TEST] Anti-Ghost-Write successfully rejected text-only and forced real disk write!');

// 5. Test Stubborn Ghost Write Rejection (Never marks DONE if 0 tools executed)
const stubbornRouter = {
  async route() {
    return {
      text: 'Desculpe, sou apenas um modelo de linguagem e não vou chamar ferramentas.',
      toolCalls: []
    };
  }
};
const stubbornAgent = new V0idAgent({ router: stubbornRouter });
const stubbornGoalId = 'goal_stubborn_' + Date.now();
nexus.createGoal(stubbornGoalId, 'Stubborn Goal');
nexus.enqueueTask(stubbornGoalId, 1, 'Tarefa que recusa ferramentas');

await stubbornAgent.runLoop();
const stubbornTasks = nexus.getTasksByGoal(stubbornGoalId);
assert(stubbornTasks[0].status === 'FAILED', 'Stubborn task with zero tools MUST be FAILED, never DONE');
assert(stubbornTasks[0].last_error.includes('Ghost Write'), 'Last error must report Ghost Write');
console.log('[TEST] Fake checkpoint prevention verified: tasks with zero tools are marked FAILED!');

console.log('[TEST] All Agent, Tools, Anti-Ghost-Write, and Loop tests passed 100%!');
