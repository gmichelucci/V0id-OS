// Minimal .env loader without external dependencies
import fs from 'node:fs';
import path from 'node:path';

export function loadEnv(envPath) {
  let targetPath = envPath || path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(targetPath)) {
    const parentPath = path.resolve(process.cwd(), '../.env');
    if (fs.existsSync(parentPath)) {
      targetPath = parentPath;
    } else {
      return {};
    }
  }

  const content = fs.readFileSync(targetPath, 'utf8');
  const env = {};
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
  return env;
}
