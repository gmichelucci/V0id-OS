# 🌑 V0ID OS — BLUEPRINT MESTRE & ESPECIFICAÇÃO OFICIAL (v4.0 FINAL)

Este documento consolida toda a arquitetura, regras de hardware, unificação de tokens, memória contínua e interface do **V0id OS**. Ele deve ficar salvo na raiz da pasta `c:\V0id\V0ID_SPEC.md` para servir como o mapa mental fixo de todos os agentes que trabalharem no projeto.

---

## 1. COMO O V0ID FUNCIONA (RESUMO EXECUTIVO EM 5 PASSOS)

Para não haver nenhuma confusão, todo o funcionamento do **V0id** se resume a este fluxo de 5 etapas:

1. **O Corpo Desacoplado (Terminal + Interface PS5):**
   - O verdadeiro cérebro do sistema é o **`v0id-cli`**, um agente de terminal puro (estilo Claude Code) que roda levinho no seu Windows.
   - Por cima dele (conectada via WebSocket `ws://localhost:7777`), roda a **`ui-launcher`**: uma interface ultra-leve em **Tauri v2** (~30 MB de RAM, zero peso na sua placa **Intel Iris Xe**) com visual de **PlayStation 5 / Apple TV** no menu principal e galeria estilo **Google Flow** dentro dos estúdios.
   - Você também controla tudo pelo celular via **Tailscale** (interface completa na tela do celular) ou via **WhatsApp** (mandando áudios na rua).

2. **O Porteiro Econômico (`Gatekeeper & Prompt Improver`):**
   - Quando você digita qualquer pedido (ex: *"crie uma novela de zumbi de 12 episódios no nosso padrão"*), essa mensagem **não** vai direto para o modelo mais caro.
   - Primeiro, um **Modelo Porteiro gratuito e abundante** lê a sua frase, puxa suas preferências no banco de memória (`LanceDB` + `SOUL.md`) e o mapa dos arquivos (`Graphify`).
   - Se for uma pergunta simples, o próprio Porteiro responde na hora (**gasto zero** de tokens nobres). Se for uma criação complexa, ele reescreve o seu pedido transformando-o em um **Super-Prompt Técnico Cirúrgico** (Modo Caveman).

3. **A Unificação dos "Dois Baldes" de Tokens (`OmniRoute` + `agy` CLI):**
   - **Balde 1 (Cota Diária / Pool Infinito via `OmniRoute`):** Recebe o Super-Prompt e usa a sua chave oficial do Google AI Studio (**Gemini 4 Argon** / Gemini Pro), Claude, Groq, Cerebras e OpenRouter (`:free`). Se um modelo atingir o limite (`erro 429`), o OmniRoute troca para o próximo da fila em milissegundos sem parar o trabalho. Se o tema for adulto ou sensível, ele chaveia para a **Rota Sem Censura** (modelos *Abliterated / Dolphin*).
   - **Balde 2 (Cota Semanal do Antigravity via `agy` CLI):** Quando o V0id precisa executar uma refatoração pesada de código local, o `v0id-cli` aciona o executável oficial de terminal do Antigravity (`agy -p "Super-Prompt"`). Como o prompt já chega 100% mastigado pelo Porteiro, você usa o **Argon** da sua cota semanal com precisão cirúrgica, sem pagar o "pedágio duplo" da interface do Antigravity.

4. **As GPUs Gratuitas na Nuvem (Estúdios Multimodais):**
   - Sua placa **Intel Iris Xe** nunca sofre. Quando os estúdios precisam clonar sua voz (**F5-TTS**), gerar imagens sem filtro ou personagens consistentes (**FLUX.1 + IP-Adapter**), criar modelos 3D/Sprites para o *Space Tide* (**TRELLIS**) ou legendar vídeos (**WhisperX `.ass`**), o V0id dispara chamadas invisíveis via `gradio_client` para as GPUs gratuitas do Hugging Face Spaces, Google Flow e **Jules** (programador na nuvem), salvando o arquivo pronto no seu PC.

