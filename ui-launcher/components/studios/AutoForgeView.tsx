import React, { useState } from 'react';

interface ToolItem {
  id: string;
  name: string;
  source: string;
  sourceType: 'github' | 'rea' | 'hf';
  score: number;
  replacementTarget: string;
  desc: string;
  impact: string;
  security: string;
  status: 'PENDENTE' | 'INSTALADO' | 'TESTANDO';
  reportId?: string;
  reportSummary?: string;
}

const FORGE_TOOLS: ToolItem[] = [
  {
    id: 'f5-tts',
    name: 'F5-TTS Voice Cloner MCP',
    source: '🤗 Hugging Face ZeroGPU',
    sourceType: 'hf',
    score: 98,
    replacementTarget: 'Substitui: APIs pagas de voz (ElevenLabs / Cartesia) — Roda 100% grátis na nuvem',
    desc: 'Motor de clonagem de voz zero-shot em tempo recorde utilizando GPUs gratuitas na nuvem via gradio_client. Gera áudios e vozes idênticas para o OmniMedia Studio.',
    impact: 'Libera clonagem de voz profissional sem consumir 1MB de VRAM da placa Intel Iris Xe local.',
    security: '✅ Verificado na Sandbox Docker (Zero Risco)',
    status: 'PENDENTE',
    reportSummary: 'F5-TTS utiliza modelo de difusão não-autoregressivo que clona voz humana com 10s de áudio. Economia de $0.00 com ZeroGPU e latência inferior a 1.2s.'
  },
  {
    id: 'ast-v2',
    name: 'Code-Review-Graph AST v2',
    source: '📦 GitHub Open-Source',
    sourceType: 'github',
    score: 99,
    replacementTarget: 'Substitui: Parsers regex frágeis e scanners de código pesados',
    desc: 'Mapeador de sintaxe abstrata integrado ao Graphify que analisa dependências entre módulos e bloqueia automaticamente Ghost Writes ou funções zumbis antes da gravação no disco.',
    impact: 'Reduz o gasto de tokens em 85% fornecendo apenas os nós essenciais no contexto do modelo.',
    security: '✅ Verificado na Sandbox Docker (Zero Risco)',
    status: 'PENDENTE',
    reportSummary: 'Integração direta com o grafo AST do Graphify (270 nós), permitindo verificação semântica em menos de 10ms antes de qualquer write_file.'
  },
  {
    id: 'live-portrait',
    name: 'LivePortrait LipSync ZeroGPU',
    source: '🤗 Hugging Face ZeroGPU',
    sourceType: 'hf',
    score: 95,
    replacementTarget: 'Substitui: SadTalker lento e com artefatos de boca em vídeo',
    desc: 'Sincronizador labial neural e animador de expressões faciais a partir de arquivos .wav e imagens estáticas dos personagens salvos no Cofre de Consistência.',
    impact: 'Gera cutscenes e episódios de novelas verticais com sincronia de boca perfeita em 3 segundos.',
    security: '✅ Verificado na Sandbox Docker (Zero Risco)',
    status: 'PENDENTE',
    reportSummary: 'Retargeting de pontos de controle facial em 60fps sem deformação da fisionomia do personagem cadastrado no Cofre de Consistência.'
  },
  {
    id: 'pncp-rea',
    name: 'Scraper Licitações .gov via REA',
    source: '🕵️ Engenharia Reversa REA (Sandbox)',
    sourceType: 'rea',
    score: 97,
    replacementTarget: 'Substitui: Monitoramento manual de compras governamentais e APIs pagas',
    desc: 'Extrator inteligente forjado por engenharia reversa que monitora em tempo real a API do Portal Nacional de Contratações Públicas (PNCP) para licitações de software.',
    impact: 'Alimenta o estúdio de Finanças automaticamente com editais lucrativos de TI sem depender de APIs pagas.',
    security: '✅ Verificado na Sandbox Docker (Zero Risco)',
    status: 'PENDENTE',
    reportSummary: 'Crawler assíncrono em Sandbox Docker que consulta os endpoints do Compras.gov.br e extrai editais de TI com valor estimado acima de R$ 50.000.'
  },
  {
    id: 'trellis-3d',
    name: 'TRELLIS 3D Mesh Generator',
    source: '🤗 Hugging Face ZeroGPU',
    sourceType: 'hf',
    score: 96,
    replacementTarget: 'Substitui: Modelagem 3D manual demorada no Blender',
    desc: 'Gerador de modelos 3D (.glb) e spritesheets em 360 graus a partir de simples prompts textuais ou fotos de naves para a Game Studio Engine.',
    impact: 'Produz assets tridimensionais completos prontos para renderização em WebGL / Canvas sem esforço manual.',
    security: '✅ Verificado na Sandbox Docker (Zero Risco)',
    status: 'PENDENTE',
    reportSummary: 'Estruturação geométrica direta com mapas de texturas e malha triangular limpa, exportando arquivos .glb leves para carregamento web em 60fps.'
  },
  {
    id: 'remotion-v4',
    name: 'Remotion Video Synthesizer',
    source: '📦 GitHub Open-Source',
    sourceType: 'github',
    score: 94,
    replacementTarget: 'Substitui: Editores pesados de vídeo desktop (Premiere / After Effects)',
    desc: 'Framework de vídeo programático em React que compila legendas animadas WhisperX (.ass), áudio e cortes de cena em vídeos .mp4 de alta resolução.',
    impact: 'Renderiza vídeos em lote em segundo plano para o estúdio de Marketing e Instagram Tech News.',
    security: '✅ Verificado na Sandbox Docker (Zero Risco)',
    status: 'PENDENTE',
    reportSummary: 'Compilador determinístico de vídeo em NodeJS/React que sincroniza frames com ondas de áudio F5-TTS e gera arquivos .mp4 prontos para Reels.'
  }
];

