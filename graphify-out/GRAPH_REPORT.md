# Graph Report - V0id  (2026-11-07)

## Corpus Check
- 79 files · ~164,442 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .bat 6, (none) 4, .ico 3)

## Summary
- 519 nodes · 811 edges · 33 communities (24 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2c80d4b1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent.test.js
- ref_node_path
- NexusDB
- index.js
- package.json
- next
- 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)
- 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)
- 🌑 V0ID OS
- ui-launcher/package.json
- 🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)
- StudioView.tsx
- compilerOptions
- v0id_blender_addon.py
- GoogleFlowBridge
- V0ID OS
- v0id_token_budget_loop.mjs
- VISUAL_INSPECTION_REPORT.md
- INTERACTIVE_TEST_REPORT.md
- SCENES_INDEX.md
- GlobalChatView.tsx
- V0idAgent
- automations.ts
- EdgeCDPClient
- ref_node_url
- setup.js
- projects.ts
- ref_node_child_process
- generate_multi_res_icon.mjs
- v0id_self_healing_suite.mjs

## God Nodes (most connected - your core abstractions)
1. `NexusDB` - 27 edges
2. `react` - 26 edges
3. `🌑 V0ID OS — LOG DE EVOLUÇÃO AUTÔNOMA E AUTO-CURA` - 25 edges
4. `StudioView()` - 18 edges
5. `next` - 15 edges
6. `BlackHoleIcon()` - 13 edges
7. `compilerOptions` - 13 edges
8. `Gatekeeper` - 12 edges
9. `V0idAgent` - 11 edges
10. `scripts` - 11 edges

