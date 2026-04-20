# TAREFAS.md — Backlog de handoff ANY App v2

Backlog priorizado. Execute na ordem das categorias:
**LAYOUT → BLOCKER → ALTA → DEBITO**. Dentro de cada categoria, siga a
ordem numérica.

Leia `INSTRUCOES.md` antes de começar. Cada tarefa tem:

- **Arquivo(s)** — paths exatos
- **Problema** — o que está errado
- **Solução** — como corrigir
- **Critério de aceite** — como saber que está feito
- **Severidade** e **Esforço** estimado

Marque `[x]` na checkbox conforme concluir.

---

## Sumário

| Categoria | Qtd | Severidade geral |
|---|---:|---|
| LAYOUT (correções de base, já desenhadas) | 12 | 🟡 média |
| BLOCKER (bloqueadores de lançamento) | 9 | 🔴 alta / crítica |
| ALTA (primeira semana pós-lançamento) | 10 | 🟠 alta |
| DEBITO (roadmap pós-lançamento) | 10 | 🟢 normal |
| **Total** | **41** | |

---

# LAYOUT — Correções de base

Referência completa: `anexos/CHANGELOG_LAYOUT_v2.md`.
Estas tarefas já estão desenhadas em detalhe. Objetivo: aplicar ao código e
abrir caminho para as demais categorias.

---

### [ ] LAYOUT-01 — `index.css`: tokens sticky + remover scale global
**Arquivo:** `v2/src/index.css`
**Severidade:** 🟡 média · **Esforço:** 30min

**Problema.** Regra `button:active { transform: scale(0.98) }` global causa
dupla-compressão em botões com `active:scale-[0.98]` próprio. Números
mágicos (`top-[41px]`, `top-[66px]`) se multiplicam nas pages porque não
há tokens coordenados para sticky.

**Solução.**
1. Remover a regra global `button:active { transform: ... }`.
2. Criar classe opt-in `.touch-press` com o mesmo efeito, aplicável onde
   necessário.
3. Definir tokens CSS no `:root`:
   ```css
   --h-disclaimer: 32px;
   --h-weight: 56px;
   --z-disclaimer: 40;
   --z-weight: 30;
   --z-search: 20;
   --z-fab: 50;
   ```
4. Tokens de border ajustados:
   - `border`: `#222` (divisores)
   - `border-card`: `#333` (bordas de card)

**Critério de aceite.** `grep -r "transform: scale" v2/src/index.css` sem
match da regra global. Tokens acessíveis via `var(--h-disclaimer)` etc.
App continua funcionando sem regressão visual óbvia.

---

### [ ] LAYOUT-02 — `Disclaimer.tsx`: reduzir altura
**Arquivo:** `v2/src/components/layout/Disclaimer.tsx`
**Severidade:** 🟡 média · **Esforço:** 15min

**Problema.** ~40px rouba espaço precioso em mobile e texto é longo demais
para a função (aviso permanente).

**Solução.**
- Altura → 32px (token `--h-disclaimer`).
- Fonte 11px, ícone de alerta inline à esquerda.
- Texto: `"Apoio em teste — não substitui o julgamento clínico."`
- Usar `var(--z-disclaimer)` no z-index.

**Critério de aceite.** Altura medida = 32px no devtools. Texto exato
conforme acima.

---

### [ ] LAYOUT-03 — `Header.tsx`: remover hack translate-x
**Arquivo:** `v2/src/components/layout/Header.tsx`
**Severidade:** 🟡 média · **Esforço:** 20min

**Problema.** `translate-x-[6px]` mascarava problema de centralização do
logo. Logo usa `src="/logo.png"` (viola CLAUDE.md §10.3) e `<img onClick>`
(inacessível).

**Solução.**
1. Remover `translate-x-[6px]`, centralizar com flex corretamente.
2. `import logo from '../../assets/logo.png'` (assume que o asset já existe
   em `src/assets/` — se não, mover de `public/`).
3. Logo vira `<button type="button">` com `aria-label`.
4. Padding vertical `py-5` → `py-4`.
5. Props `title` e `subtitle` passam a ser **opcionais** (`?`).

