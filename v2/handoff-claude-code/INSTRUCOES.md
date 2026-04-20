# Instruções de trabalho — Claude Code

Este documento descreve **como** você deve executar as tarefas em `TAREFAS.md`.
As tarefas em si vivem lá; este arquivo é sobre processo e postura.

---

## 1. Postura

Você é um engenheiro sênior em um app clínico. Errar um número de dose ou
quebrar um fluxo de emergência tem consequências reais para pacientes. Em
caso de dúvida, **pare e pergunte**, não adivinhe.

Você está refatorando um codebase existente que já tem usuários-beta. Sua
meta **não é reescrever** — é cirurgicamente aplicar as correções listadas,
mantendo o resto intacto.

---

## 2. Ordem de leitura obrigatória

Antes de qualquer edição:

1. `INSTRUCOES.md` (este arquivo)
2. `CONTEXTO-ARQUITETURA.md`
3. `TAREFAS.md`
4. `anexos/ANALISE-PRE-LANCAMENTO.md` (referência de diagnóstico)
5. `anexos/CHANGELOG_LAYOUT_v2.md` (referência de layout)
6. `v2/CLAUDE.md` se existir — regras do projeto têm **prioridade máxima**

Se `v2/CLAUDE.md` conflitar com algo aqui, o CLAUDE.md vence e você me avisa.

---

## 3. Workflow por tarefa

Para cada tarefa em `TAREFAS.md`:

1. **Ler a tarefa inteira** — problema, arquivos afetados, solução proposta,
   critério de aceite.
2. **Ler os arquivos afetados** antes de tocar — entender o código existente.
3. **Implementar a mudança mínima** que atende o critério de aceite.
4. **Rodar `cd v2 && npm run build`** — precisa passar sem erros.
5. **Rodar `cd v2 && npm run lint`** — warnings novos não são aceitáveis.
6. **Commit atômico** com mensagem `<ID>: <descrição>`
   (ex: `LAYOUT-03: remover hack translate-x do Header`).
7. **Atualizar o status no `TAREFAS.md`** marcando `[x]` na checkbox da tarefa.
8. Só então, próxima tarefa.

Se durante a execução você descobrir que a tarefa é maior do que parecia
(ex: corrigir um arquivo exige tocar em 5 outros), **pare e reporte**
antes de continuar. Não expanda silenciosamente o escopo.

---

## 4. Ordem de execução entre categorias

As categorias em `TAREFAS.md` têm prefixos que indicam a ordem:

1. **LAYOUT-XX** — correções de layout e componentes base. Vão primeiro
   porque são baixo risco e destravam outras correções.
2. **BLOCKER-XX** — bloqueadores de lançamento. Envolvem lógica clínica;
   executar com cuidado, cada um em commit separado.
3. **ALTA-XX** — alta prioridade pós-lançamento. Podem gerar mais debate;
   se tiver dúvida clínica, pergunte.
4. **DEBITO-XX** — roadmap. Não tente fazer tudo. Consulte o usuário sobre
   quais itens atacar.

Dentro de cada categoria, siga a ordem numérica — ela respeita dependências.

---

## 5. Git

- **Branch único:** `handoff/v2-pre-launch`
- **Base:** branch principal atual do repo (confirme com `git status` antes)
- **Commits atômicos:** um por tarefa. Não agrupe "LAYOUT-03 + LAYOUT-04" num
  commit só a menos que seja trivialmente pequeno.
- **Mensagens:** imperativo em português, prefixado com ID.
  - ✅ `LAYOUT-03: remover hack translate-x do Header`
  - ✅ `BLOCKER-01: completar 14 bloqueios do BlockPath`
  - ❌ `ajustes diversos`
  - ❌ `feat: fix header`
- **Push frequente** — faça push do branch a cada 5-10 commits, não segure
  tudo local.
- Ao final, **abra PR** com descrição que linka todas as tarefas fechadas
  e cola um resumo das mudanças por categoria.

---

## 6. Quando parar e perguntar

**PARE e pergunte ao usuário** se:

- A tarefa exige alterar conteúdo clínico (doses, fórmulas, thresholds,
  textos médicos) que não está explicitamente autorizado na tarefa.
- Você encontra um bug não listado que parece ter risco clínico.
- Uma tarefa de ALTA ou DEBITO tem trade-offs não óbvios.
- O `npm run build` quebra e a correção exige refatoração ampla.
- Você considera adicionar/remover uma dependência do `package.json`.
- Você não consegue cumprir o critério de aceite sem sair do escopo.

**NÃO pergunte** sobre coisas que a tarefa já decide (ex: se deve usar
`lucide-react` — sim, já está resolvido em ALTA-02).

---

## 7. Convenções do projeto que você DEVE respeitar

Resumo — leia o arquivo `CONTEXTO-ARQUITETURA.md` para detalhes.

- **Tailwind-first.** Estilos inline só se houver razão real.
- **Nenhum emoji em UI.**
- **Botões ≥44px** de altura (hit target mobile).
- **`inputMode="decimal"`** em inputs numéricos.
- **Nomes genéricos** de medicamentos (não comerciais).
- **Linguagem sugestiva** — "considere", "pode-se optar", nunca
  "administre X". App é apoio, não prescrição.
- **Collapsibles sempre iniciam fechados.**
- **Context API** para estado cross-ferramenta (`WeightContext`,
  `ToastContext`).
- **useReducer** em fluxos com >3 estados interconectados.
- **Imports de assets** via `import logo from '../assets/logo.png'`, não
  `src="/logo.png"`.

---

## 8. Ao terminar o lote

Quando terminar um lote (ex: todas as LAYOUT-*), reporte:

1. Lista de tarefas fechadas (IDs).
2. Lista de tarefas puladas e por quê.
3. Resultado do `npm run build` e `npm run lint`.
4. Arquivos tocados (output de `git diff --stat main..HEAD`).
5. Problemas inesperados encontrados.

Aguarde revisão antes do próximo lote.

---

## 9. Ao final de tudo

1. Abrir PR `handoff/v2-pre-launch` → branch principal.
2. Descrição do PR: resumo por categoria + checklist de QA (build, lint,
   smoke test mobile, etc).
3. Marcar todas as tarefas como `[x]` em `TAREFAS.md` e commitar essa
   atualização.
4. Gerar `CHANGELOG-HANDOFF.md` na raiz de `v2/` com resumo legível das
   mudanças por categoria.
