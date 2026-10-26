import assert from 'node:assert';
import { OmniRouter, Gatekeeper } from './index.js';
import { RateLimitError } from './providers.js';
import { nexus } from '../../03_chat_projects_nexus/nexus-db/nexus.js';

console.log('[TEST] Initializing OmniRouter & Gatekeeper hierarchy verification...');

// 1. Gatekeeper Test: Uses Flash tier exclusively
const gatekeeper = new Gatekeeper();
const simpleCheck = await gatekeeper.process('ping');
assert(simpleCheck.isSimple === true, 'Ping should be simple query');
assert(simpleCheck.directResponse.includes('V0id OS Ativo'), 'Ping should have direct response');
assert(simpleCheck.tier === 'fast_flash', 'Gatekeeper must operate on fast_flash tier');
console.log('[TEST] Gatekeeper fast_flash tier verified.');

const fastProviders = gatekeeper.getFastTierProviders();
assert(fastProviders.some(p => p.model.includes('flash') || p.id.includes('fast')), 'Gatekeeper must use fast/flash providers');
console.log(`[TEST] Gatekeeper fast tier providers verified (${fastProviders.length} fast providers).`);

const complexCheck = await gatekeeper.process('Crie um sistema de cutscene procedural para o Space Tide');
assert(complexCheck.isSimple === false, 'Cutscene query must be marked complex');
assert(complexCheck.superPrompt.includes('CAVE-MAN MODE'), 'Super prompt should include Caveman mode');
assert(complexCheck.superPrompt.includes('Space Tide'), 'Super prompt should reference active project');
console.log('[TEST] Gatekeeper Super-Prompt compilation verified.');

// 2. OmniRouter Model Hierarchy Verification: Tier 1 (Elite) -> Tier 2 (120B) -> Tier 3 (Flash) -> Tier 4 (Free)
const logs = [];
const router = new OmniRouter({
  onStatus: (msg) => logs.push(msg)
});

const providers = router.getAvailableProviders();
console.log(`[TEST] Available providers in hierarchy: ${providers.length}`);
providers.forEach((p, idx) => console.log(` [${idx + 1}] Tier ${p.tier} | ${p.name} (${p.model || 'bridge'})`));

// Assert strict hierarchical ordering: Tier 1 -> Tier 2 -> Tier 3 -> Tier 4
for (let i = 0; i < providers.length - 1; i++) {
  assert(providers[i].tier <= providers[i + 1].tier, `Provider order violated: ${providers[i].name} (Tier ${providers[i].tier}) before ${providers[i+1].name} (Tier ${providers[i+1].tier})`);
}

// Assert Tier 1 contains Pro or Argon
const tier1 = providers.filter(p => p.tier === 1);
assert(tier1.length > 0, 'Tier 1 (Elite) must contain models');
assert(tier1.some(p => p.model === 'gemini-4-argon' || p.model?.includes('pro') || p.type === 'agy_cli'), 'Tier 1 must contain Pro/Argon or agy bridge');
console.log('[TEST] Tier 1 (Pro/Argon/Claude Elite) verified!');

// Assert Tier 2 contains 120B models (Cerebras / Groq)
const tier2 = providers.filter(p => p.tier === 2);
assert(tier2.length > 0, 'Tier 2 (120B Ultra-Fast) must contain models');
assert(tier2.some(p => p.model.includes('120b')), 'Tier 2 must contain 120B model');
console.log('[TEST] Tier 2 (120B Ultra-Fast Cerebras/Groq) verified!');

// Assert Tier 3 contains Flash models
const tier3 = providers.filter(p => p.tier === 3);
assert(tier3.length > 0, 'Tier 3 (Alta Disponibilidade) must contain models');
assert(tier3.some(p => p.model.includes('flash')), 'Tier 3 must contain Flash models');
console.log('[TEST] Tier 3 (Alta Disponibilidade Flash) verified!');

// Assert Tier 4 contains Large OpenRouter Free models
const tier4 = providers.filter(p => p.tier === 4);
assert(tier4.length > 0, 'Tier 4 (OpenRouter Free) must contain models');
assert(!tier4.some(p => p.model.includes('2.6b')), 'Tier 4 must NOT use weak 2.6b model as primary');
console.log('[TEST] Tier 4 (OpenRouter Free Large) verified!');

// 3. Uncensored route verification
const uncensoredProviders = router.getAvailableProviders({ uncensored: true });
assert(uncensoredProviders.some(p => p.id === 'openrouter_uncensored'), 'Uncensored route must point to uncensored model');
console.log('[TEST] Uncensored route verified.');

// 4. RateLimit & Hibernation Verification
const rle = new RateLimitError('test_prov', 'Too many requests', 2);
assert(rle.isRateLimit === true);
assert(rle.retryAfterSec === 2);

nexus.setHibernation('gemini_test_hier', 500, '429 Rate Limit', 1);
assert(nexus.isProviderHibernating('gemini_test_hier').hibernating === true);
await new Promise(r => setTimeout(r, 600));
assert(nexus.isProviderHibernating('gemini_test_hier') === false);
console.log('[TEST] Hibernation timing & auto-expiration verified.');

console.log('[TEST] OmniRouter hierarchy and Gatekeeper Flash tier 100% operational!');
