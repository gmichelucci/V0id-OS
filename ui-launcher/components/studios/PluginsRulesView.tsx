import React, { useState } from 'react';

interface McpPlugin {
  id: string;
  name: string;
  category: string;
  desc: string;
  ramUsage: string;
  toolsCount: number;
  active: boolean;
}

const INITIAL_MCPS: McpPlugin[] = [
  { id: 'graphify', name: 'Graphify Knowledge AST', category: 'AST / Código', desc: 'Gera e consulta o grafo semântico de nós e comunidades do código.', ramUsage: '42 MB', toolsCount: 8, active: true },
  { id: 'ponytail', name: 'Ponytail Senior Lazy Dev', category: 'Otimizador de Tokens', desc: 'Comprime saídas, impõe a menor solução completa e corta abstrações.', ramUsage: '12 MB', toolsCount: 6, active: true },
  { id: 'rea', name: 'REA Reverse Engineering', category: 'Automação', desc: 'Engenharia reversa de APIs e sites dentro da Sandbox Docker.', ramUsage: '65 MB', toolsCount: 4, active: true },
  { id: 'omniroute', name: 'OmniRoute Meta-Router', category: 'Inteligência Artificial', desc: 'Roteamento dinâmico entre Cerebras 120B, Argon, Groq e Fallback.', ramUsage: '28 MB', toolsCount: 12, active: true },
  { id: 'context7', name: 'Context7 Compressor', category: 'Memória', desc: 'Compressão e sumarização contextual semântica de logs e chats.', ramUsage: '18 MB', toolsCount: 3, active: false },
  { id: 'stripe', name: 'Stripe Guard', category: 'Finanças', desc: 'Trava de segurança financeira e emissão de cobranças em modo sandbox.', ramUsage: '15 MB', toolsCount: 5, active: false }
];

export default function PluginsRulesView({ activeProject, isRulesOnly }: { activeProject: string; isRulesOnly?: boolean }) {
  const [mcps, setMcps] = useState<McpPlugin[]>(INITIAL_MCPS);
  const [rules, setRules] = useState({
    caveman: true,
    uncensored: false,
    antiGhostWrite: true,
    graphifyAstSync: true,
    ipAdapterLock: true,
    f5TtsZeroShot: true
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const toggleMcp = (id: string) => {
    setMcps(prev => prev.map(m => {
      if (m.id === id) {
        const next = !m.active;
        showToast(`Servidor MCP [${m.name}] ${next ? 'ATIVADO' : 'DESATIVADO'}.`);
        return { ...m, active: next };
      }
      return m;
    }));
  };

  const toggleRule = (key: keyof typeof rules) => {
    const updated = { ...rules, [key]: !rules[key] };
    setRules(updated);
    showToast(`Regra [${key}] alterada para ${updated[key] ? 'ATIVADA' : 'DESATIVADA'}.`);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#050509]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1c1c2a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔌</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Meta-MCP Lazy Loader & Regras Modulares do Sistema
            </h2>
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Projeto: {activeProject}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Ativação sob demanda de servidores MCP e parametrização do comportamento neural dos agentes.
          </p>
        </div>
      </div>

      {/* Matriz de Servidores MCP */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center justify-between">
          <span>Servidores MCP Registrados no V0id OS</span>
          <span className="text-[10px] text-indigo-400 font-mono">Consumo RAM Total: ~165 MB</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mcps.map(mcp => (
            <div
              key={mcp.id}
              onClick={() => toggleMcp(mcp.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                mcp.active
                  ? 'bg-[#0f0e1c] border-indigo-500/50 shadow-lg shadow-indigo-950/30'
                  : 'bg-[#0a0a12] border-[#1c1c28] opacity-60 hover:opacity-90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className={`text-xs font-bold ${mcp.active ? 'text-white' : 'text-gray-300'}`}>{mcp.name}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">{mcp.category}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    mcp.active ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {mcp.active ? 'ATIVO' : 'STANDBY'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{mcp.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#181826] text-[10px] text-gray-500 font-mono">
                <span>{mcp.toolsCount} Ferramentas</span>
                <span className="text-emerald-400">{mcp.ramUsage} RAM</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor de Regras Modulares */}
      <div className="bg-[#0a0a14] border border-[#1c1c2a] rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center justify-between">
          <span>📜 Diretrizes & Regras Ativas do Agente</span>
          <span className="text-[10px] text-gray-400 font-mono">SOUL.md Bridge</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            { key: 'caveman', label: 'Modo Caveman (Respostas Ultracurtas)', desc: 'Economiza tokens eliminando introduções e explicações desnecessárias.' },
            { key: 'antiGhostWrite', label: 'Anti-Ghost Write Enforcement', desc: 'Bloqueia conclusão de tarefa sem modificação física comprovada no Windows.' },
            { key: 'graphifyAstSync', label: 'Graphify Auto-Sync Obrigatório', desc: 'Executa graphify update . após qualquer criação ou edição de arquivo de código.' },
            { key: 'uncensored', label: 'Modo Sem Censura (Dolphin / Hermes)', desc: 'Roteia para modelos abliterated no OpenRouter para histórias de ficção zumbi/horror.' },
            { key: 'ipAdapterLock', label: 'Cofre de Consistência Facial (IP-Adapter)', desc: 'Mantém a mesma seed de personagem consistente entre gerações de cenas.' },
            { key: 'f5TtsZeroShot', label: 'Clonagem de Voz F5-TTS Zero-Shot', desc: 'Usa a voz configurada para dublagens e locuções automáticas.' }
          ].map(item => {
            const active = rules[item.key as keyof typeof rules];
            return (
              <div
                key={item.key}
                onClick={() => toggleRule(item.key as keyof typeof rules)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  active ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-[#06060c] border-[#181824] opacity-50 hover:opacity-80'
                }`}
              >
                <div>
                  <p className={`font-semibold ${active ? 'text-indigo-200' : 'text-gray-400'}`}>{item.label}</p>
                  <p className="text-[10px] text-gray-500 leading-snug">{item.desc}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold flex-shrink-0 ml-3 ${
                  active ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {active ? 'ON' : 'OFF'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
