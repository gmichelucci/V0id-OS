# Graph Report - V0id  (2026-11-07)

## Corpus Check
- 81 files · ~163,113 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: .bat 6, (none) 4, .ico 3)

## Summary
- 528 nodes · 820 edges · 27 communities (18 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `baab8851`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent.test.js
- v0id_engine.cpp
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
- ref_node_path
- VISUAL_INSPECTION_REPORT.md
- INTERACTIVE_TEST_REPORT.md
- SCENES_INDEX.md
- GlobalChatView.tsx
- cli.js
- automations.ts
- generate_multi_res_icon.mjs

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
- `GlobalChatView()` --calls--> `IntegratedTerminalDrawer()`  [EXTRACTED]
  ui-launcher/components/studios/GlobalChatView.tsx → ui-launcher/components/IntegratedTerminalDrawer.tsx
- `GlobalChatView()` --calls--> `MarkdownRenderer()`  [EXTRACTED]
  ui-launcher/components/studios/GlobalChatView.tsx → ui-launcher/components/MarkdownRenderer.tsx
- `StudioView()` --calls--> `BlackHoleIcon()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/icons/BlackHoleIcon.tsx

## Import Cycles
- None detected.

## Communities (27 total, 9 thin omitted)

### Community 0 - "agent.test.js"
Cohesion: 0.06
Nodes (30): EDGE_PATHS, flowBridge, PROFILE_DIR, agent, antiGhostAgent, bigText, checkpoint, cmdOut (+22 more)

### Community 3 - "index.js"
Cohesion: 0.10
Nodes (22): loadEnv(), Gatekeeper, findRes, gatekeeper, logs, providers, rle, router (+14 more)

### Community 4 - "package.json"
Cohesion: 0.08
Nodes (21): V0idWSServer, bin, v0id, dependencies, ws, description, name, scripts (+13 more)

### Community 5 - "next"
Cohesion: 0.09
Nodes (9): next, findBlenderPath(), handler(), DB_PATH, ENV_PATH, getProjectFolder(), handler(), SOUL_PATH (+1 more)

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
Cohesion: 0.14
Nodes (5): optimize_and_export(), parse_args(), V0ID_OT_ExportGameModel, V0ID_OT_ExportOmniMediaRender, V0ID_PT_MainPanel

### Community 18 - "V0ID OS"
Cohesion: 0.08
Nodes (24): 🔒 Arquitetura de Privacidade & Zero-Leak, 🎨 Catálogo dos 14 Estúdios de Produção, 🛠️ Comandos de Desenvolvimento & Testes, 🔑 Configuração de Modelos e Chaves (OmniRoute), 🛠️ Developer Commands & Test Suites, 🌟 Key Features & Architectural Highlights, 📄 License, 🔑 OmniRoute Model Routing & Free Tiers (+16 more)

### Community 19 - "ref_node_path"
Cohesion: 0.06
Nodes (41): child, EDGE_PATH, EDGE_PATHS, PROFILE_DIR, __dirname, envExamplePath, envPath, generatedDir (+33 more)

### Community 23 - "GlobalChatView.tsx"
Cohesion: 0.14
Nodes (18): IntegratedTerminalDrawer(), IntegratedTerminalDrawerProps, isTableSeparator(), MarkdownRenderer(), MarkdownRendererProps, parseTableRow(), renderInline(), AttachedFile (+10 more)

### Community 24 - "cli.js"
Cohesion: 0.13
Nodes (11): V0idAgent, agent, rl, wsServer, DB_PATH, __dirname, nexus, foundHistory (+3 more)

### Community 25 - "automations.ts"
Cohesion: 0.28
Nodes (8): getRecentLogs(), handler(), isLoopRunning(), LOG_FILE, PID_FILE, RUNNER_LOG, STOP_FILE, V0ID_ROOT

### Community 31 - "generate_multi_res_icon.mjs"
Cohesion: 0.09
Nodes (19): allBuffers, dirEntries, header, htmlFile, multiIco, pngEntries, sizes, TEMP_DIR (+11 more)

## Knowledge Gaps
- **10 isolated node(s):** `speed`, `@remotion/cli`, `react-dom`, `remotion`, `@types/node` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 298 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `ui-launcher/package.json`, `StudioView.tsx`, `ref_node_path`, `automations.ts`, `generate_multi_res_icon.mjs`?**
  _High betweenness centrality (0.263) - this node is a cross-community bridge._
- **What connects `speed`, `@remotion/cli`, `react-dom` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06349206349206349 - nodes in this community are weakly interconnected._
- **Why does `react` connect `StudioView.tsx` to `ui-launcher/package.json`, `next`, `GlobalChatView.tsx`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Should `NexusDB` be split into smaller, more focused modules?**
  _Cohesion score 0.08262108262108261 - nodes in this community are weakly interconnected._
- **Why does `NexusDB` connect `NexusDB` to `cli.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10220673635307782 - nodes in this community are weakly interconnected._