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
          filePath: { type: 'string', description: 'Caminho do arquivo (ex: ui-launcher/index.html)' },
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
      description: 'Lê o conteúdo de um arquivo do disco.',
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
      name: 'run_command',
      description: 'Executa um comando no PowerShell do Windows e retorna a saída.',
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
      name: 'list_dir',
      description: 'Lista o conteúdo de um diretório.',
      parameters: {
        type: 'object',
        properties: {
          dirPath: { type: 'string', description: 'Caminho do diretório' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'apply_diff',
      description: 'Aplica substituição cirúrgica em um arquivo existente.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Caminho do arquivo' },
          target: { type: 'string', description: 'Trecho exato a substituir' },
          replacement: { type: 'string', description: 'Novo trecho substituto' }
        },
        required: ['filePath', 'target', 'replacement']
      }
    }
  }
];

export async function callGemini(apiKey, model, systemPrompt, userPrompt, options = {}) {
  const m = model || 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
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

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000)
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
  messages.push({ role: 'user', content: userPrompt });

  const payload = {
    model,
    messages,
    temperature: 0.2
  };

  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
    payload.tool_choice = options.toolChoice || 'auto';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://v0id-os.local',
      'X-Title': 'V0id OS'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000)
  });

  if (res.status === 429 || res.status === 503) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '65', 10);
    throw new RateLimitError(providerName, `Rate limit exceeded (${res.status})`, isNaN(retryAfter) ? 65 : retryAfter);
  }

  const data = await res.json();
  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error);
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
    execSync('where.exe agy', { stdio: 'ignore' });
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