5. **Memória que Aprende Seu Gosto + Auto-Forja (`Self-Forging`):**
   - **Memória Cruzada (`Nexus DB`):** Se uma conversa usou *Audio Studio*, *Film Studio* e *Game Studio* para criar uma cena do jogo **Space Tide**, ela recebe as tags dos 3 e aparece automaticamente na galeria dos 3 estúdios.
   - **Aprendizado Contínuo (`Reflection Loop`):** Tudo que você aprova ganha o selo `[APPROVED_GOLD]` no `LanceDB`. O V0id extrai o que você gosta (ritmo de edição, cores, estilo de código) e grava no `SOUL.md`, ficando mais parecido com você a cada dia.
   - **Auto-Forja (`Auto-Forge + REA`):** Se você pedir algo que o V0id ainda não sabe fazer (ou cuja ferramenta na internet seja paga), ele isola o programa pago na **Sandbox Docker**, usa o **REA** para fazer engenharia reversa (ou programa do zero com o **Jules**), transforma em um novo plugin MCP e te envia uma **Nota de Atualização** pedindo 1 clique para instalar nele mesmo.

---

## 2. DIAGRAMA GERAL UNIFICADO DO SISTEMA (v4.0)

```text
=========================================================================================================
                       CAMADA DE CONTROLE & VISUALIZAÇÃO (ZERO PESO NA IRIS XE)
  [ 🖥️ Desktop UI: Tauri v2 (PS5 / Apple TV + Flow) ]   [ 📱 Celular: Tailscale WebApp + WhatsApp Bot ]
====================================================+====================================================
                                                    | (WebSocket Local: ws://localhost:7777)
                                                    v
=========================================================================================================
                     NÚCLEO DE TERMINAL: v0id-cli (Agente Puro Estilo Claude Code)
       • Acesso Nativo: Arquivos Locais, Terminal Bash/PS, Graphify (AST), Ponitail, RTK, Checkpoints
====================================================+====================================================
                                                    |
                                                    v
=========================================================================================================
                    ESTÁGIO 1: GATEKEEPER & PROMPT IMPROVER (Triagem de Custo Zero)
   1. Lê sua mensagem bruta  -->  2. Puxa gostos [APPROVED_GOLD] no LanceDB + SOUL.md + Grafo Graphify
   3. Tarefa simples? Responde na hora.  |  Tarefa complexa? Compila SUPER-PROMPT TÉCNICO (Modo Caveman)
====================================================+====================================================
                                                    |
                       +----------------------------+----------------------------+
                       |                                                         |
                       v                                                         v
+----------------------------------------------+       +------------------------------------------------+
|   BALDE 1: OMNIROUTE (Cota Diária & Pool)    |       |  BALDE 2: ANTIGRAVITY CLI (`agy -p`)           |
| • 1º Gemini 4 Argon / Claude (API Oficial)   |       | • Consome a Cota Semanal do Argon sem abrir    |
| • 2º Groq / Cerebras / GitHub Models (Grátis)|       |   a IDE pesada e sem "pedágio duplo"           |
| • 3º Rota Sombra Sem Censura (Abliterated)   |       | • Usado apenas para execução cirúrgica `/goal` |
+----------------------+-----------------------+       +-------------------------+----------------------+
                       |                                                         |
                       +----------------------------+----------------------------+
                                                    |
                                                    v
=========================================================================================================
                     MEMÓRIA CRUZADA (NEXUS DB) & COFRE DE CONSISTÊNCIA (VAULT)
  • SQLite: Cruza histórico entre estúdios (#SpaceTide #Film #Audio #Game)
  • LanceDB: Memória Semântica dos seus gostos, novelas passadas e ideias antigas
  • Consistency Vault: Trava Sementes (Seeds), Fotos de Rosto (IP-Adapter) e Vozes (.wav) dos personagens
====================================================+====================================================
                                                    | (Meta-MCP Lazy Loader: Só carrega o que usar)
        +-------------------------------------------+-------------------------------------------+
        |                                           |                                           |
        v                                           v                                           v
+-------------------------------+   +-----------------------------------+   +---------------------------+
|  BRAÇO 1: DEV & AUTO-FORJA    |   |  BRAÇO 2: ESTÚDIOS (CLOUD GPU)    |   |  BRAÇO 3: CAIXA & REDES   |
| • Jules (Delega PRs na nuvem) |   | • Voz: F5-TTS (Sua Voz) + Kokoro  |   | • Marketing: Instagram    |
| • REA (Reverse Eng. em Docker)|   | • Img: FLUX.1 + RMBG-2.0 (Recorte)|   |   Graph API (News & Dev)  |
| • Context7 (Docs em dia)      |   | • Film: Google Flow + WhisperX    |   | • Finances: Caixa por     |
| • Auto-Forge: Varre YouTube/  |   |   (.ass) + Remotion + CapCut JSON |   |   Projeto + Pix/Stripe    |
|   GitHub e cria próprios MCPs |   | • Games: Godot/Blender MCP +      |   |   (Trava: Zero Saque)     |
| • Repo: GitHub + Google Drive |   |   Phaser + TRELLIS (3D/Sprites)   |   | • Radar Licitações .gov   |
+-------------------------------+   +-----------------------------------+   +---------------------------+
```

