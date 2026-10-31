import React from 'react';
import Link from 'next/link';
import AutoForgeView from '../components/studios/AutoForgeView';
import BlackHoleIcon from '../components/icons/BlackHoleIcon';

export default function AutoForgePage() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#030306] text-gray-200 overflow-hidden font-sans select-none">
      <header className="h-14 border-b border-[#181824] px-6 flex items-center justify-between bg-[#07070e] flex-shrink-0 z-20">
        <Link
          href="/"
          className="text-xs font-bold tracking-wide text-amber-300 hover:text-white flex items-center gap-2 bg-[#121220] hover:bg-amber-900/40 border border-amber-500/30 hover:border-amber-400 px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-lg shadow-amber-950/40"
        >
          ← Voltar à Órbita V0id
        </Link>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs font-mono text-gray-300">
          <BlackHoleIcon className="w-4 h-4 text-amber-400" />
          <span>Auto-Forge Engine</span>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden min-h-0">
        <AutoForgeView activeProject="Global (Nenhum Projeto Criado)" />
      </main>
    </div>
  );
}
