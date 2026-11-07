import assert from 'node:assert';
import { OmniRouter, Gatekeeper } from './index.js';
import { RateLimitError, TOOL_DEFINITIONS } from './providers.js';
import { tools } from '../v0id-cli/tools.js';
import { nexus } from '../../03_chat_projects_nexus/nexus-db/nexus.js';

console.log('[TEST] Initializing OmniRouter, Gatekeeper & Tools hierarchy verification...');

// 1. Gatekeeper Test: Fast classification and Caveman mode
const gatekeeper = new Gatekeeper();
const simpleCheck = await gatekeeper.process('ping');
assert(simpleCheck.isSimple === true, 'Ping should be simple query');
assert(simpleCheck.directResponse.includes('V0id OS Ativo'), 'Ping should have direct response');
assert(simpleCheck.tier === 'fast_flash', 'Gatekeeper must operate on fast_flash tier');
console.log('[TEST] Gatekeeper fast_flash tier verified.');

const complexCheck = await gatekeeper.process('Crie um endpoint /api/teste e refatore o router.js');
assert(complexCheck.isSimple === false, 'Refactoring query must be marked complex');
assert(complexCheck.complexity === 'complex', 'Complexity must be complex');

const cavemanCheck = await gatekeeper.process('Crie um script', 'Space Tide', { cavemanMode: true });
assert(cavemanCheck.superPrompt.includes('CAVE-MAN MODE'), 'Caveman mode toggle must be respected');
console.log('[TEST] Gatekeeper classification & Caveman mode verified.');

// 2. OmniRouter Model Hierarchy Verification
const logs = [];
const router = new OmniRouter({
  onStatus: (msg) => logs.push(msg)
});

const providers = router.getAvailableProviders();
console.log(`[TEST] Available providers in hierarchy: ${providers.length}`);
providers.forEach((p, idx) => console.log(` [${idx + 1}] Tier ${p.tier} | ${p.name} (${p.model || 'bridge'})`));

// Tier 1 contains Pro / Argon or agy
const tier1 = providers.filter(p => p.tier === 1);
assert(tier1.length > 0, 'Tier 1 (Elite) must contain models');
assert(tier1.some(p => p.model?.includes('pro') || p.type === 'agy_cli'), 'Tier 1 must contain Pro or agy bridge');
console.log('[TEST] Tier 1 (Pro/Argon Elite) verified!');

// Tier 2 contains Flash models
const tier2 = providers.filter(p => p.tier === 2);
assert(tier2.length > 0, 'Tier 2 (Flash) must contain models');
assert(tier2.some(p => p.model?.includes('flash')), 'Tier 2 must contain Flash models');
console.log('[TEST] Tier 2 (Alta Disponibilidade Flash) verified!');

// Tier 3 contains 120B models (Cerebras / Groq) if configured
const tier3 = providers.filter(p => p.tier === 3);
if (process.env.CEREBRAS_API_KEY || process.env.GROQ_API_KEY) {
  assert(tier3.length > 0, 'Tier 3 (120B) must contain models when API key present');
  console.log('[TEST] Tier 3 (120B Ultra-Fast Cerebras/Groq) verified!');
}

// 3. Uncensored route verification
if (process.env.OPENROUTER_API_KEY) {
  const uncensoredProviders = router.getAvailableProviders({ uncensored: true });
  assert(uncensoredProviders.some(p => p.id === 'openrouter_uncensored'), 'Uncensored route must point to uncensored model');
  console.log('[TEST] Uncensored route verified.');
}

// 4. RateLimit & Hibernation Verification
const rle = new RateLimitError('test_prov', 'Too many requests', 2);
assert(rle.isRateLimit === true);
assert(rle.retryAfterSec === 2);

nexus.setHibernation('gemini_test_hier', 500, '429 Rate Limit', 1);
assert(nexus.isProviderHibernating('gemini_test_hier').hibernating === true);
await new Promise(r => setTimeout(r, 600));
assert(nexus.isProviderHibernating('gemini_test_hier') === false);
console.log('[TEST] Hibernation timing & auto-expiration verified.');

// 5. Verification of Tools without RTK-Mutilation
console.log('[TEST] Verifying tools engine...');
const selfContent = tools.read_file({ filePath: 'V0ID_SPEC.md', startLine: 1, endLine: 30 });
assert(selfContent.includes('V0ID OS'), 'read_file must return accurate lines without truncation');
assert(!selfContent.includes('RTK SLIM'), 'read_file must not apply destructive RTK compression to files');

const searchRes = tools.search_code({ query: 'resolveV0idPath' });
assert(searchRes.includes('tools.js'), 'search_code must find resolveV0idPath in tools.js');

const findRes = tools.find_files({ pattern: 'providers.js' });
assert(findRes.includes('providers.js'), 'find_files must locate providers.js');

// TOOL_DEFINITIONS completeness
const toolNames = TOOL_DEFINITIONS.map(t => t.function.name);
assert(toolNames.includes('read_file'));
assert(toolNames.includes('write_file'));
assert(toolNames.includes('apply_diff'));
assert(toolNames.includes('search_code'));
assert(toolNames.includes('find_files'));
assert(toolNames.includes('run_command'));
assert(toolNames.includes('graphify'));
assert(toolNames.includes('generate_image'));
console.log(`[TEST] All ${toolNames.length} native tools registered in TOOL_DEFINITIONS: ${toolNames.join(', ')}`);

console.log('[TEST] ALL TESTS PASSED! OmniRouter, Gatekeeper & Tools are 100% operational.');
