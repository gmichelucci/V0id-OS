import React, { useState, useEffect } from 'react';
import BlackHoleIcon from '../icons/BlackHoleIcon';

export default function CoreSoulView({ activeProject }: { activeProject: string }) {
  const [specContent, setSpecContent] = useState('');
  const [envContent, setEnvContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Quotas & Telemetry
  const quotas = [
    { provider: 'Google AI Studio (Gemini 4 Argon / 3.8 Pro)', status: 'Elite Titular', usage: '100% Cota Diária Livre', color: 'emerald' },
    { provider: 'Cerebras (gpt-oss-120b)', status: 'Reserva Pesada Ultra-Fast', usage: '2000 tokens/s (Ilimitado)', color: 'indigo' },
    { provider: 'Groq (openai/gpt-oss-120b)', status: 'Reserva Pesada LPU', usage: '800 tokens/s (Disponível)', color: 'purple' },
    { provider: 'Google AI Studio (Gemini 3.8 Flash)', status: 'Gatekeeper & Triagem', usage: 'Alta Disponibilidade ($0.00)', color: 'cyan' },
    { provider: 'OpenRouter Free (Qwen Coder & Dolphin)', status: 'Reserva Sem Censura', usage: 'Rotas Gratuitas Ativas', color: 'amber' }
  ];

  const goldPatterns = [
    { id: 'gold-1', rule: 'Anti-Ghost Write: Jamais marcar [DONE] sem write_file ou run_command no disco.' },
    { id: 'gold-2', rule: 'Modo Caveman: Respostas cirúrgicas direto ao ponto com código drop-in completo.' },
    { id: 'gold-3', rule: 'Cota Zero: Gatekeeper e prompts simples sempre roteados em modelos Flash ultra-rápidos.' },
    { id: 'gold-4', rule: 'Consistência Facial: Seed IP-Adapter Hero_Face_IPAdapter.png travado para cenas.' }
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadConfigFiles = () => {
    fetch('/api/system?action=config_files')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSpecContent(data.spec || data.soul || '');
          setEnvContent(data.env || '');
        }
      })
      .catch(() => {
        // Fallback initial load
        showToast('Aviso: Carregando arquivos do sistema...');
      });
  };

  useEffect(() => {
    loadConfigFiles();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/system?action=save_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: specContent, env: envContent })
      });
      const data = await res.json();
      if (data.success) {
        showToast('💾 V0id Master Blueprint (V0ID_SPEC.md) e .env gravados no disco!');
      } else {
        showToast(`Erro ao gravar: ${data.error}`);
      }
    } catch {
      showToast('Falha na requisição de gravação.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[#030306]">
  <style>{`
    .project-select-trigger {
      @apply max-w-none min-w-[280px] truncate;
    }
    .carousel-card-inactive {
      @apply opacity-40 scale-90 blur-[1px] pointer-events-none transition-all duration-300;
    }
    .carousel-container {
      @apply gap-8 perspective-[1000px];
    }
  `}</style>
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-amber-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1c1c2a] flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BlackHoleIcon className="w-6 h-6 text-amber-400" />
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Core Soul — Cérebro, Master Blueprint & Chaves V0id
            </h2>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Modo Caveman: ATIVO
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Edição em tempo real do Blueprint Mestre (V0ID_SPEC.md) e do cofre de chaves (.env). Alterações sincronizadas com o OmniRouter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadConfigFiles}
            className="text-xs bg-[#12121e] hover:bg-[#1a1a2e] text-gray-300 border border-[#232338] px-3 py-2 rounded-xl transition"
            title="Recarregar arquivos do disco"
          >
            🔄 Recarregar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-xl shadow-amber-950/60 flex items-center gap-2 cursor-pointer"
          >
            <span>💾</span>
            <span>{isSaving ? 'Gravando no Disco...' : 'Salvar Blueprint & .env no Disco'}</span>
          </button>
        </div>
      </div>

      {/* Grid de 3 Colunas: Blueprint Mestre | Cofre de Chaves .env | Telemetria Cotas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Coluna 1 (5 cols): V0ID_SPEC.md (Blueprint Mestre) */}
        <div className="lg:col-span-5 flex flex-col bg-[#080812] border border-[#1e1e30] rounded-2xl p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              📜 V0id Master Blueprint (V0ID_SPEC.md)
            </span>
            <span className="text-[10px] text-gray-500 font-mono">c:\V0id\V0ID_SPEC.md</span>
          </div>
          <textarea
            value={specContent}
            onChange={e => setSpecContent(e.target.value)}
            className="flex-1 bg-[#04040a] border border-[#191928] rounded-xl p-3.5 text-xs font-mono text-gray-200 outline-none resize-none focus:border-amber-500 leading-relaxed"
            placeholder="Carregando V0ID_SPEC.md..."
          />
        </div>

        {/* Coluna 2 (3 cols): .env (Cofre de Chaves) */}
        <div className="lg:col-span-3 flex flex-col bg-[#080812] border border-[#1e1e30] rounded-2xl p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              🔑 .env (Cofre de Chaves & Cotas)
            </span>
            <span className="text-[10px] text-gray-500 font-mono">c:\V0id\.env</span>
          </div>
          <textarea
            value={envContent}
            onChange={e => setEnvContent(e.target.value)}
            className="flex-1 bg-[#04040a] border border-[#191928] rounded-xl p-3.5 text-xs font-mono text-gray-200 outline-none resize-none focus:border-emerald-500 leading-relaxed"
            placeholder="Carregando .env..."
          />
        </div>

        {/* Coluna 3 (4 cols): Telemetria OmniRoute & Padrões Gold */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
          {/* Cotas */}
          <div className="bg-[#080812] border border-[#1e1e30] rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center justify-between">
              <span>⚡ Telemetria de Cotas OmniRoute</span>
              <span className="text-[10px] text-emerald-400 font-mono">Live</span>
            </h3>
            <div className="space-y-2.5">
              {quotas.map((q, idx) => (
                <div key={idx} className="bg-[#05050a] p-2.5 rounded-xl border border-[#161624]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-gray-200 truncate">{q.provider}</span>
                    <span className="text-[9px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded">
                      {q.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-mono">{q.usage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regras [APPROVED_GOLD] */}
          <div className="bg-[#080812] border border-[#1e1e30] rounded-2xl p-4 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center justify-between">
              <span>⭐ Padrões [APPROVED_GOLD] Memorizados</span>
              <span className="text-[10px] text-gray-400 font-mono">Nexus DB</span>
            </h3>
            <div className="space-y-2">
              {goldPatterns.map(p => (
                <div key={p.id} className="bg-[#05050a] p-2.5 rounded-xl border border-amber-900/30 text-xs">
                  <p className="text-gray-300 leading-snug">{p.rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
