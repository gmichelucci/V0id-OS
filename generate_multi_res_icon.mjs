import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TEMP_DIR = path.join(os.tmpdir(), `v0id_icon_gen_${Date.now()}`);
fs.mkdirSync(TEMP_DIR, { recursive: true });

// HTML template with the exact Gargantua Black Hole SVG
const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: 92%;
    height: 92%;
  }
</style>
</head>
<body>
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="bh-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="bh-lens" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <linearGradient id="bh-plasma" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="20%" stop-color="#818cf8" />
      <stop offset="45%" stop-color="#ffffff" />
      <stop offset="55%" stop-color="#fbbf24" />
      <stop offset="75%" stop-color="#f59e0b" />
      <stop offset="90%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <radialGradient id="bh-singularity" cx="50%" cy="50%" r="50%">
      <stop offset="80%" stop-color="#000000" />
      <stop offset="91%" stop-color="#020205" />
      <stop offset="96%" stop-color="#f59e0b" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="1" />
    </radialGradient>

    <linearGradient id="bh-lens-upper" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
      <stop offset="25%" stop-color="#f59e0b" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="75%" stop-color="#f59e0b" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#ef4444" stop-opacity="0.3" />
    </linearGradient>
  </defs>

  <!-- 1. Upper Gravitational Lensing Arc (Bending over the Singularity) -->
  <path d="M 12 50 C 14 24, 86 24, 88 50 C 76 34, 24 34, 12 50 Z" fill="url(#bh-lens-upper)" filter="url(#bh-lens)" />

  <!-- 2. Back Half of Accretion Disk -->
  <ellipse cx="50" cy="50" rx="46" ry="13" fill="none" stroke="url(#bh-plasma)" stroke-width="4.2" opacity="0.85" filter="url(#bh-glow)" />

  <!-- 3. Central Event Horizon Singularity Sphere -->
  <circle cx="50" cy="50" r="23" fill="url(#bh-singularity)" />
  <circle cx="50" cy="50" r="23.4" fill="none" stroke="#ffffff" stroke-width="0.85" opacity="0.95" filter="url(#bh-glow)" />

  <!-- 4. Front Half of Accretion Disk (Doppler Beaming) -->
  <path d="M 4 50 C 4 64, 96 64, 96 50 C 86 58, 14 58, 4 50 Z" fill="url(#bh-plasma)" filter="url(#bh-glow)" />

  <!-- 5. Lower Gravitational Lensing Arc -->
  <path d="M 22 53 C 24 66, 76 66, 78 53 C 70 60, 30 60, 22 53 Z" fill="url(#bh-lens-upper)" opacity="0.75" />
</svg>
</body>
</html>`;

const htmlFile = path.join(TEMP_DIR, 'logo.html');
fs.writeFileSync(htmlFile, htmlContent, 'utf8');

// Sizes to render: 256, 128, 64, 48, 32, 16
const sizes = [256, 128, 64, 48, 32, 16];
const pngEntries = [];

for (const s of sizes) {
  const pngPath = path.join(TEMP_DIR, `logo_${s}.png`);
  const profileDir = path.join(TEMP_DIR, `profile_${s}`);
  
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--window-size=${s},${s}`,
    '--default-background-color=00000000',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=2000',
    `--user-data-dir=${profileDir}`,
    `--screenshot=${pngPath}`,
    `file:///${htmlFile.replace(/\\/g, '/')}`
  ];

  spawnSync(EDGE_PATH, args, { timeout: 15000, windowsHide: true });
  
  if (fs.existsSync(pngPath)) {
    const bytes = fs.readFileSync(pngPath);
    console.log(`Rendered ${s}x${s}: ${bytes.length} bytes`);
    pngEntries.push({ size: s, bytes });
  } else {
    console.warn(`Failed to render ${s}x${s}`);
  }
}

if (pngEntries.length === 0) {
  console.error('No images rendered!');
  process.exit(1);
}

// Build standard Windows Multi-Resolution ICO file
const numImages = pngEntries.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Icon type = 1
header.writeUInt16LE(numImages, 4); // Number of images

const dirEntries = [];
let currentOffset = 6 + (numImages * 16);

for (const entry of pngEntries) {
  const dir = Buffer.alloc(16);
  dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, 0); // Width (0 for 256)
  dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, 1); // Height (0 for 256)
  dir.writeUInt8(0, 2); // Color palette
  dir.writeUInt8(0, 3); // Reserved
  dir.writeUInt16LE(1, 4); // Color planes
  dir.writeUInt16LE(32, 6); // Bits per pixel
  dir.writeUInt32LE(entry.bytes.length, 8); // Image data size
  dir.writeUInt32LE(currentOffset, 12); // Offset
  dirEntries.push(dir);
  currentOffset += entry.bytes.length;
}

const allBuffers = [header, ...dirEntries, ...pngEntries.map(e => e.bytes)];
const multiIco = Buffer.concat(allBuffers);

// Write to multiple paths to guarantee fresh discovery
fs.writeFileSync('C:/V0id/v0id_app_icon.ico', multiIco);
fs.writeFileSync('C:/V0id/v0id.ico', multiIco);
fs.writeFileSync('C:/V0id/ui-launcher/public/favicon.ico', multiIco);
console.log(`Successfully generated Multi-Res ICO (${multiIco.length} bytes with ${numImages} resolutions)`);

// Cleanup temp files
try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}
