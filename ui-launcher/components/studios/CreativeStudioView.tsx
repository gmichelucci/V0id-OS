import React, { useState, useRef, useEffect } from 'react';

export default function CreativeStudioView({
  activeProject,
  studioName = 'Film Studio'
}: {
  activeProject: string;
  studioName?: string;
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Chat
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    {
      sender: 'V0id Media Director',
      text: `Suite Criativa [${studioName}] ativa para [${activeProject}].\nCofre de Consistência Neural travado: Rostos IP-Adapter e Voz F5-TTS prontos para produção.`,
      time: 'Agora'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const episodes = [
    { num: 'Ep. 01', title: 'O Despertar da Frota V0id', status: 'Áudio & Legendas .ass Prontos', duration: '01:45' },
    { num: 'Ep. 02', title: 'A Queda do Satélite Zumbi', status: 'Roteiro Aprovado', duration: '02:10' },
    { num: 'Ep. 03', title: 'O Código da Singularidade', status: 'Em Produção', duration: '01:50' }
  ];

  const galleryItems = [
    { title: 'Nave Sci-Fi Principal', file: 'Ship_Tide_V1.glb', type: '3D Mesh', icon: '🚀' },
    { title: 'Cutscene Intro Sci-Fi', file: 'Cutscene_Intro.mp4', type: 'Vídeo 60fps', icon: '🎬' },
    { title: 'Hero Commander Face', file: 'Hero_Face_IPAdapter.png', type: 'IP-Adapter Seed', icon: '👤' },
    { title: 'Narração Oficial', file: 'minha_voz_narrador.wav', type: 'F5-TTS Voice', icon: '🎙️' }
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
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
          sender: 'V0id Media Director (Cerebras 120B)',
          text: data.text,
          time: new Date().toLocaleTimeString()
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        sender: 'Erro',
        text: 'Falha na geração criativa.',
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

      {/* Header */}
      <div className="h-14 border-b border-[#1c1c2a] px-6 flex items-center justify-between bg-[#080810] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <h2 className="text-sm font-extrabold text-white tracking-wide">
            {studioName} — Suite de Produção Audiovisual & Novelas
          </h2>
          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
            {activeProject}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Renderização em lote de cutscenes iniciada em background.')}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-1.5 rounded-xl transition shadow-lg shadow-purple-950/40"
          >
            🎥 Renderizar Episódio Completo
          </button>
        </div>
      </div>

      {/* Corpo em 3 Colunas: Mídia/Cofre | Chat de Direção | Painel de Consistência */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Coluna 1: Galeria Google Flow + Timeline de Episódios (w-80) */}
        <div className="w-80 border-r border-[#181824] bg-[#07070d] p-4 flex flex-col overflow-y-auto flex-shrink-0">
          {/* Timeline de Episódios */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
              <span>🎞️ Timeline da Novela</span>
              <span className="text-[10px] text-purple-400 font-mono">WhisperX .ass</span>
            </h3>
            <div className="space-y-2">
              {episodes.map((ep, idx) => (
                <div
                  key={idx}
                  onClick={() => showToast(`Carregando roteiro e timeline de ${ep.title}...`)}
                  className="bg-[#0f0f18] hover:bg-[#151524] p-3 rounded-xl border border-[#1e1e2d] transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{ep.num}: {ep.title}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{ep.duration}</span>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-mono">{ep.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Galeria Google Flow */}
          <div className="flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
              <span>🌊 Galeria Google Flow</span>
              <span className="text-[10px] text-indigo-400 font-mono">ZeroGPU</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {galleryItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => showToast(`Visualizando ${item.file}...`)}
                  className="bg-[#0f0f18] hover:bg-[#141422] p-2.5 rounded-xl border border-[#1e1e2d] transition cursor-pointer flex flex-col items-center text-center"
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <p className="text-[11px] font-bold text-gray-200 truncate w-full">{item.title}</p>
                  <p className="text-[9px] text-gray-500 truncate w-full font-mono">{item.file}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna 2: Chat de Direção Criativa */}
        <div className="flex-1 flex flex-col bg-[#040408] overflow-hidden">
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'Você' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 mb-1">{m.sender} • {m.time}</span>
                <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-2xl shadow-lg ${
                  m.sender === 'Você'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-[#0e0e18] border border-[#1c1c2a] text-gray-200 rounded-bl-none'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="text-xs text-purple-400 animate-pulse">
                Gerando cutscene e sintetizando áudio F5-TTS...
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#080810] border-t border-[#181824] flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[#11111c] border border-[#232338] rounded-2xl px-4 py-2.5">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Dirija a cena (ex: crie diálogo tenso com voz de suspense e plano de câmera cinematográfico)..."
                className="flex-1 bg-transparent text-xs text-gray-100 outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={isThinking}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Gerar Cena
              </button>
            </div>
          </div>
        </div>

        {/* Coluna 3: Cofre de Consistência Neural (w-72) */}
        <div className="w-72 border-l border-[#181824] bg-[#07070d] p-4 flex flex-col overflow-y-auto flex-shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center justify-between">
            <span>🔒 Cofre de Consistência</span>
            <span className="text-[10px] text-emerald-400 font-mono">100% Lock</span>
          </h3>

          <div className="space-y-4">
            {/* IP-Adapter Seed */}
            <div className="bg-[#0f0f18] p-3.5 rounded-2xl border border-[#1e1e2d]">
              <span className="text-xs font-bold text-gray-200 block mb-1">
                Seed de Rosto (IP-Adapter)
              </span>
              <p className="text-[10px] text-gray-400 mb-2">
                Mantém o mesmo rosto do comandante da frota em todas as tomadas.
              </p>
              <div className="w-full h-24 bg-gradient-to-br from-indigo-950 via-purple-950 to-black rounded-xl border border-indigo-500/30 flex items-center justify-center text-3xl">
                👤
              </div>
              <span className="mt-2 block text-[9px] text-emerald-400 font-mono font-bold text-center">
                Hero_Commander_Face.png [TRAVADO]
              </span>
            </div>

            {/* F5-TTS Waveform */}
            <div className="bg-[#0f0f18] p-3.5 rounded-2xl border border-[#1e1e2d]">
              <span className="text-xs font-bold text-gray-200 block mb-1">
                Clonador de Voz (F5-TTS)
              </span>
              <p className="text-[10px] text-gray-400 mb-2">
                Áudio de referência de 10 segundos da sua voz para clonagem instantânea.
              </p>

              {/* Onda Sonora Simulada */}
              <div className="h-10 bg-[#06060c] rounded-lg border border-[#181824] flex items-center justify-center gap-1 px-3 mb-2">
                {[12, 24, 18, 32, 20, 14, 28, 36, 16, 22, 30, 18, 12].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${isPlayingAudio ? Math.min(36, h * 1.3) : h}px` }}
                    className="w-1.5 bg-gradient-to-t from-purple-600 to-cyan-400 rounded-full transition-all duration-150"
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  setIsPlayingAudio(!isPlayingAudio);
                  showToast(isPlayingAudio ? 'Áudio pausado.' : 'Reproduzindo minha_voz_narrador.wav...');
                }}
                className="w-full text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 py-1.5 rounded-xl transition font-semibold"
              >
                {isPlayingAudio ? '⏸️ Pausar Voz' : '▶️ Ouvir Voz Clonada'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
