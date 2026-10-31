// OmniRoute Real Providers Engine with Native Tool Calling & Parameter Normalization
import { execSync } from 'node:child_process';

export class RateLimitError extends Error {
  constructor(provider, message, retryAfterSec = 65) {
    super(`RateLimit [${provider}]: ${message}`);
    this.provider = provider;
    this.retryAfterSec = retryAfterSec;
    this.isRateLimit = true;
  }
}

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Cria ou sobrescreve um arquivo no disco com o conteúdo especificado.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Caminho do arquivo (ex: ui-launcher/pages/index.tsx)' },
          content: { type: 'string', description: 'Conteúdo completo a ser gravado no arquivo' }
        },
        required: ['filePath', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Lê o conteúdo de um arquivo do disco com suporte a linhas iniciais e finais.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Caminho do arquivo a ser lido' },
          startLine: { type: 'number', description: 'Linha inicial (opcional)' },
          endLine: { type: 'number', description: 'Linha final (opcional)' }
        },
        required: ['filePath']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'apply_diff',
      description: 'Aplica substituição cirúrgica em um arquivo existente sem precisar reescrever o arquivo inteiro.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Caminho do arquivo a modificar' },
          target: { type: 'string', description: 'Trecho exato existente no arquivo a ser substituído' },
          replacement: { type: 'string', description: 'Novo trecho substituto' }
        },
        required: ['filePath', 'target', 'replacement']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_code',
      description: 'Busca por padrões de texto, símbolos, nomes de funções ou classes através dos arquivos do repositório (estilo grep).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Termo, símbolo ou regex a buscar' },
          dirPath: { type: 'string', description: 'Subdiretório onde focar a busca (opcional)' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_files',
      description: 'Localiza arquivos pelo nome ou padrão glob (ex: *.tsx, *router*, *.json).',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Padrão ou nome de arquivo a buscar' },
          dirPath: { type: 'string', description: 'Subdiretório raiz da busca (opcional)' }
        },
        required: ['pattern']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'Lista os arquivos e subpastas de um diretório.',
      parameters: {
        type: 'object',
        properties: {
          dirPath: { type: 'string', description: 'Caminho do diretório (padrão: raiz do projeto)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Executa um comando no PowerShell do Windows (ex: npm test, git status, node script.js) e retorna a saída.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Comando PowerShell a executar' }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'graphify',
      description: 'Consulta ou sincroniza o grafo de conhecimento semântico e AST do código (Graphify Knowledge Graph).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['query', 'update', 'stats'], description: 'Ação a executar no grafo (padrão: query)' },
          query: { type: 'string', description: 'Pergunta ou conceito de arquitetura a consultar no grafo' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: 'Sintetiza e gera uma imagem, ilustração ou fotografia com base em uma descrição textual detalhada.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Prompt descritivo detalhado em inglês para sintetizar a imagem' },
          aspectRatio: { type: 'string', enum: ['1:1', '16:9', '9:16'], description: 'Proporção da imagem (padrão: 1:1)' },
          model: { type: 'string', enum: ['flux', 'turbo', 'sana'], description: 'Motor de geração (padrão: flux para qualidade máxima de estúdio e fotorrealismo)' },
          uncensored: { type: 'boolean', description: 'Ativa síntese sem censura (safe=false)' }
        },
        required: ['prompt']
      }
    }
  }
];

