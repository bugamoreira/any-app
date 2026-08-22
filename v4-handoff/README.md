# ANY App — Handoff para v4

Inicio limpo apos tentativas v2 e v2.2.

## Como usar este pacote (proxima sessao de Claude Code)

1. Cole `PROMPT.txt` na primeira mensagem do Claude Code.
2. Ele le os 5 documentos desta pasta automaticamente + `/CLAUDE.md` do projeto.
3. Aguarda seu OK antes de codar.
4. Trabalha em branch `v4/` com commits atomicos.

## O que esta aqui

| Arquivo | Quem le | Quando |
|---------|---------|--------|
| `README.md` | Humano | Primeiro — orientacao |
| `PROMPT.txt` | Humano (para colar) | Ao iniciar sessao |
| `CONTEXT.md` | Agente | Antes de codar |
| `PRESERVE.md` | Agente | Antes de codar |
| `VISUAL-GUIDE.md` | Agente | Antes de codar |
| `ARCHITECTURE.md` | Agente | Antes de codar |

## Ordem de prioridade

`CLAUDE.md` do projeto > este pacote > instincto do agente.
Em conflito, CLAUDE.md ganha e o agente avisa.

## Estado atual (21/04/2026)

- **v1** em producao: https://anyapp.netlify.app — 21 usuarios ativos, intocada exceto pelas logos 38/39 atualizadas hoje
- **v2 antiga** em teste: https://anyapp-v2-570.netlify.app — base de referencia historica
- **v2.2** em teste: https://anyapp-v2.netlify.app — tentativa de polish, visual regrediu, NAO usar como base
- **Branch local:** `handoff/v2-pre-launch` com 30 commits nao-pushados (contem ganhos funcionais reais documentados em `PRESERVE.md`)

## Equipe

- **Gustavo Moreira** — CEO, emergencista HC-USP. Define conteudo clinico, aprova entregas. Obsessao por UX Apple.
- **Gabriela Feltrin** — CFO, medica, data scientist.
- **Joao Pedro Moreira** — CTO, engenharia de software.
