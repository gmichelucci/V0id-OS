import React, { useState, useRef, useEffect } from 'react';

interface GameObject {
  id: string;
  name: string;
  type: 'Player' | 'Camera' | 'Light' | 'Physics' | 'Tilemap' | 'Enemy' | 'Audio';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  hasCollider: boolean;
  isRigidBody: boolean;
}

const DEFAULT_OBJECTS: GameObject[] = [
  { id: 'obj-cam', name: 'MainCamera', type: 'Camera', x: 0, y: 0, rotation: 0, scale: 1, hasCollider: false, isRigidBody: false },
  { id: 'obj-phys', name: 'PhysicsWorld2D', type: 'Physics', x: 0, y: 0, rotation: 0, scale: 1, hasCollider: false, isRigidBody: false },
  { id: 'obj-player', name: 'PlayerController', type: 'Player', x: 120, y: 160, rotation: 0, scale: 1.2, hasCollider: true, isRigidBody: true },
  { id: 'obj-tile', name: 'TilemapGrid', type: 'Tilemap', x: 0, y: 280, rotation: 0, scale: 1, hasCollider: true, isRigidBody: false },
  { id: 'obj-spawner', name: 'EnemySpawner', type: 'Enemy', x: 380, y: 140, rotation: 0, scale: 1, hasCollider: true, isRigidBody: true }
];

