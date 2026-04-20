# ANY App v2 — Análise pré-lançamento

**Data:** Abril 2026
**Escopo:** Auditoria de UX, consistência, código e riscos clínicos de interface das 13 ferramentas da v2 (Hub, AirwayGuide, VmGuide, AclsGuide, BlockPath, DenguePath, PaliaPath, PedGuide, SedaPath, ShockPath, TepGuide, ToxPath, Calculators, InfusionGuide, DoseCalculator).

A análise está dividida em três seções:
1. **Bloqueadores de lançamento** — precisam ser corrigidos antes
2. **Alta prioridade** — corrigir na primeira semana pós-lançamento
3. **Débito técnico / polimento** — roadmap pós-lançamento

---

## 1. BLOQUEADORES DE LANÇAMENTO

### 1.1 BlockPath — apenas 1 de 14 bloqueios implementado 🔴
**Arquivo:** `v2/src/pages/BlockPath.tsx:49`

O array `blocks[]` tem um único item (`plexo-cervical`) seguido de um comentário `// TODO: adicionar os outros 13 bloqueios extraindo do HTML atual`. A lista visual (`blockList`) expõe todos os 14, mas ao clicar em qualquer outro, `activeBlock` vai ser `undefined` e a tela de detalhe não renderiza nada — o usuário bate em um dead-end.

**Ação:** ou (a) completar os 13 bloqueios restantes, ou (b) esconder os não-implementados com um badge "Em breve" até estarem prontos. Não é aceitável lançar uma ferramenta clínica prometendo 14 bloqueios e entregando 1.

### 1.2 AirwayGuide — estilos inline misturados com Tailwind 🔴
**Arquivo:** `v2/src/pages/AirwayGuide.tsx:502-530` (`renderHome`)

A tela inicial do AirwayGuide usa `style={{ background: '#1A1A1A', border: '1px solid #333', borderLeft: '4px solid #FF5252'... }}` inline, enquanto o resto do app usa `<Card>` e classes Tailwind. Isso quebra:
- **Dark/light mode futuro** — cores hardcoded ignoram tokens
- **Consistência visual** — espaçamento e bordas diferem de Card padrão
- **Manutenção** — mudança de design system não propaga

Mesmo problema em `PaliaPath.tsx:254, 282` (grid de módulos e extras), `DenguePath.tsx:454` (grid 2x2 do home), `PedGuide.tsx` (`bg-[#1A1A1A]` em vários lugares), `ShockPath.tsx` vários `bg-[#1A1A1A]`.

**Ação:** refatorar todos os home screens para usar `<Card>` com `borderColor` prop. Sem isso, qualquer ajuste global de tokens vira caça aos bugs.

### 1.3 Risco clínico — toggle silencioso do CRASH-H 🔴
**Arquivo:** `v2/src/pages/AirwayGuide.tsx:775-778, 791-794`

Quando o usuário digita FC/PAS e Shock Index > 1.0, o código faz `dispatch({ type: 'TOGGLE_CRASH', letter: 'H' })` **automaticamente**. Isso:
- Marca o item "H — Hipotensão" sem feedback visual imediato
- Pode **desmarcar** H se já estava marcado manualmente (TOGGLE, não SET)
- Se usuário volta e edita FC, pode marcar de novo — estado inconsistente

**Ação:** trocar `TOGGLE_CRASH` por um `SET_CRASH` idempotente. Mostrar toast "H marcado automaticamente por Shock Index > 1.0" para que o médico saiba o que o app fez em nome dele.

### 1.4 Risco clínico — dose de carvão ativado sem peso em ToxPath 🟠
**Arquivo:** `v2/src/pages/ToxPath.tsx` (DescontaminaçãoView, resultado "indicado")

O fluxo de descontaminação recomenda "Adulto: 50 g (1 g/kg)" sem nunca pedir o peso do paciente. Em adolescentes de 40 kg, 1 g/kg = 40 g, não 50 g. Em adultos de 90 kg, deveria ser 90 g.

**Ação:** adicionar input de peso antes da recomendação final, ou pelo menos um alerta "Dose padrão para adultos >50 kg — ajuste se <50 kg".

### 1.5 AclsGuide — recordNum racing condition 🟠
**Arquivo:** `v2/src/pages/AclsGuide.tsx:565-570`

`generateReport()` lê `localStorage.getItem('acls_records')` dentro da função, mas a função é chamada em `handleShowReport()` que é chamada em vários lugares. Se o usuário clica "Ver relatório" duas vezes rapidamente, dois `Date.now()` diferentes viram `record.id` idênticos se o relógio tem resolução baixa, e ambos gravam com o mesmo `num`.

