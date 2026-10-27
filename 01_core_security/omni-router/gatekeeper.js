// Gatekeeper & Prompt Improver Pipeline
// Exclusive tier: ultra-fast and high-quota models (Gemini Flash -> Groq -> Cerebras)
import fs from 'node:fs';
import path from 'node:path';
import { callGemini, callOpenAICompatible } from './providers.js';

export class Gatekeeper {
  constructor(options = {}) {
    this.soulPath = options.soulPath || path.resolve(process.cwd(), 'SOUL.md');
    this.specPath = options.specPath || path.resolve(process.cwd(), 'V0ID_SPEC.md');
    this.modelTier = 'fast_flash';
  }

  loadSoul() {
    try {
      if (fs.existsSync(this.soulPath)) {
        return fs.readFileSync(this.soulPath, 'utf8');
      }
    } catch {}
    return '';
  }

  isSimpleQuery(text) {
    const t = text.trim().toLowerCase();
    return /^(oi|ola|ping)$/i.test(t);
  }

  getFastTierProviders() {
    const list = [];
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      list.push({
        id: 'gatekeeper_gemini_flash',
        name: 'Gatekeeper Gemini Flash (3.8/3.5)',
        type: 'gemini',
        key: geminiKey,
        model: 'gemini-3.8-flash',
        fallbackModel: 'gemini-3.5-flash'
      });
    }
    if (process.env.GROQ_API_KEY) {
      list.push({
        id: 'gatekeeper_groq_fast',
        name: 'Gatekeeper Groq Fast',
        type: 'openai_compatible',
        baseUrl: 'https://api.groq.com/openai/v1',
        key: process.env.GROQ_API_KEY,
        model: 'qwen/qwen3.8-27b'
      });
    }
    if (process.env.CEREBRAS_API_KEY) {
      list.push({
        id: 'gatekeeper_cerebras_fast',
        name: 'Gatekeeper Cerebras Fast',
        type: 'openai_compatible',
        baseUrl: 'https://api.cerebras.ai/v1',
        key: process.env.CEREBRAS_API_KEY,
        model: 'qwen-3.8-27b'
      });
    }
    return list;
  }

  async runFastTier(prompt, systemPrompt) {
    const providers = this.getFastTierProviders();
    for (const prov of providers) {
      try {
        if (prov.type === 'gemini') {
          try {
            return await callGemini(prov.key, prov.model, systemPrompt, prompt);
          } catch {
            return await callGemini(prov.key, prov.fallbackModel, systemPrompt, prompt);
          }
        }
        if (prov.type === 'openai_compatible') {
          return await callOpenAICompatible(prov.name, prov.baseUrl, prov.key, prov.model, systemPrompt, prompt);
        }
      } catch (err) {
        // Continue to next fast tier provider
      }
    }
    return null;
  }

  compileSuperPrompt(userPrompt, activeProject = 'Space Tide', options = {}) {
    const isCaveman = options.cavemanMode === true;

    if (isCaveman) {
      return `[V0ID CAVE-MAN MODE]
Economia extrema de tokens. Responda de forma cirúrgica, concisa e direta, sem cumprimentos:
${userPrompt.trim()}`;
    }

    // No modo normal (inteligência de alto nível), preserva a pergunta natural do usuário
    return userPrompt.trim();
  }

  async process(input, activeProject = 'Space Tide', options = {}) {
    if (this.isSimpleQuery(input)) {
      return {
        isSimple: true,
        directResponse: `[Gatekeeper] V0id OS Ativo | Projeto: ${activeProject} | Status: Operacional.`,
        superPrompt: null,
        tier: 'fast_flash'
      };
    }

    const superPrompt = this.compileSuperPrompt(input, activeProject, options);
    return {
      isSimple: false,
      directResponse: null,
      superPrompt,
      tier: 'fast_flash'
    };
  }
}
