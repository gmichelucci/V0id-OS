import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { action, targetPath } = req.body;

  if (action === 'run_semgrep') {
    const target = targetPath || path.resolve(process.cwd(), '..');

    exec(`npx --yes semgrep scan --config auto "${target}"`, { timeout: 60000 }, (err, stdout, stderr) => {
      const isError = err && err.code !== 1;
      let logs = stdout || stderr || '';

      let vulnerabilityCount = 0;
      if (logs) {
         const match = logs.match(/(\d+)\s+(vuln|vulnerabilities|bugs)/i);
         if (match) vulnerabilityCount = parseInt(match[1], 10);
      }

      const isSafe = vulnerabilityCount === 0;

      return res.status(200).json({
        success: !isError,
        vulnerabilitiesCount: vulnerabilityCount,
        status: isSafe ? 'PASSOU (0 BUGS)' : `ENCONTRADO (${vulnerabilityCount} BUGS)`,
        risk: isSafe ? 'SEGURO' : 'ALTO',
        logs: logs,
        error: isError ? err.message : null
      });
    });
  } else {
    return res.status(400).json({ error: 'Ação não suportada' });
  }
}
