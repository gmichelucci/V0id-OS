import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '../MarkdownRenderer';
import BlackHoleIcon from '../icons/BlackHoleIcon';

interface PipelineStep {
  id: string;
  studio: string;
  action: string;
  status: 'PENDENTE' | 'EXECUTANDO' | 'CONCLUÍDO';
}

interface AttachedFile {
  name: string;
  size: number;
  content: string;
  type: string;
}

interface ChatSession {
  id: string;
  project_id: string;
  title: string;
  updated_at?: string;
  created_at?: string;
}

interface MessageItem {
  id?: number;
  sender: string;
  text: string;
  time: string;
  isGold?: boolean;
  toolResults?: any[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatToolBadge(t: any): string {
  const toolName = t.tool || 'ferramenta';
  if (toolName === 'read_file') {
    const file = t.args?.filePath || t.args?.path || t.args?.file || 'arquivo';
    const lines = typeof t.result === 'string' ? t.result.split('\n').length : 0;
    return `• [read_file] -> ${file} (${lines} linhas lidas do disco)`;
  }
  if (toolName === 'write_file') {
    const file = t.args?.filePath || t.args?.path || 'arquivo';
    return `• [write_file] -> ${file} (Gravado com sucesso no disco)`;
  }
  if (toolName === 'apply_diff') {
    const file = t.args?.filePath || t.args?.path || 'arquivo';
    return `• [apply_diff] -> ${file} (Diff cirúrgico aplicado)`;
  }
  if (toolName === 'search_code') {
    const q = t.args?.query || '';
    return `• [search_code] -> "${q}" (Busca grep no repositório)`;
  }
  if (toolName === 'find_files') {
    const p = t.args?.pattern || '*';
    return `• [find_files] -> "${p}" (Localização de arquivos)`;
  }
  if (toolName === 'run_command') {
    const cmd = t.args?.command || t.args?.cmd || 'comando';
    return `• [run_command] -> ${cmd} (Executado no PowerShell)`;
  }
  if (toolName === 'list_dir') {
    const dir = t.args?.dirPath || '.';
    return `• [list_dir] -> ${dir} (Diretório inspecionado)`;
  }
  if (toolName === 'generate_image') {
    const prompt = t.args?.prompt || t.args?.description || 'Imagem';
    const cleanPrompt = typeof prompt === 'string' ? prompt.slice(0, 36) : 'Sintetizando...';
    return `• [generate_image] -> "${cleanPrompt}..." (Síntese Neural FLUX/Sana)`;
  }
  if (toolName === 'graphify') {
    const action = t.args?.action || 'query';
    return `• [graphify] -> AST & Grafo de Conhecimento (${action})`;
  }
  if (toolName === 'attach_image') {
    return `• [visão multimodal] -> ${t.args?.name || 'imagem'} (Carregada no pipeline de visão)`;
  }
  if (toolName === 'attach_file') {
    return `• [anexo de código] -> ${t.args?.name || 'arquivo'} (${formatFileSize(t.args?.size || 0)})`;
  }
  return `• [${toolName}] -> Concluído com sucesso`;
}

export default function GlobalChatView({
  activeProject,
  projectId
}: {
  activeProject: string;
  projectId?: string;
}) {
  const projectSlug = projectId || (activeProject || 'global').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'global';

  // Sessões
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  // Chat Mode
  const [chatMode, setChatMode] = useState<string>('local');

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [superPromptModal, setSuperPromptModal] = useState<{ raw: string; compiled: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Anexos de Arquivos
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Multi-Studio Pipeline State
  const [activePipeline, setActivePipeline] = useState<{
    name: string;
    steps: PipelineStep[];
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 9 Toggles Vivos
  const [toggles, setToggles] = useState({
    promptImprover: true,
    omniRoutePool: true,
    forceAgy: false,
    graphify: true,
    ponytail: true,
    rtkSlim: true,
    uncensoredMode: false,
    cavemanMode: false,
    reaEngine: false
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const copyToClipboard = (text: string, label: string = 'Texto copiado!') => {
    navigator.clipboard.writeText(text);
    showToast(`✅ ${label}`);
  };

  const toggleSwitch = (key: keyof typeof toggles) => {
    const updated = { ...toggles, [key]: !toggles[key] };
    setToggles(updated);
    showToast(`Toggle [${key}] alternado para ${updated[key] ? 'ATIVO' : 'INATIVO'}.`);
  };

  // Carrega Sessões Salvas
  const loadSessions = async (): Promise<ChatSession[]> => {
    try {
      const res = await fetch(`/api/chat?project=${projectSlug}&action=sessions`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        return data.sessions;
      }
    } catch {}
    return [];
  };

  // Carrega Histórico Persistente da Sessão Ativa
  const loadPersistedHistory = async (targetSession: string) => {
    try {
      const res = await fetch(`/api/chat?project=${projectSlug}&session_id=${targetSession}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages.map((m: any) => {
          return {
            id: m.id,
            sender: m.sender,
            text: m.text,
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString() : 'Agora',
            isGold: !!m.is_gold,
            toolResults: m.tool_results
          };
        }));
      } else {
        setMessages([
          {
            sender: 'V0id Core (Orquestrador Supremo)',
            text: `Terminal Orquestrador Supremo Ativo [${activeProject}].\nCapacidade de acionar pipelines automatizados em sequência através de todos os estúdios (Code, OmniMedia, Game, Research) com memória multi-turn persistente.`,
            time: 'Agora'
          }
        ]);
      }
    } catch {
      setMessages([
        {
          sender: 'V0id Core',
          text: `Conversa inicializada no projeto [${activeProject}].`,
          time: 'Agora'
        }
      ]);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      const sessList = await loadSessions();
      const storedId = typeof window !== 'undefined' ? localStorage.getItem(`v0id_active_session_${projectSlug}`) : null;
      let targetSessId = '';

      if (storedId && sessList.some(s => s.id === storedId)) {
        targetSessId = storedId;
      } else if (sessList.length > 0) {
        targetSessId = sessList[0].id;
      } else {
        targetSessId = `session_${Date.now()}`;
      }

      setSessionId(targetSessId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`v0id_active_session_${projectSlug}`, targetSessId);
      }
      await loadPersistedHistory(targetSessId);
    };
    initChat();
  }, [projectSlug]);

  // Iniciar Nova Conversa
  const startNewConversation = async () => {
    const newId = `session_${Date.now()}`;
    setSessionId(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`v0id_active_session_${projectSlug}`, newId);
    }
    setAttachments([]);
    setMessages([
      {
        sender: 'V0id Core (Orquestrador Supremo)',
        text: `✨ Nova conversa iniciada no projeto [${activeProject}].\nMemória limpa e pronta para novo objetivo. Envie mensagens ou anexe arquivos abaixo.`,
        time: new Date().toLocaleTimeString()
      }
    ]);
    setSessionsOpen(false);
    showToast('✨ Nova conversa iniciada!');
    await loadSessions();
  };

  // Excluir Sessão
  const handleDeleteSession = async (sId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat?session_id=${sId}`, { method: 'DELETE' });
      showToast('🗑️ Sessão excluída!');
      const updatedList = await loadSessions();
      if (sessionId === sId) {
        if (updatedList.length > 0) {
          const nextId = updatedList[0].id;
          setSessionId(nextId);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`v0id_active_session_${projectSlug}`, nextId);
          }
          loadPersistedHistory(nextId);
        } else {
          startNewConversation();
        }
      }
    } catch {}
  };

  // Upload e Leitura de Arquivos Anexados
  const handleFiles = (files: FileList | File[]) => {
    const newAttachments: AttachedFile[] = [];
    const fileList = Array.from(files);

    fileList.forEach(file => {
      const reader = new FileReader();
      const isText = file.type.startsWith('text/') ||
        /\.(txt|ts|tsx|js|jsx|json|md|py|css|html|yml|yaml|sql|sh|bat|spec)$/i.test(file.name);

      if (isText) {
        reader.onload = (e) => {
          const content = e.target?.result as string || '';
          setAttachments(prev => [...prev, {
            name: file.name,
            size: file.size,
            content,
            type: file.type || 'text/plain'
          }]);
        };
        reader.readAsText(file);
      } else {
        // Se for imagem ou binário
        reader.onload = (e) => {
          const content = e.target?.result as string || '';
          setAttachments(prev => [...prev, {
            name: file.name,
            size: file.size,
            content,
            type: file.type || 'application/octet-stream'
          }]);
        };
        reader.readAsDataURL(file);
      }
    });

    showToast(`📎 ${fileList.length} arquivo(s) preparado(s) para envio!`);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Editar Mensagem Anterior do Usuário
  const handleEditMessage = (text: string) => {
    setInputVal(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    showToast('✏️ Mensagem carregada no editor para ajuste!');
  };

  // Regenerar Resposta
  const handleRegenerate = async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender.includes('Você'));
    if (lastUserMsg) {
      setInputVal(lastUserMsg.text);
      await sendMessage(lastUserMsg.text);
    }
  };

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, activePipeline]);

  // Drag and drop listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Enviar Mensagem
  const sendMessage = async (overrideMsg?: string) => {
    const textToSend = overrideMsg || inputVal;
    if ((!textToSend.trim() && attachments.length === 0) || isThinking) return;

    const userMsg = textToSend;
    const currentAttachments = [...attachments];

    setInputVal('');
    setAttachments([]);

    // Mostra mensagem imediatamente na UI
    let displayUserText = userMsg;
    if (currentAttachments.length > 0) {
      displayUserText += '\n\n📎 Anexos: ' + currentAttachments.map(a => `${a.name} (${formatFileSize(a.size)})`).join(', ');
    }

    setMessages(prev => [...prev, {
      sender: 'Você',
      text: displayUserText,
      time: new Date().toLocaleTimeString()
    }]);

    setIsThinking(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          project: activeProject,
          session_id: sessionId,
          toggles,
          attachments: currentAttachments,
          chatMode
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          sender: `${data.provider} (${data.tier || 'Direct'})`,
          text: data.text,
          time: new Date().toLocaleTimeString(),
          toolResults: data.toolResults
        }]);
        loadSessions(); // Atualiza títulos de sessão
      } else {
        setMessages(prev => [...prev, {
          sender: 'OmniRoute Error',
          text: `Erro na resposta: ${data.error || 'Falha de comunicação'}`,
          time: new Date().toLocaleTimeString()
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'OmniRoute Error',
        text: `Falha na requisição: ${err.message}`,
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const markLastGold = async () => {
    if (messages.length === 0) return;
    setMessages(prev => {
      const copy = [...prev];
      copy[copy.length - 1].isGold = true;
      return copy;
    });
    try {
      await fetch('/api/chat?action=gold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectSlug })
      });
    } catch {}
    showToast('Padrão [APPROVED_GOLD] gravado no SOUL.md e memorizado no Nexus DB!');
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex overflow-hidden bg-[#030306] select-text relative"
    >
      {/* Overlay de Drag and Drop */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-amber-950/80 backdrop-blur-sm border-2 border-dashed border-amber-400 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
          <span className="text-4xl mb-2">📂</span>
          <p className="text-base font-extrabold text-white">Solte os arquivos para anexar ao V0id OS</p>
          <p className="text-xs text-amber-300">Arquivos de código, textos ou imagens serão incluídos no contexto</p>
        </div>
      )}

      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-amber-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Área Central: Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#040409] overflow-hidden">
        {/* Top Header Bar Antigravity-Grade */}
        <div className="h-14 border-b border-[#181824] px-6 flex items-center justify-between bg-[#07070e] flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <BlackHoleIcon className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-extrabold text-white">Chat Global — Orquestrador Supremo</span>
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono font-bold">
              {activeProject}
            </span>

            <div className="flex items-center ml-2 border border-[#232338] bg-[#0c0c16] rounded-xl overflow-hidden">
              <select
                value={chatMode}
                onChange={e => setChatMode(e.target.value)}
                className="bg-transparent text-xs text-amber-400 font-bold outline-none px-3 py-1 cursor-pointer appearance-none"
              >
                <option value="local">Modo Local (OmniRoute - Antigravity)</option>
                <option value="nuvem">Modo Nuvem (Jules - GitHub)</option>
              </select>
              <span className="px-3 py-1 text-[10px] text-gray-500 border-l border-[#232338]">
                {chatMode === 'local' ? 'Tokens OmniRoute: 120B' : 'Tokens Jules: Ilimitado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão + Nova Conversa */}
            <button
              onClick={startNewConversation}
              className="text-xs bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-lg shadow-amber-950/40 flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>Nova Conversa</span>
            </button>

            {/* Menu de Sessões / Histórico */}
            <div className="relative">
              <button
                onClick={() => setSessionsOpen(!sessionsOpen)}
                className="text-xs bg-[#121220] hover:bg-[#1a1a2e] text-gray-200 border border-[#232338] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📂</span>
                <span>Conversas ({sessions.length})</span>
              </button>

              {sessionsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0c0c16] border border-[#26263a] rounded-2xl shadow-2xl p-3 z-50 animate-fade-in max-h-80 overflow-y-auto">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                    <span>Sessões Anteriores</span>
                    <button
                      onClick={() => setSessionsOpen(false)}
                      className="text-gray-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  {sessions.length === 0 ? (
                    <p className="text-xs text-gray-500 px-1 py-2">Nenhuma conversa salva ainda.</p>
                  ) : (
                    <div className="space-y-1">
                      {sessions.map(s => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSessionId(s.id);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem(`v0id_active_session_${projectSlug}`, s.id);
                            }
                            setSessionsOpen(false);
                            loadPersistedHistory(s.id);
                            showToast(`Sessão carregada: ${s.title}`);
                          }}
                          className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                            sessionId === s.id
                              ? 'bg-amber-950/40 border border-amber-500/50 text-amber-200'
                              : 'bg-[#080810] hover:bg-[#141422] text-gray-300 border border-transparent'
                          }`}
                        >
                          <span className="truncate flex-1 font-medium mr-2">{s.title || 'Conversa'}</span>
                          <button
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            title="Excluir sessão"
                            className="text-gray-500 hover:text-red-400 text-xs px-1"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={markLastGold}
              title="Aprovar resposta como padrão GOLD"
              className="text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              ⭐ [GOLD]
            </button>
          </div>
        </div>

        {/* Mensagens com scroll e suporte completo a seleção de texto */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 select-text">
          {messages.map((m, idx) => {
            const isUser = m.sender.includes('Você');
            const isLastAssistant = !isUser && idx === messages.length - 1;

            return (
              <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group select-text`}>
                {/* Header da Mensagem com Ações Rápidas */}
                <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-2 select-none">
                  <span className="font-bold text-gray-400">{m.sender}</span>
                  <span>•</span>
                  <span>{m.time}</span>
                  {m.isGold && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[9px] px-2 py-0.2 rounded-full font-bold">
                      ⭐ [APPROVED_GOLD]
                    </span>
                  )}

                  {/* Ações da Mensagem: Copiar & Editar */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => copyToClipboard(m.text, 'Mensagem copiada!')}
                      className="text-[10px] text-gray-400 hover:text-amber-300 px-1 py-0.5 rounded hover:bg-white/[0.05] transition cursor-pointer"
                      title="Copiar mensagem"
                    >
                      📋 Copiar
                    </button>
                    {isUser && (
                      <button
                        onClick={() => handleEditMessage(m.text)}
                        className="text-[10px] text-gray-400 hover:text-amber-300 px-1 py-0.5 rounded hover:bg-white/[0.05] transition cursor-pointer"
                        title="Editar comando e reenviar"
                      >
                        ✏️ Editar
                      </button>
                    )}
                    {isLastAssistant && (
                      <button
                        onClick={handleRegenerate}
                        className="text-[10px] text-gray-400 hover:text-cyan-300 px-1 py-0.5 rounded hover:bg-white/[0.05] transition cursor-pointer"
                        title="Regenerar resposta"
                      >
                        🔄 Regenerar
                      </button>
                    )}
                  </div>
                </div>

                {/* Balão de Mensagem Formatada */}
                <div className={`max-w-3xl p-4 rounded-2xl text-xs leading-relaxed shadow-lg select-text ${
                  isUser
                    ? 'bg-amber-600 text-white rounded-br-none'
                    : m.isGold
                    ? 'bg-[#12121d] border-2 border-amber-500/60 text-gray-200 rounded-bl-none'
                    : 'bg-[#0a0a14] border border-[#1e1e2d] text-gray-200 rounded-bl-none'
                }`}>
                  <MarkdownRenderer content={m.text} onCopyCode={(code) => copyToClipboard(code, 'Trecho de código copiado!')} />

                  {/* Drawer Retrátil de Ferramentas Executadas (Estilo Antigravity) */}
                  {m.toolResults && m.toolResults.length > 0 && (
                    <details className="mt-3 rounded-xl border border-[#232338] bg-[#070712] overflow-hidden text-[11px] group/tools">
                      <summary className="px-3 py-1.5 cursor-pointer text-amber-400 font-mono font-bold hover:text-amber-300 flex items-center justify-between bg-[#0e0e1a] select-none">
                        <span>⚙️ Ações no Sistema ({m.toolResults.length})</span>
                        <span className="text-[10px] text-gray-500 font-normal">Expandir</span>
                      </summary>
                      <div className="p-3 space-y-1.5 font-mono text-[10px] text-gray-300 border-t border-[#1e1e2d] max-h-60 overflow-y-auto">
                        {m.toolResults.map((t: any, tidx: number) => (
                          <div key={tidx} className="bg-[#040409] p-2 rounded-lg border border-[#181826]">
                            <div className="text-amber-300 font-bold">{formatToolBadge(t)}</div>
                            {t.result && typeof t.result === 'string' && (
                              <pre className="text-gray-400 mt-1 whitespace-pre-wrap max-h-24 overflow-y-auto text-[9px] leading-tight font-mono">
                                {t.result.slice(0, 1000)}
                              </pre>
                            )}
                            {t.error && (
                              <div className="text-red-400 mt-1 text-[9px]">Erro: {t.error}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex flex-col items-start animate-pulse">
              <span className="text-[10px] text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                OmniRoute (Groq / Gemini / Cerebras) sintetizando...
              </span>
              <div className="bg-[#0a0a14] border border-amber-900/50 p-3.5 rounded-2xl text-xs text-gray-400">
                Processando memória de conversa, consultando ferramentas e compondo resposta...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar Antigravity-Style com Suporte a Anexos */}
        <div className="p-3.5 bg-[#07070e] border-t border-[#181824] flex-shrink-0">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Lista de Chips de Arquivos Anexados */}
            {attachments.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pb-1">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-[#141424] border border-amber-500/30 text-amber-300 text-xs px-2.5 py-1 rounded-xl shadow"
                  >
                    <span>📄</span>
                    <span className="font-mono font-medium max-w-xs truncate">{att.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({formatFileSize(att.size)})</span>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="ml-1 text-gray-400 hover:text-red-400 text-xs cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Principal */}
            <div className="flex items-end gap-2.5 bg-[#0e0e18] border border-[#202032] focus-within:border-amber-500/60 rounded-2xl p-2.5 transition">
              {/* Input invisível para seleção de arquivo */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />

              {/* Botão Anexar 📎 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Anexar arquivos de código, texto ou imagens"
                className="p-2 text-gray-400 hover:text-amber-300 hover:bg-white/[0.05] rounded-xl transition cursor-pointer flex-shrink-0"
              >
                📎
              </button>

              {/* Textarea auto-expansível */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Pergunte ao V0id, anexe arquivos ou cole prints (Shift+Enter para nova linha)..."
                className="flex-1 bg-transparent text-xs text-gray-100 outline-none resize-none max-h-32 min-h-[28px] py-1 select-text leading-relaxed font-sans"
              />

              {/* Botão Enviar */}
              <button
                onClick={() => sendMessage()}
                disabled={isThinking || (!inputVal.trim() && attachments.length === 0)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  isThinking || (!inputVal.trim() && attachments.length === 0)
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40'
                }`}
              >
                <span>Enviar</span>
                <span>↵</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Toggles Vivos */}
      <div className="w-72 border-l border-[#181824] bg-[#05050a] p-4 flex flex-col overflow-y-auto flex-shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center justify-between select-none">
          <span>⚡ Toggles Vivos</span>
          <span className="text-[10px] text-amber-400 font-mono">Real-Time</span>
        </h3>
        <div className="space-y-2 text-xs flex-1 select-none">
          {[
            { key: 'promptImprover', label: 'Prompt Improver', desc: 'Refina via Gatekeeper Flash' },
            { key: 'omniRoutePool', label: 'OmniRoute Pool', desc: 'Cerebras + Groq + Gemini' },
            { key: 'forceAgy', label: 'Forçar agy CLI', desc: 'Ponte direta Antigravity CLI' },
            { key: 'graphify', label: 'Graphify (AST)', desc: 'Knowledge graph sincronizado' },
            { key: 'ponytail', label: 'Modo Ponytail', desc: 'Menor código que funciona' },
            { key: 'rtkSlim', label: 'RTK Output Slim', desc: 'Comprime saídas longas' },
            { key: 'uncensoredMode', label: 'Modo Sem Censura', desc: 'Rotas Dolphin/Hermes' },
            { key: 'cavemanMode', label: 'Modo Caveman', desc: 'Respostas cirúrgicas' },
            { key: 'reaEngine', label: 'Motor REA', desc: 'Engenharia reversa Docker' }
          ].map(item => {
            const active = toggles[item.key as keyof typeof toggles];
            return (
              <div
                key={item.key}
                onClick={() => toggleSwitch(item.key as keyof typeof toggles)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  active
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : 'bg-[#0a0a14] border-[#181824] opacity-60 hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-semibold text-[11px] ${active ? 'text-amber-300' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                    active ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {active ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