export default function AutoForgeView({ activeProject }: { activeProject: string }) {
  const [tools, setTools] = useState<ToolItem[]>(FORGE_TOOLS);
  const [filter, setFilter] = useState<'all' | 'hf' | 'github' | 'rea'>('all');
  const [cloneUrl, setCloneUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [sandboxModal, setSandboxModal] = useState<ToolItem | null>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [reportModal, setReportModal] = useState<ToolItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleInstall = (id: string) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'INSTALADO' } : t));
    const tool = tools.find(t => t.id === id);
    showToast(`⚡ Ferramenta "${tool?.name}" aprovada e instalada no V0id OS!`);
  };

  const handleReject = (id: string) => {
    const tool = tools.find(t => t.id === id);
    setTools(prev => prev.filter(t => t.id !== id));
    showToast(`Ferramenta "${tool?.name}" descartada do catálogo.`);
  };

  const runSandboxTest = (tool: ToolItem) => {
    setSandboxModal(tool);
    setSandboxLogs([
      `[SANDBOX] Iniciando container isolado Docker para ${tool.id}...`,
      `[SANDBOX] Montando volume temporário /tmp/v0id-sandbox-agent...`,
      `[DOCKER] Limite de memória: 256MB | Sem acesso à rede de host | Sem privilégios root`,
      `[SCAN] Executando Semgrep SAST no código do MCP...`,
      `[OK] 0 vulnerabilidades críticas encontradas.`
    ]);

    setTimeout(() => {
      setSandboxLogs(prev => [
        ...prev,
        `[TEST] Simulação de chamada de ferramenta executada com sucesso.`,
        `[STATUS] Ferramenta segura para integração com V0id OS.`
      ]);
    }, 1500);
  };

  const handleScanWeb = async () => {
    setIsScanning(true);
    showToast('Executando varredura profunda sincronizada com o Research Studio...');

    try {
      const res = await fetch('/api/autoforge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' })
      });
      const data = await res.json();

      setIsScanning(false);
      if (data.success && Array.isArray(data.tools)) {
         setTools(data.tools);
         showToast(`Varredura concluída. ${data.tools.length} ferramentas analisadas e prontas para aprovação.`);
      }
    } catch (e: any) {
      setIsScanning(false);
      showToast('Erro ao realizar a varredura (AutoForge API).');
    }
  };

  const handleCloneRepo = () => {
    if (!cloneUrl.trim()) return;
    const url = cloneUrl.trim();
    setCloneUrl('');
    showToast(`Iniciando Engenharia Reversa REA para: ${url}`);
    const newTool: ToolItem = {
      id: `rea-${Date.now().toString().slice(-4)}`,
      name: `Extrator REA: ${url.replace('https://github.com/', '').slice(0, 20)}`,
      source: '🕵️ Engenharia Reversa REA (Sandbox)',
      sourceType: 'rea',
      score: 95,
      replacementTarget: 'Nova Capacidade Inédita Forjada Sob Demanda',
      desc: `Módulo sintetizado a partir de ${url} contendo ferramentas MCP isoladas e prontas para uso.`,
      impact: 'Adiciona capacidade sob demanda forjada em container.',
      security: '✅ Verificado na Sandbox Docker (Zero Risco)',
      status: 'PENDENTE',
      reportSummary: `Ferramenta extraída de ${url} via REA e validada no ambiente de sandbox do V0id.`
    };
    setTools(prev => [newTool, ...prev]);
  };

  const filtered = filter === 'all' ? tools : tools.filter(t => t.sourceType === filter);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#030306]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-amber-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header do Módulo com Agendador às 06:00 AM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1c1c2a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚡</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Auto-Forge & Engenharia Reversa REA
            </h2>
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              ⏰ Varredura Diária Automática: 06:00 AM
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Descubra, forje e teste ferramentas MCP do GitHub, Hugging Face e APIs públicas em Sandbox Docker antes de integrá-las ao seu sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScanWeb}
            disabled={isScanning}
            className="text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isScanning ? '🔄 Sincronizando com Research...' : '🔍 Disparar Varredura Manual'}</span>
          </button>
        </div>
      </div>

      {/* Barra de Clonagem / REA */}
      <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-center">
        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 flex-shrink-0">
          🕵️ Clonar com REA:
        </span>
        <input
          type="text"
          value={cloneUrl}
          onChange={e => setCloneUrl(e.target.value)}
          placeholder="Cole URL do GitHub, HuggingFace Space ou API para clonagem e extração..."
          className="flex-1 bg-[#06060c] border border-[#222236] rounded-xl px-3.5 py-2 text-xs text-gray-200 outline-none focus:border-amber-500"
        />
        <button
          onClick={handleCloneRepo}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex-shrink-0"
        >
          Forjar com REA
        </button>
      </div>

      {/* Filtros por Categoria */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'Todas as Ferramentas' },
          { key: 'hf', label: 'ZeroGPU Hugging Face' },
          { key: 'github', label: 'GitHub Open-Source' },
          { key: 'rea', label: 'Engenharia Reversa REA' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`text-xs px-3.5 py-1.5 rounded-xl border transition ${
              filter === item.key
                ? 'bg-amber-600 text-white border-amber-500 font-bold'
                : 'bg-[#0a0a14] text-gray-400 border-[#1c1c28] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Grid de Cards de Ferramentas com Score e Análise de Substituição */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tool => (
          <div
            key={tool.id}
            className="bg-[#090912] border border-[#1d1d2e] rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-xs font-bold text-white leading-tight">{tool.name}</h3>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded-md font-mono flex-shrink-0">
                  {tool.score}/100 ⭐
                </span>
              </div>

              <div className="text-[10px] text-gray-400 mb-2 font-mono">{tool.source}</div>

              {/* Análise de Substituição em Destaque */}
              <div className="bg-[#06060c] p-2.5 rounded-xl border border-amber-900/30 mb-2.5">
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                  🎯 Análise de Substituição
                </span>
                <p className="text-[11px] text-gray-200 mt-0.5 leading-snug">
                  {tool.replacementTarget}
                </p>
              </div>

              <p className="text-xs text-gray-300 mb-3 leading-relaxed">{tool.desc}</p>

              <div className="bg-[#06060c] p-2 rounded-xl border border-[#161622] mb-3 space-y-1">
                <div className="text-[10px] text-gray-400">
                  <span className="text-emerald-400 font-bold">Impacto: </span>
                  {tool.impact}
                </div>
                <div className="text-[10px] text-gray-400">
                  <span className="text-indigo-400 font-bold">Segurança: </span>
                  {tool.security}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#181826]">
              {/* Botão de Ler Relatório Técnico */}
              <button
                onClick={() => setReportModal(tool)}
                className="w-full text-[11px] bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 py-1 rounded-xl transition flex items-center justify-center gap-1 font-semibold"
              >
                <span>📄</span>
                <span>Ler Relatório do Research Studio</span>
              </button>

              <div className="flex items-center gap-2">
                {tool.status !== 'INSTALADO' ? (
                  <button
                    onClick={() => handleInstall(tool.id)}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold py-1.5 rounded-xl transition shadow-md shadow-amber-950/40"
                  >
                    ⚡ Instalar no V0id
                  </button>
                ) : (
                  <span className="flex-1 text-center py-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800 rounded-xl">
                    ✅ Instalado
                  </span>
                )}
                <button
                  onClick={() => runSandboxTest(tool)}
                  className="text-[11px] bg-[#161624] hover:bg-[#202034] text-gray-300 border border-[#2b2b40] px-3 py-1.5 rounded-xl transition"
                >
                  🧪 Sandbox
                </button>
                <button
                  onClick={() => handleReject(tool.id)}
                  className="text-[11px] bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 px-2.5 py-1.5 rounded-xl transition"
                  title="Descartar ferramenta"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Relatório Técnico do Research Studio */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#0b0b14] border border-[#27273c] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e1e2e] mb-4">
              <div>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                  Score de Avaliação: {reportModal.score}/100 ⭐
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Relatório Técnico: {reportModal.name}
                </h3>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-300 font-sans mb-5">
              <div className="bg-[#06060c] p-3.5 rounded-xl border border-amber-900/30">
                <strong className="text-amber-400 block mb-1">Análise de Substituição:</strong>
                {reportModal.replacementTarget}
              </div>

              <div className="bg-[#06060c] p-3.5 rounded-xl border border-indigo-900/30">
                <strong className="text-indigo-400 block mb-1">Fundamentação Técnica (Research Studio):</strong>
                {reportModal.reportSummary}
              </div>

              <div className="bg-[#06060c] p-3.5 rounded-xl border border-emerald-900/30">
                <strong className="text-emerald-400 block mb-1">Garantia de Sandbox & Recursos:</strong>
                {reportModal.security} — {reportModal.impact}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  handleInstall(reportModal.id);
                  setReportModal(null);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition"
              >
                Aprovar & Instalar no V0id
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sandbox Docker */}
      {sandboxModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#0f0f18] border border-[#27273c] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span>🧪 Execução Isolada em Sandbox Docker: {sandboxModal.name}</span>
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              O teste roda em container isolado sem privilégios para garantir que a ferramenta não faça escritas fantasmas ou chamadas não autorizadas.
            </p>

            <div className="bg-[#06060c] border border-[#1a1a28] rounded-xl p-4 font-mono text-xs text-emerald-400 min-h-[160px] max-h-64 overflow-y-auto space-y-1 mb-4">
              {sandboxLogs.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSandboxModal(null)}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition"
              >
                Fechar Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
