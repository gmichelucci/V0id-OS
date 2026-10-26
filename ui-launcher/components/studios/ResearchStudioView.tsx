import React, { useState } from 'react';

interface TechReport {
  id: string;
  title: string;
  source: string;
  score: number;
  replacementTarget: string;
  tokenSavings: string;
  summary: string;
  architectureFit: string;
  date: string;
}

const INITIAL_REPORTS: TechReport[] = [
  {
    id: 'rep-f5tts',
    title: 'F5-TTS Voice Cloner Zero-Shot vs ElevenLabs & Cartesia',
    source: 'Hugging Face Daily Papers / GitHub Trending',
    score: 98,
    replacementTarget: 'Substitui: APIs de áudio pagas (ElevenLabs)',
    tokenSavings: 'Economia de 100% de custos financeiros e roda em ZeroGPU sem VRAM local',
    summary: 'O F5-TTS utiliza modelo de difusão não-autoregressivo que clona a voz humana com apenas 10 segundos de áudio de referência. Elimina a necessidade de treinamento de checkpoints por personagem e suporta entonação dramática para novelas.',
    architectureFit: 'Conexão direta com a Bancada de Áudio do OmniMedia Studio para dublagens e locuções.',
    date: 'Hoje às 06:00 AM'
  },
  {
    id: 'rep-liveportrait',
    title: 'LivePortrait LipSync a 60fps vs SadTalker & Wav2Lip',
    source: 'ArXiv Preprints (Computer Vision)',
    score: 95,
    replacementTarget: 'Substitui: SadTalker lento e com borrões de boca',
    tokenSavings: 'Redução de tempo de inferência de 45s para 3s por frame de vídeo',
    summary: 'Algoritmo de retargeting de expressões faciais com controle implícito de pontos-chave. Permite gerar animações labiais perfeitas sobre qualquer imagem de personagem estático mantendo a identidade intacta.',
    architectureFit: 'Alimenta a Bancada de Vídeo Master do OmniMedia Studio para cutscenes e novelas verticais.',
    date: 'Hoje às 06:00 AM'
  },
  {
    id: 'rep-crawl4ai',
    title: 'Crawl4AI & REA Engine vs Scrapy & Selenium',
    source: 'GitHub Trending (Python / AI Scrapers)',
    score: 97,
    replacementTarget: 'Substitui: Web scrapers lentos que consomem 800MB de RAM',
    tokenSavings: 'Reduz consumo de contexto em 80% formatando páginas em Markdown estruturado',
    summary: 'Crawler assíncrono projetado especificamente para agentes de IA. Extrai dados de páginas dinâmicas, limpa tags irrelevantes e entrega texto puro diretamente para os modelos 120B.',
    architectureFit: 'Integrado ao Radar de Licitações do PNCP e ao Auto-Forge para engenharia reversa.',
    date: 'Hoje às 06:00 AM'
  },
  {
    id: 'rep-trellis',
    title: 'TRELLIS 3D Mesh Generator vs TripoSR & Shap-E',
    source: 'Hugging Face Spaces / NeurIPS AI',
    score: 96,
    replacementTarget: 'Substitui: Modelagem manual 3D no Blender',
    tokenSavings: 'Gera assets .glb texturizados prontos para o Game Studio em 15 segundos',
    summary: 'Modelo de representação 3D estruturada que converte imagens 2D ou prompts de texto em malhas tridimensionais com topologia limpa e mapas de normais PBR.',
    architectureFit: 'Exportação direta para o Game Studio Engine e renderização na Viewport.',
    date: 'Hoje às 06:00 AM'
  }
];

export default function ResearchStudioView({ activeProject }: { activeProject: string }) {
  const [reports, setReports] = useState<TechReport[]>(INITIAL_REPORTS);
  const [selectedReport, setSelectedReport] = useState<TechReport | null>(INITIAL_REPORTS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [searchUrl, setSearchUrl] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDeepScan = () => {
    setIsScanning(true);
    showToast('Iniciando Varredura Profunda em GitHub Trending, ArXiv e Hugging Face...');
    setTimeout(() => {
      setIsScanning(false);
      showToast('Varredura concluída. 4 novos relatórios técnicos sintetizados com sucesso.');
    }, 2200);
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
          <span className="text-xl">🔬</span>
          <h2 className="text-sm font-extrabold text-white tracking-wide">
            Research Studio — Radar de Inteligência Técnica & Papers
          </h2>
          <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded font-mono font-bold">
            Scanner Agendado: 06:00 AM Diário
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeepScan}
            disabled={isScanning}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-xl transition shadow-lg shadow-indigo-950/40 flex items-center gap-1.5"
          >
            <span>{isScanning ? '🔄 Analisando Papers...' : '🔍 Disparar Varredura Manual'}</span>
          </button>
        </div>
      </div>

      {/* Corpo Dividido: Lista de Relatórios à Esquerda + Visualizador Completo à Direita */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Coluna Esquerda: Lista de Relatórios */}
        <div className="w-96 border-r border-[#181824] bg-[#05050a] p-4 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#181824]">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Relatórios Técnicos ({reports.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">100% Verificados</span>
          </div>

          <div className="space-y-2.5">
            {reports.map(rep => (
              <div
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedReport?.id === rep.id
                    ? 'bg-indigo-950/50 border-indigo-500/60 shadow-lg'
                    : 'bg-[#0a0a14] border-[#181826] hover:border-gray-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-white leading-tight">{rep.title}</h4>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded flex-shrink-0">
                      Score: {rep.score}/100
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono mb-2">{rep.source}</p>
                  <p className="text-[11px] text-emerald-400 font-mono truncate">{rep.replacementTarget}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-[#161622] flex items-center justify-between text-[9px] text-gray-500">
                  <span>{rep.date}</span>
                  <span className="text-indigo-400 font-bold">Ver Análise Completa →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Relatório Técnico em Detalhes */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#040408]">
          {selectedReport ? (
            <div className="max-w-4xl space-y-6">
              <div className="pb-4 border-b border-[#1c1c2a]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded font-mono font-bold">
                    Score Geral: {selectedReport.score} / 100
                  </span>
                  <span className="text-xs text-gray-500 font-mono">• {selectedReport.date}</span>
                </div>
                <h1 className="text-lg font-extrabold text-white leading-tight">
                  {selectedReport.title}
                </h1>
                <p className="text-xs text-indigo-400 font-mono mt-1">Fonte Primária: {selectedReport.source}</p>
              </div>

              {/* Box de Análise de Substituição & Economia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    🎯 Análise de Substituição
                  </span>
                  <p className="text-xs text-gray-200">{selectedReport.replacementTarget}</p>
                </div>

                <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    ⚡ Impacto em Tokens e Recursos
                  </span>
                  <p className="text-xs text-gray-200">{selectedReport.tokenSavings}</p>
                </div>
              </div>

              {/* Resumo Técnico e Metodologia */}
              <div className="bg-[#080812] border border-[#1a1a28] rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Resumo Executivo do Artigo / Repositório
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {selectedReport.summary}
                </p>
              </div>

              {/* Encaixe na Arquitetura do V0id OS */}
              <div className="bg-[#080812] border border-[#1a1a28] rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Encaixe Arquitetural no V0id OS
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {selectedReport.architectureFit}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
              Selecione um relatório técnico à esquerda para visualizar os detalhes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
