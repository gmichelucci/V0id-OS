import React, { useState, useEffect, useRef } from 'react';
import BlackHoleIcon from '../icons/BlackHoleIcon';

export interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  schedule: string;
  status: 'ATIVO' | 'PAUSADO';
  lastRun: string;
}

const DEFAULT_FLOWS: AutomationFlow[] = [
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
    name: 'Pipeline Diário de Produção Audiovisual',
    trigger: 'Diariamente às 08:00',
    action: 'Gera roteiro com IA, sintetiza voz neural com F5-TTS e monta legendas sincronizadas com WhisperX',
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
  const [flows, setFlows] = useState<AutomationFlow[]>(DEFAULT_FLOWS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estado do Loop de Auto-Evolução e Orçamento de Tokens
  const [isLoopRunning, setIsLoopRunning] = useState(false);
  const [loopPid, setLoopPid] = useState<number | null>(null);
  const [recentLogs, setRecentLogs] = useState<string>('Carregando registros de evolução...');
  const [currentCommit, setCurrentCommit] = useState<string>('');
  const [safeCheckpointTag, setSafeCheckpointTag] = useState<string>('v5.0-stable-gold-checkpoint');
  const [isActionPending, setIsActionPending] = useState(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);

  // Modal de Edição / Criação de Fluxo Cron
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const logTerminalRef = useRef<HTMLPreElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Carrega status da API de Automações
  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/automations?t=${Date.now()}`);
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
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll para acompanhar novos logs
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [recentLogs]);

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
      } else {
        showToast(`Erro ao parar: ${data.error}`);
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

  const handleSaveFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlow) return;

    if (isCreatingNew) {
      setFlows(prev => [...prev, editingFlow]);
      showToast(`✨ Nova automação "${editingFlow.name}" criada com sucesso!`);
    } else {
      setFlows(prev => prev.map(f => f.id === editingFlow.id ? editingFlow : f));
      showToast(`💾 Automação "${editingFlow.name}" atualizada com sucesso!`);
    }
    setEditingFlow(null);
    setIsCreatingNew(false);
  };

  const openCreateModal = () => {
    setEditingFlow({
      id: `flow-${Date.now()}`,
      name: 'Novo Robô Autônomo',
      trigger: 'Diariamente às 10:00',
      schedule: '0 10 * * *',
      action: 'Executar tarefa programada e registrar em vault/output.json',
      status: 'ATIVO',
      lastRun: 'Nunca executado'
    });
    setIsCreatingNew(true);
  };

  // Extrai a etapa atual ativa dos logs para exibir no cabeçalho
  const getActiveStep = () => {
    if (!isLoopRunning) return null;
    const lines = recentLogs.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('[1/7]')) return { label: 'Etapa 1/7: Suíte de 24 Testes & Auto-Cura', color: 'text-amber-300' };
      if (line.includes('[2/7]')) return { label: 'Etapa 2/7: Mapeamento Visual & Fotos Edge Headless', color: 'text-cyan-300' };
      if (line.includes('[3/7]')) return { label: 'Etapa 3/7: Auditoria Interativa E2E & Botões', color: 'text-sky-300' };
      if (line.includes('[4/7]')) return { label: 'Etapa 4/7: Inspeção Visual Multimodal por IA', color: 'text-pink-300' };
      if (line.includes('[5/7]')) return { label: 'Etapa 5/7: Motor de Auto-Cura Ativa & Refatoração', color: 'text-emerald-300' };
      if (line.includes('[6/7]')) return { label: 'Etapa 6/7: Avaliação Cognitiva dos 4 Pilares', color: 'text-indigo-300' };
      if (line.includes('[7/7]')) return { label: 'Etapa 7/7: Verificação TypeScript, AST & GitHub', color: 'text-purple-300' };
    }
    return { label: 'Processando ciclo em background...', color: 'text-emerald-300' };
  };

  const activeStep = getActiveStep();

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#040408] text-gray-200 select-text">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header do Estúdio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#181824]">
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
            Controle de processos em background, rotinas agendadas (Cron) e auto-evolução contínua até esgotar cotas de tokens.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={createNewCheckpoint}
            disabled={isActionPending}
            className="bg-[#121220] hover:bg-[#1c1c30] text-gray-200 border border-[#26263e] text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            title="Gera uma tag de segurança no Git"
          >
            <span>💾</span>
            <span>Salvar Checkpoint</span>
          </button>

          <button
            onClick={() => setRollbackModalOpen(true)}
            disabled={isActionPending}
            className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            title="Restaura instantaneamente a versão Gold aprovada"
          >
            <span>⏪</span>
            <span>Restaurar Versão Segura</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: PAINEL DE CONTROLE DO MOTOR DE AUTO-EVOLUÇÃO             */}
      {/* ========================================================================= */}
      <div className="bg-[#090912] border border-amber-500/30 rounded-3xl p-6 mb-8 shadow-2xl relative">
        {/* Glow de Fundo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Linha 1: Título e Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-5 border-b border-[#1c1c2e]">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <BlackHoleIcon className="w-6 h-6 text-amber-400" />
              <h3 className="text-base font-black text-white tracking-wide">
                Motor de Auto-Melhoria, Auditoria 360º & Fotos Headless
              </h3>
              
              <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                isLoopRunning
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60 animate-pulse'
                  : 'bg-gray-900 text-gray-400 border-gray-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLoopRunning ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>
                {isLoopRunning ? `EM EXECUÇÃO CONTÍNUA (PID ${loopPid || 'ATIVO'})` : 'EM ESPERA'}
              </span>

              {activeStep && (
                <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-xl bg-black/70 border border-white/10 max-w-full truncate ${activeStep.color}`}>
                  ⚡ {activeStep.label}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
              Roda em segundo plano no Windows sem travar seu computador. Você pode sair desta tela ou navegar pela Órbita 3D livremente — o motor encerra <em>somente</em> quando esgotar as cotas de tokens do OmniRoute ou ao clicar em interromper.
            </p>
          </div>

          {/* Botão de Disparo / Interrupção */}
          <div className="flex-shrink-0">
            {isLoopRunning ? (
              <button
                onClick={stopEvolutionLoop}
                disabled={isActionPending}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition shadow-xl shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⏹</span>
                <span>Interromper Loop</span>
              </button>
            ) : (
              <button
                onClick={startEvolutionLoop}
                disabled={isActionPending}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black text-xs px-7 py-3.5 rounded-2xl transition shadow-2xl shadow-amber-950/60 flex items-center justify-center gap-2 cursor-pointer tracking-wide"
              >
                <span>⚡</span>
                <span>Iniciar Loop de Auto-Melhoria</span>
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Terminal de Logs ao Vivo (Largura Total com visual de console) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLoopRunning ? 'bg-amber-400 animate-ping' : 'bg-gray-600'}`}></span>
              <span>Monitor em Tempo Real (Live Stream)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-mono">Auto-refresh 2s</span>
              <button
                onClick={fetchStatus}
                className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 transition cursor-pointer"
                title="Forçar atualização dos logs agora"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>

          <pre
            ref={logTerminalRef}
            className="p-4 bg-[#030307] border border-[#222238] rounded-2xl text-[11px] font-mono text-gray-300 h-64 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed shadow-inner"
          >
            {recentLogs}
          </pre>
        </div>

        {/* Linha 3: Os 4 Pilares Soberanos + Checkpoint Seguro */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4 border-t border-[#1c1c2e]">
          <div className="bg-[#0e0e1a] p-3 rounded-2xl border border-[#222238]">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-0.5">Pilar 01</span>
            <p className="text-xs font-bold text-white mb-0.5">Core Security & OmniRoute</p>
            <p className="text-[10px] text-gray-400">Sandbox SAST & Rotação Multi-Tier</p>
          </div>

          <div className="bg-[#0e0e1a] p-3 rounded-2xl border border-[#222238]">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-0.5">Pilar 02</span>
            <p className="text-xs font-bold text-white mb-0.5">Auto-Forge & REA</p>
            <p className="text-[10px] text-gray-400">Engenharia Reversa & Radar MCP</p>
          </div>

          <div className="bg-[#0e0e1a] p-3 rounded-2xl border border-[#222238]">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-0.5">Pilar 03</span>
            <p className="text-xs font-bold text-white mb-0.5">Nexus DB & Chat Global</p>
            <p className="text-[10px] text-gray-400">Memória Multi-Turn no SQLite</p>
          </div>

          <div className="bg-[#0e0e1a] p-3 rounded-2xl border border-[#222238]">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">Pilar 04</span>
            <p className="text-xs font-bold text-white mb-0.5">Launcher 3D & 14 Estúdios</p>
            <p className="text-[10px] text-gray-400">15 Cenas Mapeadas no Edge</p>
          </div>

          {/* Card de Checkpoint Ativo */}
          <div className="bg-[#0e0e1a] border border-amber-500/25 rounded-2xl p-3 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Versão Segura:</span>
              <p className="text-xs font-bold text-amber-300 font-mono truncate">{safeCheckpointTag}</p>
            </div>
            <button
              onClick={() => setRollbackModalOpen(true)}
              className="bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-500/40 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer w-full text-center"
            >
              ⏪ Reverter
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO SECUNDÁRIA: FLUXOS CRON & AUTOMAÇÕES ESPECÍFICAS                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>⏰</span>
            <span>Fluxos Cron & Automações Específicas</span>
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Robôs e tarefas com agendamento temporal. Você pode editá-los diretamente no botão <strong>✏️ Editar</strong> ou solicitar alterações no <strong>Chat Global</strong>.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Nova Automação</span>
        </button>
      </div>

      {/* Banner de Ajuda e Integração com Chat */}
      <div className="bg-[#0b0b14] border border-indigo-500/20 rounded-2xl p-4 mb-4 text-xs text-gray-300 flex items-start gap-3 shadow-lg">
        <span className="text-lg">💡</span>
        <div className="flex-1 leading-relaxed">
          <strong className="text-white text-xs block mb-2">Como alterar ou criar automações?</strong>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#06060e] p-3 rounded-xl border border-white/5">
              <span className="text-amber-400 font-bold block mb-1">1. Pela Interface Visual:</span>
              <p className="text-gray-300 leading-snug">
                Clique no botão <span className="text-indigo-300 font-mono font-semibold">✏️ Editar</span> em qualquer card abaixo para ajustar o horário Cron, nome ou o script em execução.
              </p>
            </div>
            <div className="bg-[#06060e] p-3 rounded-xl border border-white/5">
              <span className="text-cyan-400 font-bold block mb-1">2. Pelo Chat Global Soberano:</span>
              <p className="text-gray-300 leading-snug">
                Basta pedir no chat (ex: <em>&quot;V0id, altere o radar de editais para rodar a cada 1 hora&quot;</em>) que o V0id programa o script e agenda a tarefa diretamente no Nexus DB.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Automações */}
      <div className="space-y-3 mb-8">
        {flows.map(flow => (
          <div
            key={flow.id}
            className="bg-[#0a0a14] border border-[#1c1c2a] rounded-2xl p-4 hover:border-indigo-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="text-xs font-bold text-white">{flow.name}</span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  flow.status === 'ATIVO' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-gray-800 text-gray-400'
                }`}>
                  {flow.status}
                </span>
                <span className="text-[10px] font-mono text-gray-400 bg-[#06060c] px-2 py-0.5 rounded border border-[#181824]">
                  {flow.schedule}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 mb-1 leading-relaxed">{flow.action}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono flex-wrap">
                <span>Gatilho: <strong className="text-gray-300">{flow.trigger}</strong></span>
                <span>•</span>
                <span>Última Execução: <strong className="text-emerald-400">{flow.lastRun}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => showToast(`🚀 Disparo manual iniciado para "${flow.name}"!`)}
                className="text-xs bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition font-semibold cursor-pointer"
                title="Executar imediatamente"
              >
                ▶️ Disparar
              </button>

              <button
                onClick={() => {
                  setEditingFlow({ ...flow });
                  setIsCreatingNew(false);
                }}
                className="text-xs bg-[#141424] hover:bg-[#1f1f35] text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition font-semibold cursor-pointer"
                title="Editar parâmetros e agendamento Cron"
              >
                ✏️ Editar
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

      {/* Modal de Edição / Criação de Automação */}
      {editingFlow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#0e0e18] border border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#202035]">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <span className="text-xl">{isCreatingNew ? '➕' : '✏️'}</span>
                <h4 className="text-sm font-extrabold text-white">
                  {isCreatingNew ? 'Criar Nova Automação' : `Editar: ${editingFlow.name}`}
                </h4>
              </div>
              <button
                onClick={() => { setEditingFlow(null); setIsCreatingNew(false); }}
                className="text-gray-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFlow} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">
                  Nome da Automação
                </label>
                <input
                  type="text"
                  value={editingFlow.name}
                  onChange={e => setEditingFlow({ ...editingFlow, name: e.target.value })}
                  className="w-full bg-[#06060c] border border-[#222238] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">
                    Gatilho / Horário
                  </label>
                  <input
                    type="text"
                    value={editingFlow.trigger}
                    onChange={e => setEditingFlow({ ...editingFlow, trigger: e.target.value })}
                    className="w-full bg-[#06060c] border border-[#222238] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="Ex: Diariamente às 09:00"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">
                    Expressão Cron
                  </label>
                  <input
                    type="text"
                    value={editingFlow.schedule}
                    onChange={e => setEditingFlow({ ...editingFlow, schedule: e.target.value })}
                    className="w-full bg-[#06060c] border border-[#222238] rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="0 9 * * *"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1">
                  Ação / Script / Prompt Executado
                </label>
                <textarea
                  value={editingFlow.action}
                  onChange={e => setEditingFlow({ ...editingFlow, action: e.target.value })}
                  rows={3}
                  className="w-full bg-[#06060c] border border-[#222238] rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                  placeholder="Descreva o que o robô deve fazer ao ser disparado..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditingFlow(null); setIsCreatingNew(false); }}
                  className="bg-[#141420] hover:bg-[#1e1e2d] text-gray-300 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-lg shadow-indigo-950/60 cursor-pointer"
                >
                  Salvar Automação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
