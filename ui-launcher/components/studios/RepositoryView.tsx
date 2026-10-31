import React, { useState, useEffect } from 'react';

export default function RepositoryView({
  activeProject,
  projectId
}: {
  activeProject: string;
  projectId?: string;
}) {
  const projectSlug = projectId || (activeProject || 'global').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'global';

  const [gitStatusOutput, setGitStatusOutput] = useState('');
  const [gitRunning, setGitRunning] = useState(false);
  const [commitMsg, setCommitMsg] = useState('V0id auto-sync checkpoint');

  const [gdrivePath, setGdrivePath] = useState(`G:/Meu Drive/V0id_Novelas/${projectSlug}`);
  const [gdriveSyncing, setGdriveSyncing] = useState(false);
  const [gdriveLogs, setGdriveLogs] = useState<string[]>([
    'Aguardando comando de sincronização...'
  ]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const runGit = async (cmd: 'status' | 'init' | 'commit' | 'push') => {
    setGitRunning(true);
    try {
      const res = await fetch('/api/system?action=git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitCmd: cmd, projectId: projectSlug })
      });
      const data = await res.json();
      setGitStatusOutput(data.output || 'Comando executado sem retorno textual.');
      showToast(`Git ${cmd} concluído.`);
    } catch {
      setGitStatusOutput('Erro ao executar comando Git.');
    } finally {
      setGitRunning(false);
    }
  };

  const runGdriveSync = async () => {
    setGdriveSyncing(true);
    setGdriveLogs(prev => [`[INICIANDO] Sincronizando pastas locais com Google Drive...`, ...prev]);
    try {
      const res = await fetch('/api/system?action=gdrive_sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectSlug, gdrivePath })
      });
      const data = await res.json();
      if (data.success) {
        setGdriveLogs(prev => [`[SUCESSO] ${data.message}`, ...prev]);
        showToast(data.message);
      } else {
        setGdriveLogs(prev => [`[ERRO] ${data.error}`, ...prev]);
        showToast(`Erro: ${data.error}`);
      }
    } catch (e: any) {
      setGdriveLogs(prev => [`[FALHA] ${e.message}`, ...prev]);
      showToast('Falha na requisição de sincronização.');
    } finally {
      setGdriveSyncing(false);
    }
  };

  useEffect(() => {
    runGit('status');
  }, [projectSlug]);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[#050509]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1c1c2a] flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📦</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Repository Hub — Pontes Reais GitHub & Google Drive
            </h2>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Projeto: {activeProject} ({projectSlug})
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Controle de versão de código com Git/GitHub e espelhamento automático de ativos de mídia para o Google Drive.
          </p>
        </div>
      </div>

      {/* Split-Screen 50/50: GitHub vs Google Drive */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0">
        {/* Lado Esquerdo: GitHub Bridge */}
        <div className="flex flex-col bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
              🐙 GitHub Terminal Bridge (Código & Jogos)
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              projetos/{projectSlug}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
            <button
              onClick={() => runGit('status')}
              disabled={gitRunning}
              className="text-xs bg-[#181826] hover:bg-[#222236] text-gray-200 px-3 py-1.5 rounded-xl border border-[#2d2d42] transition"
            >
              git status
            </button>
            <button
              onClick={() => runGit('init')}
              disabled={gitRunning}
              className="text-xs bg-[#181826] hover:bg-[#222236] text-gray-200 px-3 py-1.5 rounded-xl border border-[#2d2d42] transition"
            >
              git init
            </button>
            <button
              onClick={() => runGit('commit')}
              disabled={gitRunning}
              className="text-xs bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 px-3.5 py-1.5 rounded-xl border border-purple-500/40 transition font-semibold"
            >
              git commit (Checkpoint V0id)
            </button>
            <button
              onClick={() => runGit('push')}
              disabled={gitRunning}
              className="text-xs bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-200 px-3.5 py-1.5 rounded-xl border border-indigo-500/40 transition font-semibold"
            >
              git push origin
            </button>
          </div>

          <div className="flex-1 bg-[#06060c] border border-[#191928] rounded-xl p-3.5 font-mono text-xs text-gray-300 whitespace-pre-wrap overflow-y-auto">
            {gitRunning ? 'Executando comando no terminal...' : (gitStatusOutput || 'Nenhuma saída do Git.')}
          </div>
        </div>

        {/* Lado Direito: Google Drive Bridge */}
        <div className="flex flex-col bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              ☁️ Google Drive Sync Bridge (Novelas, Vídeos & Áudios)
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              Espelha output/ e assets/
            </span>
          </div>

          <div className="space-y-3 mb-3 flex-shrink-0">
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1">
                Diretório Local do Google Drive:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={gdrivePath}
                  onChange={e => setGdrivePath(e.target.value)}
                  className="flex-1 bg-[#06060c] border border-[#1f1f2e] rounded-xl px-3 py-2 text-xs text-gray-200 font-mono outline-none focus:border-emerald-500"
                />
                <button
                  onClick={runGdriveSync}
                  disabled={gdriveSyncing}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>🚀</span>
                  <span>{gdriveSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#06060c] border border-[#191928] rounded-xl p-3.5 font-mono text-xs text-emerald-400 overflow-y-auto space-y-1">
            {gdriveLogs.map((log, idx) => (
              <p key={idx}>{log}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