## Surprising Connections (you probably didn't know these)
- `StudioView()` --calls--> `GlobalChatView()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/studios/GlobalChatView.tsx
- `GlobalChatView()` --calls--> `BlackHoleIcon()`  [EXTRACTED]
  ui-launcher/components/studios/GlobalChatView.tsx → ui-launcher/components/icons/BlackHoleIcon.tsx
- `runSingleCycle()` --calls--> `captureAllScenes()`  [EXTRACTED]
  v0id_token_budget_loop.mjs → v0id_capture_scenes.mjs
- `runSingleCycle()` --calls--> `runInteractiveTest()`  [EXTRACTED]
  v0id_token_budget_loop.mjs → v0id_interactive_tester.mjs
- `GlobalChatView()` --calls--> `IntegratedTerminalDrawer()`  [EXTRACTED]
  ui-launcher/components/studios/GlobalChatView.tsx → ui-launcher/components/IntegratedTerminalDrawer.tsx

## Import Cycles
- None detected.

## Communities (33 total, 9 thin omitted)

### Community 0 - "agent.test.js"
Cohesion: 0.06
Nodes (32): EDGE_PATHS, flowBridge, PROFILE_DIR, agent, antiGhostAgent, bigText, checkpoint, cmdOut (+24 more)

### Community 1 - "ref_node_path"
Cohesion: 0.27
Nodes (5): OUTPUT_DIR, SCENES, REPORT_FILE, REPORT_FILE, SCENES_DIR

### Community 3 - "index.js"
Cohesion: 0.07
Nodes (31): loadEnv(), Gatekeeper, findRes, gatekeeper, logs, providers, rle, router (+23 more)

### Community 4 - "package.json"
Cohesion: 0.10
Nodes (19): bin, v0id, dependencies, ws, description, name, scripts, capture (+11 more)

### Community 5 - "next"
Cohesion: 0.06
Nodes (19): next, db, dbPath, v0idRoot, config, DB_PATH, getProjectFolder(), handler() (+11 more)

### Community 6 - "🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)"
Cohesion: 0.22
Nodes (8): 1. COMO O V0ID FUNCIONA (RESUMO EXECUTIVO EM 5 PASSOS), 2. DIAGRAMA GERAL UNIFICADO DO SISTEMA (v4.0), 3. DESENHO DAS TELAS: OS 16 APPS (PS5 UI) + OS ESTÚDIOS (3 COLUNAS), 4. ESTRUTURA MODULAR DE PASTAS (`c:\V0id\`), 5. PROMPT DE PARTIDA (PARA COLAR NO ANTIGRAVITY OU NO `agy` CLI), Tela 1: O Launcher Principal (Estilo PS5 / Apple TV), Tela 2: Interior de Qualquer Estúdio (As 3 Colunas), 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)

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
Cohesion: 0.07
Nodes (37): react, BlackHoleIcon(), BlackHoleIconProps, AutoForgeView(), FORGE_TOOLS, ToolItem, AutomationFlow, AutomationsView() (+29 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+7 more)

### Community 16 - "v0id_blender_addon.py"
Cohesion: 0.15
Nodes (5): optimize_and_export(), parse_args(), V0ID_OT_ExportGameModel, V0ID_OT_ExportOmniMediaRender, V0ID_PT_MainPanel

### Community 18 - "V0ID OS"
Cohesion: 0.08
Nodes (24): 🔒 Arquitetura de Privacidade & Zero-Leak, 🎨 Catálogo dos 14 Estúdios de Produção, 🛠️ Comandos de Desenvolvimento & Testes, 🔑 Configuração de Modelos e Chaves (OmniRoute), 🛠️ Developer Commands & Test Suites, 🌟 Key Features & Architectural Highlights, 📄 License, 🔑 OmniRoute Model Routing & Free Tiers (+16 more)

### Community 19 - "v0id_token_budget_loop.mjs"
Cohesion: 0.23
Nodes (13): runSelfHealing(), runValidation(), STUDIO_COMPONENT_MAP, appendLog(), LOG_FILE, logLive(), main(), PID_FILE (+5 more)

### Community 23 - "GlobalChatView.tsx"
Cohesion: 0.14
Nodes (18): IntegratedTerminalDrawer(), IntegratedTerminalDrawerProps, isTableSeparator(), MarkdownRenderer(), MarkdownRendererProps, parseTableRow(), renderInline(), AttachedFile (+10 more)

### Community 25 - "automations.ts"
Cohesion: 0.28
Nodes (8): getRecentLogs(), handler(), isLoopRunning(), LOG_FILE, PID_FILE, RUNNER_LOG, STOP_FILE, V0ID_ROOT

### Community 26 - "EdgeCDPClient"
Cohesion: 0.53
Nodes (3): captureAllScenes(), EdgeCDPClient, runInteractiveTest()

### Community 27 - "ref_node_url"
Cohesion: 0.32
Nodes (5): dynamicImport, handler(), appendLog(), LOG_FILE, runEvolutionCycle()

### Community 28 - "setup.js"
Cohesion: 0.25
Nodes (7): __dirname, envExamplePath, envPath, generatedDir, major, UI_DIR, uiEnvPath

### Community 29 - "projects.ts"
Cohesion: 0.33
Nodes (4): DB_PATH, getDb(), handler(), VAULT_ROOT

### Community 30 - "ref_node_child_process"
Cohesion: 0.33
Nodes (4): child, EDGE_PATH, EDGE_PATHS, PROFILE_DIR

### Community 31 - "generate_multi_res_icon.mjs"
Cohesion: 0.22
Nodes (8): allBuffers, dirEntries, header, htmlFile, multiIco, pngEntries, sizes, TEMP_DIR

### Community 32 - "v0id_self_healing_suite.mjs"
Cohesion: 0.60
Nodes (4): logFail(), logPass(), results, runSuite()

## Knowledge Gaps
- **9 isolated node(s):** `@remotion/cli`, `react-dom`, `remotion`, `@types/node`, `@types/react` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 297 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `ref_node_path`, `ui-launcher/package.json`, `StudioView.tsx`, `automations.ts`, `ref_node_url`, `projects.ts`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **What connects `@remotion/cli`, `react-dom`, `remotion` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05537098560354374 - nodes in this community are weakly interconnected._
- **Why does `react` connect `StudioView.tsx` to `ui-launcher/package.json`, `next`, `GlobalChatView.tsx`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Should `NexusDB` be split into smaller, more focused modules?**
  _Cohesion score 0.08262108262108261 - nodes in this community are weakly interconnected._
- **Why does `NexusDB` connect `NexusDB` to `index.js`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07467532467532467 - nodes in this community are weakly interconnected._