**Ação:** mover a leitura/escrita para um efeito dedicado, e usar `crypto.randomUUID()` para o id.

### 1.6 DenguePath — unidade de lactato inconsistente com Shock Path 🟠
**Arquivo:** `v2/src/pages/DenguePath.tsx` vs `ShockPath.tsx:498-520`

ShockPath usa toggle mmol/L ↔ mg/dL; DenguePath não tem lactato na trilha principal mas quando mencionado nos blocos de texto, usa apenas mmol/L. Médicos brasileiros trabalham predominantemente com mg/dL. Essa inconsistência entre ferramentas do mesmo app é confusa.

**Ação:** padronizar — toggle global no contexto (já existe WeightContext, adicionar UnitContext) ou garantir que toda ferramenta que menciona lactato aceite ambas unidades.

### 1.7 SedaPath — tipo `Screen` com `direction` não usado
**Arquivo:** `v2/src/pages/SedaPath.tsx:125`

```ts
const goTo = useCallback((screen: Screen, direction: 'left' | 'right' = 'left') => {
```

`direction` é parâmetro não usado (sem sublinhado prefix). TypeScript strict aceita, mas `eslint-unused-vars` acende warning. Também em `ShockPath.tsx` (`_slideDir`).

**Ação:** prefixar com `_` ou remover.

### 1.8 ShockPath — valor de PP fica "stale" com modo calculado
**Arquivo:** `v2/src/pages/ShockPath.tsx:481-489`

Em `ppMode === 'calculado'`, o código usa dois inputs soltos (PAS e PAD). O handler `handlePasChange` só recalcula PP se `state.pad !== null`. Se usuário digita PAS antes de PAD, PP fica `null`. Se depois digita PAD, o PP recalcula — mas com a PAS **do `state`**, que pode não ter sido atualizada ainda (closure stale).

**Ação:** calcular PP sempre derivado em `useMemo`, não disparar do handler.

### 1.9 TepGuide — função `showManagement` com dependência incorreta
**Arquivo:** `v2/src/pages/TepGuide.tsx:399`

`showManagement` usa `goToPanel` mas falta nas deps do `useCallback` do `classAnswer` (linha 340). Em React 18 strict com `react-hooks/exhaustive-deps`, isso acende warning. Em certos cenários de re-render pode chamar a versão antiga.

**Ação:** adicionar `showManagement` às deps, ou inlinar a chamada.

---

## 2. ALTA PRIORIDADE (primeira semana pós-lançamento)

### 2.1 Inconsistência entre home screens das 13 ferramentas
Cada ferramenta tem layout de home próprio:
- **Hub:** grid 2x3 com ícones grandes
- **AirwayGuide:** card principal + grid 2 colunas (inline styles)
- **PaliaPath:** grid 2x2 de módulos + extras (inline styles)
- **DenguePath:** card destaque + grid 2x2 (inline styles)
- **ShockPath:** card destaque + grid 2x2 (Tailwind)
- **TepGuide:** col-span-2 + 2 cards pequenos (Card component)
- **ToxPath:** banner CIATox + lista vertical de módulos (Card component)
- **ACLSGuide:** botão circular + cards verticais
- **PedGuide:** 3 cards verticais grandes
- **BlockPath:** 5 botões verticais com ícones
- **SedaPath:** vai direto para triagem (sem home)
- **VmGuide:** vai direto para busca + collapsibles
- **Calculators:** weight gate + busca + categorias

Isso é 13 layouts diferentes para a mesma função (escolher subferramenta). Médicos em plantão precisam de previsibilidade muscular-memorial.

**Ação:** criar um `<ToolHomeGrid>` compartilhado que recebe `{ primary: Card, secondary: Card[] }` e padroniza. Os dados (cor, label, icon, destino) são props.

### 2.2 Ícones SVG inline duplicados em todos os lugares
Cada página tem 10-30 SVGs inline de voltar, chevron, checkmark, aviso. Manutenção péssima. A v2 já importa `lucide-react` (visível em `BlockPath.tsx:10`).

**Ação:** migrar todos os SVGs para `lucide-react` (ArrowLeft, ChevronRight, Check, AlertTriangle, etc). Reduz o bundle (tree-shake) e unifica stroke-width/size.

