import React, { useState, useEffect, useRef } from 'react';
import BlackHoleIcon from '../icons/BlackHoleIcon';

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

  // Estado do Loop de Auto-Evolução e Orçamento de Tokens
  const [isLoopRunning, setIsLoopRunning] = useState(false);
  const [loopPid, setLoopPid] = useState<number | null>(null);
  const [recentLogs, setRecentLogs] = useState<string>('Carregando registros de evolução...');
  const [currentCommit, setCurrentCommit] = useState<string>('');
  const [safeCheckpointTag, setSafeCheckpointTag] = useState<string>('v5.0-stable-gold-checkpoint');
  const [isActionPending, setIsActionPending] = useState(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);

  const logTerminalRef = useRef<HTMLPreElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Carrega status da API de Automações
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.success) {
        setIsLoopRunning(data.isRunning);
        setLoopPid(data.pid);
        setRecentLogs(data.recentLogs || 'Nenhum log disponível.');
        setCurrentCommit(data.currentCommit || '');
        if (data.safeCheckpointTag) setSafeCheckpointTag(data.safeCheckpointTag);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Iniciar Loop Contínuo até acabar tokens
  const startEvolutionLoop = async () => {
    setIsActionPending(true);
    try {
      const res = await fetch('/api/automations?action=start', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsLoopRunning(true);
        showToast(data.message || '🚀 Loop de evolução autônoma iniciado!');
      } else {
        showToast(`❌ Falha: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Erro na requisição: ${err.message}`);
    } finally {
      setIsActionPending(false);
      fetchStatus();
    }
  };

  // Parar Loop
  const stopEvolutionLoop = async () => {
    setIsActionPending(true);
    try {
      const res = await fetch('/api/automations?action=stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsLoopRunning(false);
        showToast(data.message || '⏹ Loop interrompido.');
      }
    } catch (err: any) {
      showToast(`Erro ao parar: ${err.message}`);
    } finally {
      setIsActionPending(false);
      fetchStatus();
    }
  };

  // Executar Rollback Seguro
  const executeRollback = async () => {
    setIsActionPending(true);
    setRollbackModalOpen(false);
    try {
      const res = await fetch('/api/automations?action=rollback', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsLoopRunning(false);
        showToast(data.message || '⏪ Rollback concluído com sucesso!');
      } else {
        showToast(`❌ Falha no rollback: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Erro no rollback: ${err.message}`);
    } finally {
      setIsActionPending(false);
      fetchStatus();
    }
  };

  // Criar Novo Checkpoint
  const createNewCheckpoint = async () => {
    setIsActionPending(true);
    try {
      const res = await fetch('/api/automations?action=checkpoint', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || '💾 Novo checkpoint registrado!');
      } else {
        showToast(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setIsActionPending(false);
      fetchStatus();
    }
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

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#040408] select-text">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header Principal */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#181824]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xl">🤖</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Automações & Motor Soberano de Auto-Evolução
            </h2>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Projeto: {activeProject}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Controle de processos em background, loops autônomos contínuos de auto-melhoria e ponto de restauração com rollback seguro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={createNewCheckpoint}
            disabled={isActionPending}
            className="bg-[#121220] hover:bg-[#1c1c30] text-gray-200 border border-[#26263e] text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <span>💾</span>
            <span>Salvar Checkpoint</span>
          </button>

          <button
            onClick={() => setRollbackModalOpen(true)}
            disabled={isActionPending}
            className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <span>⏪</span>
            <span>Restaurar Versão Segura</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: MOTOR DE AUTO-EVOLUÇÃO CONTÍNUA (ATÉ ACABAR TOKENS)      */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#0c0c18] via-[#090912] to-[#06060c] border border-amber-500/30 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
        {/* Glow de Fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BlackHoleIcon className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-black text-white tracking-wide">
                Motor de Auto-Melhoria, Auditoria 360º & Mapeamento Visual
              </h3>
              <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                isLoopRunning
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60 animate-pulse'
                  : 'bg-gray-900 text-gray-400 border-gray-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLoopRunning ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>
                {isLoopRunning ? `EM EXECUÇÃO CONTÍNUA (PID ${loopPid || 'ATIVO'})` : 'EM ESPERA'}
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              Executa ciclos ininterruptos: <strong>(1) Suíte de 24 Testes</strong> → <strong>(2) Fotos dos 15 Estúdios no Edge Headless</strong> → <strong>(3) Análise Cognitiva OmniRoute dos 4 Pilares</strong> → <strong>(4) Validação TypeScript</strong> → <strong>(5) Sincronização AST e Git</strong>. 
              A execução encerra <em>apenas</em> quando todas as cotas de tokens do OmniRoute forem consumidas ou mediante parada manual.
            </p>
          </div>

          {/* Botão Principal de Disparo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isLoopRunning ? (
              <button
                onClick={stopEvolutionLoop}
                disabled={isActionPending}
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl transition shadow-xl shadow-red-950/60 flex items-center gap-2 cursor-pointer"
              >
                <span>⏹</span>
                <span>Interromper Loop</span>
              </button>
            ) : (
              <button
                onClick={startEvolutionLoop}
                disabled={isActionPending}
                className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black text-sm px-7 py-3.5 rounded-2xl transition shadow-2xl shadow-amber-950/60 flex items-center gap-2 cursor-pointer tracking-wide"
              >
                <span>⚡</span>
                <span>Iniciar Loop de Auto-Melhoria</span>
              </button>
            )}
          </div>
        </div>

        {/* Grade de 4 Pilares do Diagrama Inicial */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#0e0e1a] p-3.5 rounded-2xl border border-[#222238]">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">Pilar 01</span>
            <p className="text-xs font-bold text-white mb-0.5">Core Security & OmniRoute</p>
            <p className="text-[10px] text-gray-400">Proteção de saldo, sandbox SAST e rotação multi-modelo.</p>
          </div>

          <div className="bg-[#0e0e1a] p-3.5 rounded-2xl border border-[#222238]">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Pilar 02</span>
            <p className="text-xs font-bold text-white mb-0.5">Auto-Forge & REA</p>
            <p className="text-[10px] text-gray-400">Engenharia reversa e radar de ferramentas MCP web.</p>
          </div>

          <div className="bg-[#0e0e1a] p-3.5 rounded-2xl border border-[#222238]">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">Pilar 03</span>
            <p className="text-xs font-bold text-white mb-0.5">Nexus DB & Chat Global</p>
            <p className="text-[10px] text-gray-400">Memória multi-turn persistente no SQLite e orquestrador.</p>
          </div>

          <div className="bg-[#0e0e1a] p-3.5 rounded-2xl border border-[#222238]">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">Pilar 04</span>
            <p className="text-xs font-bold text-white mb-0.5">Launcher 3D & 14 Estúdios</p>
            <p className="text-[10px] text-gray-400">15 cenas mapeadas, interface orbital e isolamento local.</p>
          </div>
        </div>

        {/* Card do Checkpoint Ativo */}
        <div className="bg-[#10101c] border border-amber-500/25 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>Ponto de Restauração Seguro Ativo:</span>
                <span className="text-amber-300 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  {safeCheckpointTag}
                </span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Commit atual: <code className="text-gray-300 font-mono">{currentCommit || '070f5fc'}</code> • Caso qualquer alteração não agrade, o botão de restauração reverte 100% dos arquivos imediatamente.
              </p>
            </div>
          </div>

          <button
            onClick={() => setRollbackModalOpen(true)}
            className="bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-500/40 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex-shrink-0"
          >
            ⏪ Reverter para este Checkpoint
          </button>
        </div>

        {/* Terminal de Logs em Tempo Real (EVOLUTION_LOG.md) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Monitor em Tempo Real (EVOLUTION_LOG.md)</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Auto-refresh a cada 3s</span>
          </div>

          <pre
            ref={logTerminalRef}
            className="p-4 bg-[#050509] border border-[#1e1e2d] rounded-2xl text-[11px] font-mono text-gray-300 h-48 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed"
          >
            {recentLogs}
          </pre>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO SECUNDÁRIA: FLUXOS AGENDADOS N8N                                     */}
      {/* ========================================================================= */}
      <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
        <span>⏰</span>
        <span>Fluxos Cron & Automações Específicas</span>
      </h3>

      <div className="space-y-3 mb-8">
        {flows.map(flow => (
          <div
            key={flow.id}
            className="bg-[#0a0a14] border border-[#1c1c2a] rounded-2xl p-4 hover:border-indigo-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold text-white">{flow.name}</span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full ${
                  flow.status === 'ATIVO' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-gray-800 text-gray-400'
                }`}>
                  {flow.status}
                </span>
                <span className="text-[10px] font-mono text-gray-500 bg-[#06060c] px-2 py-0.2 rounded">
                  {flow.schedule}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-1">{flow.action}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                <span>Gatilho: <strong className="text-gray-300">{flow.trigger}</strong></span>
                <span>•</span>
                <span>Última Execução: <strong className="text-emerald-400">{flow.lastRun}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => showToast(`🚀 Disparo manual iniciado para "${flow.name}"!`)}
                className="text-xs bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition font-semibold cursor-pointer"
              >
                ▶️ Disparar
              </button>
              <button
                onClick={() => toggleFlow(flow.id)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition font-semibold cursor-pointer ${
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

      {/* Modal de Confirmação de Rollback */}
      {rollbackModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#0e0e18] border border-red-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-red-400">
              <span className="text-2xl">⚠️</span>
              <h4 className="text-base font-extrabold text-white">Confirmar Restauração Segura (Rollback)?</h4>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              Esta ação executará um <code>git reset --hard {safeCheckpointTag}</code> e reverterá o código-fonte de volta para o ponto verificado e aprovado. Quaisquer arquivos ou alterações gerados pelo loop autônomo que você não tenha gostado serão descartados.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRollbackModalOpen(false)}
                className="bg-[#141420] hover:bg-[#1e1e2d] text-gray-300 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeRollback}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-lg shadow-red-950/60 cursor-pointer"
              >
                Sim, Reverter Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