export default function GameStudioEngineView({
  activeProject,
  projectId
}: {
  activeProject: string;
  projectId?: string;
}) {
  const [objects, setObjects] = useState<GameObject[]>(DEFAULT_OBJECTS);
  const [selectedObjId, setSelectedObjId] = useState<string>('obj-player');
  const [activeTab, setActiveTab] = useState<'viewport' | 'v0id-engine' | 'blender' | 'rea' | 'physics' | 'playtest'>('viewport');
  const [isPlaying, setIsPlaying] = useState(false);

  // V0id Game Engine State
  const [isScaffolding, setIsScaffolding] = useState<boolean>(false);
  const [engineFiles, setEngineFiles] = useState<string[]>([]);

  // Blender 3D Pipeline State
  const [blenderInstalled, setBlenderInstalled] = useState<boolean>(false);
  const [blenderPath, setBlenderPath] = useState<string>('');
  const [blenderCustomPath, setBlenderCustomPath] = useState<string>('');
  const [isBlenderRunning, setIsBlenderRunning] = useState<boolean>(false);
  const [blenderOutput, setBlenderOutput] = useState<string>('Aguardando execução do pipeline Blender 3D...');

  // REA (Reverse Engineer Anything by morluto) State
  const [reaVersion, setReaVersion] = useState<string>('6.8.0');
  const [reaAvailable, setReaAvailable] = useState<boolean>(true);
  const [reaCommand, setReaCommand] = useState<string>('analyze');
  const [reaTarget, setReaTarget] = useState<string>('project.godot');
  const [reaOutput, setReaOutput] = useState<string>('Aguardando comando REA... Digite o alvo e clique em "Disparar Engenharia Reversa".');
  const [isReaRunning, setIsReaRunning] = useState<boolean>(false);

  // Engine Architecture Selector
  const [engineBackend, setEngineBackend] = useState<'godot4' | 'babylon' | 'canvas'>('godot4');

  // Playtest player state in canvas
  const [playerPos, setPlayerPos] = useState({ x: 120, y: 160, vx: 0, vy: 0 });
  const [gravity, setGravity] = useState(9.8);
  const [friction, setFriction] = useState(0.85);

  // Check Game Engine & Blender status on mount
  useEffect(() => {
    fetch('/api/game?action=status')
      .then(r => r.json())
      .then(data => {
        if (data.blender) {
          setBlenderInstalled(data.blender.installed);
          setBlenderPath(data.blender.path);
        }
      })
      .catch(() => {});

    fetch('/api/rea?action=status')
      .then(r => r.json())
      .then(data => {
        if (data.available) {
          setReaAvailable(true);
          setReaVersion(data.version || '6.8.0');
        }
      })
      .catch(() => {});
  }, []);

  const handleRunRea = async () => {
    setIsReaRunning(true);
    setReaOutput(`[REA AGENT CORE] Iniciando ${reaCommand} em "${reaTarget}" via morluto/rea...`);
    try {
      const res = await fetch('/api/rea?action=analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath: reaTarget, command: reaCommand })
      });
      const data = await res.json();
      setReaOutput(data.output || 'Operação finalizada sem logs.');
      showToast('Engenharia reversa REA concluída!');
    } catch (e: any) {
      setReaOutput(`[ERRO REA] Falha na execução: ${e.message}`);
    } finally {
      setIsReaRunning(false);
    }
  };

  const handleScaffoldV0idEngine = async () => {
    setIsScaffolding(true);
    try {
      const res = await fetch('/api/game?action=scaffold_engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectName: activeProject })
      });
      const data = await res.json();
      if (data.success) {
        setEngineFiles(data.files || []);
        showToast('🚀 V0id Game Engine gerada com sucesso no disco!');
      } else {
        showToast(`Erro: ${data.error}`);
      }
    } catch (e: any) {
      showToast(`Erro de rede: ${e.message}`);
    } finally {
      setIsScaffolding(false);
    }
  };

  const handleBlenderAction = async (actionType: 'open' | 'run_pipeline') => {
    setIsBlenderRunning(true);
    try {
      const res = await fetch('/api/game?action=blender_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, customPath: blenderCustomPath || blenderPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Comando Blender executado com sucesso.');
        if (data.output) setBlenderOutput(data.output);
      } else {
        showToast(`Aviso Blender: ${data.error}`);
        setBlenderOutput(`[ERRO] ${data.error}`);
      }
    } catch (e: any) {
      showToast(`Erro ao disparar Blender: ${e.message}`);
    } finally {
      setIsBlenderRunning(false);
    }
  };

  // Game Design Chat
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    {
      sender: 'V0id Game Engine Core',
      text: `Game Studio Workbench inicializado para [${activeProject}].\nMotor visual 2D/3D pronto. Adicione entidades na hierarquia ou comande mecânicas pelo chat.`,
      time: 'Agora'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const selectedObj = objects.find(o => o.id === selectedObjId) || objects[0];

  const handleAddObject = () => {
    const newId = `obj-${Date.now().toString().slice(-4)}`;
    const newObj: GameObject = {
      id: newId,
      name: `Entity_${objects.length + 1}`,
      type: 'Enemy',
      x: 200,
      y: 150,
      rotation: 0,
      scale: 1,
      hasCollider: true,
      isRigidBody: true
    };
    setObjects(prev => [...prev, newObj]);
    setSelectedObjId(newId);
    showToast(`Novo objeto [${newObj.name}] adicionado à cena.`);
  };

  const handleDeleteObject = (id: string) => {
    if (objects.length <= 1) return;
    setObjects(prev => prev.filter(o => o.id !== id));
    setSelectedObjId(objects[0].id);
    showToast('Objeto removido da cena.');
  };

  const updateSelectedProp = (key: keyof GameObject, val: any) => {
    setObjects(prev => prev.map(o => o.id === selectedObjId ? { ...o, [key]: val } : o));
  };

  // Canvas Viewport & Playtest Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Grid Background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. Render Objects or Playtest
      if (activeTab === 'playtest') {
        // Floor
        ctx.fillStyle = '#1e1e30';
        ctx.fillRect(0, 320, canvas.width, 80);

        // Player physics
        ctx.fillStyle = '#6366f1';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#6366f1';
        ctx.beginPath();
        ctx.arc(playerPos.x, playerPos.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText('PLAYER (Use Setas / WASD)', playerPos.x - 45, playerPos.y - 25);
      } else {
        // Viewport Objects render
        for (const obj of objects) {
          const isSelected = obj.id === selectedObjId;
          ctx.save();
          ctx.translate(obj.x, obj.y);
          ctx.rotate((obj.rotation * Math.PI) / 180);
          ctx.scale(obj.scale, obj.scale);

          // Box
          ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)';
          ctx.strokeStyle = isSelected ? '#818cf8' : '#475569';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.fillRect(-20, -20, 40, 40);
          ctx.strokeRect(-20, -20, 40, 40);

          // Icon / Text
          ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(obj.type === 'Player' ? '🚀' : obj.type === 'Camera' ? '🎥' : '📦', 0, 4);
          ctx.font = '9px monospace';
          ctx.fillText(obj.name, 0, 32);

          // Collider Gizmo
          if (obj.hasCollider) {
            ctx.strokeStyle = '#10b981';
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(-24, -24, 48, 48);
            ctx.setLineDash([]);
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [objects, selectedObjId, activeTab, playerPos]);

  // Keyboard controls in playtest
  useEffect(() => {
    if (activeTab !== 'playtest') return;
    const handleKey = (e: KeyboardEvent) => {
      setPlayerPos(p => {
        let nx = p.x;
        let ny = p.y;
        if (e.key === 'ArrowRight' || e.key === 'd') nx = Math.min(580, p.x + 12);
        if (e.key === 'ArrowLeft' || e.key === 'a') nx = Math.max(20, p.x - 12);
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') ny = Math.max(50, p.y - 18);
        if (e.key === 'ArrowDown' || e.key === 's') ny = Math.min(300, p.y + 12);
        return { ...p, x: nx, y: ny };
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab]);

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
        body: JSON.stringify({ message: `[GAME ENGINE ASSISTANT] ${userMsg}`, project: activeProject })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          sender: 'V0id Game Engine (120B)',
          text: data.text,
          time: new Date().toLocaleTimeString()
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        sender: 'Erro',
        text: 'Falha ao processar script de jogo.',
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#030306]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header da Engine */}
      <div className="h-14 border-b border-[#1c1c2a] px-6 flex items-center justify-between bg-[#07070e] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎮</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                V0id Game Engine Studio
              </h2>
              <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                Godot 4 Core Architecture (MIT)
              </span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
                REA v{reaVersion} Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Seletor de Arquitetura & Abas */}
        <div className="flex items-center gap-3">
          <select
            value={engineBackend}
            onChange={e => setEngineBackend(e.target.value as any)}
            className="bg-[#121220] border border-[#27273c] text-indigo-300 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer font-semibold"
          >
            <option value="godot4">Godot 4.3 WebAssembly / Native (MIT)</option>
            <option value="babylon">Babylon.js 7 + Havok Physics (WebGPU)</option>
            <option value="canvas">V0id 2D/3D Canvas Engine (60fps)</option>
          </select>

          {/* Abas da Workbench */}
          <div className="bg-[#10101c] p-1 rounded-xl border border-[#222236] flex gap-1">
            {[
              { id: 'viewport', label: '🎨 Viewport 2D/3D' },
              { id: 'v0id-engine', label: '🌑 V0id Game Engine (C++)' },
              { id: 'blender', label: '🧊 Blender 3D Pipeline' },
              { id: 'rea', label: '🔬 REA Reverse Lab' },
              { id: 'physics', label: '⚡ Física & Colisão' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Colunas: Hierarquia de Cena | Viewport Visual | Inspetor & Assets */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Coluna 1: Hierarquia de Cena (w-64) */}
        <div className="w-64 border-r border-[#181824] bg-[#05050a] p-3 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#181824]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Hierarquia de Cena
            </span>
            <button
              onClick={handleAddObject}
              className="text-xs bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded hover:bg-indigo-600/50"
              title="Adicionar Entidade"
            >
              + Objeto
            </button>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto">
            {objects.map(obj => (
              <div
                key={obj.id}
                onClick={() => setSelectedObjId(obj.id)}
                className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                  selectedObjId === obj.id
                    ? 'bg-indigo-950/60 text-white border border-indigo-500/50'
                    : 'text-gray-400 hover:bg-[#0f0f1c] hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span>{obj.type === 'Player' ? '🚀' : obj.type === 'Camera' ? '🎥' : '📦'}</span>
                  <span className="truncate font-mono text-[11px]">{obj.name}</span>
                </div>
                {objects.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteObject(obj.id); }}
                    className="text-gray-500 hover:text-red-400 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Viewport Visual da Engine OU V0id Engine OU Blender OU REA Lab */}
        <div className="flex-1 flex flex-col bg-[#020205] overflow-hidden relative items-center justify-center p-4">
          {/* TAB 1 & 5: VIEWPORT / FÍSICA */}
          {(activeTab === 'viewport' || activeTab === 'physics') && (
            <div className="w-full max-w-[640px] h-[400px] border border-[#202034] rounded-2xl overflow-hidden shadow-2xl relative bg-[#04040a]">
              <canvas
                ref={canvasRef}
                width={640}
                height={400}
                className="w-full h-full block cursor-crosshair"
              />

              <div className="absolute top-3 left-3 bg-[#0a0a14]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/[0.1] text-[10px] text-gray-300 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Viewport 60fps • Setas / WASD para mover o Player</span>
              </div>
            </div>
          )}

          {/* TAB 2: V0ID GAME ENGINE (GODOT 4 CORE + C++ NATIVO) */}
          {activeTab === 'v0id-engine' && (
            <div className="w-full max-w-3xl h-[490px] bg-[#070712] border border-[#1e1e36] rounded-2xl p-5 flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#181828]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌑</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>V0id Game Engine — Arquitetura de Máxima Velocidade</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
                        C++ Nativo / Vulkan
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Núcleo Godot 4 Core (MIT), arquivos 100% editáveis no disco (.tscn, .gd, .cpp) e identidade visual V0id OS.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleScaffoldV0idEngine}
                  disabled={isScaffolding}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-950/60 cursor-pointer flex items-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>{isScaffolding ? 'Gerando no Disco...' : 'Gerar V0id Game Engine no Disco'}</span>
                </button>
              </div>

              {/* Destaques de Arquitetura */}
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <div className="bg-[#0b0b16] p-2.5 rounded-xl border border-[#1c1c30]">
                  <span className="text-[10px] text-amber-400 font-bold block mb-0.5">🎨 Tela de Carregamento & Ícone</span>
                  <p className="text-[11px] text-gray-300">Boot Splash oficial com o Buraco Negro 4K e ícone .ico do V0id no Windows.</p>
                </div>
                <div className="bg-[#0b0b16] p-2.5 rounded-xl border border-[#1c1c30]">
                  <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">⚡ Linguagem Mais Rápida</span>
                  <p className="text-[11px] text-gray-300">C++ GDExtension em código de máquina: zero GC, latência mínima e máximo FPS.</p>
                </div>
                <div className="bg-[#0b0b16] p-2.5 rounded-xl border border-[#1c1c30]">
                  <span className="text-[10px] text-cyan-400 font-bold block mb-0.5">📄 100% Editável em Texto</span>
                  <p className="text-[11px] text-gray-300">Cenas (.tscn) e scripts (.gd/.cpp) em texto puro, fáceis de editar no VSCode ou IA.</p>
                </div>
              </div>

              {/* Previews de Arquivos no Disco */}
              <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden text-xs font-mono">
                {/* project.godot */}
                <div className="flex flex-col bg-[#030308] border border-[#181824] rounded-xl p-2.5 overflow-hidden">
                  <span className="text-[10px] text-amber-400 font-bold mb-1.5 pb-1 border-b border-[#181824]">
                    📄 project.godot (Config)
                  </span>
                  <pre className="flex-1 overflow-y-auto text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap">
{`config_version=5
[application]
config/name="${activeProject}"
boot_splash/image="res://assets/v0id_icon.svg"
boot_splash/fullsize=true
config/icon="res://assets/v0id_icon.svg"`}
                  </pre>
                </div>

                {/* scenes/main.tscn */}
                <div className="flex flex-col bg-[#030308] border border-[#181824] rounded-xl p-2.5 overflow-hidden">
                  <span className="text-[10px] text-cyan-400 font-bold mb-1.5 pb-1 border-b border-[#181824]">
                    🎬 scenes/main.tscn (Cena)
                  </span>
                  <pre className="flex-1 overflow-y-auto text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap">
{`[node name="World" type="Node2D"]
script = ExtResource("1_main")
[node name="V0idSingularity" type="Marker2D"]
[node name="PlayerController" type="CharacterBody2D"]
[node name="Camera2D" type="Camera2D"]`}
                  </pre>
                </div>

                {/* src_cpp/v0id_engine.cpp */}
                <div className="flex flex-col bg-[#030308] border border-[#181824] rounded-xl p-2.5 overflow-hidden">
                  <span className="text-[10px] text-emerald-400 font-bold mb-1.5 pb-1 border-b border-[#181824]">
                    ⚡ src_cpp/v0id_engine.cpp
                  </span>
                  <pre className="flex-1 overflow-y-auto text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap">
{`// C++ GDExtension Loop
void V0idHighSpeedController::_physics_process(double delta) {
    // Código de máquina nativo x86_64
    // Zero Garbage Collector
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BLENDER 3D PIPELINE */}
          {activeTab === 'blender' && (
            <div className="w-full max-w-3xl h-[490px] bg-[#070712] border border-[#1e1e36] rounded-2xl p-5 flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#181828]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧊</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Blender 3D Pipeline — Fábrica de Assets para a V0id Engine</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
                        100% Gratuito (GPL)
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Modelagem 3D, personagens, cenários e conversão automática para formato .glb otimizado para jogos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBlenderAction('open')}
                    disabled={isBlenderRunning}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-lg shadow-amber-950/60 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🎨</span>
                    <span>Abrir Blender no PC</span>
                  </button>
                  <button
                    onClick={() => handleBlenderAction('run_pipeline')}
                    disabled={isBlenderRunning}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-lg shadow-indigo-950/60 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Executar Pipeline Headless</span>
                  </button>
                </div>
              </div>

              {/* 3 Cartões de Informação: Onde fica? É gratuito? Como funciona? */}
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <div className="bg-[#0b0b16] p-2.5 rounded-xl border border-[#1c1c30]">
                  <span className="text-[10px] text-amber-400 font-bold block mb-0.5">💰 Blender é Gratuito?</span>
                  <p className="text-[11px] text-gray-300">Sim! 100% livre e Open Source sob a licença GNU GPL v2+. Zero royalties e sem assinaturas.</p>
                </div>
                <div className="bg-[#0b0b16] p-2.5 rounded-xl border border-[#1c1c30]">
                  <span className="text-[10px] text-indigo-400 font-bold block mb-0.5">📂 Onde Colocamos?</span>
                  <p className="text-[11px] text-gray-300">Conectado na pasta <code>res://assets/models/</code> da Engine e no cofre 3D do OmniMedia.</p>
                </div>
                <div className="bg-[#0b0b16] p-2.5 rounded-xl border border-[#1c1c30]">
                  <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">🤖 Como Funciona?</span>
                  <p className="text-[11px] text-gray-300">Modo visual manual (GUI) ou modo autônomo via Python (Headless) convertendo modelos em segundo plano.</p>
                </div>
              </div>

              {/* Status do Blender e Configuração de Caminho */}
              <div className="bg-[#05050c] border border-[#1b1b2a] rounded-xl p-3 mb-3 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-[11px]">Status da Instalação:</span>
                    {blenderInstalled ? (
                      <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ Localizado no Windows</span>
                    ) : (
                      <span className="text-amber-400 font-mono text-[11px]">Não detectado no caminho padrão</span>
                    )}
                  </div>
                  <span className="text-gray-500 font-mono text-[10px]">Instalação rápida: winget install BlenderFoundation.Blender</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">Caminho do blender.exe:</span>
                  <input
                    type="text"
                    value={blenderCustomPath || blenderPath}
                    onChange={e => setBlenderCustomPath(e.target.value)}
                    placeholder="ex: C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"
                    className="flex-1 bg-[#020205] border border-[#1c1c28] rounded-lg px-2.5 py-1 text-xs text-gray-200 font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Console de Saída do Pipeline Headless do Blender */}
              <div className="flex-1 bg-[#020204] border border-[#191928] rounded-xl p-3 overflow-y-auto font-mono text-[11px] text-cyan-300 shadow-inner leading-relaxed">
                <div className="text-gray-500 mb-1 pb-1 border-b border-[#11111c] flex items-center justify-between text-[10px]">
                  <span>Blender Python Stdio Console</span>
                  <span>{isBlenderRunning ? 'Status: PROCESSANDO...' : 'Status: PRONTO'}</span>
                </div>
                <pre className="whitespace-pre-wrap">{blenderOutput}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: REA REVERSE ENGINEERING LAB (morluto/rea) */}
          {activeTab === 'rea' && (
            <div className="w-full max-w-3xl h-[490px] bg-[#070712] border border-[#1e1e36] rounded-2xl p-5 flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#181828]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔬</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-white">
                        REA — Reverse Engineer Anything
                      </h3>
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">
                        morluto/rea v{reaVersion}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Conecta Ghidra, Cutter, Rizin e descompiladores WASM ao agente para analisar binários e pacotes de jogos.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunRea}
                  disabled={isReaRunning}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-amber-950/60 cursor-pointer"
                >
                  {isReaRunning ? 'Executando Análise...' : '⚡ Disparar Engenharia Reversa'}
                </button>
              </div>

              {/* Controles de Entrada */}
              <div className="grid grid-cols-12 gap-2 mb-3">
                <div className="col-span-4">
                  <label className="text-[10px] text-gray-400 block mb-1">Comando REA:</label>
                  <select
                    value={reaCommand}
                    onChange={e => setReaCommand(e.target.value)}
                    className="w-full bg-[#030308] border border-[#1e1e30] rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono outline-none"
                  >
                    <option value="analyze">rea analyze (Visão Geral)</option>
                    <option value="capabilities">rea capabilities (Provedores)</option>
                    <option value="decompile">rea decompile (Descompilar)</option>
                    <option value="compare-wasm-interfaces">rea compare-wasm (WASM)</option>
                    <option value="recover-javascript-sources">rea recover-js (Sources)</option>
                  </select>
                </div>

                <div className="col-span-8">
                  <label className="text-[10px] text-gray-400 block mb-1">Alvo (Arquivo / Pacote / PCK):</label>
                  <input
                    type="text"
                    value={reaTarget}
                    onChange={e => setReaTarget(e.target.value)}
                    placeholder="ex: project.godot ou game.pck ou target.wasm"
                    className="w-full bg-[#030308] border border-[#1e1e30] rounded-xl px-2.5 py-1.5 text-xs text-gray-200 font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Terminal REA Console Output */}
              <div className="flex-1 bg-[#020204] border border-[#191928] rounded-xl p-3 overflow-y-auto font-mono text-[11px] text-emerald-400 shadow-inner leading-relaxed">
                <div className="text-gray-500 mb-1 pb-1 border-b border-[#11111c] flex items-center justify-between text-[10px]">
                  <span>REA Stdio Console</span>
                  <span>{isReaRunning ? 'Status: PROCESSANDO...' : 'Status: PRONTO'}</span>
                </div>
                <pre className="whitespace-pre-wrap">{reaOutput}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Coluna 3: Inspetor de Propriedades + Assets + Chat Game Design (w-80) */}
        <div className="w-80 border-l border-[#181824] bg-[#05050a] flex flex-col overflow-y-auto flex-shrink-0 p-4 space-y-4">
          {/* Inspetor */}
          <div className="bg-[#0a0a14] border border-[#1c1c2a] rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3 flex items-center justify-between">
              <span>Inspetor: {selectedObj.name}</span>
              <span className="text-[10px] text-gray-500 font-mono">{selectedObj.type}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Posição (X, Y):</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={selectedObj.x}
                    onChange={e => updateSelectedProp('x', Number(e.target.value))}
                    className="bg-[#050508] border border-[#202030] rounded-lg px-2 py-1 text-gray-200 font-mono"
                  />
                  <input
                    type="number"
                    value={selectedObj.y}
                    onChange={e => updateSelectedProp('y', Number(e.target.value))}
                    className="bg-[#050508] border border-[#202030] rounded-lg px-2 py-1 text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Escala / Rotação:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={selectedObj.scale}
                    onChange={e => updateSelectedProp('scale', Number(e.target.value))}
                    className="bg-[#050508] border border-[#202030] rounded-lg px-2 py-1 text-gray-200 font-mono"
                  />
                  <input
                    type="number"
                    value={selectedObj.rotation}
                    onChange={e => updateSelectedProp('rotation', Number(e.target.value))}
                    className="bg-[#050508] border border-[#202030] rounded-lg px-2 py-1 text-gray-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#181824] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-[11px]">
                  <input
                    type="checkbox"
                    checked={selectedObj.hasCollider}
                    onChange={e => updateSelectedProp('hasCollider', e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span>BoxCollider2D (Verde)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-[11px]">
                  <input
                    type="checkbox"
                    checked={selectedObj.isRigidBody}
                    onChange={e => updateSelectedProp('isRigidBody', e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span>RigidBody2D (Gravidade)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Ativos Integrados do OmniMedia Studio */}
          <div className="bg-[#0a0a14] border border-[#1c1c2a] rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center justify-between">
              <span>Ativos OmniMedia</span>
              <span className="text-[10px] text-gray-400 font-mono">Prontos</span>
            </h3>
            <div className="space-y-1.5 text-xs text-gray-300">
              <div className="bg-[#050508] p-2 rounded-lg border border-[#181824] flex items-center justify-between">
                <span>🚀 Spritesheet_Hero.png</span>
                <span className="text-[10px] text-emerald-400">FLUX.1</span>
              </div>
              <div className="bg-[#050508] p-2 rounded-lg border border-[#181824] flex items-center justify-between">
                <span>🔊 SFX_Laser_Shot.wav</span>
                <span className="text-[10px] text-amber-400">MusicFX</span>
              </div>
            </div>
          </div>

          {/* Chat Game Design */}
          <div className="bg-[#0a0a14] border border-[#1c1c2a] rounded-2xl p-4 flex-1 flex flex-col min-h-[180px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
              🤖 Game Design AI
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-2 text-xs">
              {messages.map((m, idx) => (
                <div key={idx} className="bg-[#06060c] p-2 rounded-lg border border-[#181824]">
                  <p className="text-[9px] text-gray-500">{m.sender}</p>
                  <p className="text-gray-300 text-[11px] leading-snug">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Comande mecânicas de física..."
                className="flex-1 bg-[#050508] border border-[#202030] rounded-xl px-2.5 py-1.5 text-xs text-gray-200 outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold"
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
