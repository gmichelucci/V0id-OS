# Graph Report - V0id  (2026-10-31)

## Corpus Check
- 82 files · ~150,177 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: .bat 6, .ico 3, (none) 2)

## Summary
- 504 nodes · 786 edges · 25 communities (16 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `35f82a09`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent.test.js
- global/src/v0id-game-engine/src_cpp/v0id_engine.cpp
- NexusDB
- index.js
- package.json
- next
- 🌑 V0ID OS
- 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)
- 🌑 V0ID OS
- ui-launcher/package.json
- 🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)
- StudioView.tsx
- compilerOptions
- v0id_blender_addon.py
- GoogleFlowBridge
- projetos/test/vault/README.md
- v0id_token_budget_loop.mjs
- VISUAL_INSPECTION_REPORT.md
- INTERACTIVE_TEST_REPORT.md
- SCENES_INDEX.md
- generate_multi_res_icon.mjs
- ref_node_path

## God Nodes (most connected - your core abstractions)
1. `🌑 V0ID OS — LOG DE EVOLUÇÃO AUTÔNOMA E AUTO-CURA` - 25 edges
2. `react` - 24 edges
3. `NexusDB` - 23 edges
4. `StudioView()` - 18 edges
5. `next` - 15 edges
6. `BlackHoleIcon()` - 13 edges
7. `compilerOptions` - 13 edges
8. `Gatekeeper` - 12 edges
9. `V0idAgent` - 11 edges
10. `scripts` - 11 edges

## Surprising Connections (you probably didn't know these)
- `GlobalChatView()` --calls--> `MarkdownRenderer()`  [EXTRACTED]
  ui-launcher/components/studios/GlobalChatView.tsx → ui-launcher/components/MarkdownRenderer.tsx
- `StudioView()` --calls--> `BlackHoleIcon()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/icons/BlackHoleIcon.tsx
- `StudioView()` --calls--> `AutoForgeView()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/studios/AutoForgeView.tsx
- `StudioView()` --calls--> `AutomationsView()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/studios/AutomationsView.tsx
- `StudioView()` --calls--> `CodeGameStudioView()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/studios/CodeGameStudioView.tsx

## Import Cycles
- None detected.

## Communities (25 total, 9 thin omitted)

### Community 0 - "agent.test.js"
Cohesion: 0.06
Nodes (27): agent, antiGhostAgent, bigText, checkpoint, cmdOut, compressed, diffContent, dirList (+19 more)

### Community 1 - "global/src/v0id-game-engine/src_cpp/v0id_engine.cpp"
Cohesion: 0.15
Nodes (4): V0idHighSpeedController, speed, V0idHighSpeedController, speed

### Community 3 - "index.js"
Cohesion: 0.10
Nodes (22): loadEnv(), Gatekeeper, findRes, gatekeeper, logs, providers, rle, router (+14 more)

### Community 4 - "package.json"
Cohesion: 0.10
Nodes (19): bin, v0id, dependencies, ws, description, name, scripts, capture (+11 more)

### Community 5 - "next"
Cohesion: 0.08
Nodes (12): next, getRecentLogs(), handler(), isLoopRunning(), LOG_FILE, PID_FILE, RUNNER_LOG, STOP_FILE (+4 more)

### Community 6 - "🌑 V0ID OS"
Cohesion: 0.09
Nodes (21): 1. Seletor Interativo de Motores, 2. Esteiras Criativas Especializadas, 🔒 Arquitetura de Privacidade & Segurança Comercial, 🎨 Catálogo dos 14 Estúdios de Produção, ⚡ Comandos Úteis do Desenvolvedor, 🔑 Configuração de Chaves de IA (Gratuitas), ⚡ Instalação Rápida (Onboarding em 1 Clique), 🎬 OmniStudio & Síntese Multimodal Unificada (+13 more)

