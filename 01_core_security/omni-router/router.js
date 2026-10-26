// OmniRouter - Multi-LLM Automatic Rotation with Rate-Limit Hibernation Engine
import { loadEnv } from './env_loader.js';
import { callGemini, callOpenAICompatible, callAgyCli, isAgyAvailable, RateLimitError } from './providers.js';
import { Gatekeeper } from './gatekeeper.js';
import { nexus } from '../../03_chat_projects_nexus/nexus-db/nexus.js';

export class OmniRouter {
  constructor(options = {}) {
    loadEnv();
    this.gatekeeper = new Gatekeeper(options);
    this.activeProject = options.activeProject || 'Space Tide';
    this.onStatus = options.onStatus || console.log;
  }

  getAvailableProviders(options = {}) {
    let list = [];
    const isUncensored = options.uncensored === true;

    // Multiple Gemini Keys support
    const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    // =========================================================================
    // ROTA SEM CENSURA (Se flag uncensored ativa)
    // =========================================================================
    if (isUncensored && process.env.OPENROUTER_API_KEY) {
      list.push({
        id: 'openrouter_uncensored',
        name: 'OpenRouter (Uncensored Dolphin / Hermes)',
        tier: 4,
        type: 'openai_compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        key: process.env.OPENROUTER_API_KEY,
        model: 'cognitivecomputations/dolphin-mixtral-8x7b'
      });
      return list;
    }

    // =========================================================================
    // 1º TITULAR (ELITE): Modelos Pro/Argon + agy CLI (Claude Opus/Sonnet / Argon)
    // =========================================================================
    if (isAgyAvailable() || options.forceAgy) {
      list.push({
        id: 'agy_cli_bridge',
        name: 'Antigravity CLI (Argon / Claude Opus/Sonnet Bridge)',
        tier: 1,
        type: 'agy_cli'
      });
    }

    if (geminiKeys.length > 0) {
      geminiKeys.forEach((key, idx) => {
        // 1º Titular: Pro
        list.push({
          id: `gemini_pro_${idx}`,
          name: `Gemini 3.1 Pro (Elite) [Key ${idx + 1}]`,
          tier: 1,
          type: 'gemini',
          key,
          model: 'gemini-3.1-pro-preview'
        });
      });
    }

    // =========================================================================
    // 2º RESERVA PESADO (120B ULTRA-FAST): Cerebras e Groq
    // =========================================================================
    if (process.env.CEREBRAS_API_KEY) {
      list.push({
        id: 'cerebras_120b',
        name: 'Cerebras (120B Ultra-Fast)',
        tier: 2,
        type: 'openai_compatible',
        baseUrl: 'https://api.cerebras.ai/v1',
        key: process.env.CEREBRAS_API_KEY,
        model: process.env.CEREBRAS_MODEL || 'gpt-oss-120b'
      });
    }

    if (process.env.GROQ_API_KEY) {
      list.push({
        id: 'groq_120b',
        name: 'Groq (120B Fast Llama)',
        tier: 2,
        type: 'openai_compatible',
        baseUrl: 'https://api.groq.com/openai/v1',
        key: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
      });
    }

    // =========================================================================
    // 3º RESERVA DE ALTA DISPONIBILIDADE: Gemini 3.5 Flash / 3 Flash Preview / 3.8
    // =========================================================================
    if (geminiKeys.length > 0) {
      geminiKeys.forEach((key, idx) => {
        list.push({
          id: `gemini_flash35_${idx}`,
          name: `Gemini 3.5 Flash (Ultra-Rápido) [Key ${idx + 1}]`,
          tier: 3,
          type: 'gemini',
          key,
          model: 'gemini-3.5-flash'
        });
        list.push({
          id: `gemini_flash30_${idx}`,
          name: `Gemini 3 Flash Preview [Key ${idx + 1}]`,
          tier: 3,
          type: 'gemini',
          key,
          model: 'gemini-3-flash-preview'
        });
        list.push({
          id: `gemini_flash38_${idx}`,
          name: `Gemini 3.8 Flash (Alta Disp.) [Key ${idx + 1}]`,
          tier: 3,
          type: 'gemini',
          key,
          model: 'gemini-3.8-flash'
        });
      });
    }

    // =========================================================================
    // 4º RESERVA OPENROUTER: Modelos Grandes Gratuitos de Código e Raciocínio
    // =========================================================================
    if (process.env.OPENROUTER_API_KEY) {
      list.push({
        id: 'openrouter_coder_free',
        name: 'OpenRouter Free (Gemma 31B / Qwen Coder / Nemotron 120B)',
        tier: 4,
        type: 'openai_compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        key: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_FREE_MODEL || 'google/gemma-4-31b-it:free'
      });
    }

    // Se requisição inclui imagens (visão computacional), roteia apenas para modelos com suporte a visão
    if (options.images && options.images.length > 0) {
      list = list.filter(p => p.type === 'gemini');
    }

    return list;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeRoute(provider, systemPrompt, prompt, options = {}) {
    if (provider.type === 'agy_cli') {
      return callAgyCli(prompt);
    }
    if (provider.type === 'gemini') {
      return await callGemini(provider.key, provider.model, systemPrompt, prompt, options);
    }
    if (provider.type === 'openai_compatible') {
      return await callOpenAICompatible(provider.name, provider.baseUrl, provider.key, provider.model, systemPrompt, prompt, options);
    }
    throw new Error(`Unknown provider type: ${provider.type}`);
  }

  async route(userPrompt, options = {}) {
    // Stage 1: Gatekeeper & Prompt Improver (Triagem com custo zero ou Flash)
    const gateResult = await this.gatekeeper.process(userPrompt, this.activeProject);
    if (gateResult.isSimple && !options.forceComplex) {
      this.onStatus?.(`[Gatekeeper] Pergunta simples resolvida no Gatekeeper (Flash Tier) a custo zero.`);
      return {
        text: gateResult.directResponse,
        providerUsed: 'gatekeeper_flash',
        tier: 'gatekeeper',
        tokensSaved: true
      };
    }

    const compiledPrompt = gateResult.superPrompt || userPrompt;
    const systemPrompt = options.systemPrompt || 'Você é o V0id OS Core, o núcleo soberano do sistema operacional. Responda em português formal, claro, articulado e altamente técnico (nunca use linguagem infantil ou caricata como \"mim\").';

    // Check force agy
    if (options.forceAgy) {
      this.onStatus?.(`[OmniRoute] Executando rota Antigravity CLI (agy -p)...`);
      const output = callAgyCli(compiledPrompt);
      return { text: output, providerUsed: 'agy_cli', tier: 1 };
    }

    // Stage 2: Provider loop across Elite -> 120B -> Flash -> OpenRouter
    while (true) {
      const providers = this.getAvailableProviders(options);

      if (providers.length === 0) {
        this.onStatus?.(`[OmniRoute Warning] Nenhuma API key configurada no .env. Operando em modo offline.`);
        return {
          text: `[OFFLINE_STUB] Super-Prompt compilado com sucesso:\n${compiledPrompt}`,
          providerUsed: 'offline_stub',
          tier: 0,
          offline: true
        };
      }

      const activeCandidates = [];
      let minWaitMs = Infinity;

      for (const p of providers) {
        const hib = nexus.isProviderHibernating(p.id);
        if (hib && hib.hibernating) {
          if (hib.remainingMs < minWaitMs) minWaitMs = hib.remainingMs;
        } else {
          activeCandidates.push(p);
        }
      }

      // Wait-for-Reset system if all active providers are currently in 429 hibernation
      if (activeCandidates.length === 0) {
        const waitMs = minWaitMs === Infinity ? 65000 : Math.max(1000, minWaitMs);
        const waitSec = Math.ceil(waitMs / 1000);
        this.onStatus?.(`[HIBERNAÇÃO ANTI-LIMITE] Todas as cotas 429 atingidas! Hibernando por ${waitSec}s até o reset...`);
        await this.sleep(waitMs);
        this.onStatus?.(`[HIBERNAÇÃO ANTI-LIMITE] Despertando da hibernação. Retomando fila...`);
        continue;
      }

      // Try candidates in strict hierarchical order: Elite -> 120B -> Flash -> OpenRouter
      let lastErr = null;
      for (const provider of activeCandidates) {
        try {
          this.onStatus?.(`[OmniRoute Tier ${provider.tier}] Roteando para: ${provider.name}...`);
          const result = await this.executeRoute(provider, systemPrompt, compiledPrompt, options);
          const text = typeof result === 'string' ? result : (result?.text || '');
          const toolCalls = Array.isArray(result?.toolCalls) ? result.toolCalls : [];
          return {
            text,
            toolCalls,
            providerUsed: provider.name,
            tier: provider.tier,
            model: provider.model,
            superPrompt: compiledPrompt
          };
        } catch (err) {
          if (err.isRateLimit) {
            const waitSec = err.retryAfterSec || 65;
            this.onStatus?.(`[OmniRoute 429 | Tier ${provider.tier}] ${provider.name} esgotou cota. Hibernando por ${waitSec}s.`);
            nexus.setHibernation(provider.id, waitSec * 1000, err.message, waitSec);
            lastErr = err;
            continue; // Cascade to next tier
          } else {
            this.onStatus?.(`[OmniRoute Erro | Tier ${provider.tier}] ${provider.name} falhou: ${err.message}. Rotacionando...`);
            lastErr = err;
          }
        }
      }

      if (lastErr && lastErr.isRateLimit) {
        continue;
      }

      throw lastErr || new Error('OmniRoute: Todos os provedores falharam sem resposta.');
    }
  }
}
