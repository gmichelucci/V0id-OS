# Graph Report - V0id  (2026-10-25)

## Corpus Check
- 58 files · ~42,163 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .bat 3, .glb 2, .example 1)

## Summary
- 336 nodes · 522 edges · 20 communities (13 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `210d3902`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent.test.js
- v0id_engine.cpp
- NexusDB
- index.js
- package.json
- cli.js
- game.ts
- 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)
- 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)
- ui-launcher/package.json
- 🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)
- StudioView.tsx
- compilerOptions
- v0id_blender_addon.py
- projetos/test/vault/README.md
- agent.js
- omni_router.test.js

## God Nodes (most connected - your core abstractions)
1. `react` - 21 edges
2. `NexusDB` - 20 edges
3. `StudioView()` - 18 edges
4. `compilerOptions` - 13 edges
5. `Gatekeeper` - 12 edges
6. `V0idAgent` - 11 edges
7. `BlackHoleIcon()` - 11 edges
8. `OmniRouter` - 10 edges
9. `next` - 9 edges
10. `RateLimitError` - 7 edges

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

## Communities (20 total, 7 thin omitted)

### Community 0 - "agent.test.js"
Cohesion: 0.07
Nodes (23): agent, antiGhostAgent, bigText, checkpoint, cmdOut, compressed, diffContent, dirList (+15 more)

### Community 3 - "index.js"
Cohesion: 0.19
Nodes (9): loadEnv(), Gatekeeper, callAgyCli(), callGemini(), callOpenAICompatible(), isAgyAvailable(), RateLimitError, TOOL_DEFINITIONS (+1 more)

### Community 4 - "package.json"
Cohesion: 0.14
Nodes (13): bin, v0id, dependencies, ws, description, name, scripts, start (+5 more)

### Community 5 - "cli.js"
Cohesion: 0.24
Nodes (4): V0idAgent, agent, rl, wsServer

### Community 7 - "🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)"
Cohesion: 0.22
Nodes (8): 1. COMO O V0ID FUNCIONA (RESUMO EXECUTIVO EM 5 PASSOS), 2. DIAGRAMA GERAL UNIFICADO DO SISTEMA (v4.0), 3. DESENHO DAS TELAS: OS 16 APPS (PS5 UI) + OS ESTÚDIOS (3 COLUNAS), 4. ESTRUTURA MODULAR DE PASTAS (`c:\V0id\`), 5. PROMPT DE PARTIDA (PARA COLAR NO ANTIGRAVITY OU NO `agy` CLI), Tela 1: O Launcher Principal (Estilo PS5 / Apple TV), Tela 2: Interior de Qualquer Estúdio (As 3 Colunas), 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)

### Community 8 - "🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)"
Cohesion: 0.22
Nodes (8): 1. COMO O V0ID FUNCIONA (RESUMO EXECUTIVO EM 5 PASSOS), 2. DIAGRAMA GERAL UNIFICADO DO SISTEMA (v4.0), 3. DESENHO DAS TELAS: OS 16 APPS (PS5 UI) + OS ESTÚDIOS (3 COLUNAS), 4. ESTRUTURA MODULAR DE PASTAS (`c:\V0id\`), 5. PROMPT DE PARTIDA (PARA COLAR NO ANTIGRAVITY OU NO `agy` CLI), Tela 1: O Launcher Principal (Estilo PS5 / Apple TV), Tela 2: Interior de Qualquer Estúdio (As 3 Colunas), 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)

### Community 9 - "ui-launcher/package.json"
Cohesion: 0.08
Nodes (25): autoprefixer, postcss, react-dom, tailwindcss, @types/node, @types/react, typescript, dependencies (+17 more)

### Community 10 - "🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)"
Cohesion: 0.40
Nodes (4): 1. OBJETIVOS CENTRAIS (GOALS), 2. REGRAS FINANCEIRAS & OPERACIONAIS, 3. PADRÕES APRENDIDOS [APPROVED_GOLD], 🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)

### Community 11 - "StudioView.tsx"
Cohesion: 0.07
Nodes (40): react, BlackHoleIcon(), BlackHoleIconProps, AutoForgeView(), FORGE_TOOLS, ToolItem, AutomationFlow, AutomationsView() (+32 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+7 more)

### Community 16 - "v0id_blender_addon.py"
Cohesion: 0.14
Nodes (5): optimize_and_export(), parse_args(), V0ID_OT_ExportGameModel, V0ID_OT_ExportOmniMediaRender, V0ID_PT_MainPanel

### Community 19 - "agent.js"
Cohesion: 0.08
Nodes (22): compressOutput(), tools, next, dynamicImport, handler(), config, handler(), scanDir() (+14 more)

### Community 22 - "omni_router.test.js"
Cohesion: 0.10
Nodes (18): fastProviders, gatekeeper, logs, providers, rle, router, tier1, tier2 (+10 more)

## Knowledge Gaps
- **8 isolated node(s):** `speed`, `react-dom`, `@types/node`, `@types/react`, `autoprefixer` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 176 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `agent.js` to `ui-launcher/package.json`, `StudioView.tsx`, `game.ts`?**
  _High betweenness centrality (0.303) - this node is a cross-community bridge._
- **What connects `speed`, `react-dom`, `@types/node` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07389162561576355 - nodes in this community are weakly interconnected._
- **Why does `react` connect `StudioView.tsx` to `ui-launcher/package.json`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `NexusDB` be split into smaller, more focused modules?**
  _Cohesion score 0.11052631578947368 - nodes in this community are weakly interconnected._
- **Why does `NexusDB` connect `NexusDB` to `omni_router.test.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._