**Critério de aceite.** `grep translate-x v2/src/components/layout/Header.tsx`
sem match. TS compila sem erro de prop opcional nas páginas que já passam
título.

---

### [ ] LAYOUT-04 — `Footer.tsx`: virar estático
**Arquivo:** `v2/src/components/layout/Footer.tsx`
**Severidade:** 🟡 média · **Esforço:** 10min

**Problema.** Footer fixo rouba ~56px permanentes do viewport em mobile.
Usuário não precisa ver créditos o tempo todo.

**Solução.**
- Remover `position: fixed` (e `bottom-0`, `left-0`, `right-0`).
- Renderizar ao fim do `<Container>` naturalmente.
- Créditos mantidos idênticos.

**Critério de aceite.** Footer aparece apenas ao rolar até o fim. Sem gap
visual no fim do conteúdo.

---

### [ ] LAYOUT-05 — `Container.tsx`: pb reduzido
**Arquivo:** `v2/src/components/layout/Container.tsx`
**Severidade:** 🟡 média · **Esforço:** 5min
**Depende de:** LAYOUT-04

**Problema.** `pb-[100px]` reservava espaço para footer fixed. Com footer
estático (LAYOUT-04), isso vira padding morto.

**Solução.** `pb-[100px]` → `pb-6`.

**Critério de aceite.** Nenhum gap em branco no fim do conteúdo.

---

### [ ] LAYOUT-06 — `Card.tsx`: borders limpas
**Arquivo:** `v2/src/components/common/Card.tsx`
**Severidade:** 🟡 média · **Esforço:** 30min

**Problema.** Hack de inline `borderTop/Right/Bottom` simulando `border +
border-left` colorida. Margin-bottom forçado (`mb-4`) impede controle de
spacing pelo pai.

**Solução.**
1. Usar `border` padrão + `box-shadow: inset 4px 0 0 <color>` para a
   faixa lateral colorida.
2. Nova prop `spaced?: boolean` (default `false`). Quando `true`, aplica
   `mb-4`. Caso contrário, pai controla via `space-y-3`/`gap`.
3. Padding consistente `p-4` sempre.

**Critério de aceite.** Grep por `borderTop` e `borderRight` em `Card.tsx`
sem match. Pages que dependiam de `mb-4` automático: ou passam `spaced`,
ou o container pai foi migrado para `space-y-3`.

---

### [ ] LAYOUT-07 — `Collapsible.tsx`: sem costura + a11y
**Arquivo:** `v2/src/components/common/Collapsible.tsx`
**Severidade:** 🟡 média · **Esforço:** 20min

**Problema.** Header e body têm bordas separadas, criando costura horizontal
quando expandido. Falta `aria-expanded`.

**Solução.**
1. Um único container envolvendo header + body com border única.
2. Divisor entre header e body via `border-t` sutil aplicado ao body quando
   expandido.
3. Botão do header recebe `aria-expanded={isOpen}` e
   `aria-controls={bodyId}`.
4. Body tem `id={bodyId}`.

**Critério de aceite.** Sem costura visual ao abrir. axe-core limpo nesse
componente. Comportamento "inicia fechado" preservado.

---

### [ ] LAYOUT-08 — `FABMenu.tsx`: tokens z + a11y
**Arquivo:** `v2/src/components/layout/FABMenu.tsx`
**Severidade:** 🟡 média · **Esforço:** 20min
**Depende de:** LAYOUT-01

**Problema.** `max-w-[500px]` no wrapper `fixed` não tem efeito útil.
Usa `scale` global ao apertar. Sem `aria-label` no botão FAB.

**Solução.**
1. Remover `max-w-[500px]`.
2. `z-index: var(--z-fab)` no wrapper.
3. Botão FAB usa classe `.touch-press` (definida em LAYOUT-01).
4. `aria-label="Menu de ações"` e `aria-expanded={open}` no botão.

**Critério de aceite.** FAB continua visualmente como antes. a11y checks
passam.

---

### [ ] LAYOUT-09 — `Hub.tsx`: hierarquia
**Arquivo:** `v2/src/pages/Hub.tsx`
**Severidade:** 🟡 média · **Esforço:** 45min
**Depende de:** LAYOUT-03, LAYOUT-06

