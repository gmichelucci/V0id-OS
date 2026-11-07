import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '../MarkdownRenderer';
import BlackHoleIcon from '../icons/BlackHoleIcon';
import VisualDiffModal from '../VisualDiffModal';
import IntegratedTerminalDrawer from '../IntegratedTerminalDrawer';

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
  if (toolName === 'web_search') {
    const q = t.args?.query || t.args?.q || '';
    return `• [web_search] -> "${q}" (Pesquisa na web em tempo real)`;
  }
  if (toolName === 'fetch_web') {
    const u = t.args?.url || '';
    return `• [fetch_web] -> ${u} (Conteúdo textual extraído da web)`;
  }
  if (toolName === 'attach_image') {
    return `• [visão multimodal] -> ${t.args?.name || 'imagem'} (Carregada no pipeline de visão)`;
  }
  if (toolName === 'attach_file') {
    return `• [anexo de código] -> ${t.args?.name || 'arquivo'} (${formatFileSize(t.args?.size || 0)})`;
  }
  return `• [${toolName}] -> Concluído com sucesso`;
}

interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  sync_target?: string;
  folderPath?: string;
  folderExists?: boolean;
}

export default function GlobalChatView({
  activeProject,
  projectId
}: {
  activeProject: string;
  projectId?: string;
}) {
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('v0id_last_selected_project');
      if (saved) return saved;
    }
    return projectId || (activeProject && !activeProject.includes('(') ? activeProject.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') : 'v0id');
  });
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkPathInput, setLinkPathInput] = useState('');
  const [linkNameInput, setLinkNameInput] = useState('');
  const [quickPaths, setQuickPaths] = useState<Array<{ name: string; path: string }>>([]);
  const [isBrowsingFolder, setIsBrowsingFolder] = useState(false);

  const projectSlug = selectedProjectId || 'global';
  const currentProjectObj = projectList.find(p => p.id === selectedProjectId) || {
    id: selectedProjectId,
    name: selectedProjectId,
    folderPath: ''
  };

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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Live Tool Execution Stepper (Padrão Antigravity)
  const [liveToolSteps, setLiveToolSteps] = useState<Array<{
    tool: string;
    args: any;
    status: 'running' | 'done' | 'error';
    result?: any;
    error?: string;
  }>>([]);

  // Menções de Contexto com @ (Padrão Antigravity / Cursor)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{ name: string; relativePath: string; isDir: boolean }>>([]);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Menções de Símbolos AST com # (Padrão Antigravity / Cursor)
  const [symbolQuery, setSymbolQuery] = useState<string | null>(null);
  const [symbolSuggestions, setSymbolSuggestions] = useState<Array<{ label: string; file: string; line?: string; kind?: string }>>([]);
  const [symbolIndex, setSymbolIndex] = useState(0);

  // Autocomplete de Comandos de Barra /
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashSuggestions, setSlashSuggestions] = useState<Array<{ cmd: string; desc: string; icon: string }>>([]);
  const [slashIndex, setSlashIndex] = useState(0);

  // Inspetor Visual de Diffs & Terminal Integrado
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

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

  // Carrega Lista de Projetos e Repositórios
  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjectList(data.projects);
        return data.projects;
      }
    } catch {}
    return [];
  };

  // Vincula pasta local do PC
  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPathInput.trim()) return;
    try {
      const res = await fetch('/api/projects?action=link_repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: linkNameInput.trim() || undefined,
          localPath: linkPathInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Repositório "${data.project.name}" vinculado com sucesso!`);
        setLinkModalOpen(false);
        setLinkPathInput('');
        setLinkNameInput('');
        await loadProjects();
        setSelectedProjectId(data.project.id);
      } else {
        showToast(`❌ Erro: ${data.error || 'Falha ao vincular pasta'}`);
      }
    } catch (err: any) {
      showToast(`❌ Falha: ${err.message}`);
    }
  };

  // Abre pasta no Windows Explorer
  const handleOpenFolder = async () => {
    try {
      await fetch('/api/projects?action=open_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProjectId })
      });
      showToast(`📂 Pasta aberta no Windows Explorer: ${currentProjectObj.folderPath || selectedProjectId}`);
    } catch {}
  };

  // Abre Modal de Vinculação com Carregamento de Pastas do PC
  const openLinkModal = async () => {
    setLinkModalOpen(true);
    try {
      const res = await fetch('/api/projects?action=quick_paths');
      const data = await res.json();
      if (data.success && Array.isArray(data.paths)) {
        setQuickPaths(data.paths);
      }
    } catch {}
  };

  // Aciona Diálogo Nativo de Escolha de Pastas do Windows
  const handleBrowseFolderNative = async () => {
    setIsBrowsingFolder(true);
    showToast('Abriu seletor de pastas do Windows na barra de tarefas...');
    try {
      const res = await fetch('/api/projects?action=browse_folder', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.folderPath) {
        setLinkPathInput(data.folderPath);
        if (!linkNameInput.trim()) {
          setLinkNameInput(data.name || '');
        }
        showToast(`Pasta selecionada: ${data.folderPath}`);
      }
    } catch (err: any) {
      showToast(`Erro ao selecionar pasta: ${err.message}`);
    } finally {
      setIsBrowsingFolder(false);
    }
  };

  // Desvincular / Excluir Projeto
  const handleUnlinkProject = async (projId: string) => {
    if (projId === 'global' || projId === 'v0id') {
      showToast('Os ambientes Global e V0id OS são essenciais e não podem ser desvinculados.');
      return;
    }
    if (!confirm(`Deseja desvincular o repositório "${projId}" do V0id OS? (Seus arquivos físicos no computador NÃO serão apagados)`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects?id=${projId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ Repositório [${projId}] desvinculado!`);
        await loadProjects();
        setSelectedProjectId('v0id');
      }
    } catch {}
  };

  // Reversão cirúrgica de diff (Snapshot)
  const handleRollbackSnapshot = async (snapshotId: string) => {
    try {
      const res = await fetch('/api/projects?action=rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`↩️ ${data.message}`);
      } else {
        showToast(`❌ Erro no rollback: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`❌ Falha: ${err.message}`);
    }
  };

  // Interromper Execução (Padrão Antigravity Stop)
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsThinking(false);
      setLiveToolSteps([]);
      showToast('⏹️ Execução interrompida com sucesso.');
    }
  };

  // Detector de menções (@arquivos, #símbolos, /comandos)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputVal(val);

    const caret = e.target.selectionStart;
    const textBeforeCaret = val.slice(0, caret);

    // 1. Detecção @arquivo
    const atMatch = textBeforeCaret.match(/@([a-zA-Z0-9_\-\.\/]*)$/);
    if (atMatch) {
      const query = atMatch[1];
      setMentionQuery(query);
      setSymbolQuery(null);
      setSlashQuery(null);
      fetch(`/api/projects?action=suggest_files&id=${selectedProjectId}&query=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.suggestions)) {
            setMentionSuggestions(d.suggestions);
            setMentionIndex(0);
          }
        })
        .catch(() => {});
      return;
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }

    // 2. Detecção #símbolo AST (Graphify)
    const hashMatch = textBeforeCaret.match(/#([a-zA-Z0-9_\.]*)$/);
    if (hashMatch) {
      const query = hashMatch[1];
      setSymbolQuery(query);
      setMentionQuery(null);
      setSlashQuery(null);
      fetch(`/api/projects?action=suggest_symbols&query=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.symbols)) {
            setSymbolSuggestions(d.symbols);
            setSymbolIndex(0);
          }
        })
        .catch(() => {});
      return;
    } else {
      setSymbolQuery(null);
      setSymbolSuggestions([]);
    }

    // 3. Detecção /comando de barra
    const slashMatch = textBeforeCaret.match(/^\/([a-z0-9_]*)$/i);
    if (slashMatch) {
      const query = slashMatch[1].toLowerCase();
      setSlashQuery(query);
      setMentionQuery(null);
      setSymbolQuery(null);
      const allSlash = [
        { cmd: '/plan', desc: 'Planejamento de arquitetura antes de alterar código', icon: '📋' },
        { cmd: '/git status', desc: 'Verificar status Git do repositório ativo', icon: '🌿' },
        { cmd: '/git diff', desc: 'Verificar diff do código modificado', icon: '🔍' },
        { cmd: '/rollback', desc: 'Reverter o último snapshot gravado no disco', icon: '↩️' },
        { cmd: '/diff', desc: 'Abrir Inspetor Visual de Diffs e Snapshots', icon: '📝' },
        { cmd: '/terminal', desc: 'Abrir Terminal Integrado do projeto', icon: '💻' },
        { cmd: '/compact', desc: 'Compactar histórico da conversa com resumo executivo', icon: '📦' },
        { cmd: '/repo', desc: 'Exibir pasta física e status do repositório ativo', icon: '📁' },
      ];
      setSlashSuggestions(allSlash.filter(s => s.cmd.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query)));
      setSlashIndex(0);
      return;
    } else {
      setSlashQuery(null);
      setSlashSuggestions([]);
    }
  };

  const insertMention = (relPath: string) => {
    if (!textareaRef.current) return;
    const caret = textareaRef.current.selectionStart;
    const textBeforeCaret = inputVal.slice(0, caret);
    const textAfterCaret = inputVal.slice(caret);
    const newTextBefore = textBeforeCaret.replace(/@([a-zA-Z0-9_\-\.\/]*)$/, `@${relPath} `);
    setInputVal(newTextBefore + textAfterCaret);
    setMentionQuery(null);
    setMentionSuggestions([]);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const insertSymbolMention = (symLabel: string) => {
    if (!textareaRef.current) return;
    const caret = textareaRef.current.selectionStart;
    const textBeforeCaret = inputVal.slice(0, caret);
    const textAfterCaret = inputVal.slice(caret);
    const newTextBefore = textBeforeCaret.replace(/#([a-zA-Z0-9_\.]*)$/, `#${symLabel} `);
    setInputVal(newTextBefore + textAfterCaret);
    setSymbolQuery(null);
    setSymbolSuggestions([]);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const insertSlashCommand = (cmd: string) => {
    if (cmd === '/diff') {
      setDiffModalOpen(true);
      setInputVal('');
    } else if (cmd === '/terminal') {
      setTerminalOpen(prev => !prev);
      setInputVal('');
    } else {
      setInputVal(cmd + ' ');
    }
    setSlashQuery(null);
    setSlashSuggestions([]);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Carrega Sessões Salvas
  const loadSessions = async (targetSlug?: string): Promise<ChatSession[]> => {
    const slug = targetSlug || projectSlug;
    try {
      const res = await fetch(`/api/chat?project=${slug}&action=sessions`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        return data.sessions;
      }
    } catch {}
    return [];
  };

  // Carrega Histórico Persistente da Sessão Ativa
  const loadPersistedHistory = async (targetSession: string, targetSlug?: string) => {
    const slug = targetSlug || projectSlug;
    try {
      const res = await fetch(`/api/chat?project=${slug}&session_id=${targetSession}`);
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
        const pName = currentProjectObj.name || slug;
        const pFolder = currentProjectObj.folderPath || '';
        setMessages([
          {
            sender: 'V0id Core (Orquestrador Supremo)',
            text: `Terminal Orquestrador Supremo Ativo [${pName}].${pFolder ? `\n📁 Repositório no disco: \`${pFolder}\`` : ''}\nTodas as ferramentas (leitura, escrita, terminal e IA) operam diretamente neste workspace. Digite /project para status ou /plan para arquitetura.`,
            time: 'Agora'
          }
        ]);
      }
    } catch {
      setMessages([
        {
          sender: 'V0id Core',
          text: `Conversa inicializada no projeto [${selectedProjectId}].`,
          time: 'Agora'
        }
      ]);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const initChat = async () => {
      const sessList = await loadSessions(projectSlug);
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
        localStorage.setItem('v0id_last_selected_project', projectSlug);
      }
      await loadPersistedHistory(targetSessId, projectSlug);
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

  // Suporte a Colar Imagens e Prints diretamente do Clipboard (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          const fileName = file.name && file.name !== 'image.png'
            ? file.name
            : `print_${Date.now()}.png`;
          const renamedFile = new File([file], fileName, { type: file.type || 'image/png' });
          files.push(renamedFile);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
      showToast(`📸 Imagem colada do clipboard com sucesso!`);
    }
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

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLiveToolSteps([]);
    setIsThinking(true);

    let streamText = '';
    let streamProvider = 'OmniRoute Core';
    let streamTier = 'Direct';
    let streamToolResults: any[] = [];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMsg,
          project: selectedProjectId,
          session_id: sessionId,
          toggles,
          attachments: currentAttachments,
          chatMode,
          stream: true
        })
      });

      if (!res.ok) {
        throw new Error(`Erro na conexão com o servidor (${res.status})`);
      }

      // 1. Caminho Fluido: Streaming em Tempo Real SSE
      if (res.headers.get('content-type')?.includes('text/event-stream') && res.body) {
        // Balão inicial de streaming
        setMessages(prev => [...prev, {
          sender: 'OmniRoute Core',
          text: '',
          time: new Date().toLocaleTimeString(),
          toolResults: []
        }]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            if (!block.trim()) continue;
            const eventMatch = block.match(/^event:\s*([a-zA-Z0-9_]+)/m);
            const dataMatch = block.match(/^data:\s*(.+)$/m);
            const eventName = eventMatch ? eventMatch[1] : 'message';
            if (!dataMatch) continue;

            let dataObj: any = {};
            try {
              dataObj = JSON.parse(dataMatch[1]);
            } catch {
              continue;
            }

            if (eventName === 'tool_start') {
              setLiveToolSteps(prev => [...prev, {
                tool: dataObj.tool,
                args: dataObj.args,
                status: 'running'
              }]);
            } else if (eventName === 'tool_end') {
              setLiveToolSteps(prev => {
                const copy = [...prev];
                const lastIdx = copy.map(t => t.tool).lastIndexOf(dataObj.tool);
                if (lastIdx !== -1) {
                  copy[lastIdx] = {
                    ...copy[lastIdx],
                    status: dataObj.error ? 'error' : 'done',
                    result: dataObj.result,
                    error: dataObj.error
                  };
                } else {
                  copy.push({
                    tool: dataObj.tool,
                    args: dataObj.args,
                    status: dataObj.error ? 'error' : 'done',
                    result: dataObj.result,
                    error: dataObj.error
                  });
                }
                return copy;
              });
            } else if (eventName === 'delta') {
              if (dataObj.chunk) {
                streamText += dataObj.chunk;
                setMessages(prev => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && !last.sender.includes('Você')) {
                    copy[copy.length - 1] = {
                      ...last,
                      text: streamText
                    };
                  }
                  return copy;
                });
              }
            } else if (eventName === 'done') {
              streamText = dataObj.text || streamText;
              streamProvider = dataObj.provider || streamProvider;
              streamTier = dataObj.tier || streamTier;
              streamToolResults = dataObj.toolResults || [];

              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && !last.sender.includes('Você')) {
                  copy[copy.length - 1] = {
                    ...last,
                    sender: `${streamProvider} (${streamTier})`,
                    text: streamText,
                    toolResults: streamToolResults
                  };
                }
                return copy;
              });
              loadSessions();
            } else if (eventName === 'error') {
              throw new Error(dataObj.error || 'Erro no processamento agêntico');
            }
          }
        }
      } else {
        // 2. Fallback Convencional JSON
        const data = await res.json();
        if (data.success) {
          setMessages(prev => [...prev, {
            sender: `${data.provider} (${data.tier || 'Direct'})`,
            text: data.text,
            time: new Date().toLocaleTimeString(),
            toolResults: data.toolResults
          }]);
          loadSessions();
        } else {
          setMessages(prev => [...prev, {
            sender: 'OmniRoute Error',
            text: `Erro na resposta: ${data.error || 'Falha de comunicação'}`,
            time: new Date().toLocaleTimeString()
          }]);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('⏹️ Resposta interrompida pelo usuário.');
      } else {
        setMessages(prev => [...prev, {
          sender: 'OmniRoute Error',
          text: `Falha na requisição: ${err.message}`,
          time: new Date().toLocaleTimeString()
        }]);
      }
    } finally {
      setIsThinking(false);
      setLiveToolSteps([]);
      abortControllerRef.current = null;
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

      {/* Modal de Vinculação de Repositório Local */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0b14] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#1c1c2e] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <h3 className="text-sm font-extrabold text-white">Vincular Repositório Local ao V0id OS</h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Botão Seletor Nativo do Windows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBrowseFolderNative}
                disabled={isBrowsingFolder}
                className="w-full py-2.5 px-3 rounded-xl bg-[#141426] hover:bg-[#1d1d36] text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-amber-950/30"
              >
                <span>📂</span>
                <span>{isBrowsingFolder ? 'Aguardando seleção no Windows...' : 'Explorar Pastas no Computador...'}</span>
              </button>
            </div>

            {/* Sugestões de Pastas Rápidas no PC */}
            {quickPaths.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Pastas e Repositórios Detectados no seu PC:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-[#05050a] rounded-xl border border-[#1a1a2c]">
                  {quickPaths.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLinkPathInput(qp.path);
                        if (!linkNameInput.trim()) setLinkNameInput(qp.name);
                      }}
                      className="text-[10px] bg-[#121222] hover:bg-amber-950/60 text-gray-300 hover:text-amber-300 border border-[#232338] hover:border-amber-500/50 px-2.5 py-1 rounded-lg transition font-mono truncate max-w-[210px] cursor-pointer"
                      title={qp.path}
                    >
                      📁 {qp.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleLinkRepo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Ou Digite / Cole o Caminho da Pasta no Computador:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: C:\MeuJogo ou C:\Projetos\meu-app"
                  value={linkPathInput}
                  onChange={e => setLinkPathInput(e.target.value)}
                  className="w-full bg-[#05050a] border border-[#28283e] focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  O V0id passará a ter acesso total de leitura, busca, edição e execução nesta pasta.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Nome do Projeto (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Space Tide"
                  value={linkNameInput}
                  onChange={e => setLinkNameInput(e.target.value)}
                  className="w-full bg-[#05050a] border border-[#28283e] focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c1c2e]">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/[0.05]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 cursor-pointer"
                >
                  Vincular Repositório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Área Central: Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#040409] overflow-hidden">
        {/* Top Header Bar Antigravity-Grade */}
        <div className="h-14 border-b border-[#181824] px-6 flex items-center justify-between bg-[#07070e] flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <BlackHoleIcon className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-sm font-extrabold text-white shrink-0">Chat Global</span>

            {/* Seletor de Repositório / Workspace Ativo */}
            <div className="flex items-center bg-[#0d0d1a] border border-amber-500/30 rounded-xl px-2.5 py-1">
              <span className="text-[11px] text-amber-400 font-bold mr-1.5 select-none">📁 Repo:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-xs text-amber-200 font-bold outline-none cursor-pointer"
              >
                {projectList.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0c0c16] text-white">
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedProjectId !== 'global' && selectedProjectId !== 'v0id' && (
                <button
                  type="button"
                  onClick={() => handleUnlinkProject(selectedProjectId)}
                  title={`Desvincular o projeto "${currentProjectObj.name}" do V0id OS`}
                  className="ml-1 text-gray-500 hover:text-red-400 text-xs px-1 hover:bg-white/[0.05] rounded transition cursor-pointer"
                >
                  🗑️
                </button>
              )}
            </div>

            {/* Caminho da pasta ativa com botão para abrir no Windows */}
            {currentProjectObj.folderPath && (
              <button
                onClick={handleOpenFolder}
                title={`Abrir pasta no Windows Explorer: ${currentProjectObj.folderPath}`}
                className="text-[11px] bg-[#10101c] hover:bg-amber-950/40 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer max-w-[220px]"
              >
                <span>📂</span>
                <span className="truncate font-mono text-[10px] text-gray-300">{currentProjectObj.folderPath}</span>
              </button>
            )}

            {/* Botão Vincular Pasta Local */}
            <button
              onClick={openLinkModal}
              title="Vincular qualquer pasta local do seu computador como repositório deste chat"
              className="text-[11px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer font-bold whitespace-nowrap"
            >
              <span>+</span>
              <span>Vincular Pasta</span>
            </button>

            <div className="flex items-center ml-1 border border-[#232338] bg-[#0c0c16] rounded-xl overflow-hidden">
              <select
                value={chatMode}
                onChange={e => setChatMode(e.target.value)}
                className="bg-transparent text-xs text-amber-400 font-bold outline-none px-2.5 py-1 cursor-pointer appearance-none"
              >
                <option value="local">Modo Local (OmniRoute - Antigravity)</option>
                <option value="nuvem">Modo Nuvem (Jules - GitHub)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Diffs & Alterações */}
            <button
              onClick={() => setDiffModalOpen(true)}
              title="Inspecionar alterações de código, snapshots e git diff"
              className="text-xs bg-[#121220] hover:bg-[#1c1c32] text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <span>📝</span>
              <span>Diffs</span>
            </button>

            {/* Botão Terminal Integrado */}
            <button
              onClick={() => setTerminalOpen(!terminalOpen)}
              title="Abrir/fechar Terminal Integrado no projeto"
              className={`text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer font-medium ${
                terminalOpen
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/40'
                  : 'bg-[#121220] hover:bg-[#1c1c32] text-gray-200 border border-[#232338]'
              }`}
            >
              <span>💻</span>
              <span>Terminal</span>
            </button>

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
                            {t.result && typeof t.result === 'string' && t.result.includes('[SNAPSHOT:') && (
                              <div className="mt-2 pt-1.5 border-t border-[#222238] flex items-center justify-between">
                                <span className="text-amber-400 font-mono text-[9px]">Ponto de restauração registrado</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const match = (t.result as string).match(/\[SNAPSHOT:([a-zA-Z0-9_]+)\]/);
                                    if (match) handleRollbackSnapshot(match[1]);
                                  }}
                                  className="text-[9px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded cursor-pointer font-bold transition flex items-center gap-1"
                                >
                                  <span>↩️</span>
                                  <span>Reverter Alteração</span>
                                </button>
                              </div>
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

          {/* Antigravity Live Tool Stepper em Tempo Real */}
          {liveToolSteps.length > 0 && (
            <div className="bg-[#0a0a16] border border-amber-500/40 rounded-2xl p-4 shadow-2xl animate-fade-in font-mono text-xs max-w-2xl">
              <div className="flex items-center justify-between text-amber-400 font-bold mb-2 pb-1.5 border-b border-[#1c1c30]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Executando Ferramentas no Sistema ({liveToolSteps.length})
                </span>
                <span className="text-[10px] text-gray-500 font-normal">Padrão Antigravity</span>
              </div>
              <div className="space-y-1.5">
                {liveToolSteps.map((step, sIdx) => {
                  const isRunning = step.status === 'running';
                  const isErr = step.status === 'error';
                  const target = step.args?.filePath || step.args?.path || step.args?.query || step.args?.command || step.args?.prompt || '';
                  return (
                    <div key={sIdx} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-[#05050c] border border-[#161626]">
                      <div className="flex items-center gap-2 truncate">
                        {isRunning ? (
                          <span className="text-amber-400 animate-spin">⚙️</span>
                        ) : isErr ? (
                          <span className="text-rose-400 font-bold">✕</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓</span>
                        )}
                        <span className="text-white font-bold">[{step.tool}]</span>
                        {target && <span className="text-gray-400 truncate max-w-sm font-mono text-[10px]">{String(target).slice(0, 60)}</span>}
                      </div>
                      <span className={`text-[10px] font-bold ${isRunning ? 'text-amber-400 animate-pulse' : isErr ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isRunning ? 'Executando...' : isErr ? 'Falhou' : 'Concluído'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isThinking && liveToolSteps.length === 0 && (
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

        {/* Terminal Integrado Retrátil (Padrão Antigravity) */}
        <IntegratedTerminalDrawer
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          projectId={selectedProjectId}
          projectName={currentProjectObj.name}
          projectPath={currentProjectObj.folderPath}
        />

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
                    {att.type?.startsWith('image/') || (typeof att.content === 'string' && att.content.startsWith('data:image/')) ? (
                      <img src={att.content} alt={att.name} className="w-5 h-5 rounded object-cover border border-amber-500/40" />
                    ) : (
                      <span>📄</span>
                    )}
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

            {/* Input Principal com Suporte a Autocomplete @arquivo */}
            <div
              onPaste={handlePaste}
              className="relative flex items-end gap-2.5 bg-[#0e0e18] border border-[#202032] focus-within:border-amber-500/60 rounded-2xl p-2.5 transition"
            >
              {/* Popover Flutuante de Menções @arquivo (Padrão Antigravity / Cursor) */}
              {mentionQuery !== null && mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 bg-[#0c0c18] border border-amber-500/50 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in font-mono max-h-56 overflow-y-auto">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between border-b border-[#1c1c2e] mb-1">
                    <span>Arquivos do Repositório (@)</span>
                    <span className="text-[9px] text-gray-500 font-sans">Tab / Enter para inserir</span>
                  </div>
                  {mentionSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => insertMention(s.relativePath)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                        idx === mentionIndex
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                          : 'text-gray-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{s.isDir ? '📁' : '📄'}</span>
                        <span className="font-medium truncate">{s.relativePath}</span>
                      </span>
                      <span className="text-[9px] text-gray-500 font-sans ml-2">
                        {s.isDir ? 'pasta' : 'arquivo'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Popover Flutuante de Símbolos AST com # (Padrão Antigravity / Graphify) */}
              {symbolQuery !== null && symbolSuggestions.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 bg-[#0c0c18] border border-amber-500/50 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in font-mono max-h-56 overflow-y-auto">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between border-b border-[#1c1c2e] mb-1">
                    <span>Símbolos AST & Grafo (#)</span>
                    <span className="text-[9px] text-gray-500 font-sans">Tab / Enter para inserir</span>
                  </div>
                  {symbolSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => insertSymbolMention(s.label)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                        idx === symbolIndex
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                          : 'text-gray-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{s.kind === 'class' ? '🔷' : s.kind === 'function' ? '⚡' : '📦'}</span>
                        <span className="font-bold truncate text-white">{s.label}</span>
                        <span className="text-[10px] text-gray-500 truncate">{s.file}</span>
                      </span>
                      <span className="text-[9px] text-amber-400 font-mono ml-2">
                        {s.line || s.kind}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Popover Flutuante de Comandos / (Padrão Antigravity) */}
              {slashQuery !== null && slashSuggestions.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 bg-[#0c0c18] border border-amber-500/50 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in font-mono max-h-56 overflow-y-auto">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between border-b border-[#1c1c2e] mb-1">
                    <span>Comandos de Barra (/)</span>
                    <span className="text-[9px] text-gray-500 font-sans">Tab / Enter para selecionar</span>
                  </div>
                  {slashSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => insertSlashCommand(s.cmd)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                        idx === slashIndex
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                          : 'text-gray-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{s.icon}</span>
                        <span className="font-bold text-amber-300">{s.cmd}</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-sans ml-2 truncate max-w-[170px]">
                        {s.desc}
                      </span>
                    </div>
                  ))}
                </div>
              )}

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

              {/* Textarea auto-expansível com Navegação de Menções @ */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputVal}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onKeyDown={e => {
                  if (mentionQuery !== null && mentionSuggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setMentionIndex(i => (i + 1) % mentionSuggestions.length);
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setMentionIndex(i => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
                      return;
                    }
                    if (e.key === 'Tab' || e.key === 'Enter') {
                      e.preventDefault();
                      insertMention(mentionSuggestions[mentionIndex].relativePath);
                      return;
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setMentionQuery(null);
                      setMentionSuggestions([]);
                      return;
                    }
                  }

                  if (symbolQuery !== null && symbolSuggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSymbolIndex(i => (i + 1) % symbolSuggestions.length);
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSymbolIndex(i => (i - 1 + symbolSuggestions.length) % symbolSuggestions.length);
                      return;
                    }
                    if (e.key === 'Tab' || e.key === 'Enter') {
                      e.preventDefault();
                      insertSymbolMention(symbolSuggestions[symbolIndex].label);
                      return;
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setSymbolQuery(null);
                      setSymbolSuggestions([]);
                      return;
                    }
                  }

                  if (slashQuery !== null && slashSuggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSlashIndex(i => (i + 1) % slashSuggestions.length);
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSlashIndex(i => (i - 1 + slashSuggestions.length) % slashSuggestions.length);
                      return;
                    }
                    if (e.key === 'Tab' || e.key === 'Enter') {
                      e.preventDefault();
                      insertSlashCommand(slashSuggestions[slashIndex].cmd);
                      return;
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setSlashQuery(null);
                      setSlashSuggestions([]);
                      return;
                    }
                  }

                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Pergunte ao V0id, digite @arquivo, /project, /plan, /compact ou cole prints..."
                className="flex-1 bg-transparent text-xs text-gray-100 outline-none resize-none max-h-32 min-h-[28px] py-1 select-text leading-relaxed font-sans"
              />

              {/* Botão Enviar ou Parar (Antigravity Stop) */}
              {isThinking ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/60 animate-pulse"
                  title="Interromper execução da IA (Padrão Antigravity Stop)"
                >
                  <span>⏹️</span>
                  <span>Parar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!inputVal.trim() && attachments.length === 0}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                    !inputVal.trim() && attachments.length === 0
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40'
                  }`}
                >
                  <span>Enviar</span>
                  <span>↵</span>
                </button>
              )}
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

      {/* Modal de Diffs & Snapshots */}
      <VisualDiffModal
        isOpen={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        projectId={selectedProjectId}
        projectName={currentProjectObj.name}
        onRollback={handleRollbackSnapshot}
      />
    </div>
  );
}
