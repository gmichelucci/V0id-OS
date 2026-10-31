# =========================================================================
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
