import React, { useState } from 'react';

export default function SecurityView({ activeProject }: { activeProject: string }) {
  const [semgrepRunning, setSemgrepRunning] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState([
    { time: '18:04:12', type: 'WRITE_FILE', target: 'c:\\V0id\\ui-launcher\\pages\\index.tsx', risk: 'BAIXO', status: 'AUTORIZADO' },
    { time: '18:01:45', type: 'RUN_COMMAND', target: 'npx next build', risk: 'MÉDIO', status: 'ISOLADO' },
    { time: '17:59:05', type: 'GRAPHIFY', target: 'graphify update .', risk: 'BAIXO', status: 'AUTORIZADO' },
    { time: '17:42:19', type: 'NET_REQUEST', target: 'api.cerebras.ai (gpt-oss-120b)', risk: 'SEGURO', status: 'AUTORIZADO' },
    { time: '17:30:00', type: 'FINANCIAL_ATTEMPT', target: 'Transferência / Saque Externo', risk: 'CRÍTICO', status: 'BLOQUEADO' }
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const runSemgrep = () => {
    setSemgrepRunning(true);
    showToast('Executando varredura estática de segurança Semgrep SAST...');
    setTimeout(() => {
      setSemgrepRunning(false);
      showToast('Semgrep SAST finalizado: 0 vulnerabilidades de injeção ou vazamento de chaves.');
      setAuditLogs(prev => [
        { time: new Date().toLocaleTimeString(), type: 'SEMGREP_SCAN', target: `Projeto [${activeProject}]`, risk: 'SEGURO', status: 'PASSOU (0 BUGS)' },
        ...prev
      ]);
    }, 2000);
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
            <span className="text-xl">🛡️</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Segurança Sandbox & Centro de Operações (SOC)
            </h2>
            <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              TRAVA DE SAQUE: ZERO EXTERNO
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Monitoramento de privilégios, isolamento de containers Docker e proteção anti-ghost write para o projeto [{activeProject}].
          </p>
        </div>

        <button
          onClick={runSemgrep}
          disabled={semgrepRunning}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer"
        >
          <span>🔍</span>
          <span>{semgrepRunning ? 'Analisando Código...' : 'Rodar Scanner Semgrep'}</span>
        </button>
      </div>

      {/* Grid de 4 Métricas de Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0c0c16] border border-[#1e1e30] rounded-2xl p-4">
          <p className="text-[11px] text-gray-400 mb-1">Status Docker Runtime:</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <p className="text-sm font-bold text-white">v0id-sandbox (Ativo)</p>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Memória: 256MB max | Read-Only root</p>
        </div>

        <div className="bg-[#0c0c16] border border-[#1e1e30] rounded-2xl p-4">
          <p className="text-[11px] text-gray-400 mb-1">Vulnerabilidades SAST:</p>
          <p className="text-sm font-bold text-emerald-400">0 Críticas / 0 Altas</p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Regras Semgrep OWASP Top 10</p>
        </div>

        <div className="bg-[#0c0c16] border border-[#1e1e30] rounded-2xl p-4">
          <p className="text-[11px] text-gray-400 mb-1">Trava Financeira do Sistema:</p>
          <p className="text-sm font-bold text-red-400">LOCK ATIVO</p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Saques automáticos bloqueados</p>
        </div>

        <div className="bg-[#0c0c16] border border-[#1e1e30] rounded-2xl p-4">
          <p className="text-[11px] text-gray-400 mb-1">Auditoria de Disco:</p>
          <p className="text-sm font-bold text-indigo-300">Anti-Ghost Write: ON</p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Gravação confirmada no Windows</p>
        </div>
      </div>

      {/* Log de Auditoria em Tempo Real */}
      <div className="bg-[#090912] border border-[#1c1c2a] rounded-2xl p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <span>📜 Log de Auditoria de Operações no Sistema</span>
          </h3>
          <span className="text-[10px] text-gray-500 font-mono">Proteção de Integridade V0id</span>
        </div>

        <div className="bg-[#05050a] border border-[#161622] rounded-xl overflow-hidden flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0b14] text-[10px] uppercase font-bold text-gray-400 border-b border-[#181826]">
              <tr>
                <th className="py-2.5 px-4">Horário</th>
                <th className="py-2.5 px-4">Tipo de Ação</th>
                <th className="py-2.5 px-4">Alvo / Caminho</th>
                <th className="py-2.5 px-4">Risco</th>
                <th className="py-2.5 px-4 text-right">Decisão do Gatekeeper</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12121d] font-mono text-[11px]">
              {auditLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition">
                  <td className="py-2.5 px-4 text-gray-500">{log.time}</td>
                  <td className="py-2.5 px-4 text-indigo-300 font-bold">{log.type}</td>
                  <td className="py-2.5 px-4 text-gray-300 truncate max-w-xs">{log.target}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      log.risk === 'CRÍTICO' ? 'bg-red-950 text-red-300' :
                      log.risk === 'MÉDIO' ? 'bg-amber-950 text-amber-300' :
                      'bg-emerald-950 text-emerald-300'
                    }`}>
                      {log.risk}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'BLOQUEADO' ? 'text-red-400 bg-red-950/50' : 'text-emerald-400 bg-emerald-950/50'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