**Problema.** `<Header title="" subtitle="" />` com props vazias é hack.
Label "FERRAMENTAS" sem divisores laterais, tracking solto. Cards têm
ícone + nome centralizados competindo. Badge "NOVO" usa `rotate(45deg)`
cafona. `<div onClick>` em vez de `<button>`.

**Solução.**
1. Remover `<Header />` da página (só usa o Disclaimer + conteúdo).
2. Label "FERRAMENTAS" com divisor `<span className="h-px w-8 bg-border" />`
   dos dois lados, tracking mais discreto (`tracking-[0.18em]`).
3. Cards: ícone no topo-esquerda, nome no fim alinhado à esquerda.
4. Badge "NOVO" vira pill no canto superior direito, sem rotate.
5. `<div onClick>` → `<button type="button">` com `aria-label`.
6. Manter accents existentes (12 em `#FF5252`, Calculadoras `#2196F3`).

**Critério de aceite.** Tab navega por todos os cards. Sem `rotate(45deg)`.
Nenhum `<div onClick>` no Hub.

---

### [ ] LAYOUT-10 — `WeightInput.tsx`: sticky coordenado
**Arquivo:** `v2/src/components/common/WeightInput.tsx`
**Severidade:** 🟡 média · **Esforço:** 30min
**Depende de:** LAYOUT-01, LAYOUT-02

**Problema.** `top-[41px]` é número mágico que quebra se a altura do
Disclaimer mudar. Card sólido é pesado.

**Solução.**
1. `style={{ top: 'var(--h-disclaimer)' }}` (ou classe utilitária
   equivalente).
2. Altura exposta via `--h-weight` para que outros sticky (busca) empilhem
   com `calc(var(--h-disclaimer) + var(--h-weight))`.
3. Fundo `bg-bg-primary/95 backdrop-blur`.
4. `z-index: var(--z-weight)`.

**Critério de aceite.** Ao rolar uma página com busca sticky, o empilhamento
Disclaimer → Weight → Search é correto, sem sobreposição.

---

### [ ] LAYOUT-11 — `InfusionGuide.tsx`: refatoração exemplar
**Arquivo:** `v2/src/pages/InfusionGuide.tsx`
**Severidade:** 🟡 média · **Esforço:** 1h
**Depende de:** LAYOUT-01, LAYOUT-10

**Problema.** FABMenu inútil (items placeholder). Busca com
`top-[66px]` mágico. Gate de peso com tipografia incoerente.

**Solução.**
1. Remover `<FABMenu />`.
2. Busca sticky: `top: calc(var(--h-disclaimer) + var(--h-weight))`.
3. Gate de peso: título 17px, label "Obrigatório" como micro uppercase.
4. Botão do gate usa `active:bg-accent-hover` (não opacity fade).
5. `autoFocus` no input de peso.
6. Adicionar `animate-fade-in` nas calculadoras que abrem
   (transição 150ms ease-out).

**Critério de aceite.** Fluxo peso → busca → calculadora aberta funcional
e fluido em mobile. Sem `top-[66px]` no arquivo.

---

### [ ] LAYOUT-12 — `DoseCalculator.tsx`: hierarquia limpa
**Arquivo:** `v2/src/components/clinical/DoseCalculator.tsx`
**Severidade:** 🟡 média · **Esforço:** 1h

**Problema.** "Diluição" com border-left azul (uso indevido do padrão
`AlertCard`). Diluições alternativas como botões separados competindo.
Range terapêutico em card cinza extra. Grid com border 2px gritante.
Inputs/sliders sem `aria-label`.

**Solução.**
1. Card de "Diluição" sem border-left azul — card de metadados com
   hierarquia tipográfica limpa.
2. Diluições alternativas → segmented control (pill único com indicador
   interno).
3. Range terapêutico inline com o label da dose.
4. Grid de resultado com border 1px.
5. `aria-label` em sliders e inputs.

**Critério de aceite.** Visual mais calmo, mesma função. Screen reader
anuncia todos os controles corretamente.

---

# BLOCKER — Bloqueadores de lançamento

Estes envolvem **lógica clínica ou segurança do paciente**. Executar com
cuidado, commit atômico por tarefa, e — onde indicado — pausar para
revisão antes de mergear.

