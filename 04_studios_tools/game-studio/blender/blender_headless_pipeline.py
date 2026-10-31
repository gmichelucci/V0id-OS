# =========================================================================
# V0id Game Engine & OmniMedia — Headless Blender Batch Pipeline
# Permite ao V0id OS processar, otimizar e exportar modelos 3D via CLI:
# blender -b scene.blend -P blender_headless_pipeline.py -- --output model.glb --decimate 0.5
# =========================================================================

import bpy
import sys
import os
import argparse

def parse_args():
    # Pega apenas os argumentos depois de '--'
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1:]
    else:
        argv = []
    
    parser = argparse.ArgumentParser(description="V0id Blender Headless Pipeline")
    parser.add_argument("--output", "-o", default="model_v0id.glb", help="Caminho do arquivo .glb de saida")
    parser.add_argument("--decimate", "-d", type=float, default=1.0, help="Fator de reducao de poligonos (0.1 a 1.0)")
    parser.add_argument("--triangulate", action="store_true", help="Triangular malhas para game engine")
    return parser.parse_known_args(argv)[0]

def optimize_and_export(output_path, decimate_ratio=1.0, triangulate=False):
    print(f"\n[V0id Blender Pipeline] Processando cena...")
    print(f" -> Saida: {output_path}")
    print(f" -> Fator Decimate (LOD): {decimate_ratio}")

    # Itera sobre objetos de malha
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    print(f" -> Malhas encontradas: {len(mesh_objects)}")

    for obj in mesh_objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        # Aplica Decimate se ratio < 1.0 (otimizacao para Intel Iris Xe / GPU)
        if decimate_ratio < 1.0:
            mod = obj.modifiers.new(name="V0idDecimate", type='DECIMATE')
            mod.ratio = decimate_ratio
            print(f"    [LOD] Aplicado decimate ratio {decimate_ratio} em {obj.name}")

        # Aplica Triangulate se solicitado
        if triangulate:
            mod_tri = obj.modifiers.new(name="V0idTriangulate", type='TRIANGULATE')
            print(f"    [Mesh] Triangulado objeto {obj.name}")

    # Cria diretorio pai se necessario
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    # Exporta para GLB (formato padrao da V0id Game Engine)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT',
        export_animations=True
    )
    print(f"[V0id Blender Pipeline] Exportacao concluida com sucesso: {output_path}\n")

if __name__ == "__main__":
    args = parse_args()
    optimize_and_export(args.output, args.decimate, args.triangulate)
