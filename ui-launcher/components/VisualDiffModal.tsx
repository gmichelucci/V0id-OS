import React, { useState, useEffect } from 'react';

interface SnapshotItem {
  id: string;
  filePath: string;
  fileName: string;
  timestamp?: number;
  hasOld: boolean;
  hasNew: boolean;
  oldContent?: string;
  newContent?: string;
}

interface VisualDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  onRollback: (snapshotId: string) => Promise<void>;
}

export default function VisualDiffModal({
  isOpen,
  onClose,
  projectId,
  projectName = 'Projeto',
  onRollback
}: VisualDiffModalProps) {
  const [activeTab, setActiveTab] = useState<'snapshots' | 'git'>('snapshots');
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [gitDiff, setGitDiff] = useState<string>('');
  const [selectedSnapIndex, setSelectedSnapIndex] = useState<number>(0);
  const [isReverting, setIsReverting] = useState(false);

  const fetchDiffs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?action=diffs&id=${encodeURIComponent(projectId)}`);
      const data = await res.json();
      if (data.success) {
        setSnapshots(data.snapshots || []);
        setGitDiff(data.gitDiff || '');
        if (data.snapshots && data.snapshots.length > 0) {
          setSelectedSnapIndex(0);
        } else if (data.gitDiff) {
          setActiveTab('git');
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiffs();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const currentSnap = snapshots[selectedSnapIndex];

  // Helper simples para renderizar diff linha a linha entre oldContent e newContent
  const renderInlineDiff = (oldText?: string, newText?: string) => {
    if (oldText === undefined || newText === undefined) {
      return (
        <div className="p-4 text-xs text-gray-400 font-mono">
          {oldText ? 'Arquivo original registrado.' : 'Novo arquivo criado pelo agente.'}
        </div>
      );
    }

    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const max = Math.max(oldLines.length, newLines.length);
    const rows = [];

    // Diff linear rápido
    let i = 0;
    let j = 0;
    while (i < oldLines.length || j < newLines.length) {
      const o = oldLines[i];
      const n = newLines[j];
      if (o === n) {
        rows.push({ type: 'same', text: o, oldLine: i + 1, newLine: j + 1 });
        i++;
        j++;
      } else if (o !== undefined && !newLines.slice(j, j + 5).includes(o)) {
        rows.push({ type: 'del', text: o, oldLine: i + 1, newLine: '' });
        i++;
      } else if (n !== undefined) {
        rows.push({ type: 'add', text: n, oldLine: '', newLine: j + 1 });
        j++;
      } else {
        rows.push({ type: 'del', text: o, oldLine: i + 1, newLine: '' });
        i++;
      }
      if (rows.length > 1000) break; // Limite de segurança para performance UI
    }

    return (
      <div className="font-mono text-[11px] leading-5 divide-y divide-[#151525] overflow-x-auto">
        {rows.map((r, idx) => (
          <div
            key={idx}
            className={`flex items-start px-2 py-0.5 select-text ${
              r.type === 'add'
                ? 'bg-emerald-950/40 text-emerald-300'
                : r.type === 'del'
                ? 'bg-rose-950/40 text-rose-300 line-through decoration-rose-500/50'
                : 'text-gray-300 hover:bg-white/[0.02]'
            }`}
          >
            <span className="w-9 shrink-0 text-right pr-2 text-gray-600 select-none text-[9px]">{r.oldLine}</span>
            <span className="w-9 shrink-0 text-right pr-2 text-gray-600 select-none text-[9px]">{r.newLine}</span>
            <span className="w-4 shrink-0 font-bold select-none text-center">
              {r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '}
            </span>
            <pre className="font-mono whitespace-pre flex-1 overflow-x-auto">{r.text || ' '}</pre>
          </div>
        ))}
      </div>
    );
  };

  const handleRevertClick = async () => {
    if (!currentSnap) return;
    setIsReverting(true);
    await onRollback(currentSnap.id);
    setIsReverting(false);
    await fetchDiffs();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0b16] border border-amber-500/40 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header do Modal */}
        <div className="h-14 border-b border-[#1c1c2e] px-5 flex items-center justify-between bg-[#0e0e1c] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">📝</span>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Inspetor Visual de Diffs & Alterações</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  {projectName}
                </span>
              </h3>
              <p className="text-[10px] text-gray-400">
                Audite adições (+), deleções (-) e reverta modificações com 1 clique (Padrão Antigravity)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#05050c] p-0.5 rounded-xl border border-[#202035]">
              <button
                type="button"
                onClick={() => setActiveTab('snapshots')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === 'snapshots'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Snapshots ({snapshots.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('git')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === 'git'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Git Diff {gitDiff ? '●' : ''}
              </button>
            </div>

            <button
              type="button"
              onClick={fetchDiffs}
              title="Recarregar diffs"
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-amber-300 rounded-lg hover:bg-white/[0.05] transition"
            >
              🔄
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm px-2.5 py-1 rounded-lg hover:bg-white/[0.05] transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conteúdo Central */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'snapshots' ? (
            snapshots.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <span className="text-4xl mb-3">🛡️</span>
                <h4 className="text-sm font-bold text-gray-200">Nenhuma modificação pendente registrada</h4>
                <p className="text-xs text-gray-500 max-w-md mt-1">
                  Quando o agente editar arquivos usando <code className="text-amber-400">write_file</code> ou <code className="text-amber-400">apply_diff</code>, snapshots cirúrgicos aparecerão aqui para inspeção e reversão instantânea.
                </p>
              </div>
            ) : (
              <>
                {/* Lista lateral de arquivos modificados */}
                <div className="w-72 border-r border-[#1c1c2e] bg-[#070710] flex flex-col shrink-0">
                  <div className="p-3 border-b border-[#181826] text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    Histórico de Modificações ({snapshots.length})
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#141424]">
                    {snapshots.map((s, idx) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSnapIndex(idx)}
                        className={`p-3 cursor-pointer transition text-xs flex flex-col gap-1 ${
                          selectedSnapIndex === idx
                            ? 'bg-amber-950/40 border-l-2 border-amber-400 text-white'
                            : 'text-gray-400 hover:bg-white/[0.02] hover:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold truncate">
                          <span className="truncate">{s.fileName}</span>
                          <span className="text-[9px] text-amber-400/80 font-normal">
                            {s.timestamp ? new Date(s.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono truncate" title={s.filePath}>
                          {s.filePath}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Painel de Diff do arquivo selecionado */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#05050c]">
                  {currentSnap && (
                    <>
                      <div className="h-10 border-b border-[#181826] px-4 flex items-center justify-between bg-[#090914] shrink-0">
                        <div className="flex items-center gap-2 font-mono text-xs truncate">
                          <span className="text-amber-400 font-bold">📄 {currentSnap.fileName}</span>
                          <span className="text-[10px] text-gray-500 truncate">{currentSnap.filePath}</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleRevertClick}
                          disabled={isReverting}
                          className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>↩️</span>
                          <span>{isReverting ? 'Revertendo...' : 'Reverter para Original'}</span>
                        </button>
                      </div>

                      <div className="flex-1 overflow-auto p-2">
                        {renderInlineDiff(currentSnap.oldContent, currentSnap.newContent)}
                      </div>
                    </>
                  )}
                </div>
              </>
            )
          ) : (
            /* Tab: Git Diff */
            <div className="flex-1 flex flex-col overflow-hidden bg-[#05050c]">
              <div className="h-10 border-b border-[#181826] px-4 flex items-center justify-between bg-[#090914] shrink-0 text-xs">
                <span className="text-amber-400 font-bold font-mono">🌿 git diff -U3</span>
                <span className="text-[10px] text-gray-500 font-mono">Modificações não comitadas no diretório</span>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-5 select-text">
                {gitDiff ? (
                  gitDiff.split('\n').map((line, idx) => {
                    const isAdd = line.startsWith('+') && !line.startsWith('+++');
                    const isDel = line.startsWith('-') && !line.startsWith('---');
                    const isHunk = line.startsWith('@@');
                    return (
                      <div
                        key={idx}
                        className={`${
                          isAdd
                            ? 'bg-emerald-950/40 text-emerald-300 px-1'
                            : isDel
                            ? 'bg-rose-950/40 text-rose-300 px-1'
                            : isHunk
                            ? 'text-cyan-400 font-bold mt-2 border-b border-cyan-900/40 pb-0.5'
                            : 'text-gray-300'
                        }`}
                      >
                        <pre className="whitespace-pre overflow-x-auto">{line || ' '}</pre>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500 flex flex-col items-center justify-center h-full">
                    <span className="text-3xl mb-2">🌿</span>
                    <span>Repositório limpo. Nenhuma alteração pendente detectada no Git.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