Referência: `anexos/ANALISE-PRE-LANCAMENTO.md` §1.

---

### [ ] BLOCKER-01 — BlockPath: implementar 13 bloqueios faltantes
**Arquivo:** `v2/src/pages/BlockPath.tsx:49` (array `blocks[]`)
**Severidade:** 🔴 crítica · **Esforço:** 1-3 dias (depende do conteúdo)
**⚠ Revisão clínica obrigatória antes de mergear.**

**Problema.** Só 1 de 14 bloqueios tem dados (`plexo-cervical`). Os outros
13 aparecem na lista mas levam a dead-end (`activeBlock === undefined`).

**Solução (escolher com o usuário).**
- **(a)** Completar os 13 bloqueios restantes. Extrair conteúdo do HTML
  antigo (v1). Requer fonte de dados clínica — **pergunte ao usuário**
  onde está e se pode usar.
- **(b)** Esconder bloqueios não-implementados com badge "Em breve" na
  lista até estarem prontos. Mais rápido e seguro para lançamento.

**Critério de aceite.** Nenhum clique na lista leva a tela vazia. Se (a),
todos os 14 com dados completos revisados clinicamente. Se (b), badges
"Em breve" visíveis e cliques desabilitados nos não-implementados.

---

### [ ] BLOCKER-02 — Estilos inline em home screens
**Arquivos:**
- `v2/src/pages/AirwayGuide.tsx:502-530` (`renderHome`)
- `v2/src/pages/PaliaPath.tsx:254, 282`
- `v2/src/pages/DenguePath.tsx:454`
- `v2/src/pages/PedGuide.tsx` (vários `bg-[#1A1A1A]`)
- `v2/src/pages/ShockPath.tsx` (vários `bg-[#1A1A1A]`)

**Severidade:** 🔴 alta · **Esforço:** 3h

**Problema.** `style={{ background: '#1A1A1A', border: '1px solid #333',
borderLeft: '4px solid #FF5252' }}` inline mistura com Tailwind. Quebra
futuras mudanças de token, complica manutenção.

**Solução.** Refatorar todos os home screens para usar `<Card>` com prop
`borderColor` (faixa lateral). Mesma aparência visual, mas via componente.

**Critério de aceite.** `grep "style={{.*background" v2/src/pages/` sem
matches nos arquivos acima. Visual idêntico ao atual.

---

### [ ] BLOCKER-03 — Auto-toggle silencioso do CRASH-H (risco clínico)
**Arquivo:** `v2/src/pages/AirwayGuide.tsx:775-778, 791-794`
**Severidade:** 🔴 crítica · **Esforço:** 1h
**⚠ Revisão clínica recomendada.**

**Problema.** Quando Shock Index > 1.0, o código dispara
`dispatch({ type: 'TOGGLE_CRASH', letter: 'H' })`. TOGGLE não é idempotente —
pode **desmarcar** H que já estava marcado manualmente. E não há feedback
visual de que foi o app que marcou.

**Solução.**
1. Trocar `TOGGLE_CRASH` por novo action `SET_CRASH` idempotente:
   ```ts
   { type: 'SET_CRASH'; letter: CrashLetter; value: boolean }
   ```
2. Adicionar toast informativo: `"H (Hipotensão) marcado automaticamente por
   Shock Index > 1.0"`.
3. O toast aparece **uma vez** por cálculo (não a cada keystroke). Use um
   ref para rastrear o último valor.

**Critério de aceite.** Digitar FC/PAS que leve a SI > 1.0 marca H e mostra
toast. Editar de volta para SI < 1.0 NÃO desmarca H automaticamente
(conservar preserva decisão médica). Se o médico desmarcou manualmente
depois, não re-marcar.

---

### [ ] BLOCKER-04 — Carvão ativado sem peso em ToxPath (risco clínico)
**Arquivo:** `v2/src/pages/ToxPath.tsx` (DescontaminaçãoView, resultado "indicado")
**Severidade:** 🔴 alta · **Esforço:** 1h
**⚠ Revisão clínica obrigatória.**

**Problema.** Recomenda "Adulto: 50 g (1 g/kg)" sem pedir peso. Em paciente
de 40 kg (adolescente), 50 g é overdose. Em 90 kg, é subdose.

