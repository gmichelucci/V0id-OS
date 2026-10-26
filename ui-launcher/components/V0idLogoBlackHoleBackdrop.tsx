import React from 'react';

export default function V0idLogoBlackHoleBackdrop() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Deep Space Radial Atmosphere (1.5x) */}
      <div className="absolute w-[1950px] h-[1950px] rounded-full bg-radial from-amber-500/22 via-orange-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* The Official V0id Black Hole Logo rendered in Monumental 4K Scalable Vector (1.5x) */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[1320px] h-[1320px] max-w-[120vw] max-h-[110vh] drop-shadow-[0_0_180px_rgba(245,158,11,0.75)] transition-transform duration-700"
      >
        <defs>
          {/* Intense 4K Multi-pass Glow Filters */}
          <filter id="bg-bh-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="bg-bh-lens" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Relativistic Accretion Disk Plasma Gradient */}
          <linearGradient id="bg-bh-plasma" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="20%" stopColor="#818cf8" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fbbf24" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="90%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Central Singularity with Photon Fringe */}
          <radialGradient id="bg-bh-singularity" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="#000000" />
            <stop offset="91%" stopColor="#020205" />
            <stop offset="96%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
          </radialGradient>

          {/* Upper Gravitational Lensing Arc Gradient */}
          <linearGradient id="bg-bh-lens-upper" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* 1. Upper Gravitational Lensing Arc (Bending over the Singularity) */}
        <path
          d="M 12 50 C 14 24, 86 24, 88 50 C 76 34, 24 34, 12 50 Z"
          fill="url(#bg-bh-lens-upper)"
          filter="url(#bg-bh-lens)"
        />

        {/* 2. Back Half of Accretion Disk */}
        <ellipse
          cx="50"
          cy="50"
          rx="46"
          ry="13"
          fill="none"
          stroke="url(#bg-bh-plasma)"
          strokeWidth="3.8"
          opacity="0.85"
          filter="url(#bg-bh-glow)"
        />

        {/* 3. Central Event Horizon (Absolute Black Singularity Core) */}
        <circle
          cx="50"
          cy="50"
          r="23"
          fill="url(#bg-bh-singularity)"
        />

        {/* Thin Blazing Photon Ring */}
        <circle
          cx="50"
          cy="50"
          r="23.4"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.75"
          opacity="0.95"
          filter="url(#bg-bh-glow)"
        />

        {/* 4. Front Half of Accretion Disk (Passing directly in front with Doppler Beaming) */}
        <path
          d="M 4 50 C 4 64, 96 64, 96 50 C 86 58, 14 58, 4 50 Z"
          fill="url(#bg-bh-plasma)"
          filter="url(#bg-bh-glow)"
        />

        {/* 5. Lower Gravitational Lensing Arc */}
        <path
          d="M 22 53 C 24 66, 76 66, 78 53 C 70 60, 30 60, 22 53 Z"
          fill="url(#bg-bh-lens-upper)"
          opacity="0.7"
        />

        {/* Center Typography inside the Singularity */}
        <text
          x="50"
          y="49"
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(251, 191, 36, 0.85)"
          fontSize="3.2"
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="0.4"
        >
          V0ID OS
        </text>
        <text
          x="50"
          y="53.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(156, 163, 175, 0.7)"
          fontSize="2"
          fontFamily="monospace"
          letterSpacing="0.2"
        >
          SINGULARITY
        </text>
      </svg>
    </div>
  );
}
