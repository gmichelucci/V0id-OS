import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action = 'status' } = req.query;

  // 1. STATUS E CAPACIDADES DO REA (morluto/rea)
  if (req.method === 'GET' && action === 'status') {
    exec('npx --yes rea-agents --version', { timeout: 10000 }, (err, stdout) => {
      if (err) {
        return res.status(200).json({
          available: false,
          version: null,
          error: err.message
        });
      }
      return res.status(200).json({
        available: true,
        version: stdout.trim(),
        engine: 'REA (Reverse Engineer Anything by morluto)',
        providers: ['ghidra', 'cutter', 'rizin', 'jeb', 'wasm', 'electron']
      });
    });
    return;
  }

  // 2. EXECUTAR ANÁLISE REA EM ARQUIVO / PACOTE DE JOGO
  if (req.method === 'POST' && action === 'analyze') {
    const { targetPath, command = 'analyze' } = req.body;
    
    // Default safe target se não fornecido
    const target = targetPath || path.join(process.cwd(), '..', 'V0ID_SPEC.md');

    exec(`npx --yes rea-agents ${command} "${target}"`, { timeout: 30000 }, (err, stdout, stderr) => {
      return res.status(200).json({
        success: !err,
        command: `rea ${command} "${path.basename(target)}"`,
        output: stdout || stderr || (err ? err.message : 'Análise concluída sem saída textual.')
      });
    });
    return;
  }

  // 3. SCAFFOLD PROJETO GODOT 4 PARA O DISCO DO PROJETO ATIVO
  if (req.method === 'POST' && action === 'scaffold_godot') {
    const { projectId = 'global', projectName = 'V0idGame' } = req.body;
    const v0idRoot = path.resolve(process.cwd(), '..');
    const projectDir = path.join(v0idRoot, '03_chat_projects_nexus', 'projects-vault', projectId, 'src', 'game-godot');

    try {
      fs.mkdirSync(projectDir, { recursive: true });

      // project.godot
      const projectGodotContent = `; Engine configuration file.
; Generated automatically by V0id Game Engine Studio

config_version=5

[application]
config/name="${projectName}"
run/main_scene="res://main.tscn"
config/features=PackedStringArray("4.3", "Forward Plus")
config/icon="res://icon.svg"

[rendering]
renderer/rendering_method="forward_plus"
`;
      fs.writeFileSync(path.join(projectDir, 'project.godot'), projectGodotContent, 'utf8');

      // main.gd (GDScript)
      const mainGdContent = `extends Node2D

# V0id Game Engine - Script Principal
# Licença MIT (Baseado em Godot 4.3 Architecture)

func _ready():
    print("V0id Game Engine inicializada com sucesso!")
    print("Projeto: ${projectName}")

func _process(delta):
    pass
`;
      fs.writeFileSync(path.join(projectDir, 'main.gd'), mainGdContent, 'utf8');

      return res.status(200).json({
        success: true,
        path: projectDir,
        message: `Estrutura Godot 4 gerada com sucesso em ${projectDir}`
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(400).json({ error: 'Ação não suportada' });
}