---

## 3. DESENHO DAS TELAS: OS 16 APPS (PS5 UI) + OS ESTÚDIOS (3 COLUNAS)

### Tela 1: O Launcher Principal (Estilo PS5 / Apple TV)
No topo fica o **Seletor Global de Projeto** (ex: `Projeto Ativo: Space Tide` ou `Global`). Ao mudar o projeto no topo, todos os 16 aplicativos abaixo passam a filtrar automaticamente apenas os arquivos, personagens, conversas e finanças daquele projeto:

| Bloco | Aplicativo no Carrossel | Função Principal |
| :--- | :--- | :--- |
| **Controle & Evolução** | **1. Chat (Global)** | Chat mestre estilo terminal/Antigravity com acesso total ao PC, voz local `Kokoro-82M` e todos os estúdios. |
| | **2. Core (Soul & Brain)** | Mostra o que o V0id aprendeu sobre seus gostos (`SOUL.md`), status das cotas de tokens e Meta-Chat para editar o próprio V0id. |
| | **3. Auto-Forge & Improvements** | Radar que lê YouTube/GitHub/BigTechs e forja ferramentas novas (ou faz engenharia reversa de pagas com `REA`), exibindo **Notas de Atualização** para você aprovar com 1 clique. |
| | **4. Security (Sandbox)** | Jaula Docker para testar códigos desconhecidos, scanner anti-malware (`Semgrep`) e trava das APIs financeiras. |
| **Infra & Regras** | **5. Plugins (MCP)** | Central de conexões (`OmniRoute`, `Graphify`, `Ponitail`, `REA`, `Context7`, `Chrome AutoConnect`) com *Lazy-Loading*. |
| | **6. Rules** | Regras ativáveis (ex: *Modo Sem Censura*, *Modo Caveman*, *Auto-Prompt Improver*, *Trava de Consistência*). |
| | **7. Automations (n8n)** | Robôs de horário via `n8n` + `GitHub Actions` e biblioteca de conversas que você transformou em *Skill*. |
| | **8. Repository** | Sincronização unificada entre pastas do PC, **GitHub**, tarefas na nuvem do **Jules** e **Google Drive**. |
| **Os Estúdios (Com Galeria Google Flow)** | **9. Code Studio** | Compilador/Otimizador de Prompts, criador de Apps/Sites, ponte com `agy` / `Jules` e engenharia reversa com `REA`. |
| | **10. Game Studio** | Criador de jogos com 1 prompt (Phaser/Godot/Blender MCP), central do **Space Tide** e gerador de Sprites/3D na nuvem (`TRELLIS`). |
| | **11. Film Studio** | Fábrica de novelas consistentes (DramaBox) e cutscenes. Conecta Google Flow, `LivePortrait`, legendas `.ass` (`WhisperX`), `Remotion` e `CapCut JSON`. |
| | **12. Image Studio** | Geração com e sem censura (`FLUX.1`), folhas de personagens consistentes (`IP-Adapter`) e recorte de fundo (`RMBG-2.0`). |
| | **13. Audio Studio** | Clonagem da sua voz e de personagens (`F5-TTS`), vozes rápidas (`Edge-TTS`/`Kokoro`) e trilhas sonoras (`MusicFX`). |
| | **14. Research** | Pesquisa profunda conectada ao seu **Google NotebookLM**, `Crawl4AI` (sites limpos) e transcrição do YouTube. |
| **Negócios & Caixa** | **15. Marketing** | Mantém o Instagram de Tech News rodando sozinho e gerencia as redes sociais dos seus jogos (*Space Tide*) e apps. |
| | **16. Finances** | Painel financeiro separado por projeto, Caçador de Licitações `.gov` (API PNCP), controle via WhatsApp e cobranças Pix/Stripe. |

