<div align="center">

<img src="./v0id_logo.png" alt="V0id OS Logo" width="130" />

# V0ID OS
### Sistema Operacional Autônomo Soberano & Motor de Produção com IA

🇧🇷 **Português** • [🇺🇸 English Version](./README_EN.md)

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](./LICENSE)
[![Remotion](https://img.shields.io/badge/Remotion-Video_Engine-red.svg?style=for-the-badge&logo=react)](https://www.remotion.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_Vault-003B57.svg?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Self-Healing](https://img.shields.io/badge/Self--Healing-Automated_Suite-purple.svg?style=for-the-badge)](./EVOLUTION_LOG.md)

<br/>

**V0id OS** é uma plataforma soberana e sistema operacional autônomo projetado para orquestração de múltiplos estúdios de desenvolvimento de software, criação de jogos, engenharia reversa de ferramentas, produção audiovisual multimodal com IA e automação 24/7 com rotinas de auto-cura (*self-healing*).

> 🌐 **English Overview:** *V0id OS is a sovereign, local-first autonomous developer operating system and creative workstation engineered for multi-agent AI orchestration, full-stack software development, 2D/3D game design, multimodal media synthesis, and self-healing automated loops. Full documentation in English is available in [README_EN.md](./README_EN.md).*

[Instalação Rápida](#-instalação-rápida-onboarding-em-1-clique) • [Configuração de Modelos](#-configuração-de-modelos-e-chaves-omniroute) • [Catálogo dos Estúdios](#-catálogo-dos-14-estúdios-de-produção) • [Arquitetura & Segurança](#-arquitetura-de-privacidade--zero-leak) • [Licença](#-licença)

</div>

---

## 🌟 Visão Geral & Recursos Principais

* **🔄 OmniRoute — Roteamento Inteligente Resiliente:** Roteador com tolerância a falhas e chaveamento automático entre múltiplos provedores em caso de limite de taxa (*429 Rate Limit*). Suporta streaming SSE em tempo real, cálculo dinâmico de latência e balanceamento inteligente entre Gemini, Groq, Cerebras, OpenRouter e instâncias locais.
* **🎬 Workstation Multimodal Unificada (OmniMedia Studio):** Esteiras integradas para síntese neural de imagens em alta resolução (FLUX.1), clonagem e geração de voz ultra-expressiva (*F5-TTS / Kokoro*), composição de vídeo programático (*Remotion + FFmpeg*) e conversão 3D (TRELLIS + Blender headless).
* **🔒 Cofre de Consistência (`nexus.db`):** Banco relacional SQLite local de alta performance (`node:sqlite`) que trava seeds de rostos (IP-Adapter), perfis de voz e identidades visuais de personagens entre múltiplos episódios e mídias.
* **🎮 Game & Code Studio Integrados:** Suporte para fluxos de desenvolvimento de software, editor com Prompt Improver, terminal nativo integrado, visualizador de diffs lado a lado e viewport 2D/3D compatível com pipelines Godot, Phaser e Blender.
* **🛡️ Arquitetura Zero-Leak Soberana:** Seus dados, histórico de conversas, credenciais e arquivos de projeto nunca saem da sua máquina sem a sua autorização explícita. Zero telemetria, zero dependência de serviços fechados de terceiros.
* **⚡ Auto-Cura (*Self-Healing*):** Suíte de testes automáticos com validação de tipagem TypeScript em tempo real, varredura de integridade AST via Graphify e logs de evolução contínua.

---

## ⚡ Instalação Rápida (Onboarding em 1 Clique)

O V0id OS foi arquitetado para ser completamente auto-contido, rápido e portátil em ambientes Windows, Linux e macOS.

### Pré-requisitos:
* **Node.js 18+ ou 22+ (LTS recomendado):** [Baixar Node.js](https://nodejs.org/)
* **FFmpeg (Recomendado para aceleração de vídeo e renderização Remotion):**  
  No Windows (PowerShell): `winget install Gyan.FFmpeg`  
  No Linux (Ubuntu/Debian): `sudo apt-get install ffmpeg`  
  No macOS (Homebrew): `brew install ffmpeg`

---

### Executando no Windows:

```powershell
# 1. Clone o repositório:
git clone https://github.com/gmichelucci/V0id-OS.git
cd V0id-OS

# 2. Execute o instalador automático:
.\instalar_v0id.bat
# (Ou manualmente: npm run setup)
```

O assistente de onboarding realiza o setup completo em segundos:
* ✅ Instala automaticamente as dependências do núcleo e da interface Next.js/Tailwind;
* ✅ Gera o seu arquivo de ambiente local seguro `.env` a partir de `.env.example`;
* ✅ Inicializa uma base SQLite limpa e isolada no seu disco local (`nexus.db`);
* ✅ Detecta e valida o binário nativo do FFmpeg.

### Para Iniciar o Sistema:
Dê um duplo clique em **`iniciar_v0id.bat`** (ou execute `npm run dev`).  
A interface abrirá automaticamente no seu navegador em **`http://localhost:3000`**.

---

## 🔑 Configuração de Modelos e Chaves (OmniRoute)

O **OmniRouter** permite alternar e rotacionar provedores sem interromper pipelines de produção:

Abra o arquivo `.env` criado na raiz do projeto e insira as credenciais dos provedores que desejar:

| Provedor | Modelos Atendidos | Como Obter |
| :--- | :--- | :--- |
| **Google Gemini** | *Gemini 2.5 Flash, Gemini 2.0 Flash, Gemini 3.1 Pro* | Gratuito em [aistudio.google.com](https://aistudio.google.com/) |
| **Groq** | *Llama 3.3 70B Versatile (Inferência de Alta Velocidade)* | Gratuito em [console.groq.com](https://console.groq.com/) |
| **Cerebras** | *Llama 3.3 70B (Taxa de até 1.200 tokens/seg)* | Gratuito em [cloud.cerebras.ai](https://cloud.cerebras.ai/) |
| **OpenRouter** | *Modelos Abertos (:free) e Rotas Flexíveis* | Gratuito em [openrouter.ai](https://openrouter.ai/) |

> [!TIP]
> **Modo Local Offline:** O V0id OS opera mesmo sem provedores de nuvem, conectando-se a instâncias locais (Ollama, LM Studio, vLLM) e utilizando síntese local de mídia.

---

## 🎨 Catálogo dos 14 Estúdios de Produção

| # | Estúdio | Identificador | Categoria | Descrição Principal | Preview |
|---|---|---|---|---|---|
| **01** | **Chat Global** | `chat` | Controle | Orquestrador supremo com execução de pipelines multi-agente e streaming SSE | [Preview](./docs/scenes/01_chat_global.png) |
| **02** | **Core Soul** | `core` | Controle | Master Blueprint (`V0ID_SPEC.md`) e parâmetros operacionais do sistema | [Preview](./docs/scenes/02_core_soul.png) |
| **03** | **Auto-Forge** | `auto-forge` | Controle | Radar de novas ferramentas, engenharia reversa REA e auto-evolução contínua | [Preview](./docs/scenes/03_auto_forge.png) |
| **04** | **Segurança Sandbox** | `security` | Controle | Ambiente de execução isolado, Semgrep SAST e travas financeiras | [Preview](./docs/scenes/04_security_sandbox.png) |
| **05** | **Plugins MCP** | `plugins` | Infra | Gerenciador de servidores Model Context Protocol com lazy-loading sob demanda | [Preview](./docs/scenes/05_plugins_mcp.png) |
| **06** | **Regras do Sistema** | `rules` | Infra | Gestor de comportamentos modulares (Caveman, Ponytail Senior Dev, Estilos Customizados) | [Preview](./docs/scenes/06_rules_system.png) |
| **07** | **Automações n8n** | `automations` | Infra | Fila de fluxos agendados em background e robôs autônomos 24/7 | [Preview](./docs/scenes/07_automations_n8n.png) |
| **08** | **Repository Hub** | `repository` | Infra | Sincronizador de código (Git/GitHub) e mídias de produção em nuvem | [Preview](./docs/scenes/08_repository_hub.png) |
| **09** | **Code Studio** | `code` | Estúdio | Editor de código, Prompt Improver com IA, visual diffs e terminal integrado | [Preview](./docs/scenes/09_code_studio.png) |
| **10** | **Game Studio Engine** | `game` | Estúdio | Viewport 2D/3D (Godot/Phaser), inspetor de entidades de cena e integração Blender | [Preview](./docs/scenes/10_game_engine.png) |
| **11** | **OmniMedia Studio** | `omnimedia` | Estúdio | Workstation com 4 bancadas: Imagem/3D, Áudio/Voz, Consistência e Timeline de Vídeo | [Preview](./docs/scenes/11_omnimedia_studio.png) |
| **12** | **Research Studio** | `research` | Estúdio | Radar de papers científicos, extração estruturada de conteúdo e síntese técnica | [Preview](./docs/scenes/12_research_studio.png) |
| **13** | **Marketing Agency** | `marketing` | Negócios | Automação de divulgação de releases, documentação de software e campanhas | [Preview](./docs/scenes/13_marketing_agency.png) |
| **14** | **Finanças & Caixa** | `finances` | Negócios | Livro-caixa limpo por projeto e monitoramento automatizado de editais públicos | [Preview](./docs/scenes/14_finances_caixa.png) |

---

## 🔒 Arquitetura de Privacidade & Zero-Leak

O V0id OS foi projetado para uso comercial sério e segurança corporativa:
1. **Isolamento de Estado no Disco Local:** Todos os prompts, sessões, checkpoints e históricos residem em bancos SQLite protegidos (`nexus.db`), ignorados por padrão no controle de versão.
2. **Assets e Mídias Privados:** Imagens, vídeos, modelos 3D e áudios sintetizados permanecem estritamente no armazenamento local (`public/generated/` e `assets/`).
3. **Auditoria Transparente:** Código 100% aberto, sem telemetria embutida, sem conexões ocultas e auditável por qualquer ferramenta SAST/DAST.

---

## 🛠️ Comandos de Desenvolvimento & Testes

```powershell
# Executar a suíte completa de auto-cura e integridade:
npm run test:suite

# Executar testes unitários do roteador e provedores:
npm run test:omniroute

# Executar testes unitários do agente de terminal:
npm run test:agent

# Atualizar o grafo de conhecimento semântico AST (Graphify):
graphify update .
```

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para obter todos os termos e condições.

<br/>

<div align="center">
<sub>V0id OS — Engenharia de Software Soberana & Autonomia Criativa.</sub>
</div>