### 2.3 Traduções misturadas em nomes de estados e tipos
Examples:
- `PaliaPath.tsx:29`: `type ManejarTab = 'dor' | 'dispneia' | 'náusea' | 'delirium' | 'sedação' | 'final'` — acentos em union types (funciona mas gera problemas em builds ES5, fontes sem glyph, URL encoding)
- `DenguePath.tsx:17`: `'stepGrupo'` (camelCase pt), `'classificação'` (acento), `'referências'` (acento) misturados no mesmo type
- `SedaPath.tsx:32-41`: `'pouco-colaborativo'`, `'sedação-vo'`, `'nao-colaborativo'` — mistura hífen com e sem acento

**Ação:** padronizar identificadores internos em ASCII kebab-case (`'dor'`, `'dispneia'`, `'nausea'`, `'sedacao'`). Manter labels em português no `BREADCRUMB_LABELS` e equivalentes. Isso evita bugs de URL, roteamento, analytics e busca.

### 2.4 Persistência inconsistente — alguns estados em localStorage, outros não
- `Calculators.tsx` — favoritos persistem (bom)
- `AclsGuide.tsx` — histórico de atendimentos persiste (bom)
- `ShockPath.tsx` — `localStorage.setItem('anyapp-peso', ...)` antes de navegar (mas só aqui)
- Todo o resto — estado volátil no useState, perde ao refresh

Se um médico está no meio de um `AirwayGuide` passo 7 e refresh acidental → tudo perdido. Especialmente grave em trilhas longas (Dengue Path, Airway, TEP).

**Ação:** criar hook `usePersistentReducer` que salva snapshot do estado a cada mudança, com TTL de 6h. Aplicar em todos os fluxos longos. Adicionar botão visível "Continuar de onde parei" no Hub.

### 2.5 Accessibility — faltam labels em muitos inputs
Examples:
- `ShockPath.tsx` — inputs de FC/PAS/PAD têm `placeholder` mas nenhum tem `aria-label`
- `AirwayGuide.tsx:940+` — `<input type="number">` em Shock Index calc sem aria-label
- `PaliaPath.tsx` — calculadora de opioides: `<select>` sem labels associados via htmlFor/id

Médicos idosos com leitores de tela, deficientes visuais, ou em luz baixa (UTI à noite) sofrem.

**Ação:** auditoria com axe-core. Todo input precisa de `<label>` ou `aria-label`. Todo botão com só ícone precisa de `aria-label`.

### 2.6 Internacionalização — português ASCII vs acentuado em strings visíveis
Exemplos:
- `ACLS Guide: "Considere intubação"` — correto
- `Airway Guide: "Indicação"` — correto
- `SedaPath: "Seda Path"` no footer mas `"SedaPath"` no título
- `TepGuide: "próximal"` em vez de "proximal"

Tem várias palavras soltas sem acento (provavelmente remanescentes de uma migração). `grep -r "proximal\|criança\|hidratação"` e revisar.

**Ação:** revisão ortográfica completa passada por profissional. Um app médico com erros de português reduz credibilidade.

### 2.7 ShockPath e AclsGuide — timers sem cleanup garantido
`AclsGuide.tsx` tem `clearAllIntervals()` robusto, mas `ShockPath.tsx` tem `startCycleTimer()` que pode vazar se componente desmonta mid-run. Nenhum `useEffect` cleanup.

**Ação:** adicionar `useEffect(() => () => clearAllIntervals(), [])` em todas as páginas que iniciam timers.

### 2.8 PedGuide — dropdown do Broselow cobre o próximo conteúdo
**Arquivo:** `v2/src/pages/PedGuide.tsx:1237-1253`

O dropdown é `absolute top-full left-0 right-0` mas não tem `z-index` explícito suficiente. Em conjunto com cards abaixo com `position: relative`, pode ficar atrás dependendo de stacking context. Em iOS Safari isso acontece com frequência.

**Ação:** `z-[100]` explícito; testar em dispositivo real.

### 2.9 Modais sem foco trap
`PaliaPath.tsx` usa `<Modal>` para mitos. `AirwayGuide.tsx` usa para flush rate. Nenhum garante que Tab não saia do modal (foco escapa para elementos atrás). Em mobile é menos visível mas em desktop quebra acessibilidade e é chato.

**Ação:** usar `focus-trap-react` ou similar no `Modal` componente base.

### 2.10 Nenhum rate limiting / debounce em Ht e VNERi
Em `ShockPath`, a cada tecla nos inputs de FC/PAS/PAD/NE o `useMemo` do VNERi reexecuta. Não é caro, mas em mobile baixo-fim causa lag perceptível.

