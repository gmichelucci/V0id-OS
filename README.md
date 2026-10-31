<div align="center">

# 🌑 V0ID OS
### Sovereign Autonomous Multi-Studio Operating System & Media Director

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Remotion](https://img.shields.io/badge/Remotion-Video_Engine-red.svg?style=for-the-badge&logo=react)](https://www.remotion.dev/)
[![Self--Healing](https://img.shields.io/badge/Self--Healing_Suite-100%25_Passing-emerald.svg?style=for-the-badge&logo=checkmarx)](file:///c:/V0id/EVOLUTION_LOG.md)
[![Graphify AST](https://img.shields.io/badge/Knowledge_Graph-AST_Synced-purple.svg?style=for-the-badge)](file:///c:/V0id/graphify-out/)
[![License](https://img.shields.io/badge/License-Commercial_Sovereign-gray.svg?style=for-the-badge)](./LICENSE)

<br/>

**V0id OS** é um sistema operacional autônomo soberano projetado para orquestração de múltiplos estúdios de desenvolvimento de software, criação de jogos, produção audiovisual com IA (Reels do Instagram, novelas no DramaBox com consistência de personagens, clipes cinematográficos e conteúdo livre sem censura), pesquisa avançada e automação 24/7 com auto-cura (*self-healing*).

[Instalação Rápida](#-instalação-rápida-onboarding-em-1-clique) • [Configuração de Chaves](#-configuração-de-chaves-de-ia-gratuitas) • [Estúdios & OmniMedia](#-catálogo-dos-14-estúdios-de-produção) • [Especificação Mestre](./V0ID_SPEC.md)

</div>

---

## ⚡ Instalação Rápida (Onboarding em 1 Clique)

O V0id OS foi arquitetado para ser portátil e auto-instalável em qualquer computador (Windows, Linux ou macOS), sem vazamento de dados prévios:

### Pré-requisitos:
* **Node.js 18+ ou 22+ (LTS recomendado):** [Baixar Node.js](https://nodejs.org/)
* **FFmpeg (Recomendado para aceleração de vídeo em tempo real):**  
  No Windows (PowerShell): `winget install Gyan.FFmpeg`

---

### Passo a Passo no Windows:

```powershell
# 1. Clone o repositório oficial:
git clone https://github.com/gmichelucci/V0id-OS.git
cd V0id-OS

# 2. Execute o instalador automático de 1 clique:
.\instalar_v0id.bat
# (Ou no terminal: npm run setup)
```

O assistente de onboarding fará todo o trabalho pesado por você:
* ✅ Instala automaticamente as dependências do núcleo e da interface Next.js/Remotion;
* ✅ Cria o seu arquivo `.env` seguro a partir do modelo `.env.example`;
* ✅ Inicializa uma base SQLite limpa e segura no seu disco local (`nexus.db`);
* ✅ Valida seu compilador de vídeo FFmpeg nativo.

### Para Iniciar o Sistema:
Dê um duplo clique em **`iniciar_v0id.bat`** (ou execute `npm run dev`).  
O painel abrirá automaticamente no seu navegador em **`http://localhost:3000`**.

---

## 🔑 Configuração de Chaves de IA (Gratuitas)

O V0id OS utiliza o **OmniRouter**, um roteador inteligente de modelos com fallback automático entre cotas gratuitas para nunca interromper suas tarefas por limite de taxa (*429 Rate Limit*).

Abra o arquivo `.env` gerado na raiz e insira as chaves que desejar (todas possuem planos gratuitos generosos):

| Provedor | Modelos Atendidos | Como Obter Gratuitamente |
| :--- | :--- | :--- |
| **Google Gemini** | *Gemini 2.5 Flash*, *Gemini 2.0 Flash*, *Gemini 3.1 Pro* | Crie grátis em [aistudio.google.com](https://aistudio.google.com/) |
| **Groq** | *Llama 3.3 70B (Alta Velocidade)* | Crie grátis em [console.groq.com](https://console.groq.com/) |
| **Cerebras** | *Llama 3.3 70B (1.200 tokens/segundo ultra-rápido)* | Crie grátis em [cloud.cerebras.ai](https://cloud.cerebras.ai/) |
| **OpenRouter** | *Modelos Livres (:free) & Rota Sem Censura (Hermes 3 / Dolphin)* | Crie grátis em [openrouter.ai](https://openrouter.ai/) |

> [!TIP]
> **Modo Local Offline:** O V0id funciona mesmo sem nenhuma chave paga externa, utilizando a rede neural soberana aberta para síntese de imagens e áudio.

---

## 🎬 OmniStudio & Síntese Multimodal Unificada

O V0id OS resolve a sincronia de mídia através de um **Painel do Diretor no Chat Global**:

### 1. Seletor Interativo de Motores
Ao solicitar a criação de imagens, vídeos ou músicas no chat, o V0id exibe o catálogo de motores para você escolher antes de renderizar:
* 🍌 **Google Nano Banana Pro / Lite:** Fotorrealismo e fidelidade tipográfica estrita (Google Flow).
* ⚡ **FLUX.1 Sovereign (12B):** Fotorrealismo de estúdio com **liberdade total sem censura (+18)**.
* 🎬 **Google Veo / Wan2.1:** Cenas cinematográficas em vídeo HD.
* 🎙️ **F5-TTS / Kokoro:** Clonagem de voz humana ultra-expressiva estilo ElevenLabs.
* 🎵 **Google Flow Music / MusicFX:** Composição de trilhas sonoras e efeitos sonoros.

### 2. Esteiras Criativas Especializadas
* **Notícias do Instagram (Reels verticais 9:16):** Roteiro automatizado -> Locução humana -> Legendas sincronizadas estilo Alex Hormozi (`WhisperX`) -> Renderização ultra-rápida via **FFmpeg** / **Remotion**.
* **Novelas DramaBox (Consistência de Personagens):** O **Cofre de Consistência (`nexus.db`)** trava os traços faciais (IP-Adapter) e o timbre da voz dos personagens em múltiplos episódios com sincronia labial (*LivePortrait*).
* **Esteira Sem Censura:** Rota soberana 100% isolada para roteiros livres (*Hermes 3 70B*) e arte visual sem filtros morais restritivos.

---

## 🎨 Catálogo dos 14 Estúdios de Produção

| # | Estúdio | Identificador | Categoria | Descrição Principal | Preview |
|---|---|---|---|---|---|
| **01** | **Chat Global** | `chat` | Controle | Orquestrador Supremo com execução de pipelines multi-estúdio | [Foto](./docs/scenes/01_chat_global.png) |
| **02** | **Core Soul** | `core` | Controle | Master Blueprint (`V0ID_SPEC.md`) e parâmetros operacionais | [Foto](./docs/scenes/02_core_soul.png) |
| **03** | **Auto-Forge** | `auto-forge` | Controle | Radar de MCPs na web, engenharia reversa REA e auto-evolução | [Foto](./docs/scenes/03_auto_forge.png) |
| **04** | **Segurança Sandbox** | `security` | Controle | Jaula Docker de teste, Semgrep SAST e trava financeira de saque | [Foto](./docs/scenes/04_security_sandbox.png) |
| **05** | **Plugins MCP** | `plugins` | Infra | Gerenciador de servidores MCP com carregamento sob demanda (*lazy-loading*) | [Foto](./docs/scenes/05_plugins_mcp.png) |
| **06** | **Regras do Sistema** | `rules` | Infra | Gerenciador de modos: Caveman, Sem Censura e Ponytail Senior | [Foto](./docs/scenes/06_rules_system.png) |
| **07** | **Automações n8n** | `automations` | Infra | Fila de fluxos em background e robôs autônomos 24/7 | [Foto](./docs/scenes/07_automations_n8n.png) |
| **08** | **Repository Hub** | `repository` | Infra | Sincronizador de código (GitHub) e mídias brutas (Google Drive) | [Foto](./docs/scenes/08_repository_hub.png) |
| **09** | **Code Studio** | `code` | Estúdio | Editor, Prompt Improver com IA e terminal nativo PowerShell | [Foto](./docs/scenes/09_code_studio.png) |
| **10** | **Game Studio Engine** | `game` | Estúdio | Viewport 2D/3D (Godot/Phaser), árvore de entidades e ponte Blender | [Foto](./docs/scenes/10_game_engine.png) |
| **11** | **OmniMedia Studio** | `omnimedia` | Estúdio | Workstation com 4 bancadas: Imagem (FLUX), Áudio (F5-TTS), Vídeo e Remotion | [Foto](./docs/scenes/11_omnimedia_studio.png) |
| **12** | **Research Studio** | `research` | Estúdio | Radar de papers acadêmicos, extração de texto e scores técnicos | [Foto](./docs/scenes/12_research_studio.png) |
| **13** | **Marketing Agency** | `marketing` | Negócios | Campanhas de social media, gerador de Reels e branding | [Foto](./docs/scenes/13_marketing_agency.png) |
| **14** | **Finanças & Caixa** | `finances` | Negócios | Livro-caixa Clean Slate (saldo inicial R$ 0,00) e radar de licitações | [Foto](./docs/scenes/14_finances_caixa.png) |

---

## 🔒 Arquitetura de Privacidade & Segurança Comercial

O V0id OS foi construído sobre o princípio de **Privacidade Absoluta (Zero-Leak)**:
1. **Bancos de Dados Isolados no Disco:** Nenhum histórico de conversas, prompts ou tarefas locais é sincronizado com servidores externos ou repositórios Git (`*.db` é bloqueado por padrão).
2. **Mídias e Imagens Privadas:** Todas as fotos, áudios e vídeos sintetizados permanecem estritamente no seu computador (`public/generated/` e `assets/` são ignorados no versionamento).
3. **Sem Telemetria ou Rastreadores:** O código é 100% aberto, transparente e auditável.

---

## ⚡ Comandos Úteis do Desenvolvedor

```powershell
# Executar a suíte de auto-cura e testes de integridade:
npm run test:suite

# Executar testes unitários do OmniRouter e Agente ReAct:
npm run test:omniroute
npm run test:agent

# Atualizar o grafo de conhecimento semântico AST (Graphify):
graphify update .
```

---

<div align="center">
<sub>V0id OS — Engenharia de Software Soberana & Autonomia Criativa.</sub>
</div>
