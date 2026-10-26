import React, { useState } from 'react';

interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  schedule: string;
  status: 'ATIVO' | 'PAUSADO';
  lastRun: string;
}

const FLOWS: AutomationFlow[] = [
  {
    id: 'pncp-scout',
    name: 'Radar Autônomo de Editais PNCP (Gov.br)',
    trigger: 'Cron Job a cada 2 horas',
    action: 'Varre compras.gov.br com REA, filtra editais de TI e grava em vault/editais_filtrados.json',
    schedule: '0 */2 * * *',
    status: 'ATIVO',
    lastRun: 'Hoje às 17:00'
  },
  {
    id: 'novel-pipeline',
    name: 'Fábrica Diária de Episódios de Novela',
    trigger: 'Diariamente às 08:00',
    action: 'Gera roteiro com Cerebras 120B, sintetiza voz com F5-TTS e monta legenda .ass com WhisperX',
    schedule: '0 8 * * *',
    status: 'ATIVO',
    lastRun: 'Hoje às 08:00'
  },
  {
    id: 'git-backup',
    name: 'Auto-Sync e Commit Checkpoint',
    trigger: 'Final do dia útil (18:30)',
    action: 'Executa git add, commit com tag V0id auto-sync e espelha output/ no Google Drive',
    schedule: '30 18 * * 1-5',
    status: 'ATIVO',
    lastRun: 'Ontem às 18:30'
  },
  {
    id: 'insta-publisher',
    name: 'Publicador Instagram Tech News',
    trigger: 'Horários nobres (12:00 e 18:00)',
    action: 'Coleta notícias do HackerNews, resume em carrossel e prepara post no Instagram',
    schedule: '0 12,18 * * *',
    status: 'PAUSADO',
    lastRun: '2 dias atrás'
  }
];

export default function AutomationsView({ activeProject }: { activeProject: string }) {
  const [flows, setFlows] = useState<AutomationFlow[]>(FLOWS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const toggleFlow = (id: string) => {
    setFlows(prev => prev.map(f => {
      if (f.id === id) {
        const next = f.status === 'ATIVO' ? 'PAUSADO' : 'ATIVO';
        showToast(`Fluxo [${f.name}] ${next === 'ATIVO' ? 'ATIVADO' : 'PAUSADO'}.`);
        return { ...f, status: next };
      }
      return f;
    }));
  };

  const triggerNow = (f: AutomationFlow) => {
    showToast(`🚀 Disparo manual iniciado para o fluxo "${f.name}"!`);
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
            <span className="text-xl">🤖</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Automações n8n & Robôs em Background 24/7
            </h2>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Projeto: {activeProject}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Pipelines agendados e execução assíncrona de agentes em segundo plano sem necessidade de manter o terminal aberto.
          </p>
        </div>

        <button
          onClick={() => showToast('Novo fluxo cron criado na fila do V0id.')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-950/50 flex items-center gap-1.5"
        >
          <span>+ Criar Novo Robô</span>
        </button>
      </div>

      {/* Lista de Fluxos */}
      <div className="space-y-4 mb-8">
        {flows.map(flow => (
          <div
            key={flow.id}
            className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-5 hover:border-indigo-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-sm font-bold text-white">{flow.name}</span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  flow.status === 'ATIVO' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-gray-800 text-gray-400'
                }`}>
                  {flow.status}
                </span>
                <span className="text-[10px] font-mono text-gray-500 bg-[#06060c] px-2 py-0.5 rounded">
                  {flow.schedule}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{flow.action}</p>
              <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                <span>Gatilho: <strong className="text-gray-300">{flow.trigger}</strong></span>
                <span>•</span>
                <span>Última Execução: <strong className="text-emerald-400">{flow.lastRun}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => triggerNow(flow)}
                className="text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl transition font-semibold"
              >
                ▶️ Disparar Agora
              </button>
              <button
                onClick={() => toggleFlow(flow.id)}
                className={`text-xs px-3.5 py-1.5 rounded-xl border transition font-semibold ${
                  flow.status === 'ATIVO'
                    ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/40'
                    : 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800/40'
                }`}
              >
                {flow.status === 'ATIVO' ? '⏸️ Pausar' : '▶️ Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Biblioteca de Skills Salvas */}
      <div className="bg-[#080810] border border-[#1a1a26] rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center justify-between">
          <span>📚 Biblioteca de Skills Conectadas ao n8n</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { name: 'automation', desc: 'Design e deploy de cron jobs e timers' },
            { name: 'graphify', desc: 'Sincronização de grafo semântico' },
            { name: 'gdrive', desc: 'Upload e download no Google Drive' },
            { name: 'ponytail', desc: 'Auditorias de código e corte de bloat' }
          ].map(s => (
            <div key={s.name} className="bg-[#0e0e18] p-3 rounded-xl border border-[#1c1c2a]">
              <p className="font-bold text-indigo-300 font-mono mb-1">{s.name}</p>
              <p className="text-[10px] text-gray-400 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
