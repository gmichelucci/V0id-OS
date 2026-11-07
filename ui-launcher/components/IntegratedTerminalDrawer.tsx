import React, { useState, useRef, useEffect } from 'react';

interface IntegratedTerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  projectPath?: string;
}

export default function IntegratedTerminalDrawer({
  isOpen,
  onClose,
  projectId,
  projectName = 'V0id OS',
  projectPath = ''
}: IntegratedTerminalDrawerProps) {
  const [history, setHistory] = useState<Array<{ cmd: string; output: string; exitCode: number; time: string }>>([
    {
      cmd: 'init',
      output: `V0id OS Sovereign Terminal Console inicializado.\nEscopo ativo: [${projectName}] (${projectPath || 'raiz'})\nPronto para comandos PowerShell.`,
      exitCode: 0,
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [cmdInput, setCmdInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [cmdHistoryList, setCmdHistoryList] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  const terminalScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
      inputRef.current?.focus();
    }
  }, [isOpen, history]);

  const executeCommand = async (commandToRun: string) => {
    const trimmed = commandToRun.trim();
    if (!trimmed || isRunning) return;

    if (trimmed === 'clear' || trimmed === 'cls') {
      setHistory([]);
      setCmdInput('');
      return;
    }

    setIsRunning(true);
    setCmdInput('');
    setCmdHistoryList(prev => [...prev, trimmed]);
    setHistoryPointer(-1);

    try {
      const res = await fetch('/api/projects?action=run_terminal_cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: trimmed, id: projectId })
      });
      const data = await res.json();
      setHistory(prev => [
        ...prev,
        {
          cmd: trimmed,
          output: data.output || (data.success ? 'Concluído com sucesso (sem saída).' : data.error || 'Erro'),
          exitCode: data.exitCode ?? (data.success ? 0 : 1),
          time: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      setHistory(prev => [
        ...prev,
        {
          cmd: trimmed,
          output: `Falha de rede ao disparar comando: ${err.message}`,
          exitCode: 1,
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsRunning(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(cmdInput);
    } else if (e.key === 'ArrowUp') {
      if (cmdHistoryList.length > 0) {
        e.preventDefault();
        const nextPtr = historyPointer === -1 ? cmdHistoryList.length - 1 : Math.max(0, historyPointer - 1);
        setHistoryPointer(nextPtr);
        setCmdInput(cmdHistoryList[nextPtr]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyPointer !== -1) {
        e.preventDefault();
        const nextPtr = historyPointer + 1;
        if (nextPtr >= cmdHistoryList.length) {
          setHistoryPointer(-1);
          setCmdInput('');
        } else {
          setHistoryPointer(nextPtr);
          setCmdInput(cmdHistoryList[nextPtr]);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-[#1a1a2e] bg-[#070710] flex flex-col h-64 shrink-0 transition-all font-mono text-xs select-text shadow-2xl animate-fade-in">
      {/* Top Bar do Terminal */}
      <div className="h-9 border-b border-[#141424] px-4 flex items-center justify-between bg-[#0a0a14] shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
            <span>💻</span>
            <span>Terminal: {projectName}</span>
          </span>
          {projectPath && (
            <span className="text-[10px] text-gray-500 truncate max-w-xs" title={projectPath}>
              ({projectPath})
            </span>
          )}
        </div>

        {/* Quick Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { label: 'git status', cmd: 'git status --short' },
            { label: 'git diff', cmd: 'git diff --stat' },
            { label: 'git log', cmd: 'git log -n 5 --oneline' },
            { label: 'dir', cmd: 'dir' },
            { label: 'npm test', cmd: 'npm test' }
          ].map((pill, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isRunning}
              onClick={() => executeCommand(pill.cmd)}
              className="px-2 py-0.5 rounded-lg bg-[#121222] hover:bg-amber-950/40 text-gray-300 hover:text-amber-300 border border-[#232338] hover:border-amber-500/40 text-[10px] font-mono transition cursor-pointer"
            >
              ⚡ {pill.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setHistory([])}
            title="Limpar terminal"
            className="text-[10px] text-gray-500 hover:text-gray-300 px-1.5 py-0.5 rounded hover:bg-white/[0.05]"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Fechar terminal"
            className="text-[10px] text-gray-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/[0.05]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Janela de Saída do Console */}
      <div
        ref={terminalScrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#040409] text-[11px] leading-relaxed text-gray-300"
      >
        {history.map((h, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <span className="text-gray-500 text-[10px]">{h.time}</span>
              <span>PS &gt;</span>
              <span className="text-white">{h.cmd}</span>
              {h.exitCode !== 0 && (
                <span className="text-[9px] bg-rose-950 text-rose-300 px-1.5 rounded">
                  exit {h.exitCode}
                </span>
              )}
            </div>
            <pre className="text-gray-300 whitespace-pre-wrap pl-4 font-mono text-[10px] border-l border-[#1a1a2e]">
              {h.output}
            </pre>
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-amber-400 text-[11px] animate-pulse">
            <span>⚙️</span>
            <span>Executando no PowerShell...</span>
          </div>
        )}
      </div>

      {/* Barra de Entrada de Comandos */}
      <div className="h-9 border-t border-[#141424] px-3 flex items-center gap-2 bg-[#080812] shrink-0">
        <span className="text-amber-400 font-bold select-none text-[11px]">PS &gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={cmdInput}
          onChange={e => setCmdInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          placeholder="Digite um comando (ex: git status, npm run build, dir) e pressione Enter..."
          className="flex-1 bg-transparent text-white outline-none font-mono text-[11px] placeholder:text-gray-600"
        />
        <button
          type="button"
          onClick={() => executeCommand(cmdInput)}
          disabled={!cmdInput.trim() || isRunning}
          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
        >
          Executar
        </button>
      </div>
    </div>
  );
}
