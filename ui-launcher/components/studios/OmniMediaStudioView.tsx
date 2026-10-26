import React, { useState, useRef } from 'react';

export default function OmniMediaStudioView({
  activeProject,
  projectId
}: {
  activeProject: string;
  projectId?: string;
}) {
  const [activeBench, setActiveBench] = useState<'vault' | 'image' | 'audio' | 'video'>('vault');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Bench 1: Vault State
  const [vaultItems, setVaultItems] = useState([
    { id: 'v1', name: 'Seed de Rosto Protagonista', file: 'Hero_Face_IPAdapter.png', type: 'IP-Adapter', status: 'TRAVADO (100% Consistência)' },
    { id: 'v2', name: 'Perfil de Voz Oficial', file: 'minha_voz_narrador.wav', type: 'F5-TTS Clone', status: 'Zero-Shot Match 99.4%' },
    { id: 'v3', name: 'Estilo de Iluminação', file: 'Cinematic_SciFi_Glow.json', type: 'LoRA Style', status: 'Ativo em todas as cenas' }
  ]);

  // Bench 2: Image & 3D State
  const [imagePrompt, setImagePrompt] = useState('');
  const [uncensoredFlux, setUncensoredFlux] = useState(false);
  const [trellis3dMode, setTrellis3dMode] = useState(false);
  const [rmbgAutoCut, setRmbgAutoCut] = useState(true);
  const [generatedAssets, setGeneratedAssets] = useState<any[]>([]);

  // Bench 3: Audio State
  const [audioPrompt, setAudioPrompt] = useState('');
  const [ttsEngine, setTtsEngine] = useState<'f5' | 'kokoro' | 'musicfx'>('f5');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Bench 4: Video Timeline State
  const [timelineScenes, setTimelineScenes] = useState([
    { id: 'sc-1', title: 'Cena 01: O Despertar da Singularidade', duration: '00:30', audio: 'Narrador F5-TTS', visual: 'Render FLUX.1 + LivePortrait' },
    { id: 'sc-2', title: 'Cena 02: A Travessia do Buraco Negro', duration: '00:45', audio: 'Efeitos SFX + Trilha', visual: 'Câmera Espacial Relativística' }
  ]);

  // Chat
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    {
      sender: 'V0id OmniMedia Director',
      text: `Workstation Unificada OmniMedia Studio carregada para [${activeProject}].\nAs 4 bancadas (Cofre de Consistência, Forja de Imagem/3D, Áudio/Voz e Timeline Vídeo) estão integradas e prontas para produção.`,
      time: 'Agora'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) return;
    showToast(`Gerando ativo com ${trellis3dMode ? 'TRELLIS 3D (.glb)' : 'FLUX.1'}${uncensoredFlux ? ' [Modo Sem Censura]' : ''}...`);
    const newAsset = {
      title: imagePrompt,
      type: trellis3dMode ? '3D Mesh (.glb)' : 'Imagem 4K',
      engine: trellis3dMode ? 'TRELLIS ZeroGPU' : (uncensoredFlux ? 'FLUX.1 Abliterated' : 'FLUX.1 Schnell'),
      time: new Date().toLocaleTimeString()
    };
    setGeneratedAssets(prev => [newAsset, ...prev]);
    setImagePrompt('');
  };

  const handleGenerateAudio = () => {
    if (!audioPrompt.trim()) return;
    showToast(`Sintetizando áudio com motor [${ttsEngine.toUpperCase()}]...`);
    setAudioPrompt('');
  };

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
        setMessages(prev => [...prev, {
          sender: 'OmniMedia Engine (120B)',
          text: data.text,
          time: new Date().toLocaleTimeString()
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        sender: 'Erro',
        text: 'Falha no processamento multimodal.',
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#030306]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-amber-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Top Bar com as 4 Bancadas Integradas */}
      <div className="h-14 border-b border-[#1c1c2a] px-6 flex items-center justify-between bg-[#07070e] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <h2 className="text-sm font-extrabold text-white tracking-wide">
            OmniMedia Studio — Workstation Audiovisual Unificada
          </h2>
          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono font-bold">
            {activeProject}
          </span>
        </div>

        {/* Seletor das 4 Bancadas */}
        <div className="bg-[#10101c] p-1 rounded-xl border border-[#222236] flex gap-1">
          {[
            { id: 'vault', label: '🔒 1. Cofre Consistência', icon: '👤' },
            { id: 'image', label: '🎨 2. Forja Imagem & 3D', icon: '🖼️' },
            { id: 'audio', label: '🎙️ 3. Laboratório Áudio', icon: '🔊' },
            { id: 'video', label: '🎞️ 4. Timeline & Vídeo', icon: '🎬' }
          ].map(bench => (
            <button
              key={bench.id}
              onClick={() => setActiveBench(bench.id as any)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                activeBench === bench.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {bench.label}
            </button>
          ))}
        </div>
      </div>

      {/* Área da Bancada Ativa */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Lado Esquerdo/Centro: Conteúdo da Bancada Selecionada */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#040409]">
          {/* BANCADA 1: COFRE DE CONSISTÊNCIA */}
          {activeBench === 'vault' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🔒 Cofre de Consistência Neural (IP-Adapter &amp; Seeds)</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Garante que personagens, vozes clonadas e estilos visuais permaneçam 100% idênticos em todas as imagens, jogos e novelas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vaultItems.map(item => (
                  <div key={item.id} className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono mb-3">{item.file}</p>
                      <div className="h-28 bg-[#06060c] rounded-xl border border-[#181824] flex items-center justify-center text-3xl text-gray-500">
                        {item.type.includes('Voice') ? '🎙️' : '👤'}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#181824] flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-mono">{item.status}</span>
                      <button
                        onClick={() => showToast(`Item ${item.name} configurado como ativo.`)}
                        className="text-[10px] bg-amber-600/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded"
                      >
                        Travar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BANCADA 2: FORJA DE IMAGEM & 3D */}
          {activeBench === 'image' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎨 Forja de Imagem 4K e Modelagem 3D (FLUX.1 / TRELLIS / RMBG-2.0)</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Geração de assets gráficos para jogos, texturas e renders de alta definição com remoção automática de fundo.
                </p>
              </div>

              <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4 space-y-3">
                <textarea
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  placeholder="Descreva o ativo visual (ex: Nave estelar cyberpunk em ângulo isométrico 4K com luz neon dourada)..."
                  rows={3}
                  className="w-full bg-[#06060c] border border-[#202034] rounded-xl p-3 text-xs text-gray-100 outline-none focus:border-amber-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={uncensoredFlux}
                        onChange={e => setUncensoredFlux(e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span>Modo Sem Censura</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={trellis3dMode}
                        onChange={e => setTrellis3dMode(e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span>Gerar 3D Mesh (.glb) TRELLIS</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={rmbgAutoCut}
                        onChange={e => setRmbgAutoCut(e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span>Recorte RMBG-2.0</span>
                    </label>
                  </div>

                  <button
                    onClick={handleGenerateImage}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-lg shadow-amber-950/50"
                  >
                    Gerar Ativo Visual
                  </button>
                </div>
              </div>

              {/* Integração Nativa Blender 3D Suite */}
              <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧊</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Blender 3D Suite e Cutscene Renderer</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">
                        v4.2 LTS Instalado
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Modelagem 3D, texturização PBR, iluminação e render de cutscenes conectado à pasta <code>res://assets/models/</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetch('/api/game?action=blender_action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ actionType: 'open' })
                      });
                      showToast('Inicializando Blender 4.2 no Windows...');
                    }}
                    className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    🎨 Abrir Blender
                  </button>
                  <button
                    onClick={() => {
                      fetch('/api/game?action=blender_action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ actionType: 'run_pipeline' })
                      });
                      showToast('Pipeline Blender 3D disparado via Python!');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-md cursor-pointer"
                  >
                    ⚡ Exportar .GLB Headless
                  </button>
                </div>
              </div>

              {/* Ativos Gerados */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Ativos da Forja</h4>
                {generatedAssets.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Nenhum ativo gerado ainda nesta sessão.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {generatedAssets.map((asset, idx) => (
                      <div key={idx} className="bg-[#090912] border border-[#1a1a26] p-3 rounded-xl text-xs">
                        <p className="font-bold text-white truncate">{asset.title}</p>
                        <p className="text-[10px] text-amber-400 font-mono">{asset.type} • {asset.engine}</p>
                        <p className="text-[9px] text-gray-500 mt-1">{asset.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BANCADA 3: LABORATÓRIO DE ÁUDIO & VOZ */}
          {activeBench === 'audio' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎙️ Laboratório de Áudio, Voz e Trilha (F5-TTS / Kokoro / MusicFX)</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Clonagem instantânea de vozes com entonação dramática, efeitos sonoros e trilhas musicais geradas por IA.
                </p>
              </div>

              <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4 space-y-3">
                <div className="flex gap-2 mb-2">
                  {[
                    { id: 'f5', label: 'Voz Clonada F5-TTS' },
                    { id: 'kokoro', label: 'Kokoro-82M Ultra-Fast' },
                    { id: 'musicfx', label: 'Trilha Sonora MusicFX' }
                  ].map(e => (
                    <button
                      key={e.id}
                      onClick={() => setTtsEngine(e.id as any)}
                      className={`text-xs px-3 py-1 rounded-lg border transition ${
                        ttsEngine === e.id
                          ? 'bg-amber-600 text-white border-amber-500 font-bold'
                          : 'bg-[#090912] text-gray-400 border-[#1c1c28]'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={audioPrompt}
                  onChange={e => setAudioPrompt(e.target.value)}
                  placeholder="Texto para locução ou descrição da trilha sonora (ex: Batida de suspense sci-fi com sintetizador analógico 120bpm)..."
                  rows={3}
                  className="w-full bg-[#06060c] border border-[#202034] rounded-xl p-3 text-xs text-gray-100 outline-none focus:border-amber-500"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                    <span>Áudio de Referência: minha_voz_narrador.wav (OK)</span>
                  </div>
                  <button
                    onClick={handleGenerateAudio}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
                  >
                    Sintetizar Áudio
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BANCADA 4: TIMELINE & VÍDEO MASTER */}
          {activeBench === 'video' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎞️ Timeline e Vídeo Master (LivePortrait / WhisperX / Remotion)</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Montagem sequencial de cenas para novelas verticais, cutscenes de jogos e sincronia labial automática.
                </p>
              </div>

              <div className="space-y-3">
                {timelineScenes.map(sc => (
                  <div key={sc.id} className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">{sc.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({sc.duration})</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Áudio: <strong className="text-amber-400">{sc.audio}</strong> | Visual: <strong className="text-indigo-400">{sc.visual}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showToast(`Reproduzindo preview de ${sc.title}...`)}
                        className="text-xs bg-[#161626] hover:bg-[#202034] text-gray-200 border border-[#2c2c42] px-3 py-1.5 rounded-xl transition"
                      >
                        ▶️ Prévia
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => showToast('Compilando episódio completo com Remotion e legendas WhisperX .ass...')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-purple-950/60"
                >
                  🚀 Renderizar Episódio Master em 60fps
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Chat Construtor Multimodal (w-80) */}
        <div className="w-80 border-l border-[#181824] bg-[#07070e] flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-[#181824] flex items-center justify-between bg-[#0a0a14]">
            <span className="text-xs font-bold text-amber-300">
              🎬 Diretor Multimodal
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">OmniRoute Pool</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'Você' ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-gray-500 mb-0.5">{m.sender}</span>
                <div className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-full ${
                  m.sender === 'Você'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#10101c] border border-[#1e1e30] text-gray-200'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans text-[11px]">{m.text}</pre>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="text-[10px] text-amber-400 animate-pulse">
                Processando modelo multimodal...
              </div>
            )}
          </div>

          <div className="p-2.5 border-t border-[#181824] bg-[#080812]">
            <div className="flex gap-2 bg-[#10101a] border border-[#222234] rounded-xl px-2.5 py-1.5">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Dirija os estúdios multimodais..."
                className="flex-1 bg-transparent text-xs text-gray-100 outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={isThinking}
                className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
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