**Solução (escolher com usuário).**
- **(a)** Adicionar input de peso no fluxo antes da recomendação, calcular
  1 g/kg (mín 25g, máx 100g — confirmar ranges com literatura).
- **(b)** Mostrar alerta destacado: `"Dose padrão para adultos ≥50 kg.
  Em pacientes <50 kg, calcular 1 g/kg (dose máxima 100 g)."` — não ideal
  porque pede cálculo mental; só aceitar se (a) não for viável.

**Critério de aceite.** Nenhum usuário consegue completar o fluxo com dose
errada para peso conhecido.

---

### [ ] BLOCKER-05 — AclsGuide `recordNum` race condition
**Arquivo:** `v2/src/pages/AclsGuide.tsx:565-570` (`generateReport()`)
**Severidade:** 🟠 alta · **Esforço:** 1h

**Problema.** `Date.now()` com resolução baixa pode gerar IDs idênticos em
cliques rápidos. Dois registros gravados com o mesmo `num` — histórico
inconsistente.

**Solução.**
1. Trocar `Date.now()` → `crypto.randomUUID()` para `record.id`.
2. `num` continua sequencial mas calculado a partir de
   `records.length + 1` (não de timestamp).
3. Mover leitura/escrita de `localStorage` para um `useEffect` dedicado
   com debounce ou ref guard para evitar double-write.
4. **Adicionar teste unitário** (Vitest) que simula cliques rápidos e
   verifica unicidade.

**Critério de aceite.** 100 gerações de ID consecutivas produzem 100 IDs
únicos. Teste passa.

---

### [ ] BLOCKER-06 — Unidade de lactato inconsistente
**Arquivos:**
- `v2/src/pages/ShockPath.tsx:498-520` (toggle mmol/L ↔ mg/dL)
- `v2/src/pages/DenguePath.tsx` (só menciona mmol/L)
- (revisar todas as pages que citam lactato)

**Severidade:** 🟠 alta · **Esforço:** 3h

**Problema.** Ferramentas diferentes tratam lactato com unidades
diferentes. Médico brasileiro usa predominantemente mg/dL. Inconsistência
entre telas do mesmo app confunde.

**Solução.**
1. Criar `UnitContext` em `src/contexts/UnitContext.tsx` com preferência
   global (mmol/L | mg/dL) persistida em localStorage.
2. Todas as menções de lactato no app consultam o contexto.
3. Função utilitária `convertLactate(value, from, to)` em `src/utils/units.ts`.
4. Toggle visível em uma página de config (ou no gate de peso, como nota).

**Critério de aceite.** Trocar preferência em uma tela reflete em todas.
Sem hardcode de unidade no JSX.

---

### [ ] BLOCKER-07 — SedaPath / ShockPath: params não usados
**Arquivos:**
- `v2/src/pages/SedaPath.tsx:125` (`direction` no `goTo`)
- `v2/src/pages/ShockPath.tsx` (`_slideDir`)

**Severidade:** 🟡 média · **Esforço:** 15min

**Problema.** Params não usados geram warnings do eslint.

**Solução.** Prefixar com `_` ou remover parâmetro e suas chamadas.

**Critério de aceite.** `npm run lint` sem warnings desses arquivos.

---

### [ ] BLOCKER-08 — ShockPath: PP stale em modo calculado
**Arquivo:** `v2/src/pages/ShockPath.tsx:481-489`
**Severidade:** 🟠 alta · **Esforço:** 1h

**Problema.** PP (pressão de pulso) calculado via handler usa closure stale
do state. Digitar PAS antes de PAD, depois PAD → PP usa PAS antigo.

**Solução.**
1. Remover o cálculo do handler.
2. Derivar PP em `useMemo`:
   ```ts
   const pp = useMemo(
     () => (state.pas != null && state.pad != null)
       ? state.pas - state.pad : null,
     [state.pas, state.pad]
   );
   ```
3. Dispatch só altera os inputs, nunca PP direto.

**Critério de aceite.** Digitar PAS=120, depois PAD=80 → PP=40. Trocar
PAS para 140 → PP=60 imediatamente, sem re-render extra.

