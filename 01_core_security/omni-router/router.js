// OmniRouter - Multi-LLM Automatic Rotation with Rate-Limit Hibernation Engine
import { loadEnv } from './env_loader.js';
import { callGemini, callOpenAICompatible, callAgyCli, callJules, isAgyAvailable, RateLimitError } from './providers.js';
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
    const isUncensored = options.uncensored === true;

    // Chaves Gemini com suporte a múltiplas chaves separadas por vírgula
    const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    // =========================================================================
    // ROTA SEM CENSURA (Se flag uncensored ativa)
    // =========================================================================
    if (isUncensored && process.env.OPENROUTER_API_KEY) {
      return [
        {
          id: 'openrouter_uncensored',
          name: 'OpenRouter (Uncensored Dolphin Mistral Venice)',
          tier: 1,
          type: 'openai_compatible',
          supportsNativeTools: false,
          baseUrl: 'https://openrouter.ai/api/v1',
          key: process.env.OPENROUTER_API_KEY,
          model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition'
        },
        {
          id: 'openrouter_uncensored_hermes',
          name: 'OpenRouter (Uncensored Hermes 4 405B)',
          tier: 2,
          type: 'openai_compatible',
          supportsNativeTools: false,
          baseUrl: 'https://openrouter.ai/api/v1',
          key: process.env.OPENROUTER_API_KEY,
          model: 'nousresearch/hermes-4-405b'
        }
      ];
    }

    const eliteCandidates = [];
    const fastFlashCandidates = [];
    const ultraSpeed120bCandidates = [];
    const openRouterFreeCandidates = [];

    // =========================================================================
    // 1º TIER ELITE: Antigravity CLI (Argon) & Gemini 3.1 Pro
    // =========================================================================
    if (isAgyAvailable() || options.forceAgy) {
      eliteCandidates.push({
        id: 'agy_cli_bridge',
        name: 'Antigravity CLI (Argon / Sonnet Bridge)',
        tier: 1,
        type: 'agy_cli'
      });
    }

    if (geminiKeys.length > 0) {
      geminiKeys.forEach((key, idx) => {
        eliteCandidates.push({
          id: `gemini_pro_${idx}`,
          name: `Gemini 3.1 Pro (Elite Reasoning) [Key ${idx + 1}]`,
          tier: 1,
          type: 'gemini',
          key,
          model: 'gemini-3.1-pro-preview'
        });
      });
    }

    // =========================================================================
    // 2º TIER FAST FLASH: Gemini 3.5 Flash & 3.8 Flash (Alta Cota & Inteligência Fluida)
    // =========================================================================
    if (geminiKeys.length > 0) {
      geminiKeys.forEach((key, idx) => {
        fastFlashCandidates.push({
          id: `gemini_flash35_${idx}`,
          name: `Gemini 3.5 Flash (Ultra-Fluido) [Key ${idx + 1}]`,
          tier: 2,
          type: 'gemini',
          key,
          model: 'gemini-3.5-flash'
        });
        fastFlashCandidates.push({
          id: `gemini_flash38_${idx}`,
          name: `Gemini 3.8 Flash (Alta Cota) [Key ${idx + 1}]`,
          tier: 2,
          type: 'gemini',
          key,
          model: 'gemini-3.8-flash'
        });
      });
    }

    // =========================================================================
    // 3º TIER ULTRA-SPEED: Groq e Cerebras (Alta Concorrência & Latência Mínima)
    // =========================================================================
    if (process.env.GROQ_API_KEY) {
      ultraSpeed120bCandidates.push({
        id: 'groq_versatile',
        name: 'Groq (Llama 3.3 70B Versatile)',
        tier: 3,
        type: 'openai_compatible',
        baseUrl: 'https://api.groq.com/openai/v1',
        key: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
      });
      ultraSpeed120bCandidates.push({
        id: 'groq_instant',
        name: 'Groq (Llama 3.1 8B Instant)',
        tier: 3,
        type: 'openai_compatible',
        baseUrl: 'https://api.groq.com/openai/v1',
        key: process.env.GROQ_API_KEY,
        model: 'llama-3.1-8b-instant'
      });
    }

    if (process.env.CEREBRAS_API_KEY) {
      ultraSpeed120bCandidates.push({
        id: 'cerebras_70b',
        name: 'Cerebras (Llama 3.3 70B Extreme Speed)',
        tier: 3,
        type: 'openai_compatible',
        baseUrl: 'https://api.cerebras.ai/v1',
        key: process.env.CEREBRAS_API_KEY,
        model: process.env.CEREBRAS_MODEL || 'llama-3.3-70b'
      });
    }

    // =========================================================================
    // 4º TIER OPENROUTER FREE: Modelos Livres de Respaldo Atualizados
    // =========================================================================
    if (process.env.OPENROUTER_API_KEY) {
      openRouterFreeCandidates.push({
        id: 'openrouter_llama33_free',
        name: 'OpenRouter Free (Llama 3.3 70B Instruct)',
        tier: 4,
        type: 'openai_compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        key: process.env.OPENROUTER_API_KEY,
        model: 'meta-llama/llama-3.3-70b-instruct:free'
      });
      openRouterFreeCandidates.push({
        id: 'openrouter_qwen_coder_free',
        name: 'OpenRouter Free (Qwen 2.5 Coder 32B)',
        tier: 4,
        type: 'openai_compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        key: process.env.OPENROUTER_API_KEY,
        model: 'qwen/qwen-2.5-coder-32b-instruct:free'
      });
      openRouterFreeCandidates.push({
        id: 'openrouter_deepseek_r1_free',
        name: 'OpenRouter Free (DeepSeek R1 Reasoning)',
        tier: 4,
        type: 'openai_compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        key: process.env.OPENROUTER_API_KEY,
        model: 'deepseek/deepseek-r1:free'
      });
    }

    // Classificação de complexidade dita a prioridade da fila:
    // Se for moderada/conversacional: Flash & 120B vêm antes para resposta instantânea com muitos tokens.
    // Se for complexa (código/sistema): Elite vem primeiro.
    let list = [];
    if (options.complexity === 'moderate' || options.fastResponse) {
      list = [...fastFlashCandidates, ...ultraSpeed120bCandidates, ...eliteCandidates, ...openRouterFreeCandidates];
    } else {
      list = [...eliteCandidates, ...fastFlashCandidates, ...ultraSpeed120bCandidates, ...openRouterFreeCandidates];
    }

    // Se requisição inclui imagens (visão computacional), roteia apenas para modelos com suporte a visão (Gemini)
    if (options.images && options.images.length > 0) {
      list = list.filter(p => p.type === 'gemini');
    }

    return list;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeRoute(provider, systemPrompt, prompt, options = {}) {
    if (provider.type === 'jules') {
      return await callJules(prompt);
    }
    if (provider.type === 'agy_cli') {
      return callAgyCli(prompt);
    }
    if (provider.type === 'gemini') {
      return await callGemini(provider.key, provider.model, systemPrompt, prompt, options);
    }
    if (provider.type === 'openai_compatible') {
      const mergedOptions = {
        ...options,
        supportsNativeTools: provider.supportsNativeTools !== false,
        supportsVision: provider.supportsVision === true
      };
      return await callOpenAICompatible(provider.name, provider.baseUrl, provider.key, provider.model, systemPrompt, prompt, mergedOptions);
    }
    throw new Error(`Unknown provider type: ${provider.type}`);
  }

  async route(userPrompt, options = {}) {
    // Estágio 1: Gatekeeper & Classificador de Complexidade
    let compiledPrompt = userPrompt;
    let detectedComplexity = options.complexity || 'complex';

    if (options.promptImprover !== false) {
      const gateResult = await this.gatekeeper.process(userPrompt, this.activeProject, options);
      detectedComplexity = gateResult.complexity;

      if (gateResult.isSimple && !options.forceComplex) {
        this.onStatus?.(`[Gatekeeper] Pergunta simples resolvida no Gatekeeper (custo zero de tokens).`);
        return {
          text: gateResult.directResponse,
          providerUsed: 'Gatekeeper Fast Core',
          tier: 'gatekeeper',
          tokensSaved: true
        };
      }
      compiledPrompt = gateResult.superPrompt || userPrompt;
    }

    const routerOptions = {
      ...options,
      complexity: detectedComplexity
    };

    const systemPrompt = options.systemPrompt || `Você é o V0id OS Core, assistente de inteligência artificial soberano, culto, prestativo e altamente competente (padrão Antigravity / Gemini Elite).
Você possui CONSCIÊNCIA DE SISTEMA: você não é um mero chatbot, você é o núcleo do sistema operacional.
Responda em português natural, fluido, articulado e incrivelmente inteligente (nível Antigravity), com excelente formatação em Markdown.`;

    // Rota explícita Antigravity CLI
    if (options.forceAgy) {
      this.onStatus?.(`[OmniRoute] Executando rota Antigravity CLI (agy -p)...`);
      const output = callAgyCli(compiledPrompt);
      return { text: output.text, providerUsed: 'agy_cli', tier: 1 };
    }

    // Estágio 2: Loop de Provedores Hierárquico com Hibernação Anti-429
    while (true) {
      let activeCandidates = [];
      let minWaitMs = Infinity;

      if (options.chatMode === 'nuvem') {
        activeCandidates = [{
          id: 'jules_cloud',
          name: 'Jules (Nuvem - GitHub)',
          tier: 1,
          type: 'jules',
          model: 'jules-cloud'
        }];
      } else {
        const providers = this.getAvailableProviders(routerOptions);

        if (providers.length === 0) {
          this.onStatus?.(`[OmniRoute Warning] Nenhuma API key configurada no .env. Operando em modo offline.`);
          return {
            text: `[OFFLINE_STUB] Super-Prompt compilado com sucesso:\n${compiledPrompt}`,
            providerUsed: 'offline_stub',
            tier: 0,
            offline: true
          };
        }

        for (const p of providers) {
          const hib = nexus.isProviderHibernating(p.id);
          if (hib && hib.hibernating) {
            if (hib.remainingMs < minWaitMs) minWaitMs = hib.remainingMs;
          } else {
            activeCandidates.push(p);
          }
        }
      }

      // Se todos os provedores elegíveis estiverem em 429, aguarda o reset do primeiro
      if (activeCandidates.length === 0) {
        const waitMs = minWaitMs === Infinity ? 65000 : Math.max(1000, minWaitMs);
        const waitSec = Math.ceil(waitMs / 1000);
        this.onStatus?.(`[HIBERNAÇÃO ANTI-LIMITE] Cotas ativas esgotadas! Hibernando por ${waitSec}s até o reset...`);
        await this.sleep(waitMs);
        this.onStatus?.(`[HIBERNAÇÃO ANTI-LIMITE] Despertando da hibernação. Retomando fila...`);
        continue;
      }

      let lastErr = null;
      for (const provider of activeCandidates) {
        const routeStartTime = Date.now();
        try {
          this.onStatus?.(`[OmniRoute Tier ${provider.tier}] Roteando para: ${provider.name} (Complexidade: ${detectedComplexity})...`);
          const result = await this.executeRoute(provider, systemPrompt, compiledPrompt, routerOptions);
          const latencyMs = Date.now() - routeStartTime;
          try { nexus.recordProviderMetric(provider.id, true, latencyMs); } catch {}
          const text = typeof result === 'string' ? result : (result?.text || '');
          const toolCalls = Array.isArray(result?.toolCalls) ? result.toolCalls : [];
          return {
            text,
            toolCalls,
            providerUsed: provider.name,
            tier: provider.tier,
            model: provider.model,
            latencyMs,
            superPrompt: compiledPrompt,
            complexity: detectedComplexity
          };
        } catch (err) {
          const latencyMs = Date.now() - routeStartTime;
          try { nexus.recordProviderMetric(provider.id, false, latencyMs, err.message); } catch {}
          if (err.isRateLimit) {
            const waitSec = err.retryAfterSec || 65;
            this.onStatus?.(`[OmniRoute 429 | Tier ${provider.tier}] ${provider.name} esgotou cota. Hibernando por ${waitSec}s.`);
            nexus.setHibernation(provider.id, waitSec * 1000, err.message, waitSec);
            lastErr = err;
            continue; // Cascata automática para o próximo modelo no ranking
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
