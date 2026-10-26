// Minimal .env loader without external dependencies
import fs from 'node:fs';
import path from 'node:path';

export function loadEnv(envPath) {
  const env = {};
  const candidates = [
    envPath,
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), 'ui-launcher', '.env'),
    path.resolve(process.cwd(), '..', 'ui-launcher', '.env')
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx === -1) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          env[key] = val;
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      } catch {}
    }
  }

  return env;
}