**Ação:** debounce 200ms nos inputs numéricos, ou calcular só no blur.

---

## 3. DÉBITO TÉCNICO / ROADMAP PÓS-LANÇAMENTO

### 3.1 Arquivos gigantescos
Top 5 por tamanho:
1. ShockPath.tsx — 2588 linhas, 97KB
2. TepGuide.tsx — 1793 linhas, 98KB
3. DenguePath.tsx — 1742 linhas, 86KB
4. AirwayGuide.tsx — 1725 linhas, 77KB
5. AclsGuide.tsx — 1687 linhas, 63KB

O system prompt do próprio projeto diz "Always avoid writing large files (>1000 lines). Instead, split your code into several smaller JSX files". Todas as 13 páginas violam isso.

**Ação:** split em `src/pages/<Tool>/` com `index.tsx`, `screens/`, `components/`, `data.ts`. Tempo estimado: 2-3 dias/ferramenta. Não bloqueia lançamento, mas primeira onda de manutenção pós-lançamento vai doer.

### 3.2 Tipagem frouxa em vários lugares
- `AirwayGuide.tsx:85`: `[key: string]: boolean` em `CrashState` — permite qualquer key, perde safety do union
- Várias páginas usam `as any`, `void _var` para suprimir warnings
- `PedGuide.tsx` tem objetos enormes `INFUSION_DATA` sem interface abstrata que garanta que todas as drogas têm `small/medium/large`

**Ação:** ligar `noUncheckedIndexedAccess` no tsconfig, limpar warnings.

### 3.3 Dados clínicos hardcoded em arquivos de UI
- Doses de medicação, ranges de referência, thresholds — tudo misturado com JSX
- PaliaPath e ToxPath extraíram para `data/paliaData.ts` e `data/toxData.ts` — **bom padrão**, seguir para as outras

**Ação:** extrair `AIRWAY_DRUGS`, `ACLS_MEDICATIONS`, `PED_DRUGS`, `VM_REFERENCES` para `src/data/<tool>Data.ts`. Facilita revisão clínica (um residente de farmácia pode revisar o arquivo sem conhecer React).

### 3.4 Componentes internos repetidos
Cada página redefine `BackButton`, `StepHeader`, `CheckItem`, `NavButtons`, `ResultCard`, `SectionTitle`, `BulletList`, `InfoCard`, `CalcCard`, `Tag`, `DataBadge`, `Breadcrumb`, `ProgressDots`, `ProgressBar`, `ChecklistCalc`, `CalcResult`, `VitalBadge`, `MedTable`, `StepsList`, `PillTabs`, `TabBar`...

**Ação:** mover para `src/components/clinical/` como primitivas. 80% do design system emerge disso.

### 3.5 Sem testes automatizados
Não encontrei `*.test.ts*` no projeto. Para um app clínico, no mínimo:
- Unit tests nos helpers de cálculo (`calcVNERi`, `calcDengueHydration`, `calcPesoIdeal`, `calcInfusionRate`, nomograma Rumack-Matthew, etc)
- Snapshot tests das telas principais para detectar regressão visual
- E2E básico do fluxo Airway → IOT com Playwright

**Ação:** começar pelos cálculos. Um número errado em dose pediátrica pode matar. Tem ~50 funções de cálculo em `utils/` e espalhadas nas pages — cada uma precisa de teste com 3 inputs de canto.

### 3.6 Nenhuma telemetria de uso
Sem saber quais ferramentas são usadas, em que horários, em que fluxos os médicos abandonam — impossível priorizar melhorias. Considerando que é app clínico, evite analytics invasivo; mas métricas agregadas anônimas (posthog/plausible com opt-in) seriam úteis.

**Ação:** conversar com DPO. Se for OK, adicionar eventos: tool_opened, pathway_completed, calculator_used, copy_report, etc.

### 3.7 Versionamento das referências clínicas
`VmGuide` cita "Global 2024" para SDRA. `AclsGuide` cita AHA 2025. `DenguePath` cita Ministério da Saúde 6ª ed 2024. `ShockPath` cita ANDROMEDA-SHOCK 2. Essas referências vão mudar — e quando mudarem, o usuário precisa saber qual guideline está ativo.

**Ação:** Footer deveria mostrar "Baseado em: [lista de guidelines com data]". Um JSON `src/data/guidelines.ts` consultado por cada ferramenta.

