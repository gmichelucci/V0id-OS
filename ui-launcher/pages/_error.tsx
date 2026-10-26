import React from 'react';
import type { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

export default function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020204] text-white font-sans p-6">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
        🌑
      </div>
      <h1 className="text-xl font-black text-amber-400 tracking-wide mb-1">
        V0id OS — Recuperação do Sistema
      </h1>
      <p className="text-xs text-gray-400 mb-6 font-mono">
        {statusCode ? `Código HTTP: ${statusCode}` : 'Sessão recarregando...'}
      </p>
      <a
        href="/"
        className="text-xs font-bold bg-[#121220] hover:bg-amber-950/60 text-amber-300 border border-amber-500/40 px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg"
      >
        ← Voltar à Órbita 3D
      </a>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
