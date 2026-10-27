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
    if (t.length < 25) return true;
    if (/^(oi|ola|status|help|ajuda|quem e voce|ping|version|versao)$/i.test(t)) return true;
    return false;
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
    const isPonytail = options.ponytail !== false;

    if (!isCaveman) {
      return `[V0ID COGNITIVE ENHANCED PROMPT]
PROJETO ATIVO: ${activeProject}
DIRETRIZ DE IDENTIDADE & ENGENHARIA (PADRÃO ANTIGRAVITY):
- Você é o V0id OS Core, assistente técnico de engenharia de software e orquestrador supremo.
- Responda em texto corrido, fluido, articulado e altamente analítico em português, formatado em Markdown rico (tópicos, negrito, listas).
- NUNCA responda apenas com um bloco JSON ou código solto sem explicação, a menos que o usuário peça explicitamente formato JSON.
- Apresente explicações detalhadas e contextuais respondendo com precisão à pergunta do usuário.
${isPonytail ? '- Adote a postura Ponytail (engenharia pragmática e objetiva).' : ''}
- Se a pergunta envolver o status do sistema, histórico ou arquivos, fundamente-se nos dados reais do sistema.

OBJETIVO DO USUÁRIO:
${userPrompt.trim()}
`;
    }

    return `[V0ID AUTO-COMPILED SUPER-PROMPT | CAVE-MAN MODE]
PROJETO ATIVO: ${activeProject}
REGRAS DO SOUL.MD:
- Economia extrema de tokens. Zero conversa fiada.
- Código 100% funcional, completo e testável.
- Padrão [APPROVED_GOLD]: Validação com saída de terminal real.

OBJETIVO DO USUÁRIO:
${userPrompt.trim()}

DIRETRIZ DE SAÍDA:
Responda no formato Caveman direto: Apenas blocos de código completos, ferramentas executáveis e resultado final.
`;
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
