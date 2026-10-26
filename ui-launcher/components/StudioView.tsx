import React from 'react';
import BlackHoleIcon from './icons/BlackHoleIcon';
import AutoForgeView from './studios/AutoForgeView';
import CoreSoulView from './studios/CoreSoulView';
import SecurityView from './studios/SecurityView';
import PluginsMcpAuditView from './studios/PluginsMcpAuditView';
import PluginsRulesView from './studios/PluginsRulesView';
import AutomationsView from './studios/AutomationsView';
import RepositoryView from './studios/RepositoryView';
import CodeGameStudioView from './studios/CodeGameStudioView';
import GameStudioEngineView from './studios/GameStudioEngineView';
import OmniMediaStudioView from './studios/OmniMediaStudioView';
import ResearchStudioView from './studios/ResearchStudioView';
import MarketingAgencyView from './studios/MarketingAgencyView';
import ExecutiveStudioView from './studios/ExecutiveStudioView';
import GlobalChatView from './studios/GlobalChatView';

export interface StudioViewProps {
  activeProject?: string;
  projectId?: string;
  studioName?: string;
  appId?: string;
  onBackToLauncher?: () => void;
}

export default function StudioView({
  activeProject = 'Global (Nenhum Projeto Criado)',
  projectId,
  studioName = 'Code Studio',
  appId = 'code',
  onBackToLauncher
}: StudioViewProps) {
  // Renderiza a interface interna exclusiva para cada aplicativo
  const renderAppView = () => {
    switch (appId) {
      case 'auto-forge':
        return <AutoForgeView activeProject={activeProject} />;

      case 'core':
        return <CoreSoulView activeProject={activeProject} />;

      case 'security':
        return <SecurityView activeProject={activeProject} />;

      case 'plugins':
        return <PluginsMcpAuditView activeProject={activeProject} />;

      case 'rules':
        return <PluginsRulesView activeProject={activeProject} isRulesOnly />;

      case 'automations':
        return <AutomationsView activeProject={activeProject} />;

      case 'repository':
        return <RepositoryView activeProject={activeProject} projectId={projectId} />;

      case 'code':
        return (
          <CodeGameStudioView
            activeProject={activeProject}
            projectId={projectId}
            studioName={studioName}
          />
        );

      case 'game':
        return (
          <GameStudioEngineView
            activeProject={activeProject}
            projectId={projectId}
          />
        );

      case 'omnimedia':
      case 'film':
      case 'image':
      case 'audio':
        return (
          <OmniMediaStudioView
            activeProject={activeProject}
            projectId={projectId}
          />
        );

      case 'research':
        return <ResearchStudioView activeProject={activeProject} />;

      case 'marketing':
        return <MarketingAgencyView activeProject={activeProject} projectId={projectId} />;

      case 'finances':
        return (
          <ExecutiveStudioView
            activeProject={activeProject}
            studioId="finances"
            studioName={studioName}
          />
        );

      case 'chat':
      default:
        return (
          <GlobalChatView
            activeProject={activeProject}
            projectId={projectId}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#020204] text-gray-200 overflow-hidden font-sans select-text animate-fade-in">
      {/* Header Global com Ícone Oficial do Buraco Negro V0id */}
      <header className="h-14 border-b border-[#181824] px-6 flex items-center justify-between bg-[#07070e] flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToLauncher}
            className="text-xs font-bold tracking-wide text-amber-300 hover:text-white flex items-center gap-2 bg-[#121220] hover:bg-amber-900/40 border border-amber-500/30 hover:border-amber-400 px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-lg shadow-amber-950/40"
          >
            ← Voltar à Órbita V0id
          </button>

          <div className="h-4 w-[1px] bg-gray-700"></div>

          <div className="flex items-center gap-2.5">
            <BlackHoleIcon className="w-5 h-5 text-amber-400" />
            <h1 className="text-sm font-extrabold text-white tracking-wide">{studioName}</h1>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/40 font-mono">
              {activeProject}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-300 font-mono text-[11px]">V0id OS v5.0 • Online</span>
          </div>
        </div>
      </header>

      {/* Corpo Principal: Tela Exclusiva */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {renderAppView()}
      </main>
    </div>
  );
}
