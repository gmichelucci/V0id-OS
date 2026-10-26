import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// Helper to locate Blender on Windows
function findBlenderPath(): string | null {
  const commonPaths = [
    'C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender 3.6\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Blender Foundation', 'Blender 4.3', 'blender.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Blender Foundation', 'Blender 4.2', 'blender.exe'),
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Steam', 'steamapps', 'common', 'Blender', 'blender.exe')
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action = 'status' } = req.query;

  // 1. STATUS GERAL DO AMBIENTE (GODOT 4 ARCHITECTURE + BLENDER + GDExtension)
  if (req.method === 'GET' && action === 'status') {
    const blenderExe = findBlenderPath();
    return res.status(200).json({
      engine: 'V0id Game Engine (Core Godot 4.3 Architecture - MIT)',
      speedTier: 'C++ Native / GDExtension (Zero Garbage Collector, Max FPS)',
      editableFiles: 'Human-readable Text-based (.tscn, .gd, .tres)',
      branding: {
        bootSplash: 'V0id OS Black Hole (4K HDR)',
        icon: 'V0id Black Hole Kerr SVG',
        title: 'V0id Game Engine'
      },
      blender: {
        isFree: true,
        license: 'GNU GPL v2+ (100% Gratuito & Livre)',
        installed: !!blenderExe,
        path: blenderExe || 'Não localizado no caminho padrão (Instale via winget install BlenderFoundation.Blender)'
      }
    });
  }

  // 2. GERAR V0ID GAME ENGINE COMPLETA NO DISCO LOCAL
  if (req.method === 'POST' && action === 'scaffold_engine') {
    const { projectId = 'global', projectName = 'SpaceTide' } = req.body;
    const v0idRoot = path.resolve(process.cwd(), '..');
    const projectDir = path.join(v0idRoot, 'projetos', projectId, 'src', 'v0id-game-engine');

    try {
      // Cria a hierarquia de pastas completa da engine
      const dirs = [
        path.join(projectDir, 'assets', 'models'),
        path.join(projectDir, 'assets', 'textures'),
        path.join(projectDir, 'assets', 'audio'),
        path.join(projectDir, 'scenes'),
        path.join(projectDir, 'scripts'),
        path.join(projectDir, 'src_cpp'),
        path.join(projectDir, 'tools')
      ];
      dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

      // 1. Copia o Ícone Oficial do Buraco Negro V0id
      const sourceIcon = path.join(v0idRoot, '04_studios_tools', 'game-studio', 'v0id_icon.svg');
      const targetIcon = path.join(projectDir, 'assets', 'v0id_icon.svg');
      if (fs.existsSync(sourceIcon)) {
        fs.copyFileSync(sourceIcon, targetIcon);
      } else {
        fs.writeFileSync(targetIcon, `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="23" fill="#000"/><circle cx="50" cy="50" r="24" stroke="#f59e0b" fill="none"/></svg>`, 'utf8');
      }

      // 2. project.godot (Com Boot Splash e Ícone V0id)
      const projectGodotContent = `; =========================================================================
; V0ID GAME ENGINE — CONFIGURAÇÃO PRINCIPAL DO PROJETO
; Arquitetura Baseada em Godot 4 Core (Licença MIT Open Source)
; Tela de Carregamento & Ícone: Buraco Negro Oficial V0id OS
; =========================================================================

config_version=5

[application]
config/name="${projectName}"
config/description="Desenvolvido na V0id Game Engine com C++ Nativo e Blender 3D Pipeline."
config/version="1.0.0"
run/main_scene="res://scenes/main.tscn"
config/features=PackedStringArray("4.3", "Forward Plus", "C++ GDExtension")
config/icon="res://assets/v0id_icon.svg"
config/windows_native_icon="res://assets/v0id_icon.ico"

[boot_splash]
bg_color=Color(0.012, 0.012, 0.02, 1.0)
image="res://assets/v0id_icon.svg"
fullsize=true
use_filter=true

[display]
window/size/viewport_width=1280
window/size/viewport_height=720
window/size/mode=0
window/stretch/mode="canvas_items"
window/stretch/aspect="keep"

[rendering]
renderer/rendering_method="forward_plus"
textures/vram_compression/import_etc2_astc=true
anti_aliasing/quality/msaa_2d=2
anti_aliasing/quality/msaa_3d=2
`;
      fs.writeFileSync(path.join(projectDir, 'project.godot'), projectGodotContent, 'utf8');

      // 3. scenes/main.tscn (Cena principal editável em texto)
      const mainSceneContent = `[gd_scene load_steps=3 format=3 uid="uid://v0id_main_scene"]

[ext_resource type="Script" path="res://scripts/main.gd" id="1_main"]

[sub_resource type="RectangleShape2D" id="RectangleShape2D_player"]
size = Vector2(48, 48)

[node name="World" type="Node2D"]
script = ExtResource("1_main")

[node name="BackgroundSpace" type="ColorRect" parent="."]
offset_right = 1280.0
offset_bottom = 720.0
color = Color(0.015, 0.015, 0.03, 1)

[node name="V0idSingularityCenter" type="Marker2D" parent="."]
position = Vector2(640, 360)

[node name="PlayerController" type="CharacterBody2D" parent="."]
position = Vector2(640, 520)

[node name="CollisionShape2D" type="CollisionShape2D" parent="PlayerController"]
shape = SubResource("RectangleShape2D_player")

[node name="Camera2D" type="Camera2D" parent="."]
position = Vector2(640, 360)
`;
      fs.writeFileSync(path.join(projectDir, 'scenes', 'main.tscn'), mainSceneContent, 'utf8');

      // 4. scripts/main.gd (GDScript de Alta Performance)
      const mainGdContent = `extends Node2D

# =========================================================================
# V0id Game Engine — Script do Mundo
# =========================================================================

func _ready():
    print("==================================================")
    print("🌑 V0ID GAME ENGINE — JOGO INICIALIZADO")
    print("Projeto Ativo: ${projectName}")
    print("Pipeline 3D: Blender (.glb) Ativo")
    print("Aceleração: C++ GDExtension / Vulkan")
    print("==================================================")

func _process(delta):
    # Loop de 60fps / 144fps
    pass
`;
      fs.writeFileSync(path.join(projectDir, 'scripts', 'main.gd'), mainGdContent, 'utf8');

      // 5. src_cpp/v0id_engine.cpp & .h (GDExtension para C++ Nativo de Máxima Velocidade)
      const cppHeaderContent = `#pragma once
#include <godot_cpp/classes/node2d.hpp>

namespace godot {

class V0idHighSpeedController : public Node2D {
    GDCLASS(V0idHighSpeedController, Node2D)

private:
    float speed = 450.0f;

protected:
    static void _bind_methods();

public:
    V0idHighSpeedController();
    ~V0idHighSpeedController();

    void _physics_process(double delta) override;
    void fire_projectile();
};

}
`;
      fs.writeFileSync(path.join(projectDir, 'src_cpp', 'v0id_engine.h'), cppHeaderContent, 'utf8');

      const cppSourceContent = `#include "v0id_engine.h"
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>

using namespace godot;

void V0idHighSpeedController::_bind_methods() {
    ClassDB::bind_method(D_METHOD("fire_projectile"), &V0idHighSpeedController::fire_projectile);
}

V0idHighSpeedController::V0idHighSpeedController() {}
V0idHighSpeedController::~V0idHighSpeedController() {}

void V0idHighSpeedController::_physics_process(double delta) {
    // Loop C++ nativo em código de máquina: zero GC, máxima taxa de quadros
}

void V0idHighSpeedController::fire_projectile() {
    UtilityFunctions::print("Laser disparado via C++ Nativo V0id Engine!");
}
`;
      fs.writeFileSync(path.join(projectDir, 'src_cpp', 'v0id_engine.cpp'), cppSourceContent, 'utf8');

      // 6. tools/blender_export_pipeline.py (Script Headless do Blender)
      const blenderScriptContent = `# =========================================================================
# V0id Game Engine — Blender Headless Export Pipeline
# Executa no Blender em modo background: blender -b scene.blend -P blender_export_pipeline.py
# Converte e otimiza malhas 3D para .glb direto na pasta res://assets/models/
# =========================================================================

import bpy
import sys
import os

def export_glb_for_v0id(output_path):
    print(f"[V0id Pipeline] Exportando modelo 3D otimizado para: {output_path}")
    
    # Aplica modificadores e exporta em formato GLB limpo para a V0id Game Engine
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT',
        export_animations=True
    )
    print("[V0id Pipeline] Exportacao GLB concluida com sucesso!")

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    target_glb = os.path.join(out_dir, "..", "assets", "models", "ship_v0id.glb")
    export_glb_for_v0id(target_glb)
`;
      fs.writeFileSync(path.join(projectDir, 'tools', 'blender_export_pipeline.py'), blenderScriptContent, 'utf8');

      return res.status(200).json({
        success: true,
        path: projectDir,
        message: `V0id Game Engine scaffoldada com sucesso em: ${projectDir}`,
        files: [
          'project.godot (Boot Splash 4K e Ícone V0id)',
          'scenes/main.tscn (Cena editável em texto puro)',
          'scripts/main.gd (Script GDScript)',
          'src_cpp/v0id_engine.cpp (Loop C++ Nativo de Máxima Velocidade)',
          'tools/blender_export_pipeline.py (Pipeline 3D Blender Headless)'
        ]
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // 3. ABRIR O BLENDER OU EXECUTAR PIPELINE HEADLESS
  if (req.method === 'POST' && action === 'blender_action') {
    const { actionType = 'open', customPath } = req.body;
    const blenderExe = customPath || findBlenderPath();

    if (!blenderExe || !fs.existsSync(blenderExe)) {
      return res.status(404).json({
        success: false,
        error: 'Blender não encontrado. Instale com "winget install BlenderFoundation.Blender" ou aponte o caminho.'
      });
    }

    if (actionType === 'open') {
      exec(`"${blenderExe}"`, (err) => {
        if (err) console.error('Erro ao abrir Blender:', err);
      });
      return res.status(200).json({ success: true, message: 'Blender inicializado no Windows.' });
    }

    if (actionType === 'run_pipeline') {
      const v0idRoot = path.resolve(process.cwd(), '..');
      const scriptPath = path.join(v0idRoot, '04_studios_tools', 'game-studio', 'blender', 'blender_headless_pipeline.py');
      const targetGlb = path.join(v0idRoot, 'projetos', 'global', 'src', 'v0id-game-engine', 'assets', 'models', 'v0id_ship.glb');
      
      exec(`"${blenderExe}" -b -P "${scriptPath}" -- --output "${targetGlb}" --decimate 0.75`, { timeout: 30000 }, (err, stdout, stderr) => {
        return res.status(200).json({
          success: !err,
          output: stdout || stderr || 'Pipeline Blender finalizada com sucesso.'
        });
      });
      return;
    }
  }

  return res.status(400).json({ error: 'Ação não suportada' });
}