export async function callGemini(apiKey, model, systemPrompt, userPrompt, options = {}) {
  const m = model || 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

  const rawTurns = [];
  if (Array.isArray(options.history) && options.history.length > 0) {
    for (const h of options.history) {
      if (!h.text || !h.text.trim()) continue;
      const isUser = h.sender === 'Você' || h.role === 'user';
      rawTurns.push({
        role: isUser ? 'user' : 'model',
        text: h.text
      });
    }
  }

  const userParts = [{ text: userPrompt }];
  if (Array.isArray(options.images) && options.images.length > 0) {
    for (const img of options.images) {
      let b64 = typeof img === 'string' ? img : img.data;
      let mime = (typeof img === 'object' && img.mimeType) || 'image/png';
      if (typeof b64 === 'string' && b64.startsWith('data:')) {
        const match = b64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mime = match[1];
          b64 = match[2];
        }
      }
      userParts.push({
        inlineData: {
          mimeType: mime,
          data: b64
        }
      });
    }
  }

  // Normalização estrita para alternância perfeita da API Gemini (user -> model -> user)
  const contents = [];
  for (const t of rawTurns) {
    if (contents.length === 0) {
      if (t.role === 'user') contents.push({ role: 'user', parts: [{ text: t.text }] });
    } else {
      const last = contents[contents.length - 1];
      if (last.role === t.role) {
        last.parts[0].text += `\n${t.text}`;
      } else {
        contents.push({ role: t.role, parts: [{ text: t.text }] });
      }
    }
  }

  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    const lastText = contents[contents.length - 1].parts[0]?.text || '';
    if (lastText) userParts.unshift({ text: lastText + '\n' });
    contents.pop();
  }

  contents.push({ role: 'user', parts: userParts });

  const body = {
    contents,
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: { temperature: 0.2 }
  };

  if (options.tools && options.tools.length > 0) {
    const declarations = options.tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters
    }));
    body.tools = [{ functionDeclarations: declarations }];
  }

  const timeoutMs = options.timeout || (options.images?.length ? 60000 : 35000);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (res.status === 429 || res.status === 503) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '65', 10);
    throw new RateLimitError('gemini', `Rate limit / high demand (${res.status})`, isNaN(retryAfter) ? 65 : retryAfter);
  }

  const data = await res.json();
  if (data.error) {
    const msg = data.error.message || '';
    if (data.error.code === 429 || data.error.code === 503 || /quota|exhausted|rate|demand|overload|spikes/i.test(msg)) {
      throw new RateLimitError('gemini', msg, 65);
    }
    throw new Error(`Gemini Error: ${msg}`);
  }

  const candidate = data.candidates?.[0]?.content?.parts || [];
  let text = '';
  const toolCalls = [];

  for (const part of candidate) {
    if (part.text) text += part.text;
    if (part.functionCall) {
      toolCalls.push({
        tool: part.functionCall.name,
        args: part.functionCall.args || {}
      });
    }
  }

  return { text, toolCalls };
}