---

### [ ] BLOCKER-09 — TepGuide: dependências incorretas no useCallback
**Arquivo:** `v2/src/pages/TepGuide.tsx:340, 399`
**Severidade:** 🟡 média · **Esforço:** 30min

**Problema.** `classAnswer` usa `showManagement` mas este não está nas deps.
`react-hooks/exhaustive-deps` acende warning. Em re-renders, pode chamar
versão antiga.

**Solução.** Adicionar `showManagement` às deps de `classAnswer`.
Verificar que não cria loop. Se criar, usar `useRef` para a função ou
inline a chamada.

**Critério de aceite.** ESLint sem warning de exhaustive-deps nesse arquivo.

---

# ALTA — Primeira semana pós-lançamento

Não bloqueiam lançamento. Executar logo depois, idealmente na v2.0.1.

Referência: `anexos/ANALISE-PRE-LANCAMENTO.md` §2.

---

### [ ] ALTA-01 — `<ToolHomeGrid>` compartilhado
**Arquivos:** criar `v2/src/components/clinical/ToolHomeGrid.tsx`; refatorar
todas as 13 pages
**Severidade:** 🟠 média · **Esforço:** 1-2 dias
**Depende de:** BLOCKER-02

**Problema.** 13 layouts diferentes para "escolher subferramenta".
Inconsistência quebra memória muscular do médico em plantão.

**Solução.**
1. Criar `<ToolHomeGrid>` recebendo `{ primary?: Card; secondary: Card[] }`.
2. Props de cada Card: `{ icon, label, color, to, disabled?, badge? }`.
3. Layout padronizado: primary (se houver) ocupa largura total com destaque;
   secondary em grid 2 colunas.
4. Refatorar todas as pages para consumir. Dados em `src/data/<tool>Home.ts`.

**Critério de aceite.** Apenas um componente de home-grid no projeto.
Visualmente uniforme entre as 13 ferramentas.

---

### [ ] ALTA-02 — Migrar SVGs inline para `lucide-react`
**Arquivos:** todas as pages
**Severidade:** 🟠 média · **Esforço:** 1 dia

**Problema.** Cada page tem 10-30 SVGs inline de voltar, chevron, check,
aviso. `lucide-react` já está no `package.json`.

**Solução.**
1. Substituir sistematicamente:
   - seta voltar → `<ArrowLeft />`
   - chevron → `<ChevronRight />`, `<ChevronDown />`
   - check → `<Check />`
   - aviso → `<AlertTriangle />`
   - info → `<Info />`
   - etc.
2. Stroke-width padrão `1.5`, size padrão `20`.
3. Grep final por `<svg ` nas pages — idealmente zero matches (ou apenas
   casos com SVG customizado genuíno).

**Critério de aceite.** Bundle reduz (tree-shake), visual consistente.

---

### [ ] ALTA-03 — Padronizar identificadores ASCII
**Arquivos:**
- `v2/src/pages/PaliaPath.tsx:29`
- `v2/src/pages/DenguePath.tsx:17`
- `v2/src/pages/SedaPath.tsx:32-41`

**Severidade:** 🟠 média · **Esforço:** 3h

**Problema.** Union types com `'náusea'`, `'sedação'`, `'referências'`,
`'classificação'` misturados com ASCII. Risco em URLs, analytics, builds
ES5, fontes sem glyph.

**Solução.** Union types em ASCII kebab-case. Labels em PT ficam em mapas
separados (`BREADCRUMB_LABELS`, `TAB_LABELS` etc).

```ts
// antes
type Tab = 'dor' | 'náusea' | 'sedação'
// depois
type Tab = 'dor' | 'nausea' | 'sedacao'
const TAB_LABELS: Record<Tab, string> = {
  dor: 'Dor',
  nausea: 'Náusea',
  sedacao: 'Sedação',
};
```

**Critério de aceite.** `grep -r "type.*=.*'.*[áéíóúâêôãõç]" v2/src` sem match.

---

### [ ] ALTA-04 — Hook `usePersistentReducer` + "Continuar"
**Arquivos:** criar `v2/src/hooks/usePersistentReducer.ts`; aplicar em
todos os fluxos longos; adicionar "Continuar" no Hub
**Severidade:** 🟠 alta · **Esforço:** 1-2 dias

