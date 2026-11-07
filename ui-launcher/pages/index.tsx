import React, { useState, useEffect, useRef } from 'react';
import StudioView from '../components/StudioView';
import BlackHoleIcon from '../components/icons/BlackHoleIcon';
import V0idLogoBlackHoleBackdrop from '../components/V0idLogoBlackHoleBackdrop';

export interface AppItem {
  id: string;
  name: string;
  category: 'Controle' | 'Infra' | 'Estúdio' | 'Negócios';
  icon: string;
  desc: string;
  status: string;
  glowClass: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  type: string;
  sync_target: string;
  folderExists?: boolean;
  folderPath?: string;
}

const APPS: AppItem[] = [
  // 1. Controle
  {
    id: 'chat',
    name: 'Chat Global',
    category: 'Controle',
    icon: '💬',
    desc: 'Orquestrador Supremo com Pipelines Multi-Estúdio automatizados.',
    status: 'Conectado ao OmniRoute e WebSocket :7777',
    glowClass: 'glow-controle'
  },
  {
    id: 'core',
    name: 'Core Soul',
    category: 'Controle',
    icon: '🧠',
    desc: 'V0id Master Blueprint (V0ID_SPEC.md) e .env com cotas 120B.',
    status: 'Memória de gostos aprendidos [APPROVED_GOLD]',
    glowClass: 'glow-controle'
  },
  {
    id: 'auto-forge',
    name: 'Auto-Forge',
    category: 'Controle',
    icon: '⚡',
    desc: 'Radar de MCPs na web, REA e scanner diário agendado para 06:00 AM.',
    status: '6 ferramentas com score técnico',
    glowClass: 'glow-controle'
  },
  {
    id: 'security',
    name: 'Segurança Sandbox',
    category: 'Controle',
    icon: '🛡️',
    desc: 'Jaula Docker de teste, Semgrep SAST e trava de saque financeiro.',
    status: 'Zero conexões não autorizadas (Lock ativo)',
    glowClass: 'glow-controle'
  },

  // 2. Infra
  {
    id: 'plugins',
    name: 'Plugins MCP',
    category: 'Infra',
    icon: '🔌',
    desc: 'Auditoria de Integrações, consumo de recursos e diagnóstico.',
    status: '6 Servidores MCP Operacionais',
    glowClass: 'glow-infra'
  },
  {
    id: 'rules',
    name: 'Regras do Sistema',
    category: 'Infra',
    icon: '📜',
    desc: 'Gerenciador de modos: Caveman, Sem Censura e Anti-Ghost Write.',
    status: 'Modo Caveman & AST ativos',
    glowClass: 'glow-infra'
  },
  {
    id: 'automations',
    name: 'Automações n8n',
    category: 'Infra',
    icon: '🤖',
    desc: 'Fluxos agendados em background e robôs autônomos 24/7.',
    status: 'Fila de background em espera',
    glowClass: 'glow-infra'
  },
  {
    id: 'repository',
    name: 'Repository Hub',
    category: 'Infra',
    icon: '📦',
    desc: 'Pontes reais com GitHub (código) e armazenamento em nuvem (mídias e assets).',
    status: 'Sincronizador Git + GDrive Ativo',
    glowClass: 'glow-infra'
  },

  // 3. Estúdios & Negócios (OmniMedia unificado + Game Engine)
  {
    id: 'code',
    name: 'Code Studio',
    category: 'Estúdio',
    icon: '💻',
    desc: 'Criador de software com Prompt Improver, editor e terminal.',
    status: 'Ponte agy/Jules e Live Preview',
    glowClass: 'glow-estudio'
  },
  {
    id: 'game',
    name: 'Game Studio Engine',
    category: 'Estúdio',
    icon: '🎮',
    desc: 'Engine completa: Hierarquia, Viewport 2D/3D, Física e Playtest.',
    status: 'Workbench Visual e Inspetor Ativo',
    glowClass: 'glow-estudio'
  },
  {
    id: 'omnimedia',
    name: 'OmniMedia Studio',
    category: 'Estúdio',
    icon: '🎬',
    desc: 'Workstation unificada: Cofre IP-Adapter, FLUX.1, F5-TTS e Vídeo.',
    status: '4 Bancadas Multimodais Prontas',
    glowClass: 'glow-estudio'
  },
  {
    id: 'research',
    name: 'Research Studio',
    category: 'Estúdio',
    icon: '🔬',
    desc: 'Radar de Papers em tempo real com relatórios técnicos e scores.',
    status: 'Sincronizado com Auto-Forge',
    glowClass: 'glow-estudio'
  },
  {
    id: 'marketing',
    name: 'Marketing Agency',
    category: 'Negócios',
    icon: '📢',
    desc: 'Vinculação com Instagram Graph API e gerador de READMEs GitHub.',
    status: 'Calendário de Posts Conectado',
    glowClass: 'glow-negocios'
  },
  {
    id: 'finances',
    name: 'Finanças & Caixa',
    category: 'Negócios',
    icon: '💰',
    desc: 'Fluxo financeiro real (saldo inicial zero) e radar Compras.gov.br.',
    status: 'Clean Slate • Saldo R$ 0,00',
    glowClass: 'glow-negocios'
  }
];

