bl_info = {
    "name": "V0id OS Game Engine & OmniMedia Exporter",
    "author": "V0id OS Core Team",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > V0id OS",
    "description": "Exporta malhas 3D otimizadas (.glb) direto para a V0id Game Engine e OmniMedia Studio",
    "category": "Import-Export",
}

import bpy
import os

class V0ID_PT_MainPanel(bpy.types.Panel):
    bl_label = "🌑 V0id OS 3D Pipeline"
    bl_idname = "V0ID_PT_main_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'V0id OS'

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        layout.label(text="Exportador V0id Game Engine", icon='GHOST_ENABLED')
        
        box = layout.box()
        box.prop(scene, "v0id_target_path")
        box.prop(scene, "v0id_model_name")
        box.prop(scene, "v0id_apply_modifiers")
        box.prop(scene, "v0id_export_animations")

        layout.separator()
        layout.operator("v0id.export_game_model", text="🚀 Exportar para V0id Engine (.glb)", icon='EXPORT')
        layout.operator("v0id.export_omnimedia_render", text="🎬 Renderizar Cutscene para OmniMedia", icon='RENDER_STILL')

class V0ID_OT_ExportGameModel(bpy.types.Operator):
    bl_idname = "v0id.export_game_model"
    bl_label = "Exportar para V0id Game Engine"

    def execute(self, context):
        scene = context.scene
        target_dir = scene.v0id_target_path
        model_name = scene.v0id_model_name.strip() or "asset_v0id"

        if not os.path.exists(target_dir):
            try:
                os.makedirs(target_dir, exist_ok=True)
            except Exception as e:
                self.report({'ERROR'}, f"Erro ao criar pasta: {e}")
                return {'CANCELLED'}

        out_path = os.path.join(target_dir, f"{model_name}.glb")

        bpy.ops.export_scene.gltf(
            filepath=out_path,
            export_format='GLB',
            use_selection=True,
            export_apply=scene.v0id_apply_modifiers,
            export_animations=scene.v0id_export_animations,
            export_materials='EXPORT',
            export_yup=True
        )

        self.report({'INFO'}, f"Modelo exportado com sucesso para {out_path}")
        return {'FINISHED'}

class V0ID_OT_ExportOmniMediaRender(bpy.types.Operator):
    bl_idname = "v0id.export_omnimedia_render"
    bl_label = "Renderizar Cutscene para OmniMedia"

    def execute(self, context):
        scene = context.scene
        target_dir = scene.v0id_target_path
        model_name = scene.v0id_model_name.strip() or "render_v0id"
        out_path = os.path.join(target_dir, f"{model_name}.png")

        scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)

        self.report({'INFO'}, f"Render salvo em {out_path}")
        return {'FINISHED'}

def register():
    bpy.types.Scene.v0id_target_path = bpy.props.StringProperty(
        name="Pasta Alvo",
        default="C:\\V0id\\projetos\\global\\src\\v0id-game-engine\\assets\\models\\",
        subtype='DIR_PATH'
    )
    bpy.types.Scene.v0id_model_name = bpy.props.StringProperty(
        name="Nome do Asset",
        default="player_ship"
    )
    bpy.types.Scene.v0id_apply_modifiers = bpy.props.BoolProperty(
        name="Aplicar Modificadores",
        default=True
    )
    bpy.types.Scene.v0id_export_animations = bpy.props.BoolProperty(
        name="Exportar Animações",
        default=True
    )

    bpy.utils.register_class(V0ID_PT_MainPanel)
    bpy.utils.register_class(V0ID_OT_ExportGameModel)
    bpy.utils.register_class(V0ID_OT_ExportOmniMediaRender)

def unregister():
    bpy.utils.unregister_class(V0ID_PT_MainPanel)
    bpy.utils.unregister_class(V0ID_OT_ExportGameModel)
    bpy.utils.unregister_class(V0ID_OT_ExportOmniMediaRender)
    del bpy.types.Scene.v0id_target_path
    del bpy.types.Scene.v0id_model_name
    del bpy.types.Scene.v0id_apply_modifiers
    del bpy.types.Scene.v0id_export_animations

if __name__ == "__main__":
    register()