### 3.8 Disclaimer médico-legal é genérico
Componente `<Disclaimer />` é montado em todas as páginas. Mas não vi o conteúdo — presumo "ferramenta de apoio à decisão clínica, não substitui avaliação médica". Pergunta: ele é aceito juridicamente no Brasil? CFM tem requisitos específicos para apps de decisão clínica (Resolução CFM 2.311/2022 e seguintes).

**Ação:** revisão jurídica antes do lançamento público. Se o app é distribuído em app store ou tem users cadastrados, precisa de Termo de Uso + Política de Privacidade + conformidade LGPD. Isso não é código, mas é bloqueador real de lançamento.

### 3.9 Offline-first?
O app parece SPA client-side (React Router), funções usam `navigator.clipboard`, `window.open('https://wa.me/')`, mas não vi service worker ou manifest. Médicos em UTI com Wi-Fi ruim precisam que funcione offline. `window.claude.complete` não está sendo usado (bom — exige internet).

**Ação:** adicionar PWA com service worker + cache de todas as assets + manifest. Vite tem plugin `vite-plugin-pwa` pronto.

### 3.10 Sem feature flags
Se um bug crítico surgir em produção em uma ferramenta, não tem como desabilitá-la remotamente. Todo fix exige redeploy.

**Ação:** simples flag em `src/config.ts` ou fetch de `/config.json` ao boot que liga/desliga cada ferramenta.

---

## 4. OBSERVAÇÕES POSITIVAS

Coisas que estão **bem feitas** e devem ser mantidas:

- **Context API** bem aplicado — `WeightContext`, `ToastContext` evitam prop drilling
- **useReducer** para fluxos complexos (Airway, Shock, ACLS, Dengue) — escolha certa
- **Data separation** em Palia/Tox — padrão para expandir
- **Calculadoras favoritáveis** — ótima UX, imitar em outras listas
- **Breadcrumb do SedaPath** — clareza do estado atual em fluxos longos
- **Broselow bidirecional** — escolher por cor ou peso, sincronizam — elegante
- **Metronome com audio silencioso para iOS** em ACLS — detalhe técnico maduro
- **Wake Lock API** em ACLS — previne tela desligar em reanimação

---

## 5. CHECKLIST DE GO/NO-GO

Itens que precisam de ✅ antes de liberar para produção:

- [ ] **Clínico:** revisão de todas as doses e thresholds por médico emergencista independente (peer review)
- [ ] **Clínico:** revisão jurídica do disclaimer + CFM/LGPD
- [ ] **Funcional:** BlockPath — 14 bloqueios implementados OU escondidos
- [ ] **Funcional:** Airway — fix do auto-TOGGLE_CRASH H
- [ ] **Funcional:** Tox — peso do paciente no cálculo de carvão
- [ ] **UX:** todos os home screens auditados visualmente
- [ ] **UX:** teste com 3 médicos emergencistas em cenário simulado
- [ ] **Técnico:** eslint sem warnings, tsc sem erros
- [ ] **Técnico:** smoke test manual de todas as 13 ferramentas em mobile real (iOS + Android)
- [ ] **Técnico:** lighthouse >90 em performance/acessibilidade
- [ ] **Legal:** Termo de Uso, Política de Privacidade, disclaimer revisado
- [ ] **Operacional:** canal de feedback para médicos reportarem bugs
- [ ] **Operacional:** plano de hotfix (quanto tempo até correção em produção?)

---

## 6. RECOMENDAÇÃO FINAL

**Estado atual:** beta muito robusto. Os 13 módulos são conceitualmente bem desenhados, as calculadoras estão certas, a arquitetura é coerente. **Não é lixo** — é produto.

**Mas não está pronto para lançamento público.** Os bloqueadores na seção 1 são reais e alguns envolvem risco de segurança do paciente (1.3 auto-toggle CRASH-H, 1.4 peso em Tox). O item 1.1 (BlockPath incompleto) é questão de expectativa frustrada.

**Sugestão de fases:**

1. **Beta fechado (1-2 semanas):** convidar 20-30 médicos emergencistas de confiança. Corrigir seção 1 + alguns itens da seção 2 com base no feedback.
2. **Lançamento soft (público mas com banner "beta"):** cobertura de seção 2 completa. Telemetria ativa.
3. **v2.1 (1-2 meses depois):** seção 3 completa, PWA offline, testes automatizados.

**Prioridade absoluta antes de qualquer lançamento:** revisão clínica por par independente. Código bom com dose errada mata.

---

*Relatório gerado por análise automatizada. Não substitui revisão manual caso a caso.*