export default function LauncherPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('global');
  const [selectedStudio, setSelectedStudio] = useState<AppItem | null>(null);

  // 3D Orbital Carousel State
  const [rotation, setRotation] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastRotRef = useRef(0);
  const dragDistanceRef = useRef(0);

  // Modal Novo Projeto
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjType, setNewProjType] = useState('git');
  const [newProjLocalPath, setNewProjLocalPath] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Carrega projetos reais do banco SQLite
  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects && data.projects.length > 0) {
        setProjects(data.projects);
        if (!data.projects.some((p: ProjectItem) => p.id === activeProjectId)) {
          setActiveProjectId(data.projects[0].id);
        }
      } else {
        setProjects([]);
        setActiveProjectId('global');
      }
    } catch (e) {
      console.error('Falha ao carregar projetos:', e);
    }
  };

  useEffect(() => {
    loadProjects();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const studioParam = params.get('studio');
      if (studioParam) {
        const found = APPS.find(a => a.id.toLowerCase() === studioParam.toLowerCase());
        if (found) setSelectedStudio(found);
      }
    }
  }, []);

  // Spotlight radial que segue o mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yPercent = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${xPercent}%`);
      document.documentElement.style.setProperty('--mouse-y', `${yPercent}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth Rotation Interpolation (Inertia Damping)
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setRotation(prev => {
        const diff = targetRotation - prev;
        if (Math.abs(diff) < 0.0005) return targetRotation;
        return prev + diff * 0.09;
      });
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [targetRotation]);

  // Keyboard navigation: Left and Right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedStudio) return;
      if (e.key === 'ArrowLeft') {
        setTargetRotation(r => r + (2 * Math.PI) / APPS.length);
      } else if (e.key === 'ArrowRight') {
        setTargetRotation(r => r - (2 * Math.PI) / APPS.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudio]);

  // =========================================================================
  // 60fps 4K Photorealistic Gargantua Black Hole Canvas Renderer
  // Relativistic Doppler beaming, photon ring, and gravitational lensing
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Handle high-DPI (4K / Retina) crispness
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Deep cosmic background stars
    const stars: { x: number; y: number; size: number; baseAlpha: number; phase: number }[] = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.6 + Math.random() * 1.5,
        baseAlpha: 0.2 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Infalling relativistic plasma particles
    const particles: {
      r: number;
      angle: number;
      speed: number;
      size: number;
      color: string;
      trail: number;
    }[] = [];

    const plasmaColors = [
      'rgba(255, 255, 255, 0.95)',
      'rgba(251, 191, 36, 0.95)',
      'rgba(245, 158, 11, 0.9)',
      'rgba(239, 68, 68, 0.85)',
      'rgba(56, 189, 248, 0.9)',
      'rgba(217, 119, 6, 0.8)'
    ];

    for (let i = 0; i < 140; i++) {
      particles.push({
        r: 100 + Math.random() * 320,
        angle: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.018,
        size: 1 + Math.random() * 2.2,
        color: plasmaColors[Math.floor(Math.random() * plasmaColors.length)],
        trail: 0.04 + Math.random() * 0.08
      });
    }

    const render = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      t += 0.016;

      ctx.clearRect(0, 0, w, h);

      // Deep space void background
      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, w, h);

      // Schwarzschild radius (Event Horizon)
      const Rs = Math.min(w, h) * 0.17; // Perfect 4K proportions

      // 1. STARS WITH GRAVITATIONAL DEFLECTION
      for (const s of stars) {
        const sx = s.x * w;
        const sy = s.y * h;
        const dx = sx - cx;
        const dy = sy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Einstein ring gravitational light bending
        let renderX = sx;
        let renderY = sy;
        if (dist > Rs && dist < Rs * 3.8) {
          const deflection = (Rs * Rs) / (dist * 1.8);
          renderX += (dx / dist) * deflection;
          renderY += (dy / dist) * deflection;
        }

        const flicker = Math.sin(t * 1.5 + s.phase) * 0.2;
        const alpha = Math.max(0.1, Math.min(1, s.baseAlpha + flicker));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(renderX, renderY, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. OUTER ATMOSPHERIC GRAVITATIONAL GLOW (NEBULA BLOOM)
      const outerGlow = ctx.createRadialGradient(cx, cy, Rs * 0.8, cx, cy, Rs * 3.6);
      outerGlow.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      outerGlow.addColorStop(0.35, 'rgba(234, 88, 12, 0.12)');
      outerGlow.addColorStop(0.7, 'rgba(126, 34, 206, 0.06)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, Rs * 3.6, 0, Math.PI * 2);
      ctx.fill();

      // 3. SWIRLING RELATIVISTIC PLASMA PARTICLES AROUND THE LOGO SINGULARITY
      for (const p of particles) {
        // Relativistic Keplerian orbital acceleration: faster closer to Rs
        const speedMultiplier = 1 + Math.pow(Rs / Math.max(Rs * 0.9, p.r), 1.3) * 1.8;
        p.angle += p.speed * speedMultiplier;
        p.r -= 0.14; // Gravitational infalling flow

        if (p.r < Rs * 0.9) {
          p.r = Rs * 3.0 + Math.random() * (Rs * 0.8);
        }

        // Tilted orbital plane coordinates
        const px = cx + Math.cos(p.angle) * p.r * 1.48;
        const py = cy + Math.sin(p.angle) * p.r * 0.38 - Math.cos(p.angle) * 8;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Carousel Interactions (Wheel & Drag)
  const handleWheel = (e: React.WheelEvent) => {
    setTargetRotation(r => r + e.deltaY * 0.0022);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastRotRef.current = targetRotation;
    dragDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    dragDistanceRef.current = Math.abs(deltaX);
    setTargetRotation(lastRotRef.current + deltaX * 0.0035);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const spinOrbit = (direction: 'left' | 'right') => {
    const step = (2 * Math.PI) / APPS.length;
    setTargetRotation(r => r + (direction === 'left' ? step : -step));
  };

  // Criação real de projeto
  const handleCreateProject = async () => {
    if (!newProjName.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjName.trim(),
          description: newProjDesc.trim(),
          type: newProjType,
          localPath: newProjType === 'local' ? newProjLocalPath.trim() : ''
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Projeto "${data.project.name}" criado com pastas reais no disco!`);
        setNewProjName('');
        setNewProjDesc('');
        setNewProjectModal(false);
        await loadProjects();
        setActiveProjectId(data.project.id);
      } else {
        showToast(`Erro: ${data.error}`);
      }
    } catch (e: any) {
      showToast(`Erro de conexão: ${e.message}`);
    }
  };

  // Abrir pasta no Windows Explorer
  const handleOpenFolder = async () => {
    try {
      const res = await fetch('/api/projects?action=open_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeProjectId === 'global' ? '' : activeProjectId })
      });
      const data = await res.json();
      showToast(data.message || 'Abrindo pasta no Windows Explorer...');
    } catch (e: any) {
      showToast(`Erro ao abrir pasta: ${e.message}`);
    }
  };

  // Excluir projeto real
  const handleDeleteProject = async () => {
    if (activeProjectId === 'global') return;
    const currentProj = projects.find(p => p.id === activeProjectId);
    if (!confirm(`Deseja realmente excluir o projeto "${currentProj?.name}" e apagar seus arquivos físicos no Windows?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects?id=${activeProjectId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadProjects();
      } else {
        showToast(`Erro: ${data.error}`);
      }
    } catch (e: any) {
      showToast(`Erro: ${e.message}`);
    }
  };

  const activeProjectObj = projects.find(p => p.id === activeProjectId) || {
    id: 'global',
    name: 'Global (Nenhum Projeto Criado)',
    description: 'Ambiente raiz do V0id OS. Crie um projeto no botão + Novo Projeto.',
    type: 'global',
    sync_target: ''
  };

  const handleCardClick = (app: AppItem) => {
    if (dragDistanceRef.current > 6) return;
    setSelectedStudio(app);
  };

  if (selectedStudio) {
    return (
      <StudioView
        activeProject={activeProjectObj.name}
        projectId={activeProjectObj.id}
        studioName={selectedStudio.name}
        appId={selectedStudio.id}
        onBackToLauncher={() => setSelectedStudio(null)}
      />
    );
  }

  // Dimensões orbitais com profundidade real
  const TOTAL_APPS = APPS.length;
  const RADIUS_X = 540;
  const RADIUS_Z = 300;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="h-screen w-screen cyber-mesh-bg text-gray-200 flex flex-col overflow-hidden font-sans select-none relative cursor-grab active:cursor-grabbing"
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-amber-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* =========================================================================
          HEADER SUPERIOR COM ÍCONE OFICIAL DO BURACO NEGRO V0ID
         ========================================================================= */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-white/[0.07] bg-[#05050b]/80 backdrop-blur-xl flex-shrink-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <BlackHoleIcon className="w-7 h-7" />
            <span className="font-extrabold text-base tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400">
              V0ID OS
            </span>
          </div>

          {/* Seletor Global de Projeto (Clean Slate) */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-1.5 shadow-inner backdrop-blur-md">
            <span className="text-xs text-gray-400 font-medium">Projeto:</span>
            <select
              value={activeProjectId}
              onChange={e => {
                if (e.target.value === '__NEW__') {
                  setNewProjectModal(true);
                } else {
                  setActiveProjectId(e.target.value);
                  const p = projects.find(item => item.id === e.target.value);
                  showToast(`Contexto alterado para [${p?.name || e.target.value}]`);
                }
              }}
              className="bg-transparent text-amber-400 font-bold text-xs outline-none cursor-pointer pr-2 max-w-[200px] truncate"
            >
              {projects.length === 0 ? (
                <option value="global" className="bg-[#0e0e1a] text-gray-300">
                  Global (Nenhum Projeto Criado)
                </option>
              ) : (
                projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0e0e1a] text-white">
                    {p.name}
                  </option>
                ))
              )}
              <option value="__NEW__" className="bg-[#18182c] text-amber-300 font-bold">
                + Criar Novo Projeto...
              </option>
            </select>

            <button
              onClick={() => setNewProjectModal(true)}
              className="text-[11px] bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg transition cursor-pointer"
              title="Adicionar novo projeto"
            >
              + Novo
            </button>
          </div>

          {/* Ações no Windows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFolder}
              className="text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-gray-200 border border-white/[0.12] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer hover:border-amber-400/50 shadow-sm"
              title="Abre a pasta do projeto no Windows Explorer"
            >
              <span>📂</span>
              <span>Abrir Pasta</span>
            </button>

            {activeProjectId !== 'global' && (
              <button
                onClick={handleDeleteProject}
                className="text-xs font-semibold bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-700/40 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                title="Exclui o projeto do SQLite e do disco"
              >
                <span>🗑️</span>
              </button>
            )}
          </div>
        </div>

        {/* Status de Infra */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-300 font-medium">OmniRoute Pool: Ativo</span>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-xl text-amber-300 font-mono text-[11px] flex items-center gap-1.5">
            <BlackHoleIcon className="w-3.5 h-3.5" />
            <span>Gargantua Singularity • 14 Apps</span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          CENA PRINCIPAL:
          1. BURACO NEGRO REALISTA 4K NO BACKGROUND (Z-INDEX: 0)
          2. CARROSSEL 3D ORBITAL DIRETAMENTE SOBRE ELE (Z-INDEX: 1)
         ========================================================================= */}
      <main
        className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0"
        style={{ perspective: '1400px' }}
      >
        {/* Canvas de Buraco Negro 4K Realista Centralizado (Z-INDEX: 0) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none blackhole-canvas-bg"
          style={{ zIndex: 0 }}
        />

        {/* O BURACO NEGRO OFICIAL DA LOGO V0ID NO BACKGROUND (Z-INDEX: 0) */}
        <V0idLogoBlackHoleBackdrop />

        {/* Botões Laterais Sutis de Navegação na Órbita */}
        <button
          onClick={e => { e.stopPropagation(); spinOrbit('left'); }}
          className="absolute left-6 w-11 h-11 rounded-2xl bg-[#0e0e18]/80 hover:bg-amber-600/30 border border-white/[0.1] hover:border-amber-400 text-gray-300 hover:text-white flex items-center justify-center text-xl transition backdrop-blur-md shadow-2xl cursor-pointer"
          style={{ zIndex: 20 }}
          title="Girar para a esquerda"
        >
          ‹
        </button>

        <button
          onClick={e => { e.stopPropagation(); spinOrbit('right'); }}
          className="absolute right-6 w-11 h-11 rounded-2xl bg-[#0e0e18]/80 hover:bg-amber-600/30 border border-white/[0.1] hover:border-amber-400 text-gray-300 hover:text-white flex items-center justify-center text-xl transition backdrop-blur-md shadow-2xl cursor-pointer"
          style={{ zIndex: 20 }}
          title="Girar para a direita"
        >
          ›
        </button>

        {/* =======================================================================
            OS 14 CARDS EM ÓRBITA 3D GIRANDO DIRETAMENTE SOBRE O BURACO NEGRO (Z-INDEX: 1)
           ======================================================================= */}
        <div
          className="absolute inset-0 flex items-center justify-center preserve-3d pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {APPS.map((app, idx) => {
            const angle = (idx / TOTAL_APPS) * 2 * Math.PI + rotation;
            const x = Math.sin(angle) * RADIUS_X;
            const z = Math.cos(angle) * RADIUS_Z;
            const y = Math.cos(angle * 2) * 12;

            // Normalized depth: 0 (furthest back) to 1 (frontmost)
            const normZ = (z + RADIUS_Z) / (2 * RADIUS_Z);
            const scale = 0.82 + normZ * 0.32;
            const opacity = 0.85 + normZ * 0.15;

            // Todos os cards orbitam SOBRE o buraco negro (zIndex > 40)
            const cardZIndex = 40 + Math.round(normZ * 60);
            const isFrontCard = normZ > 0.85;

            return (
              <div
                key={app.id}
                onClick={() => handleCardClick(app)}
                style={{
                  transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
                  opacity,
                  zIndex: cardZIndex
                }}
                className={`absolute w-60 h-44 glass-card-3d rounded-2xl p-4 flex flex-col justify-between cursor-pointer pointer-events-auto transition-all duration-150 group ${
                  isFrontCard ? `${app.glowClass} ring-1 ring-amber-400/40 scale-105` : ''
                }`}
              >
                {/* Top: Ícone + Categoria */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#161626] to-black border border-white/[0.1] flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                    {app.icon}
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/[0.08]">
                    {app.category}
                  </span>
                </div>

                {/* Conteúdo: Título limpo + Descrição */}
                <div className="mt-1">
                  <h3 className={`text-xs font-extrabold leading-tight truncate ${
                    isFrontCard ? 'text-white drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-gray-200'
                  }`}>
                    {app.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {app.desc}
                  </p>
                </div>

                {/* Rodapé: Status + Dica de Clique Direto */}
                <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between text-[9px]">
                  <span className="text-amber-400 font-mono font-medium truncate max-w-[140px]">
                    {app.status}
                  </span>
                  <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform font-bold">
                    Entrar →
                  </span>
                </div>

                {/* Highlight Specular */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none rounded-2xl"></div>
              </div>
            );
          })}
        </div>

        {/* Rodapé Indicativo */}
        <div className="absolute bottom-4 z-40 flex items-center gap-3 text-xs text-gray-500 font-mono bg-[#080810]/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/[0.06]">
          <span>🖱️ Roda do Mouse ou Arraste para Girar</span>
          <span>•</span>
          <span>⌨️ Setas ← / →</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">Clique direto em qualquer card para entrar</span>
        </div>
      </main>

      {/* =========================================================================
          MODAL: CRIAR NOVO PROJETO COM TIPO DE SINCRONIZAÇÃO
         ========================================================================= */}
      {newProjectModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-[#0b0b14] border border-[#27273c] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white mb-2 flex items-center gap-2">
              <BlackHoleIcon className="w-5 h-5 text-amber-400" />
              <span>Criar Novo Projeto no V0id OS</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Cria pastas físicas reais no Windows (`src`, `assets`, `vault`, `output`) e registra no SQLite Nexus DB.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Nome do Projeto:
                </label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="ex: Sci-Fi Universe / Space Shooter / SaaS Platform"
                  className="w-full bg-[#050508] border border-[#232334] rounded-xl px-3.5 py-2 text-xs text-gray-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Onde sincronizar este projeto? (Destino de Sincronização):
                </label>
                <select
                  value={newProjType}
                  onChange={e => setNewProjType(e.target.value)}
                  className="w-full bg-[#050508] border border-[#232334] rounded-xl px-3.5 py-2 text-xs text-amber-400 outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="git">🐙 GitHub (Git)</option>
                  <option value="drive">📁 Google Drive</option>
                  <option value="both">🔄 Ambos (GitHub + Google Drive)</option>
                  <option value="local">💾 Apenas Local (Sem Nuvem)</option>
                </select>
              </div>

              {newProjType === 'local' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Caminho Local (opcional, ex: C:\Projetos\MeuRepo):
                  </label>
                  <input
                    type="text"
                    value={newProjLocalPath}
                    onChange={e => setNewProjLocalPath(e.target.value)}
                    placeholder="Deixe em branco para usar o padrão c:\V0id\projetos\"
                    className="w-full bg-[#050508] border border-[#232334] rounded-xl px-3.5 py-2 text-xs text-gray-100 outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Descrição (opcional):
                </label>
                <input
                  type="text"
                  value={newProjDesc}
                  onChange={e => setNewProjDesc(e.target.value)}
                  placeholder="ex: Projeto forjado no OmniMedia e Game Studio"
                  className="w-full bg-[#050508] border border-[#232334] rounded-xl px-3.5 py-2 text-xs text-gray-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setNewProjectModal(false)}
                className="bg-transparent hover:bg-[#161622] text-gray-400 text-xs px-4 py-2 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProject}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-amber-950/50"
              >
                Criar Pastas e Ativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
