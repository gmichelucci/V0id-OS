<div align="center">

<img src="./v0id_logo.png" alt="V0id OS Logo" width="130" />

# V0ID OS
### Sovereign Autonomous Multi-Studio Operating System & AI Production Engine

[🇧🇷 Ler em Português](./README.md) • 🇺🇸 **English**

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](./LICENSE)
[![Remotion](https://img.shields.io/badge/Remotion-Video_Engine-red.svg?style=for-the-badge&logo=react)](https://www.remotion.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_Vault-003B57.svg?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Self-Healing](https://img.shields.io/badge/Self--Healing-Automated_Suite-purple.svg?style=for-the-badge)](./EVOLUTION_LOG.md)

<br/>

**V0id OS** is a sovereign, local-first autonomous developer operating system and creative workstation engineered for multi-agent AI orchestration, full-stack software development, 2D/3D game design, multimodal media synthesis (neural voice cloning, high-fidelity image generation, programmatic video composition), reverse-engineering engines, and 24/7 self-healing automated loops.

[Quickstart](#-quickstart-1-click-onboarding) • [OmniRoute Engine](#-omniroute-model-routing--free-tiers) • [Studio Catalog](#-the-14-integrated-production-studios) • [Privacy & Zero-Leak Architecture](#-privacy--zero-leak-architecture) • [License](#-license)

</div>

---

## 🌟 Key Features & Architectural Highlights

* **🔄 OmniRoute — Resilient Multi-Provider Model Routing:** Fault-tolerant AI router with instant sub-second failover when encountering rate limits (*429 Too Many Requests*). Supports real-time Server-Sent Events (SSE) streaming, adaptive latency tracking, and automatic load balancing across Google Gemini (Flash, Pro, Argon), Groq (Llama 3.3 70B), Cerebras (up to 1,200 tokens/sec), OpenRouter, and local offline models (Ollama, LM Studio, vLLM).
* **🎬 Unified Multimodal Workstation (OmniMedia Studio):** Fully integrated production workbenches for neural image synthesis (FLUX.1), ultra-expressive zero-shot voice cloning (*F5-TTS / Kokoro*), programmatic video rendering (*Remotion + native FFmpeg*), and automated 3D mesh pipelines (TRELLIS + Blender headless).
* **🔒 Consistency Vault (`nexus.db`):** High-performance embedded SQLite database (`node:sqlite`) that locks character facial seeds (IP-Adapter), voice profiles, and visual styling across complex iterative media pipelines.
* **🎮 Integrated Game & Code Studios:** Built-in code editor with AI Prompt Improver, native terminal drawer, side-by-side visual diff inspector, and 2D/3D viewport compatible with Godot, Phaser, and Blender pipelines.
* **🛡️ Sovereign Zero-Leak Architecture:** Your prompts, conversations, credentials, and project files remain strictly on your local disk. Zero cloud telemetry, zero tracking, zero unauthorized network calls.
* **⚡ Self-Healing Engineering Suite:** Automated verification loop validating TypeScript typing across all 14 studios, continuous AST knowledge graph synchronization (Graphify), and visual inspection snapshots.

---

## ⚡ Quickstart (1-Click Onboarding)

V0id OS is engineered to be portable, self-contained, and lightweight across Windows, Linux, and macOS environments.

### Prerequisites:
* **Node.js 18+ or 22+ (LTS recommended):** [Download Node.js](https://nodejs.org/)
* **FFmpeg (Recommended for real-time video acceleration and Remotion):**  
  Windows (PowerShell): `winget install Gyan.FFmpeg`  
  Linux (Ubuntu/Debian): `sudo apt-get install ffmpeg`  
  macOS (Homebrew): `brew install ffmpeg`

---

### Step-by-Step Installation:

```powershell
# 1. Clone the repository:
git clone https://github.com/gmichelucci/V0id-OS.git
cd V0id-OS

# 2. Run the automated 1-click installer:
.\instalar_v0id.bat
# (Or via terminal: npm run setup)
```

The automated onboarding wizard configures your environment in seconds:
* ✅ Installs core and Next.js/Tailwind web studio dependencies;
* ✅ Creates your secure local `.env` configuration from `.env.example`;
* ✅ Initializes a clean SQLite schema in your local workspace (`nexus.db`);
* ✅ Detects and validates your native FFmpeg binary.

### Starting the System:
Double-click **`iniciar_v0id.bat`** (or run `npm run dev`).  
The dashboard will open automatically in your browser at **`http://localhost:3000`**.

---

## 🔑 OmniRoute Model Routing & Free Tiers

**OmniRouter** allows seamless rotation between free-tier providers to keep your production pipelines running 24/7 without quota interruptions:

Open the `.env` file generated at the project root and add your preferred provider keys:

| Provider | Supported Models | How to Obtain |
| :--- | :--- | :--- |
| **Google Gemini** | *Gemini 2.5 Flash, Gemini 2.0 Flash, Gemini 3.1 Pro* | Free at [aistudio.google.com](https://aistudio.google.com/) |
| **Groq** | *Llama 3.3 70B Versatile (Ultra-High Speed Inference)* | Free at [console.groq.com](https://console.groq.com/) |
| **Cerebras** | *Llama 3.3 70B (Up to 1,200 tokens/sec)* | Free at [cloud.cerebras.ai](https://cloud.cerebras.ai/) |
| **OpenRouter** | *Open Models (:free) & Flexible Fallback Routes* | Free at [openrouter.ai](https://openrouter.ai/) |

> [!TIP]
> **Local Offline Mode:** V0id OS runs seamlessly without external cloud keys by connecting to local OpenAI-compatible endpoints (Ollama, LM Studio, vLLM) and utilizing local media engines.

---

## 🎨 The 14 Integrated Production Studios

| # | Studio | Identifier | Category | Core Purpose | Preview |
|---|---|---|---|---|---|
| **01** | **Global Chat** | `chat` | Control | Central orchestrator with multi-agent pipelines and real-time SSE streaming | [Preview](./docs/scenes/01_chat_global.png) |
| **02** | **Core Soul** | `core` | Control | Master Blueprint (`V0ID_SPEC.md`) and operational parameters | [Preview](./docs/scenes/02_core_soul.png) |
| **03** | **Auto-Forge** | `auto-forge` | Control | Web tool discovery radar, REA reverse engineering, and auto-evolution | [Preview](./docs/scenes/03_auto_forge.png) |
| **04** | **Security Sandbox** | `security` | Control | Isolated execution cage, Semgrep SAST scanner, and financial locks | [Preview](./docs/scenes/04_security_sandbox.png) |
| **05** | **MCP Plugins** | `plugins` | Infra | Model Context Protocol server manager with on-demand lazy loading | [Preview](./docs/scenes/05_plugins_mcp.png) |
| **06** | **Rules System** | `rules` | Infra | Modular behavior profiles (Caveman, Ponytail Senior Dev, Custom Prompts) | [Preview](./docs/scenes/06_rules_system.png) |
| **07** | **Automations** | `automations` | Infra | Scheduled background task queues and autonomous 24/7 bots | [Preview](./docs/scenes/07_automations_n8n.png) |
| **08** | **Repository Hub** | `repository` | Infra | Code synchronization (Git/GitHub) and cloud asset storage bridge | [Preview](./docs/scenes/08_repository_hub.png) |
| **09** | **Code Studio** | `code` | Studio | Code editor, AI Prompt Improver, visual diff inspector, and native terminal | [Preview](./docs/scenes/09_code_studio.png) |
| **10** | **Game Studio Engine** | `game` | Studio | 2D/3D viewport (Godot/Phaser), scene entity inspector, and Blender pipeline | [Preview](./docs/scenes/10_game_engine.png) |
| **11** | **OmniMedia Studio** | `omnimedia` | Studio | 4-bench workstation: Image/3D, Audio/Voice, Consistency Vault, and Video | [Preview](./docs/scenes/11_omnimedia_studio.png) |
| **12** | **Research Studio** | `research` | Studio | Academic paper radar, structured document extractor, and technical summaries | [Preview](./docs/scenes/12_research_studio.png) |
| **13** | **Marketing Agency** | `marketing` | Business | Release publication automation, technical documentation, and social campaigns | [Preview](./docs/scenes/13_marketing_agency.png) |
| **14** | **Finances & Treasury** | `finances` | Business | Project ledger accounts and automated public tender monitoring | [Preview](./docs/scenes/14_finances_caixa.png) |

---

## 🔒 Privacy & Zero-Leak Architecture

V0id OS is engineered for commercial production, developer privacy, and enterprise security:
1. **Isolated Local State:** All prompt histories, sessions, checkpoints, and tasks reside in local SQLite databases (`nexus.db`), ignored by default in version control.
2. **Private Generated Media:** All synthesized images, cloned audio files, 3D models, and rendered MP4 videos remain strictly within your local storage (`public/generated/` and `assets/`).
3. **Auditable Open Code:** 100% open source and transparent. Zero proprietary telemetry, zero background telemetry pings, and completely inspectable via standard SAST/DAST tools.

---

## 🛠️ Developer Commands & Test Suites

```powershell
# Run the complete self-healing test suite:
npm run test:suite

# Run OmniRouter and model provider unit tests:
npm run test:omniroute

# Run terminal agent and anti-ghost-write test suite:
npm run test:agent

# Update the AST semantic knowledge graph (Graphify):
graphify update .
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

<br/>

<div align="center">
<sub>V0id OS — Sovereign Software Engineering & Autonomous Creative Systems.</sub>
</div>
