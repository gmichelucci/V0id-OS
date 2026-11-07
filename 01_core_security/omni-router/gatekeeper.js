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

  classifyComplexity(text) {
    if (!text || typeof text !== 'string') return 'simple';
    const t = text.trim();

    // 1. Simples: Saudações ou perguntas de ping
    if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|ping|opa|e aí|e ai|tudo bem\??|status\??)$/i.test(t)) {
      return 'simple';
    }

    // 2. Complexo: Ações de código, arquivos, terminais, refatoração, bugs, diffs ou texto longo
    const isCodeOrSystem = /(crie|altere|modifique|edite|corrija|conserte|refatore|implemente|execute|rode|leia|teste|arquivo|pasta|caminho|c:\\|git|npm|node|powershell|endpoint|api|banco|sqlite|bug|erro|stack|function|class)/i.test(t);
    const hasCodeBlock = /```|\{|\}|<\/|<script|import\s+|export\s+/i.test(t);
    const isLong = t.length > 280;

    if (isCodeOrSystem || hasCodeBlock || isLong) {
      return 'complex';
    }

    // 3. Moderado: Perguntas conceituais, conversação livre, dúvidas técnicas sem edição direta de arquivos
    return 'moderate';
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
        // Continua para o próximo provedor do tier rápido
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

    return userPrompt.trim();
  }

  async process(input, activeProject = 'Space Tide', options = {}) {
    const complexity = this.classifyComplexity(input);
    const isSimple = complexity === 'simple';
    const isModerate = complexity === 'moderate';

    const superPrompt = this.compileSuperPrompt(input, activeProject, options);
    return {
      isSimple,
      isModerate,
      complexity,
      directResponse: isSimple ? `[Gatekeeper] V0id OS Ativo | Projeto: ${activeProject} | Status: Operacional e pronto para comandos.` : null,
      superPrompt,
      tier: isSimple || isModerate ? 'fast_flash' : 'elite'
    };
  }
}