### Tela 2: Interior de Qualquer Estúdio (As 3 Colunas)
Sempre que você entra em um estúdio (ex: *Film Studio* ou *Game Studio*), a tela tem:
* **Coluna Esquerda (Galeria Google Flow + Cofre de Consistência):** Todos os vídeos, áudios, sprites e códigos gerados naquele estúdio + os Rostos/Vozes fixos do projeto + Histórico compartilhado por tags cruzadas (`#SpaceTide #Film #Audio #Game`).
* **Coluna Central (Chat Contextual):** Onde você pede as criações. Possui o botão `"👁️ Ver Super-Prompt"` (para ver como o *Prompt Improver* melhorou sua frase), botão `"☁️ Delegar ao Jules"` e botão `"⚡ Virar Skill"`.
* **Coluna Direita (Barra de Toggles Viva):** Switches que você liga ou desliga na hora para aquela conversa:
  * `[ON] Auto-Prompt Improver` | `[ON] OmniRoute Pool` | `[OFF] Forçar Antigravity CLI (agy)`
  * `[ON] Graphify (Grafo)` | `[ON] Ponitail` | `[ON] RTK Slim`
  * `[OFF] Modo Sem Censura` | `[ON] Modo Caveman` | `[OFF] REA (Reverse Eng)`

---

## 4. ESTRUTURA MODULAR DE PASTAS (`c:\V0id\`)

```text
c:\V0id\
├── V0ID_SPEC.md                        # Este documento mestre (Bíblia Arquitetural do V0id)
├── SOUL.md                             # Seus objetivos, regras financeiras e gostos aprendidos [APPROVED_GOLD]
├── .env                                # Chaves gratuitas (AI Studio Argon, Groq, OpenRouter, GitHub, etc.)
├── v0id.bat                            # Executável rápido para chamar o V0id no terminal de qualquer pasta
│
├── 01_core_security\                   # PILAR 1: MOTOR DE TERMINAL, TOKENS, SEGURANÇA E AUTO-FORJA
│   ├── v0id-cli\                       # Agente de Terminal Puro + Loop /goal + Ponte `agy` + WS Server :7777
│   ├── omni-router\                    # Gatekeeper + Prompt Improver + Fila 429 + Rota Sem Censura
│   ├── security-guard\                 # Sandbox Docker, scanner Semgrep e trava financeira (Zero Saque)
│   └── auto-forge\                     # Radar YouTube/GitHub + Criador de MCPs próprios (REA/Jules) + Patch Notes
│
├── 02_plugins_automations_rules\       # PILAR 2: PLUGINS MCP, REGRAS E AUTOMAÇÕES (A Barra Direita)
│   ├── mcp-gateway\                    # Meta-MCP Lazy Loader (Graphify, Ponitail, REA, Context7, Chrome...)
│   ├── rules-engine\                   # Modos modulares (Sem Censura, Caveman, Consistência de Novela)
│   └── automations-hub\                # Motor n8n + GitHub Actions + Receitas salvas ("[Virar Skill]")
│
├── 03_chat_projects_nexus\             # PILAR 3: MEMÓRIA CRUZADA, GOSTOS E PROJETOS
│   ├── nexus-db\                       # SQLite (Tags cruzadas entre estúdios) + LanceDB (Memória Semântica)
│   ├── reflection-loop\                # Agente que analisa itens aprovados e atualiza seus gostos no SOUL.md
│   ├── checkpoints\                    # Banco de estado para retomar tarefas longas se a internet oscilar
│   └── projects-vault\                 # Pastas de projetos (/space_tide) + Consistency Vault (Rostos/Vozes)
│
├── 04_studios_tools\                   # PILAR 4: OS 9 MOTORES OPERACIONAIS DOS ESTÚDIOS
│   ├── code-studio\                    # Prompt Improver UI + App Builder + REA Bridge + Delegação Jules/agy
│   ├── game-studio\                    # Phaser/Three.js + Godot/Blender MCP + TRELLIS (Sprites 2D / 3D .glb)
│   ├── film-studio\                    # Novelas, Google Flow Bridge, WhisperX (.ass), Remotion, CapCut JSON
│   ├── image-studio\                   # FLUX.1 + IP-Adapter (Cloud GPU via gradio_client) + RMBG-2.0
│   ├── audio-studio\                   # Clonagem F5-TTS (minha_voz.wav) + Kokoro-82M + Edge-TTS + MusicFX
│   ├── research-studio\                # Ponte Google NotebookLM + Crawl4AI + Transcrição YouTube
│   ├── repository-hub\                 # Sincronizador Arquivos Locais + GitHub + Jules + Google Drive
│   ├── marketing-agency\               # Robô Instagram Tech News + Gestão de Perfis de Jogos/Apps
│   └── finances-hub\                   # Caixa Multi-Projeto + Radar Licitações .gov (PNCP) + Pix/Stripe + WA
│
└── ui-launcher\                        # INTERFACE VISUAL (Tauri v2 / Next.js — PS5 Launcher + 3-Column Studios)
```

