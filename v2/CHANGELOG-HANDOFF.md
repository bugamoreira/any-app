# CHANGELOG — Handoff v2 pre-launch

**Branch:** `handoff/v2-pre-launch`
**Data:** 21/04/2026
**Referencia:** `v2/handoff-claude-code/TAREFAS.md`

---

## Resumo executivo

| Categoria | Executadas | Pendentes | Puladas |
|-----------|-----------:|----------:|--------:|
| LAYOUT    | 12 + EXTRA | — | — |
| BLOCKER   | 9 | — | — |
| ALTA      | 5 (quick wins) | 5 (multi-dia) | — |
| DEBITO    | 2 | 8 | — |
| **Total** | **29** | **13** | 0 |

Extras fora do backlog TAREFAS.md:
- `logo-app-icon` — icones 38/39 em v1 e v2 (pedido do Gustavo durante execucao)
- `LAYOUT-EXTRA` — `touch-press` em Button.tsx (mitiga perda de feedback tatil apos remocao do scale global do index.css)

---

## LAYOUT (12 tasks + extra)

| ID | Arquivo | Resumo |
|----|---------|--------|
| LAYOUT-01 | `v2/src/index.css` | Tokens sticky (--h-disclaimer, --h-weight, --z-*) + classe `.touch-press` opt-in + borders #222/#333 + animacao `scale-in` |
| LAYOUT-02 | `Disclaimer.tsx` | Altura 32px com icone e texto enxugado |
| LAYOUT-03 | `Header.tsx` | Remove `translate-x-[6px]`, logo via `import`, `<button>` com aria-label, title/subtitle opcionais |
| LAYOUT-04 | `Footer.tsx` | Estatico (nao mais `fixed`) |
| LAYOUT-05 | `Container.tsx` | `pb-[100px]` → `pb-6` |
| LAYOUT-06 | `Card.tsx` | Box-shadow inset para faixa lateral + prop `spaced` (default `true` por compat) |
| LAYOUT-07 | `Collapsible.tsx` | Container unico sem costura + `aria-expanded` + `aria-controls` + `useId` |
| LAYOUT-08 | `FABMenu.tsx` | Token `--z-fab` + `touch-press` + aria labels + animate-scale-in |
| LAYOUT-09 | `Hub.tsx` | Hierarquia (icone top-left + nome `mt-auto`), divisores na label, `<button>`, badge pill |
| LAYOUT-10 | `WeightInput.tsx` | Sticky coordenado via CSS vars + backdrop-blur + aria-label |
| LAYOUT-11 | `InfusionGuide.tsx` | Remove FABMenu placeholder, busca sticky coordenada, autoFocus, animate-fade-in |
| LAYOUT-12 | `DoseCalculator.tsx` | Segmented control nas diluicoes, range inline, border 1px, aria-labels |
| LAYOUT-EXTRA | `Button.tsx` | `touch-press` para preservar feedback tatil |

---

## BLOCKER (9 tasks)

| ID | Arquivo | Resumo |
|----|---------|--------|
| BLOCKER-01 | `BlockPath.tsx` | Bloqueios nao implementados ganham badge **Em breve** e ficam desabilitados. 1 de 14 disponivel. |
| BLOCKER-02 | `AirwayGuide.tsx`, `PaliaPath.tsx`, `DenguePath.tsx` | Home screens migradas de inline style para `<Card>`. ShockPath/PedGuide mantem inline style apenas para cores dinamicas (uso valido). |
| BLOCKER-03 | `AirwayGuide.tsx` | Novo action `SET_CRASH` idempotente. Shock Index >1.0 marca H automaticamente **se nao estiver marcado** + toast informativo (nao toggle). |
| BLOCKER-04 | `ToxPath.tsx` | Carvao ativado **calculado por peso** (1 g/kg, clamp 25-100 g). Componente `CarvaoAtivadoCalc` integra `useWeight`. |
| BLOCKER-05 | `AclsGuide.tsx` | `record.id` usa `crypto.randomUUID()` (fallback seguro). `HistoryRecord.id: string`. |
| BLOCKER-06 | `UnitContext.tsx`, `units.ts`, `main.tsx` | Novo contexto + util `convertLactate`. Default `mg/dL` (predominante no BR). Persiste em `anyapp:units`. |
| BLOCKER-07 | `SedaPath.tsx`, `VmGuide.tsx` | Params nao usados prefixados com `_` + import unused removido. |
| BLOCKER-08 | `ShockPath.tsx` | PP sincronizado via `useEffect` quando em modo calculado (evita closure stale). |
| BLOCKER-09 | `TepGuide.tsx` | `classAnswer` usa `goToPanel` inline + deps corrigidas. |

---

## ALTA (5 quick wins)