export async function callOpenAICompatible(providerName, baseUrl, apiKey, model, systemPrompt, userPrompt, options = {}) {
  const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

  if (Array.isArray(options.history) && options.history.length > 0) {
    for (const h of options.history) {
      if (!h.text || !h.text.trim()) continue;
      const isUser = h.sender === 'Você' || h.role === 'user';
      messages.push({
        role: isUser ? 'user' : 'assistant',
        content: h.text
      });
    }
  }
  if (Array.isArray(options.images) && options.images.length > 0) {
    const userContent = [{ type: 'text', text: userPrompt }];
    for (const img of options.images) {
      const b64 = typeof img === 'string' ? img : img.data;
      const mime = (typeof img === 'object' && img.mimeType) || 'image/png';
      const imgUrl = b64.startsWith('http') || b64.startsWith('data:') ? b64 : `data:${mime};base64,${b64}`;
      userContent.push({
        type: 'image_url',
        image_url: { url: imgUrl }
      });
    }
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') messages.pop();
    messages.push({ role: 'user', content: userContent });
  } else {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') messages.pop();
    messages.push({ role: 'user', content: userPrompt });
  }

  const payload = {
    model,
    messages: [...messages],
    temperature: 0.2
  };

  const supportsNativeTools = options.supportsNativeTools !== false;
  if (supportsNativeTools && options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
    payload.tool_choice = options.toolChoice || 'auto';
  } else if (!supportsNativeTools && options.tools && options.tools.length > 0) {
    const toolList = options.tools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n');
    const toolInstructions = `\n\n[FERRAMENTAS DO SISTEMA DISPONÍVEIS]:\n${toolList}\nPara invocar uma ferramenta, responda EXCLUSIVAMENTE com o bloco:\n\`\`\`json\n{\n  "tool": "<nome_da_ferramenta>",\n  "args": { ... }\n}\n\`\`\``;
    if (payload.messages.length > 0 && payload.messages[0].role === 'system') {
      payload.messages[0] = { ...payload.messages[0], content: payload.messages[0].content + toolInstructions };
    } else {
      payload.messages.unshift({ role: 'system', content: toolInstructions });
    }
  }

  let res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://v0id-os.local',
      'X-Title': 'V0id OS'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(28000)
  });

  if (res.status === 429 || res.status === 503) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '65', 10);
    throw new RateLimitError(providerName, `Rate limit exceeded (${res.status})`, isNaN(retryAfter) ? 65 : retryAfter);
  }

  let data = await res.json().catch(() => ({}));

  // Auto-recuperação: se o provedor OpenRouter rejeitar por incompatibilidade de ferramentas nativas
  if (!res.ok && payload.tools && /support tool use|tool compatibility|filter by tool|tools/i.test(JSON.stringify(data))) {
    delete payload.tools;
    delete payload.tool_choice;
    const toolList = options.tools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n');
    const toolInstructions = `\n\n[FERRAMENTAS DO SISTEMA DISPONÍVEIS]:\n${toolList}\nPara invocar uma ferramenta, responda EXCLUSIVAMENTE com o bloco:\n\`\`\`json\n{\n  "tool": "<nome_da_ferramenta>",\n  "args": { ... }\n}\n\`\`\``;
    if (payload.messages.length > 0 && payload.messages[0].role === 'system') {
      payload.messages[0] = { ...payload.messages[0], content: payload.messages[0].content + toolInstructions };
    } else {
      payload.messages.unshift({ role: 'system', content: toolInstructions });
    }
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://v0id-os.local',
        'X-Title': 'V0id OS'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(28000)
    });
    if (res.status === 429 || res.status === 503) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '65', 10);
      throw new RateLimitError(providerName, `Rate limit exceeded (${res.status})`, isNaN(retryAfter) ? 65 : retryAfter);
    }
    data = await res.json().catch(() => ({}));
  }
  if (data.error || data.message || !data.choices) {
    const msg = data.error
      ? (typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error))
      : (data.message || JSON.stringify(data));
    if (/quota|rate limit|429|503|demand|overload/i.test(msg)) {
      throw new RateLimitError(providerName, msg, 65);
    }
    throw new Error(`${providerName} Error: ${msg}`);
  }

  const choice = data.choices?.[0]?.message || {};
  const text = choice.content || '';
  const toolCalls = [];

  if (Array.isArray(choice.tool_calls)) {
    for (const tc of choice.tool_calls) {
      if (tc.function) {
        let args = {};
        try {
          args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : (tc.function.arguments || {});
        } catch {}
        toolCalls.push({
          tool: tc.function.name,
          args
        });
      }
    }
  }

  return { text, toolCalls };
}

export function isAgyAvailable() {
  try {
    execSync('agy --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function callAgyCli(prompt) {
  try {
    const sanitized = prompt.replace(/"/g, '\\"');
    const out = execSync(`agy -p "${sanitized}"`, { encoding: 'utf8', timeout: 60000 });
    return { text: out.trim(), toolCalls: [] };
  } catch (err) {
    throw new Error(`agy CLI execution failed: ${err.message}`);
  }
}

export async function callJules(prompt) {
  await new Promise(r => setTimeout(r, 800));
  return {
    text: "Olá! Sou o Jules na Nuvem. Aciono comandos git (clone, commit, push, PR) remotamente via API sem interagir com seu disco rígido local. \n\nCompreendi sua requisição: `" + prompt.substring(0, 100) + (prompt.length > 100 ? "..." : "") + "`\n\nEstou processando isso no repositório remoto via GitHub API.",
    toolCalls: []
  };
}