---

## 5. PROMPT DE PARTIDA (PARA COLAR NO ANTIGRAVITY OU NO `agy` CLI)

Copie o bloco abaixo para iniciar a construção da Fase 1:

```text
/goal Construir e entregar funcionando a Fase 1 do V0id OS (v0id-cli + OmniRoute Gatekeeper/Prompt Improver + Nexus DB + UI Launcher Estilo PS5/Apple TV) seguindo estritamente o arquivo V0ID_SPEC.md na raiz do projeto.

REGRAS DE EXECUÇÃO E ECONOMIA DE TOKENS:
1. Use o `Graphify` para mapear arquivos e o `Ponitail` para comprimir contexto. Opere em Modo Caveman (zero texto desnecessário no chat, foco total em código funcional).
2. Não pare a execução até cumprir todos os itens abaixo:

PASSO 1 — Fundação e Memória (`SOUL.md` & `Nexus DB`):
- Crie todos os diretórios dos 4 pilares definidos na Seção 4 do `V0ID_SPEC.md`.
- Crie o arquivo `SOUL.md` (com seções para Objetivos, Regras Financeiras e Padrões Aprendidos `[APPROVED_GOLD]`) e o `.env.example`.
- Em `03_chat_projects_nexus/nexus-db`, implemente o banco SQLite de Memória Cruzada (suportando tags simultâneas como `#SpaceTide`, `#FilmStudio`, `#AudioStudio`, `#GameStudio`), o Cofre de Consistência (`Consistency Vault`) e o `reflection-loop` que grava padrões aprovados no `SOUL.md`. Cadastre o projeto inicial `Space Tide`.

PASSO 2 — Motor de Terminal `v0id-cli` + Gatekeeper & Prompt Improver (`01_core_security`):
- Em `01_core_security/omni-router`, implemente o pipeline de entrada: toda mensagem passa primeiro pelo modelo rápido (Gatekeeper) que consulta o `SOUL.md` e o projeto ativo; se for simples, responde direto; se for complexa, compila um Super-Prompt técnico otimizado e envia para a fila principal (1º Argon/Claude -> 2º Gemini Pro -> 3º Groq -> Rota Sem Censura em caso de 429 ou flag ativa), além de suportar delegação via linha de comando para `agy -p`.
- Em `01_core_security/v0id-cli`, crie o agente de terminal autônomo com ferramentas de arquivo/terminal, suporte ao comando `/goal` com Checkpoints e servidor WebSocket local (`ws://localhost:7777`). Crie o atalho `v0id.bat` na raiz.

PASSO 3 — Interface Estilo PS5 / Apple TV + Estúdios em 3 Colunas (`ui-launcher`):
- Crie a interface web/desktop ultra-leve (tema dark futurista V0id, zero peso na Intel Iris Xe) conectada ao `v0id-cli` contendo:
  a) Launcher Principal estilo PS5 / Apple TV com Seletor Global de Projeto no topo (`Space Tide`) e o carrossel/grid navegável com todos os 16 Aplicativos.
  b) Visão Interna de Estúdio em 3 Colunas:
     - Coluna 1 (Esquerda): Galeria estilo Google Flow + Cofre de Consistência (rostos, seeds, vozes fixas) + Histórico filtrado por tags cruzadas.
     - Coluna 2 (Centro): Chat contextual mostrando o botão "Ver Super-Prompt (Prompt Improver)", botão "Delegar ao Jules", botão "Aprovar [GOLD]" (que aciona o Reflection Loop) e botão "Virar Skill".
     - Coluna 3 (Direita): Barra de Toggles em tempo real (`Auto-Prompt Improver`, `OmniRoute Pool`, `Antigravity CLI agy`, `Graphify`, `Ponitail`, `RTK`, `REA`, `Modo Sem Censura`, `Modo Caveman`).
  c) Tela funcional do app `Auto-Forge & Improvements` exibindo Notas de Atualização (Patch Notes) com aprovação segura em 1 clique.
```