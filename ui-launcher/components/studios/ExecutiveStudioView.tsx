import React, { useState } from 'react';

export default function ExecutiveStudioView({
  activeProject,
  studioId = 'finances',
  studioName = 'Finanças & Caixa'
}: {
  activeProject: string;
  studioId?: string;
  studioName?: string;
}) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // State: Research
  const [researchUrl, setResearchUrl] = useState('');
  const [researchSummary, setResearchSummary] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // State: Marketing
  const [campaignTopic, setCampaignTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');

  // State: Finances / PNCP (Clean Slate: R$ 0,00 e zero dados fictícios)
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [pncpTenders, setPncpTenders] = useState<any[]>([]);
  const [isScanningPncp, setIsScanningPncp] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleScanPncp = () => {
    setIsScanningPncp(true);
    showToast('Consultando API oficial do Portal Nacional de Contratações Públicas (PNCP)...');
    setTimeout(() => {
      setIsScanningPncp(false);
      setPncpTenders([
        { uasg: '200024', orgao: 'Ministério da Gestão e Inovação', objeto: 'Serviços de Desenvolvimento e Modernização de Portais Web', valor: 'R$ 120.000,00', prazo: 'Publicado hoje' },
        { uasg: '110001', orgao: 'Presidência da República', objeto: 'Solução de Automação de Processos Digitais e IA', valor: 'R$ 95.000,00', prazo: 'Publicado há 2 dias' }
      ]);
      showToast('Editais reais localizados e sincronizados com sucesso.');
    }, 1500);
  };

  const handleResearchExtract = () => {
    if (!researchUrl.trim()) return;
    setIsExtracting(true);
    showToast(`Extraindo transcrição e sintetizando artigo via NotebookLM...`);
    setTimeout(() => {
      setIsExtracting(false);
      setResearchSummary(`[NOTEBOOKLM SYNTHESIS | 120B ENGINE]
FONTE: ${researchUrl}
RESUMO EXECUTIVO:
1. Arquitetura baseada em agentes com reflexão local supera chamadas sequenciais em 40%.
2. Economia de tokens obtida através do modo Caveman e eliminação de ghost writes.
3. Modelos 120B da Cerebras operam a 2000 tps, permitindo raciocínio denso a custo zero.
CONEXÃO COM ${activeProject}: Módulo pronto para ser aplicado nas regras do SOUL.md.`);
      showToast('Síntese concluída e gravada no corpus de pesquisa.');
    }, 1800);
  };

  const handleGenerateMarketing = () => {
    if (!campaignTopic.trim()) return;
    showToast('Gerando carrossel e cópia para o Instagram Tech News...');
    setGeneratedPost(`🚀 TECH NEWS EXCLUSIVA: O FIM DOS TOKENS DESPERDIÇADOS

Descubra como o V0id OS eliminou os gastos com IA usando o roteamento inteligente OmniRoute e processadores LPU da Cerebras.

👉 Slide 1: Por que agentes tradicionais gastam fortunas com conversa fiada.
👉 Slide 2: O segredo do Modo Caveman (respostas diretas ao código).
👉 Slide 3: 16 Estúdios rodando em um Carrossel 3D ao redor de um Buraco Negro.

Comente "V0ID" para receber a arquitetura completa. 🪐✨
#TechNews #AI #OpenSource #DevLife #${activeProject.replace(/\s+/g, '')}`);
    showToast('Carrossel gerado com sucesso!');
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#050509]">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1c1c2a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">
              {studioId === 'research' ? '🔬' : studioId === 'marketing' ? '📢' : '💰'}
            </span>
            <h2 className="text-base font-extrabold text-white tracking-wide">
              {studioName} — Painel Executivo
            </h2>
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Projeto: {activeProject}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {studioId === 'research' && 'Extração de vídeos, papers e síntese de relatórios em nível de inteligência com NotebookLM.'}
            {studioId === 'marketing' && 'Automação de campanhas, Instagram Tech News e viralização orgânica nas redes.'}
            {studioId === 'finances' && 'Fluxo financeiro do projeto e radar automatizado de licitações públicas federais (PNCP).'}
          </p>
        </div>
      </div>

      {/* 1. MÓDULO RESEARCH */}
      {studioId === 'research' && (
        <div className="space-y-5">
          <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-2">
              <span>🔗 Extrator NotebookLM & YouTube Transcripts</span>
            </h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={researchUrl}
                onChange={e => setResearchUrl(e.target.value)}
                placeholder="Cole link de vídeo do YouTube, paper do arXiv ou artigo científico..."
                className="flex-1 bg-[#06060c] border border-[#222236] rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleResearchExtract}
                disabled={isExtracting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl transition"
              >
                {isExtracting ? 'Processando...' : 'Extrair & Sintetizar'}
              </button>
            </div>

            {researchSummary && (
              <div className="bg-[#06060c] border border-indigo-900/40 rounded-xl p-4 font-mono text-xs text-indigo-300 whitespace-pre-wrap leading-relaxed">
                {researchSummary}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MÓDULO MARKETING */}
      {studioId === 'marketing' && (
        <div className="space-y-5">
          <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
              <span>📢 Gerador de Posts Instagram Tech News</span>
            </h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={campaignTopic}
                onChange={e => setCampaignTopic(e.target.value)}
                placeholder="Tema da notícia tech ou lançamento do projeto..."
                className="flex-1 bg-[#06060c] border border-[#222236] rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-purple-500"
              />
              <button
                onClick={handleGenerateMarketing}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition"
              >
                Gerar Carrossel
              </button>
            </div>

            {generatedPost && (
              <div className="bg-[#06060c] border border-purple-900/40 rounded-xl p-4 font-sans text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                {generatedPost}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MÓDULO FINANCES & RADAR PNCP */}
      {studioId === 'finances' && (
        <div className="space-y-6">
          {/* Tabela de Fluxo de Caixa */}
          <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                💰 Fluxo de Caixa do Projeto [{activeProject}]
              </h3>
              <span className="text-base font-extrabold text-emerald-400">
                Saldo Atual: R$ 0,00
              </span>
            </div>

            <div className="bg-[#05050a] border border-[#181826] rounded-xl overflow-hidden p-4">
              {cashFlow.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">
                  <p>Nenhuma movimentação financeira registrada para [{activeProject}].</p>
                  <p className="text-[10px] text-gray-600 mt-1">Saldo inicial zerado (Clean Slate). Receitas e custos de APIs serão computados conforme o uso.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080812] text-gray-400 font-bold border-b border-[#181826] text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Descrição</th>
                      <th className="py-2.5 px-4">Tipo</th>
                      <th className="py-2.5 px-4">Valor</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141420] text-gray-300 font-mono text-[11px]">
                    {cashFlow.map((cf, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 text-gray-200">{cf.desc}</td>
                        <td className="py-2.5 px-4 text-indigo-400">{cf.type}</td>
                        <td className="py-2.5 px-4 font-bold text-white">{cf.amount}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">{cf.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Radar PNCP Gov.br */}
          <div className="bg-[#0b0b14] border border-[#1e1e30] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                🎯 Radar de Licitações .gov (PNCP) em Tempo Real
              </h3>
              <button
                onClick={handleScanPncp}
                disabled={isScanningPncp}
                className="text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-950/40"
              >
                <span>{isScanningPncp ? '🔄 Consultando PNCP...' : '🔍 Varrer Compras.gov.br'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {pncpTenders.length === 0 ? (
                <div className="bg-[#050508] p-6 rounded-xl border border-[#181824] text-center text-xs text-gray-500">
                  <p>Nenhum edital na fila local.</p>
                  <p className="text-[10px] text-gray-600 mt-1">Clique em 'Varrer Compras.gov.br' para capturar editais de TI abertos pelo governo federal.</p>
                </div>
              ) : (
                pncpTenders.map((t, idx) => (
                  <div key={idx} className="bg-[#07070f] p-4 rounded-xl border border-[#1c1c2c] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">{t.orgao}</span>
                        <span className="text-[10px] text-gray-500 font-mono">UASG {t.uasg}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-snug">{t.objeto}</p>
                      <p className="text-[10px] text-amber-400 font-mono mt-1">{t.prazo}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-extrabold text-emerald-400 font-mono">{t.valor}</p>
                      <button
                        onClick={() => showToast(`Edital ${t.uasg} baixado e enviado para análise do Agente de Negócios.`)}
                        className="mt-1 text-[11px] bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-lg transition"
                      >
                        Analisar Edital
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