**Problema.** Refresh no meio de Airway/Dengue/TEP/ACLS perde tudo. Grave
em fluxos longos.

**Solução.**
1. Hook `usePersistentReducer(reducer, initial, key, ttlHours = 6)`.
2. Salva snapshot a cada dispatch em `localStorage` sob `anyapp:<key>`.
3. Ao montar, se existe snapshot válido (dentro do TTL), restaura.
4. Hook expõe `clearPersisted()`.
5. Aplicar em: Airway, Shock, ACLS (já tem lógica própria — cuidado para
   não duplicar), Dengue, Seda, Palia, TEP, Tox.
6. `Hub.tsx`: se há sessões ativas, mostrar card "Continuar de onde parou"
   no topo.

**Critério de aceite.** Refresh em qualquer fluxo longo retoma no último
estado. Sessões expiradas são limpas automaticamente.

---

### [ ] ALTA-05 — Acessibilidade: labels em inputs/botões
**Arquivos:** todas as pages
**Severidade:** 🟠 alta · **Esforço:** 1 dia

**Problema.** Inputs de FC/PAS/PAD, sliders, botões com só ícone — sem
`aria-label` ou `<label htmlFor>`.

**Solução.**
1. Rodar axe DevTools em cada page, listar violações.
2. Corrigir sistematicamente:
   - Inputs com `placeholder` também recebem `aria-label` ou `<label>`.
   - `<select>` com `id` e `<label htmlFor>`.
   - Botões só com ícone recebem `aria-label`.

**Critério de aceite.** axe DevTools 0 violações críticas em todas as
pages.

---

### [ ] ALTA-06 — Revisão ortográfica PT
**Arquivos:** todas as pages, componentes com texto visível
**Severidade:** 🟠 média · **Esforço:** meio dia + revisão humana

**Problema.** Várias palavras sem acento ou com acento errado (ex:
`próximal`, `criança` vs `crianca`, `hidratação` vs `hidratacao`).

**Solução.**
1. Varredura com revisor profissional (cliente decide).
2. Para o Claude Code: listar todos os textos visíveis em um relatório
   `REVISAO-TEXTO.md` para revisão humana, **não editar sem aprovação**.

**Critério de aceite.** Relatório entregue. Correções aplicadas após OK
do cliente.

---

### [ ] ALTA-07 — Cleanup de timers
**Arquivos:** `v2/src/pages/ShockPath.tsx`, `v2/src/pages/AclsGuide.tsx`,
outras com `setInterval`/`setTimeout`
**Severidade:** 🟠 média · **Esforço:** 2h

**Problema.** `AclsGuide` tem `clearAllIntervals()` robusto. Outros não.
Timers podem vazar se componente desmonta mid-run.

**Solução.**
1. Grep por `setInterval|setTimeout` em pages.
2. Cada chamada deve ter cleanup em `useEffect(() => () => { ... }, [])`.
3. Usar refs para ids de timer quando necessário armazenar.

**Critério de aceite.** Navegar entre pages com timers ativos e voltar não
deixa intervals pendurados (inspect via `chrome://inspect`).

---

### [ ] ALTA-08 — PedGuide: z-index do dropdown Broselow
**Arquivo:** `v2/src/pages/PedGuide.tsx:1237-1253`
**Severidade:** 🟡 média · **Esforço:** 15min

**Problema.** Dropdown `absolute` sem z-index explícito suficiente. Em iOS
Safari, pode ficar atrás de cards abaixo.

**Solução.** `z-[100]` explícito no dropdown. Testar em iOS Safari real
(iPhone SE 375px).

**Critério de aceite.** Dropdown sempre acima em todos os dispositivos
testados.

---

### [ ] ALTA-09 — Focus trap em Modal
**Arquivo:** `v2/src/components/common/Modal.tsx` (ou onde estiver)
**Severidade:** 🟡 média · **Esforço:** 30min

**Problema.** Tab sai do modal para elementos atrás. Pior em desktop.

**Solução.**
1. Adicionar focus trap manual (React 19 não precisa de lib, mas
   `focus-trap-react` é aceitável se o custo em bundle for aceitável — use
   implementação caseira preferencialmente).
