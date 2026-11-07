import React from 'react';

export interface BlackHoleIconProps {
  className?: string;
  size?: number;
}

export default function BlackHoleIcon({ className = 'w-6 h-6', size }: BlackHoleIconProps) {
  const sizeAttr = size ? { width: size, height: size } : {};

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] ${className}`}
      {...sizeAttr}
    >
      <defs>
        {/* Glow Filters */}
        <filter id="bh-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="bh-lens" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Accretion Disk Gradients */}
        <linearGradient id="bh-plasma" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="25%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="75%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <radialGradient id="bh-singularity" cx="50%" cy="50%" r="50%">
          <stop offset="82%" stopColor="#000000" />
          <stop offset="92%" stopColor="#020205" />
          <stop offset="97%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
        </radialGradient>

        <linearGradient id="bh-lens-upper" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* 1. Upper Gravitational Lensing Arc (Bending over the Singularity) */}
      <path
        d="M 12 50 C 14 24, 86 24, 88 50 C 76 34, 24 34, 12 50 Z"
        fill="url(#bh-lens-upper)"
        filter="url(#bh-lens)"
      />

      {/* 2. Back Half of Accretion Disk */}
      <ellipse
        cx="50"
        cy="50"
        rx="46"
        ry="13"
        fill="none"
        stroke="url(#bh-plasma)"
        strokeWidth="4"
        opacity="0.75"
        filter="url(#bh-glow)"
      />

      {/* 3. Central Event Horizon (Pure Black Singularity Sphere + Photon Ring) */}
      <circle
        cx="50"
        cy="50"
        r="23"
        fill="url(#bh-singularity)"
      />

      {/* Thin Blazing Photon Ring */}
      <circle
        cx="50"
        cy="50"
        r="23.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.8"
        opacity="0.9"
        filter="url(#bh-glow)"
      />

      {/* 4. Front Half of Accretion Disk (Passing in front with Relativistic Doppler Beaming) */}
      <path
        d="M 4 50 C 4 64, 96 64, 96 50 C 86 58, 14 58, 4 50 Z"
        fill="url(#bh-plasma)"
        filter="url(#bh-glow)"
      />

      {/* 5. Lower Gravitational Lensing Arc */}
      <path
        d="M 22 53 C 24 66, 76 66, 78 53 C 70 60, 30 60, 22 53 Z"
        fill="url(#bh-lens-upper)"
        opacity="0.65"
      />
    </svg>
  );
}
