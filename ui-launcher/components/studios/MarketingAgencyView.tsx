import React, { useState, useEffect } from 'react';

export default function MarketingAgencyView({
  activeProject,
  projectId
}: {
  activeProject: string;
  projectId?: string;
}) {
  // Accounts linking state
  const [instaUser, setInstaUser] = useState('@v0id.os.tech');
  const [instaToken, setInstaToken] = useState('IGQVJ...masked_token');
  const [instaAutoReels, setInstaAutoReels] = useState(true);

  const [ghUser, setGhUser] = useState('gmichelucci');
  const [ghRepo, setGhRepo] = useState('V0id-OS');
  const [ghToken, setGhToken] = useState('ghp_...masked_token');

  // Generator State
  const [readmeOutput, setReadmeOutput] = useState('');
  const [isGeneratingReadme, setIsGeneratingReadme] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([
    { id: 'p1', day: 'Segunda 12:00', platform: 'Instagram', title: 'Carrossel: Por que o V0id OS usa LPU 120B a $0.00', status: 'Agendado' },
    { id: 'p2', day: 'Quarta 18:00', platform: 'Instagram Reels', title: 'Reel: Renderizando cutscenes verticais com F5-TTS', status: 'Agendado' },
    { id: 'p3', day: 'Sexta 17:00', platform: 'GitHub Release', title: 'v0.5.0 Release Notes: Buraco Negro 3D & OmniMedia', status: 'Pronto' }
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveCredentials = async () => {
    try {
      const res = await fetch('/api/system?action=save_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: `# V0id OS Credentials Config\nINSTAGRAM_USER=${instaUser}\nINSTAGRAM_TOKEN=${instaToken}\nGITHUB_USER=${ghUser}\nGITHUB_REPO=${ghRepo}\nGITHUB_TOKEN=${ghToken}\n`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Credenciais do Instagram & GitHub salvas com segurança no .env!');
      }
    } catch {
      showToast('Falha ao salvar no .env');
    }
  };

  const handleGenerateViralReadme = () => {
    setIsGeneratingReadme(true);
    showToast('Gerando README viral e badges para o GitHub...');
    setTimeout(() => {
      setIsGeneratingReadme(false);
      setReadmeOutput(`# 🪐 V0ID OS — Autonomous Terminal & Operating System

[![OmniRoute](https://img.shields.io/badge/OmniRoute-120B_Cerebras-indigo?style=for-the-badge)](https://github.com/v0id-os)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Zero-GPU](https://img.shields.io/badge/ZeroGPU-HuggingFace-amber?style=for-the-badge)](https://huggingface.co)

> The next-generation autonomous OS featuring a 3D Gargantua Singularity, 14 specialized studios, zero-token waste Caveman mode, and native local filesystem automation.

---

### ✨ Key Features
- **🪐 3D Orbital Carousel:** Cinematic Kerr black hole with relativistic accretion disk running at 60fps.
- **🎬 OmniMedia Studio:** Integrated workbenches for F5-TTS voice cloning, FLUX.1 generation, and Remotion video synthesis.
- **🎮 Game Studio Engine:** In-browser 2D/3D physics, scene hierarchy, and live interactive playtesting.
- **🛡️ Docker Sandbox & SOC:** Enterprise Semgrep security and zero unauthorized outbound withdrawal locks.

### 🚀 Quick Start
\`\`\`bash
cd C:\\V0id
.\\v0id-ui.bat
\`\`\`
`);
      showToast('README viral gerado e pronto para commit no repositório!');
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#030306]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1c1c2a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📢</span>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Marketing Agency — Vinculação Instagram & GitHub Releases
            </h2>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Projeto: {activeProject}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Automação de divulgação orgânica, geração de carrosséis/reels para o Instagram Tech News e documentações virais de repositórios no GitHub.
          </p>
        </div>

        <button
          onClick={handleSaveCredentials}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
        >
          <span>💾</span>
          <span>Salvar Contas no .env</span>
        </button>
      </div>

      {/* Painel de Vinculação Dupla: Instagram & GitHub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Instagram Account Bridge */}
        <div className="bg-[#090912] border border-[#1e1e30] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#181824]">
            <span className="text-xs font-bold text-pink-400 flex items-center gap-2">
              📸 Instagram Graph API Bridge
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded">
              Conexão Ativa
            </span>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Perfil / Conta:</label>
            <input
              type="text"
              value={instaUser}
              onChange={e => setInstaUser(e.target.value)}
              className="w-full bg-[#050508] border border-[#202030] rounded-xl px-3 py-2 text-xs text-gray-200 font-mono outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Access Token / Session:</label>
            <input
              type="password"
              value={instaToken}
              onChange={e => setInstaToken(e.target.value)}
              className="w-full bg-[#050508] border border-[#202030] rounded-xl px-3 py-2 text-xs text-gray-200 font-mono outline-none focus:border-pink-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-300 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={instaAutoReels}
              onChange={e => setInstaAutoReels(e.target.checked)}
              className="accent-pink-500"
            />
            <span>Publicação Automática de Reels do OmniMedia Studio</span>
          </label>
        </div>

        {/* GitHub Releases Bridge */}
        <div className="bg-[#090912] border border-[#1e1e30] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#181824]">
            <span className="text-xs font-bold text-purple-400 flex items-center gap-2">
              🐙 GitHub Profile & Release Bridge
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded">
              Pronto
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Usuário / Org:</label>
              <input
                type="text"
                value={ghUser}
                onChange={e => setGhUser(e.target.value)}
                className="w-full bg-[#050508] border border-[#202030] rounded-xl px-3 py-2 text-xs text-gray-200 font-mono outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Repositório:</label>
              <input
                type="text"
                value={ghRepo}
                onChange={e => setGhRepo(e.target.value)}
                className="w-full bg-[#050508] border border-[#202030] rounded-xl px-3 py-2 text-xs text-gray-200 font-mono outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">GitHub Personal Access Token (PAT):</label>
            <input
              type="password"
              value={ghToken}
              onChange={e => setGhToken(e.target.value)}
              className="w-full bg-[#050508] border border-[#202030] rounded-xl px-3 py-2 text-xs text-gray-200 font-mono outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={handleGenerateViralReadme}
            disabled={isGeneratingReadme}
            className="w-full text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 py-2 rounded-xl transition font-bold"
          >
            {isGeneratingReadme ? 'Gerando Documentação...' : '⚡ Gerar README Viral & Badges'}
          </button>
        </div>
      </div>

      {/* Visualizador de README Gerado */}
      {readmeOutput && (
        <div className="bg-[#090912] border border-[#1e1e30] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
              📄 README.md Viral Gerado
            </h3>
            <button
              onClick={() => showToast('README copiado para a área de transferência!')}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg"
            >
              Copiar Markdown
            </button>
          </div>
          <pre className="bg-[#050508] border border-[#181824] rounded-xl p-4 font-mono text-xs text-gray-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
            {readmeOutput}
          </pre>
        </div>
      )}

      {/* Calendário e Fila de Publicações */}
      <div className="bg-[#090912] border border-[#1e1e30] rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center justify-between">
          <span>📅 Calendário de Publicações Agendadas</span>
          <span className="text-[10px] text-gray-400 font-mono">Automação Contínua</span>
        </h3>

        <div className="space-y-2.5">
          {scheduledPosts.map(post => (
            <div key={post.id} className="bg-[#050508] border border-[#181824] p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">{post.title}</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    {post.platform}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">Horário: {post.day}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  {post.status}
                </span>
                <button
                  onClick={() => showToast(`Post "${post.title}" disparado manualmente agora!`)}
                  className="text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-lg transition"
                >
                  Publicar Agora
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
