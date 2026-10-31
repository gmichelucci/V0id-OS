import React, { useState } from 'react';

interface McpAuditPlugin {
  id: string;
  name: string;
  origin: string;
  category: string;
  tools: string[];
  ram: string;
  latency: string;
  status: 'OPERACIONAL' | 'STANDBY';
}

const INITIAL_MCPS: McpAuditPlugin[] = [
  {
    id: 'omniroute',
    name: 'OmniRoute Meta-Router',
    origin: 'Local (01_core_security/omni-router)',
    category: 'Roteamento & Inteligência Artificial',
    tools: ['omniroute_route_request', 'omniroute_check_quota', 'omniroute_cost_report', 'omniroute_memory_search', 'omniroute_skills_list', 'omniroute_sync_pricing'],
    ram: '28 MB',
    latency: '42ms',
    status: 'OPERACIONAL'
  },
  {
    id: 'graphify',
    name: 'Graphify Knowledge AST',
    origin: 'CLI Nativo (graphify CLI)',
    category: 'Sintaxe & Análise Semântica de Código',
    tools: ['query_graph', 'get_node', 'get_neighbors', 'god_nodes', 'shortest_path', 'graph_stats'],
    ram: '42 MB',
    latency: '15ms',
    status: 'OPERACIONAL'
  },
  {
    id: 'ponytail',
    name: 'Ponytail Senior Lazy Dev',
    origin: 'Plugin Bundled (.gemini/config/plugins/ponytail)',
    category: 'Auditoria de Código & Economia de Tokens',
    tools: ['ponytail_audit', 'ponytail_review', 'ponytail_debt', 'ponytail_gain', 'ponytail_help'],
    ram: '14 MB',
    latency: '10ms',
    status: 'OPERACIONAL'
  },
  {
    id: 'rea',
    name: 'REA Reverse Engineering Agent',
    origin: 'Container Docker Sandbox (/tmp/v0id-rea)',
    category: 'Engenharia Reversa & Scrapers',
    tools: ['rea_clone_repo', 'rea_extract_endpoints', 'rea_sandbox_test', 'rea_generate_mcp'],
    ram: '65 MB',
    latency: '120ms',
    status: 'OPERACIONAL'
  },
  {
    id: 'gcloud-gdrive',
    name: 'Google Cloud & Google Drive Bridge',
    origin: 'Plugin Bundled (.gemini/config/plugins/gdrive)',
    category: 'Sincronização de Mídias & Nuvem',
    tools: ['gdrive_search', 'gdrive_upload', 'gdrive_download', 'gcloud_status'],
    ram: '34 MB',
    latency: '85ms',
    status: 'OPERACIONAL'
  },
  {
    id: 'stripe-guard',
    name: 'Stripe Guard & Financial Lock',
    origin: 'MCP Server Lazy (Cerebras / Tools)',
    category: 'Segurança Financeira & Checkout',
    tools: ['stripe_api_read', 'stripe_account_info', 'stripe_analytics'],
    ram: '15 MB',
    latency: '90ms',
    status: 'STANDBY'
  }
];

export default function PluginsMcpAuditView({ activeProject }: { activeProject: string }) {
  const [plugins, setPlugins] = useState<McpAuditPlugin[]>(INITIAL_MCPS);
  const [selectedPlugin, setSelectedPlugin] = useState<McpAuditPlugin | null>(INITIAL_MCPS[0]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUninstall = (id: string) => {
    const p = plugins.find(item => item.id === id);
    if (!confirm(`Deseja realmente desinstalar e excluir o plugin MCP [${p?.name}]?`)) return;
    setPlugins(prev => prev.filter(item => item.id !== id));
    if (selectedPlugin?.id === id) setSelectedPlugin(plugins[0] || null);
    showToast(`Plugin [${p?.name}] desinstalado com sucesso do V0id OS.`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#030306]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="h-14 border-b border-[#1c1c2a] px-6 flex items-center justify-between bg-[#07070e] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔌</span>
          <h2 className="text-sm font-extrabold text-white tracking-wide">
            Plugins MCP — Auditoria de Integrações & Diagnóstico
          </h2>
          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded font-mono font-bold">
            6 Servidores Registrados
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
          <span>Consumo de Memória: <strong className="text-emerald-400">198 MB</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">Zero Conflitos</span>
        </div>
      </div>

      {/* Grid: Lista de Plugins à Esquerda + Detalhes e Ferramentas à Direita */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Coluna Esquerda: Lista de Plugins */}
        <div className="w-96 border-r border-[#181824] bg-[#05050a] p-4 flex flex-col overflow-y-auto flex-shrink-0 space-y-3">
          {plugins.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPlugin(p)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                selectedPlugin?.id === p.id
                  ? 'bg-purple-950/40 border-purple-500/60 shadow-lg'
                  : 'bg-[#0a0a14] border-[#181826] hover:border-gray-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-xs font-bold text-white">{p.name}</h4>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                    p.status === 'OPERACIONAL' ? 'bg-emerald-950 text-emerald-300' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mb-2">{p.origin}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span>{p.tools.length} Funções MCP</span>
                  <span className="text-emerald-400">{p.ram}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coluna Direita: Diagnóstico e Funções Ofertadas */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#040408]">
          {selectedPlugin ? (
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1c1c2a]">
                <div>
                  <h1 className="text-base font-extrabold text-white">{selectedPlugin.name}</h1>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedPlugin.origin}</p>
                </div>
                <button
                  onClick={() => handleUninstall(selectedPlugin.id)}
                  className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <span>🗑️</span>
                  <span>Desinstalar / Excluir Plugin</span>
                </button>
              </div>

              {/* Métricas de Diagnóstico */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Consumo de RAM</span>
                  <p className="text-sm font-bold text-emerald-400 font-mono">{selectedPlugin.ram}</p>
                </div>
                <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Latência de Execução</span>
                  <p className="text-sm font-bold text-indigo-400 font-mono">{selectedPlugin.latency}</p>
                </div>
                <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Categoria</span>
                  <p className="text-xs font-bold text-purple-300">{selectedPlugin.category}</p>
                </div>
              </div>

              {/* Lista de Ferramentas / Funções MCP Oferecidas */}
              <div className="bg-[#090912] border border-[#1c1c2a] rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                  Ferramentas & Funções Oferecidas ao OmniRouter ({selectedPlugin.tools.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedPlugin.tools.map(tool => (
                    <div key={tool} className="bg-[#050508] border border-[#181824] p-2.5 rounded-xl text-xs font-mono text-indigo-300 flex items-center gap-2">
                      <span className="text-gray-500">⚡</span>
                      <span>{tool}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
              Selecione um plugin à esquerda para visualizar seu diagnóstico.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