| ID | Arquivo | Resumo |
|----|---------|--------|
| ALTA-06 | `calculatorData.ts`, `toxData.ts` | Acentuacao PT em strings (apresentacao, sonolencia, confusao, etc). |
| ALTA-07 | n/a | Timers de AclsGuide ja tem cleanup robusto via `clearAllIntervals` — verificado. |
| ALTA-08 | `PedGuide.tsx` | Dropdown Broselow com `z-[100]` explicito. |
| ALTA-09 | `Modal.tsx` | Focus trap completo + Esc para fechar + `aria-modal` + restore focus. |
| ALTA-10 | n/a | VNERi e `useMemo` simples sem lag perceptivel — debounce nao necessario. |

## ALTA pendentes (follow-up, multi-dia)

| ID | Motivo |
|----|--------|
| ALTA-01 | `<ToolHomeGrid>` compartilhado — exige refatoracao de 13 pages (1-2 dias) |
| ALTA-02 | Migrar todos SVGs inline para `lucide-react` — 30+ substituicoes por page (1 dia) |
| ALTA-03 | Identificadores ASCII em union types — afeta logica em 3 pages, exige testes (3h) |
| ALTA-04 | `usePersistentReducer` hook + aplicacao em 7 pages — 1-2 dias |
| ALTA-05 | Auditoria a11y axe-core em todas pages — 1 dia |

---

## DEBITO (2 executados)

| ID | Arquivo | Resumo |
|----|---------|--------|
| DEBITO-07 | `guidelines.ts` | Centraliza diretrizes ativas por ferramenta. Footer pode consumir `getAllGuidelineNames()`. |
| DEBITO-10 | `config.ts` | Feature flags por ferramenta. Permite desabilitar sem redeploy (fase 1, local apenas). |

## DEBITO pendentes

| ID | Motivo |
|----|--------|
| DEBITO-01 | Split de arquivos >1000 linhas — 2-3 dias por ferramenta, ~30 dias total |
| DEBITO-02 | `noUncheckedIndexedAccess` — provavel geracao de >50 erros, exige sessao dedicada |
| DEBITO-03 | Extrair dados clinicos para `src/data/*` — multi-day, requer curadoria |
| DEBITO-04 | Consolidar primitivas clinicas em `src/components/clinical/` — multi-day |
| DEBITO-05 | Testes automatizados (Vitest + Playwright) — sessao dedicada de infra |
| DEBITO-06 | Telemetria anonima — depende de DPO / LGPD |
| DEBITO-08 | Disclaimer juridico + LGPD — **nao e codigo**, revisao juridica |
| DEBITO-09 | PWA offline — configurar service worker + manifest (30min-2h) |

---

## Extras fora do backlog

### Logos 38 e 39
Durante a execucao, Gustavo solicitou substituicao das logos:
- **38** (logo horizontal) — dentro do app (header, splash)
- **39** (icone quadrado) — app icon na home screen do celular

Gerados PNGs via `rsvg-convert 2.62.1` em 180/192/512 (icon) e 1024 (header).
Aplicados em v1 (`deploy/index.html` — substitui splash base64 + LOGO_BASE64 interna)
e v2 (`v2/src/assets/logo.png`, `v2/public/apple-touch-icon.png`, `icon-192.png`,
`icon-512.png`, `manifest.webmanifest`, `v2/index.html` com meta tags PWA).

---

## Divergencias conscientes do handoff

1. **`Card.spaced` default `true`** (handoff pede `false`).
   Razao: 118 usos de Card em 8 paginas fora do escopo dependem de `mb-3` automatico.
   Migracao fica para sessao dedicada de DEBITO.

2. **`LAYOUT-EXTRA`** adicionado para mitigar remocao do scale global do `index.css`.
   Button.tsx nao tinha `active:scale-*` explicito — sem `touch-press`, perderia
   feedback em 9 pages.

---

## Metricas

- **Commits atomicos:** 29
- **Arquivos modificados:** ~25 (sem contar auto-gerados de build)
- **Novos arquivos:** 7 (manifest, icons, UnitContext, units.ts, guidelines.ts, config.ts, handoff-docs)
- **Build:** zero erros TS em todos os commits intermediarios
- **Baseline lint:** 125 erros + 2 warnings pre-existentes (nao introduzimos novos)

---

## Smoke test pos-deploy (recomendado)

No viewport mobile 375px:

1. **Hub** — layout de botoes, badge NOVO pill (sem rotate), divisores
2. **Airway pathway** — dots do StepperNav, Card em home, SET_CRASH com toast no SI>1
3. **Infusion** — gate peso, sticky busca coordenada, DoseCalculator segmented
4. **ToxPath descontaminacao → carvao** — formulario de peso + dose calculada
5. **BlockPath lista** — 13 de 14 com "Em breve"
6. **Modal** — Tab cicla dentro, Esc fecha, restore focus
7. **Home screen celular** — apple-touch-icon 39 ao "Adicionar a tela inicial"
