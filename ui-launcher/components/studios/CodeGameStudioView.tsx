import React, { useState, useEffect, useRef } from 'react';

interface ProjectFile {
  name: string;
  relPath: string;
  size: number;
  ext: string;
  isText: boolean;
  isMedia: boolean;
}

export default function CodeGameStudioView({
  activeProject,
  projectId,
  studioName = 'Code Studio',
  isGameStudio = false
}: {
  activeProject: string;
  projectId?: string;
  studioName?: string;
  isGameStudio?: boolean;
}) {
  const projectSlug = projectId || (activeProject || 'global').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'global';

  // State: Files & Editor
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [codeContent, setCodeContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [centerTab, setCenterTab] = useState<'editor' | 'preview'>('preview');
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // State: Chat
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    {
      sender: 'V0id Architect',
      text: `IDE de Desenvolvimento inicializada para [${activeProject}].\nPronto para codificar, debugar e testar em tempo real no Live Preview.`,
      time: 'Agora'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Carregar arquivos
  const loadFiles = async () => {
    try {
      const res = await fetch(`/api/files?projectId=${encodeURIComponent(projectSlug)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setFiles(data.files);
        // Abre arquivo default se nenhum estiver aberto
        if (!activeFile && data.files.length > 0) {
          const defaultF = data.files.find((f: any) => f.relPath.includes('src/') || f.relPath.includes('index.html')) || data.files[0];
          loadFileContent(defaultF.relPath);
        }
      }
    } catch {}
  };

  // Carregar conteúdo de um arquivo específico
  const loadFileContent = async (relPath: string) => {
    try {
      const res = await fetch(`/api/files?projectId=${encodeURIComponent(projectSlug)}&file=${encodeURIComponent(relPath)}`);
      const data = await res.json();
      if (data.success && data.isText) {
        setActiveFile(relPath);
        setCodeContent(data.content || '');
      }
    } catch {}
  };

  // Carregar HTML do Live Preview
  const loadPreviewHtml = async () => {
    try {
      const res = await fetch(`/api/files?projectId=${encodeURIComponent(projectSlug)}&file=output/index.html`);
      const data = await res.json();
      if (data.success && data.content) {
        setPreviewHtml(data.content);
      } else {
        // Fallback game canvas template
        setPreviewHtml(`<!DOCTYPE html><html><head><style>body{margin:0;background:#05050a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column}canvas{border:1px solid #333;border-radius:12px;background:#000}</style></head><body><h2>🚀 ${activeProject} — Live Canvas</h2><canvas id="c" width="600" height="400"></canvas><script>const c=document.getElementById("c").getContext("2d");let x=50,dx=2;function loop(){c.fillStyle="rgba(0,0,0,0.2)";c.fillRect(0,0,600,400);c.fillStyle="#6366f1";c.beginPath();c.arc(x,200,15,0,Math.PI*2);c.fill();x+=dx;if(x>580||x<20)dx=-dx;requestAnimationFrame(loop);}loop();</script></body></html>`);
      }
    } catch {}
  };

  useEffect(() => {
    loadFiles();
    loadPreviewHtml();
  }, [projectSlug]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Salvar arquivo no disco
  const handleSaveFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/files?projectId=${encodeURIComponent(projectSlug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relPath: activeFile, content: codeContent })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Arquivo [${activeFile}] salvo com sucesso no disco!`);
        if (activeFile === 'output/index.html') {
          loadPreviewHtml();
        }
      }
    } catch {
      showToast('Erro ao salvar arquivo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Abrir no Windows
  const handleOpenLocal = async () => {
    if (!activeFile) return;
    await fetch(`/api/files?projectId=${encodeURIComponent(projectSlug)}&action=open_local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relPath: activeFile })
    });
    showToast(`Arquivo aberto no Windows: ${activeFile}`);
  };

  // Chat
  const handleSendMessage = async () => {
    if (!inputVal.trim() || isThinking) return;
    const userMsg = inputVal;
    setInputVal('');
    setMessages(prev => [...prev, { sender: 'Você', text: userMsg, time: new Date().toLocaleTimeString() }]);
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, project: activeProject })
      });
      const data = await res.json();
      if (data.success) {
        let text = data.text;
        if (data.toolResults && data.toolResults.length > 0) {
          text += '\n\n🔧 Modificações aplicadas no disco:\n' +
            data.toolResults.map((t: any) => `• [${t.tool}] -> ${typeof t.result === 'object' ? JSON.stringify(t.result) : (t.result || 'OK')}`).join('\n');
        }
        setMessages(prev => [...prev, {
          sender: `${data.provider} (${data.tier || 'Elite'})`,
          text,
          time: new Date().toLocaleTimeString()
        }]);
        loadFiles();
        loadPreviewHtml();
      }
    } catch {
      setMessages(prev => [...prev, {
        sender: 'OmniRoute Error',
        text: 'Falha ao executar comando de código.',
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#050509]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header da IDE */}
      <div className="h-12 border-b border-[#1c1c2a] px-5 flex items-center justify-between bg-[#080810] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            {isGameStudio ? '🎮 Game Studio Engine' : '💻 Code Studio IDE'}
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
            {activeProject}
          </span>
          {activeFile && (
            <span className="text-xs text-gray-400 font-mono">
              / {activeFile}
            </span>
          )}
        </div>

        {/* Abas Centrais: Editor vs Live Preview */}
        <div className="flex items-center gap-2">
          <div className="bg-[#12121e] p-1 rounded-xl border border-[#202034] flex gap-1">
            <button
              onClick={() => setCenterTab('preview')}
              className={`text-xs px-3.5 py-1 rounded-lg font-semibold transition ${
                centerTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ▶️ Live Preview (60fps)
            </button>
            <button
              onClick={() => setCenterTab('editor')}
              className={`text-xs px-3.5 py-1 rounded-lg font-semibold transition ${
                centerTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📝 Editor de Código
            </button>
          </div>

          {centerTab === 'editor' && (
            <>
              <button
                onClick={handleSaveFile}
                disabled={isSaving}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
              >
                <span>💾</span>
                <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
              <button
                onClick={handleOpenLocal}
                className="text-xs bg-[#181826] hover:bg-[#222236] text-gray-200 border border-[#2c2c40] px-3 py-1.5 rounded-xl transition"
              >
                🖥️ Abrir no PC
              </button>
            </>
          )}

          {centerTab === 'preview' && (
            <button
              onClick={loadPreviewHtml}
              className="text-xs bg-[#181826] hover:bg-[#222236] text-emerald-300 border border-[#2c2c40] px-3 py-1.5 rounded-xl transition"
              title="Recarregar tela do jogo"
            >
              🔄 Recarregar Jogo
            </button>
          )}
        </div>
      </div>

      {/* Corpo da IDE em 3 Colunas Modernas */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Coluna 1: File Tree (w-64) */}
        <div className="w-64 border-r border-[#181824] bg-[#07070d] p-3 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#181824]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Pastas & Arquivos
            </span>
            <button
              onClick={loadFiles}
              className="text-xs text-gray-400 hover:text-white"
              title="Atualizar arquivos"
            >
              🔄
            </button>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto">
            {files.map(f => (
              <div
                key={f.relPath}
                onClick={() => {
                  if (f.isText) {
                    loadFileContent(f.relPath);
                    setCenterTab('editor');
                  }
                }}
                className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                  activeFile === f.relPath
                    ? 'bg-indigo-950/60 text-white border border-indigo-500/40'
                    : 'text-gray-400 hover:bg-[#10101c] hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span>{f.isText ? '📜' : f.isMedia ? '🖼️' : '📄'}</span>
                  <span className="truncate font-mono text-[11px]">{f.relPath}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Editor OU Live Preview Iframe */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#040408] relative">
          {centerTab === 'preview' ? (
            <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
              <iframe
                title="Live App Preview"
                srcDoc={previewHtml}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-modals"
              />
            </div>
          ) : (
            <textarea
              value={codeContent}
              onChange={e => setCodeContent(e.target.value)}
              className="flex-1 w-full h-full p-4 bg-[#05050a] text-gray-200 font-mono text-xs outline-none resize-none leading-relaxed"
              placeholder="Selecione um arquivo de código para editar..."
            />
          )}
        </div>

        {/* Coluna 3: Chat Compacto do Agente Construtor (w-80) */}
        <div className="w-80 border-l border-[#181824] bg-[#07070d] flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-[#181824] flex items-center justify-between bg-[#0a0a12]">
            <span className="text-xs font-bold text-indigo-300">
              🤖 Agente Construtor
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">120B / Argon</span>
          </div>

          {/* Mensagens */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'Você' ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-gray-500 mb-0.5">{m.sender}</span>
                <div className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-full ${
                  m.sender === 'Você'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#10101a] border border-[#1e1e2d] text-gray-200'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans text-[11px]">{m.text}</pre>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="text-[10px] text-indigo-400 animate-pulse">
                Escrevendo código no disco...
              </div>
            )}
          </div>

          {/* Input do Chat */}
          <div className="p-2.5 border-t border-[#181824] bg-[#090910]">
            <div className="flex gap-2 bg-[#12121c] border border-[#222234] rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Peça alterações de código..."
                className="flex-1 bg-transparent text-xs text-gray-100 outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={isThinking}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
              >
                ↵
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
