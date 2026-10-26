# Graph Report - V0id  (2026-10-25)

## Corpus Check
- 61 files · ~41,197 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .glb 4, .godot 2, .tscn 2)

## Summary
- 342 nodes · 528 edges · 20 communities (14 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- agent.test.js
- projects-vault/global/src/v0id-game-engine/src_cpp/v0id_engine.cpp
- NexusDB
- index.js
- package.json
- cli.js
- next
- 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)
- 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)
- ui-launcher/package.json
- 🌑 V0ID OS — SOUL (Identidade, Regras & Memória Evolutiva)
- StudioView.tsx
- compilerOptions
- v0id_blender_addon.py
- projects-vault/test/vault/README.md
- projetos/test/vault/README.md
- omni_router.test.js

## God Nodes (most connected - your core abstractions)
1. `react` - 21 edges
2. `NexusDB` - 20 edges
3. `StudioView()` - 18 edges
4. `compilerOptions` - 13 edges
5. `Gatekeeper` - 12 edges
6. `OmniRouter` - 12 edges
7. `V0idAgent` - 11 edges
8. `BlackHoleIcon()` - 11 edges
9. `next` - 9 edges
10. `RateLimitError` - 7 edges

## Surprising Connections (you probably didn't know these)
- `test()` --calls--> `OmniRouter`  [EXTRACTED]
  test_followup.mjs → 01_core_security/omni-router/router.js
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

## Communities (20 total, 6 thin omitted)

### Community 0 - "agent.test.js"
Cohesion: 0.05
Nodes (40): agent, antiGhostAgent, bigText, checkpoint, cmdOut, compressed, diffContent, dirList (+32 more)

### Community 1 - "projects-vault/global/src/v0id-game-engine/src_cpp/v0id_engine.cpp"
Cohesion: 0.15
Nodes (4): V0idHighSpeedController, speed, V0idHighSpeedController, speed

### Community 3 - "index.js"
Cohesion: 0.17
Nodes (10): loadEnv(), Gatekeeper, callAgyCli(), callGemini(), callOpenAICompatible(), isAgyAvailable(), RateLimitError, TOOL_DEFINITIONS (+2 more)

### Community 4 - "package.json"
Cohesion: 0.14
Nodes (13): bin, v0id, dependencies, ws, description, name, scripts, start (+5 more)

### Community 5 - "cli.js"
Cohesion: 0.15
Nodes (6): V0idAgent, agent, rl, wsServer, V0idWSServer, ws

### Community 6 - "next"
Cohesion: 0.17
Nodes (5): next, dynamicImport, handler(), findBlenderPath(), handler()

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

### Community 19 - "omni_router.test.js"
Cohesion: 0.15
Nodes (11): fastProviders, gatekeeper, logs, providers, rle, router, tier1, tier2 (+3 more)

## Knowledge Gaps
- **9 isolated node(s):** `speed`, `speed`, `react-dom`, `@types/node`, `@types/react` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 178 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `agent.test.js`, `ui-launcher/package.json`, `StudioView.tsx`?**
  _High betweenness centrality (0.280) - this node is a cross-community bridge._
- **What connects `speed`, `speed`, `react-dom` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.053109713487071976 - nodes in this community are weakly interconnected._
- **Why does `react` connect `StudioView.tsx` to `ui-launcher/package.json`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Should `projects-vault/global/src/v0id-game-engine/src_cpp/v0id_engine.cpp` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `NexusDB` connect `NexusDB` to `agent.test.js`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `NexusDB` be split into smaller, more focused modules?**
  _Cohesion score 0.11052631578947368 - nodes in this community are weakly interconnected._