### Community 7 - "🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)"
Cohesion: 0.22
Nodes (8): 1. COMO O V0ID FUNCIONA (RESUMO EXECUTIVO EM 5 PASSOS), 2. DIAGRAMA GERAL UNIFICADO DO SISTEMA (v4.0), 3. DESENHO DAS TELAS: OS 16 APPS (PS5 UI) + OS ESTÚDIOS (3 COLUNAS), 4. ESTRUTURA MODULAR DE PASTAS (`c:\V0id\`), 5. PROMPT DE PARTIDA (PARA COLAR NO ANTIGRAVITY OU NO `agy` CLI), Tela 1: O Launcher Principal (Estilo PS5 / Apple TV), Tela 2: Interior de Qualquer Estúdio (As 3 Colunas), 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)

### Community 8 - "🌑 V0ID OS"
Cohesion: 0.08
Nodes (25): [CICLO DE AUDITORIA] 2026-10-26T02:37:26.445Z, [CICLO DE AUDITORIA] 2026-10-26T02:55:06.270Z, [CICLO DE AUDITORIA] 2026-10-26T02:55:52.445Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:09:59.521Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:17:49.491Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:23:42.644Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:26:12.239Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:27:57.041Z (+17 more)

### Community 9 - "ui-launcher/package.json"
Cohesion: 0.07
Nodes (29): autoprefixer, postcss, react-dom, remotion, @remotion/cli, tailwindcss, @types/node, @types/react (+21 more)

### Community 10 - "🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)"
Cohesion: 0.40
Nodes (4): 1. OBJETIVOS CENTRAIS (GOALS), 2. REGRAS FINANCEIRAS & OPERACIONAIS, 3. PADRÕES APRENDIDOS [APPROVED_GOLD], 🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)

### Community 11 - "StudioView.tsx"
Cohesion: 0.06
Nodes (49): react, BlackHoleIcon(), BlackHoleIconProps, isTableSeparator(), MarkdownRenderer(), MarkdownRendererProps, parseTableRow(), renderInline() (+41 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+7 more)

### Community 16 - "v0id_blender_addon.py"
Cohesion: 0.14
Nodes (5): optimize_and_export(), parse_args(), V0ID_OT_ExportGameModel, V0ID_OT_ExportOmniMediaRender, V0ID_PT_MainPanel

### Community 19 - "v0id_token_budget_loop.mjs"
Cohesion: 0.12
Nodes (21): runSelfHealing(), runValidation(), STUDIO_COMPONENT_MAP, captureAllScenes(), OUTPUT_DIR, SCENES, EdgeCDPClient, REPORT_FILE (+13 more)

### Community 23 - "generate_multi_res_icon.mjs"
Cohesion: 0.22
Nodes (8): allBuffers, dirEntries, header, htmlFile, multiIco, pngEntries, sizes, TEMP_DIR

### Community 44 - "ref_node_path"
Cohesion: 0.05
Nodes (42): EDGE_PATHS, flowBridge, PROFILE_DIR, child, EDGE_PATH, EDGE_PATHS, PROFILE_DIR, compressOutput() (+34 more)

## Knowledge Gaps
- **11 isolated node(s):** `speed`, `speed`, `@remotion/cli`, `react-dom`, `remotion` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 279 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `ui-launcher/package.json`, `StudioView.tsx`, `ref_node_path`?**
  _High betweenness centrality (0.255) - this node is a cross-community bridge._
- **What connects `speed`, `speed`, `@remotion/cli` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06090808416389812 - nodes in this community are weakly interconnected._
- **Why does `react` connect `StudioView.tsx` to `ui-launcher/package.json`, `next`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `global/src/v0id-game-engine/src_cpp/v0id_engine.cpp` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `NexusDB` connect `NexusDB` to `ref_node_path`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `NexusDB` be split into smaller, more focused modules?**
  _Cohesion score 0.09486166007905138 - nodes in this community are weakly interconnected._