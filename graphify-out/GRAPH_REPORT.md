# Graph Report - V0id  (2026-10-26)

## Corpus Check
- 67 files · ~218,916 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .bat 3, .glb 2, .example 1)

## Summary
- 409 nodes · 643 edges · 25 communities (18 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `400b432e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent.test.js
- v0id_engine.cpp
- NexusDB
- index.js
- package.json
- cli.js
- automations.ts
- 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)
- 🌑 V0ID OS
- ui-launcher/package.json
- 🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)
- StudioView.tsx
- compilerOptions
- v0id_blender_addon.py
- ref_node_fs
- projetos/test/vault/README.md
- ref_node_path
- v0id_token_budget_loop.mjs
- INTERACTIVE_TEST_REPORT.md
- v0id_self_healing_suite.mjs
- nexus.test.js
- projects.ts

## God Nodes (most connected - your core abstractions)
1. `NexusDB` - 23 edges
2. `react` - 21 edges
3. `StudioView()` - 18 edges
4. `🌑 V0ID OS — LOG DE EVOLUÇÃO AUTÔNOMA E AUTO-CURA` - 17 edges
5. `BlackHoleIcon()` - 13 edges
6. `compilerOptions` - 13 edges
7. `Gatekeeper` - 12 edges
8. `V0idAgent` - 11 edges
9. `OmniRouter` - 10 edges
10. `next` - 10 edges

## Surprising Connections (you probably didn't know these)
- `StudioView()` --calls--> `BlackHoleIcon()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/icons/BlackHoleIcon.tsx
- `StudioView()` --calls--> `AutoForgeView()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/studios/AutoForgeView.tsx
- `StudioView()` --calls--> `AutomationsView()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/studios/AutomationsView.tsx
- `StudioView()` --calls--> `CodeGameStudioView()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/studios/CodeGameStudioView.tsx
- `StudioView()` --calls--> `CoreSoulView()`  [EXTRACTED]
  ui-launcher/components/StudioView.tsx → ui-launcher/components/studios/CoreSoulView.tsx

## Import Cycles
- None detected.

## Communities (25 total, 7 thin omitted)

### Community 0 - "agent.test.js"
Cohesion: 0.09
Nodes (21): agent, antiGhostAgent, bigText, checkpoint, cmdOut, compressed, diffContent, dirList (+13 more)

### Community 3 - "index.js"
Cohesion: 0.11
Nodes (20): loadEnv(), Gatekeeper, fastProviders, gatekeeper, logs, providers, rle, router (+12 more)

### Community 4 - "package.json"
Cohesion: 0.11
Nodes (17): bin, v0id, dependencies, ws, description, name, scripts, capture (+9 more)

### Community 5 - "cli.js"
Cohesion: 0.15
Nodes (6): V0idAgent, agent, rl, wsServer, V0idWSServer, ws

### Community 6 - "automations.ts"
Cohesion: 0.12
Nodes (11): next, getRecentLogs(), handler(), isLoopRunning(), LOG_FILE, PID_FILE, RUNNER_LOG, STOP_FILE (+3 more)

### Community 7 - "🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)"
Cohesion: 0.22
Nodes (8): 1. COMO O V0ID FUNCIONA (RESUMO EXECUTIVO EM 5 PASSOS), 2. DIAGRAMA GERAL UNIFICADO DO SISTEMA (v4.0), 3. DESENHO DAS TELAS: OS 16 APPS (PS5 UI) + OS ESTÚDIOS (3 COLUNAS), 4. ESTRUTURA MODULAR DE PASTAS (`c:\V0id\`), 5. PROMPT DE PARTIDA (PARA COLAR NO ANTIGRAVITY OU NO `agy` CLI), Tela 1: O Launcher Principal (Estilo PS5 / Apple TV), Tela 2: Interior de Qualquer Estúdio (As 3 Colunas), 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)

### Community 8 - "🌑 V0ID OS"
Cohesion: 0.07
Nodes (25): 🌑 V0ID OS — MAPA VISUAL DAS CENAS E ESTÚDIOS, [CICLO DE AUDITORIA] 2026-10-26T02:37:26.445Z, [CICLO DE AUDITORIA] 2026-10-26T02:55:06.270Z, [CICLO DE AUDITORIA] 2026-10-26T02:55:52.445Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:09:59.521Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:17:49.491Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:23:42.644Z, [CICLO DE EVOLUÇÃO CONTÍNUA] 2026-10-26T06:26:12.239Z (+17 more)

### Community 9 - "ui-launcher/package.json"
Cohesion: 0.08
Nodes (25): autoprefixer, postcss, react-dom, tailwindcss, @types/node, @types/react, typescript, dependencies (+17 more)

### Community 10 - "🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)"
Cohesion: 0.40
Nodes (4): 1. OBJETIVOS CENTRAIS (GOALS), 2. REGRAS FINANCEIRAS & OPERACIONAIS, 3. PADRÕES APRENDIDOS [APPROVED_GOLD], 🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)

### Community 11 - "StudioView.tsx"
Cohesion: 0.06
Nodes (45): react, BlackHoleIcon(), BlackHoleIconProps, AutoForgeView(), FORGE_TOOLS, ToolItem, AutomationFlow, AutomationsView() (+37 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+7 more)

### Community 16 - "v0id_blender_addon.py"
Cohesion: 0.14
Nodes (5): optimize_and_export(), parse_args(), V0ID_OT_ExportGameModel, V0ID_OT_ExportOmniMediaRender, V0ID_PT_MainPanel

### Community 17 - "ref_node_fs"
Cohesion: 0.17
Nodes (9): config, handler(), scanDir(), VAULT_ROOT, ENV_PATH, SOUL_PATH, appendLog(), LOG_FILE (+1 more)

### Community 19 - "ref_node_path"
Cohesion: 0.29
Nodes (5): compressOutput(), tools, DB_PATH, __dirname, nexus

### Community 20 - "v0id_token_budget_loop.mjs"
Cohesion: 0.12
Nodes (19): captureAllScenes(), OUTPUT_DIR, SCENES, TEMP_PROFILE_DIR, EdgeCDPClient, REPORT_FILE, runInteractiveTest(), appendLog() (+11 more)

### Community 22 - "v0id_self_healing_suite.mjs"
Cohesion: 0.31
Nodes (6): dynamicImport, handler(), logFail(), logPass(), results, runSuite()

### Community 23 - "nexus.test.js"
Cohesion: 0.33
Nodes (4): foundHistory, hibState, nextTask, projs

### Community 24 - "projects.ts"
Cohesion: 0.40
Nodes (4): DB_PATH, getDb(), handler(), VAULT_ROOT

## Knowledge Gaps
- **8 isolated node(s):** `speed`, `react-dom`, `@types/node`, `@types/react`, `autoprefixer` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 219 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `automations.ts` to `ui-launcher/package.json`, `StudioView.tsx`, `ref_node_fs`, `v0id_self_healing_suite.mjs`, `projects.ts`?**
  _High betweenness centrality (0.272) - this node is a cross-community bridge._
- **What connects `speed`, `react-dom`, `@types/node` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Why does `react` connect `StudioView.tsx` to `ui-launcher/package.json`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Should `NexusDB` be split into smaller, more focused modules?**
  _Cohesion score 0.09486166007905138 - nodes in this community are weakly interconnected._
- **Why does `NexusDB` connect `NexusDB` to `ref_node_path`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1106612685560054 - nodes in this community are weakly interconnected._