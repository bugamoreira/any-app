# README — Handoff Claude Code

Pacote de handoff para o projeto **ANY App v2**. Contém tudo que o Claude
Code precisa para executar as correções pré-lançamento sem contexto adicional.

## Como usar

1. Abra o Claude Code no repositório (raiz que contém a pasta `v2/`).
2. Cole o conteúdo de `PROMPT-INICIAL.txt` na primeira mensagem.
3. Aguarde ele ler os documentos e propor um plano de execução.
4. Dê OK no plano antes dele codar.
5. Ele trabalhará no branch `handoff/v2-pre-launch`, commits atômicos por
   tarefa. Revise cada lote conforme ele reporta.

## Conteúdo do pacote

```
handoff-claude-code/
├── README.md                     ← este arquivo
├── PROMPT-INICIAL.txt            ← cole isto no Claude Code
├── INSTRUCOES.md                 ← regras de trabalho (lidas pelo agente)
├── CONTEXTO-ARQUITETURA.md       ← stack, convenções, padrões (lidos pelo agente)
├── TAREFAS.md                    ← 41 tarefas priorizadas (backlog de execução)
└── anexos/
    ├── ANALISE-PRE-LANCAMENTO.md ← relatório completo de diagnóstico
    └── CHANGELOG_LAYOUT_v2.md    ← histórico das correções de layout
```

## Escopo

- **12 tarefas LAYOUT** — correções de base (componentes e tokens)
- **9 tarefas BLOCKER** — bloqueadores de lançamento (alguns com risco clínico)
- **10 tarefas ALTA** — prioridade pós-lançamento (1ª semana)
- **10 tarefas DEBITO** — roadmap (split de arquivos, testes, PWA, etc)

**Total: 41 tarefas** organizadas em um único PR grande
(`handoff/v2-pre-launch`).

## Pontos de atenção

- Tarefas com **⚠ Revisão clínica obrigatória**: BLOCKER-01, BLOCKER-03,
  BLOCKER-04. Não mergeiem sem revisão médica independente.
- **DEBITO-08** (disclaimer jurídico / LGPD / CFM) não é código, mas é
  bloqueador real de lançamento público.
- O `CLAUDE.md` do projeto tem prioridade máxima sobre qualquer coisa
  neste pacote.