2. Primeiro elemento focável recebe foco ao abrir.
3. Tab/Shift-Tab ciclam apenas dentro do modal.
4. Esc fecha.

**Critério de aceite.** Teste manual: abrir modal, tabular 10x → foco nunca
sai.

---

### [ ] ALTA-10 — Debounce em inputs numéricos pesados
**Arquivo:** `v2/src/pages/ShockPath.tsx` (VNERi e similares)
**Severidade:** 🟢 baixa · **Esforço:** 1h

**Problema.** A cada keystroke, `useMemo` do VNERi reexecuta. Em mobile
baixo-fim, lag perceptível.

**Solução.**
1. Debounce 200ms ou calcular só no `onBlur`.
2. Enquanto debounce pendente, mostrar placeholder "…".

**Critério de aceite.** Perceptivelmente mais fluido em device de 3 anos.

---

# DEBITO — Roadmap pós-lançamento

Não atacar tudo de uma vez. Consultar usuário sobre prioridade. Cada item
pode virar um PR dedicado futuro.

Referência: `anexos/ANALISE-PRE-LANCAMENTO.md` §3.

---

### [ ] DEBITO-01 — Split de arquivos gigantes (>1000 linhas)
**Arquivos alvo:**
- ShockPath (2588) → `pages/ShockPath/` com `index.tsx`, `screens/`, `components/`, `data.ts`
- TepGuide (1793), DenguePath (1742), AirwayGuide (1725), AclsGuide (1687),
  PedGuide (~1500), ToxPath (~1400), PaliaPath (~1200), SedaPath (~1100),
  VmGuide (~900)

**Esforço:** 2-3 dias por ferramenta. **Consultar usuário sobre ordem.**

---

### [ ] DEBITO-02 — `noUncheckedIndexedAccess` no tsconfig
Limpar `as any` e `[key: string]: boolean` laxos no caminho.

---

### [ ] DEBITO-03 — Extrair dados clínicos para `src/data/*`
Seguir padrão de `paliaData.ts`, `toxData.ts`. Objetivo: um farmacêutico
pode revisar `airwayData.ts` sem saber React.

---

### [ ] DEBITO-04 — Consolidar primitivas clínicas
Mover `BackButton`, `StepHeader`, `CheckItem`, `NavButtons`, `ResultCard`,
`SectionTitle`, `BulletList`, `InfoCard`, `CalcCard`, `Tag`, `DataBadge`,
`Breadcrumb`, `ProgressDots`, `ProgressBar`, `ChecklistCalc`, `CalcResult`,
`VitalBadge`, `MedTable`, `StepsList`, `PillTabs`, `TabBar` para
`src/components/clinical/`.

---

### [ ] DEBITO-05 — Testes automatizados
1. Configurar Vitest.
2. Testes unitários dos helpers de cálculo (~50 funções).
3. Testes de snapshot das telas principais.
4. E2E básico Airway→IOT com Playwright.

---

### [ ] DEBITO-06 — Telemetria anônima (após OK DPO)
Posthog/Plausible com opt-in. Eventos: `tool_opened`, `pathway_completed`,
`calculator_used`, `copy_report`.

---

### [ ] DEBITO-07 — `src/data/guidelines.ts` + footer de referências
Um JSON com guidelines ativos e data. Footer mostra "Baseado em: …".

---

### [ ] DEBITO-08 — Disclaimer jurídico + LGPD
**Não é código.** Revisão jurídica (CFM 2.311/2022, LGPD, Termos de Uso,
Política de Privacidade). **Bloqueador real de lançamento público.**

---

### [ ] DEBITO-09 — PWA offline
`vite-plugin-pwa` + service worker + manifest + cache. Médicos em UTI
com Wi-Fi ruim precisam.

---

### [ ] DEBITO-10 — Feature flags
`src/config.ts` ou `/config.json` fetchado no boot. Desabilitar ferramenta
sem redeploy.

---

## Ao final

Após concluir cada lote, reportar conforme `INSTRUCOES.md §8`.
Ao concluir tudo, abrir PR e gerar `v2/CHANGELOG-HANDOFF.md` conforme §9.
