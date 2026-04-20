# CHANGELOG — Ajustes de layout v2 (Abril 2026)

> Refatoração cirúrgica de layout. **Nenhum conteúdo clínico foi alterado.**
> Nenhuma funcionalidade foi removida. Escopo restrito a componentes de
> layout, Hub e InfusionGuide (como prova de conceito da nova base).

## Arquivos modificados

```
v2/src/index.css
v2/src/components/layout/Disclaimer.tsx
v2/src/components/layout/Header.tsx
v2/src/components/layout/Footer.tsx
v2/src/components/layout/Container.tsx
v2/src/components/layout/FABMenu.tsx
v2/src/components/common/Card.tsx
v2/src/components/common/Collapsible.tsx
v2/src/components/common/WeightInput.tsx
v2/src/components/clinical/DoseCalculator.tsx
v2/src/pages/Hub.tsx
v2/src/pages/InfusionGuide.tsx
```

## Problemas corrigidos

### 1. `index.css`
- **Removido `button:active { transform: scale(0.98) }` global** que causava
  dupla-compressão em botões com `active:scale-[0.98]` próprio.
- Substituído por classe utilitária opt-in `.touch-press`.
- **Adicionados tokens de coordenação sticky**: `--h-disclaimer`, `--h-weight`,
  `--z-disclaimer`, `--z-weight`, `--z-search`, `--z-fab`. Fim dos números
  mágicos (`top-[41px]`, `top-[66px]`).
- Border tokens voltados para `#222` (border) e `#333` (border-card), conforme
  CLAUDE.md §5.1 (o v2 anterior tinha `#444` em ambos — muito pesado).

### 2. `Disclaimer.tsx`
- Altura reduzida de ~40px para 32px (token `--h-disclaimer`).
- Fonte 11px, ícone de alerta inline para manter a legibilidade.
- Texto enxugado: "Apoio em teste — não substitui o julgamento clínico."

### 3. `Header.tsx`
- **Removido hack `translate-x-[6px]`** que mascarava problema de centralização.
- Logo passa a ser importado via `import logo from '../../assets/logo.png'`
  conforme CLAUDE.md §10.3 (antes usava `src="/logo.png"` direto).
- Logo vira `<button>` nativo em vez de `<img onClick>` (acessibilidade).
- Padding py-5 → py-4.
- `title` e `subtitle` agora são opcionais (Hub não precisa passar `""`).

### 4. `Footer.tsx`
- **Footer deixou de ser `fixed`** — agora é estático no fim da página.
  - Motivo: em mobile, footer fixo rouba ~56px permanentes do viewport.
  - O usuário vê o footer quando chega ao fim do conteúdo, como deve ser.
- Créditos mantidos idênticos.

### 5. `Container.tsx`
- `pb-[100px]` → `pb-6` (footer não é mais fixed, não precisa de espaço reservado).

### 6. `Card.tsx`
- **Removido hack de inline `borderTop/Right/Bottom`** que simulava
  `border + border-left`. Agora usa `border` padrão + `box-shadow inset` para
  a faixa lateral colorida. Resultado: código limpo, sem conflito de bordas.
- Nova prop `spaced` (default `false`): pai controla spacing via
  `space-y`/`gap`, evitando `mb-4` forçado.
- Padding consistente (`p-4` sempre; antes alternava p-4/p-5).

### 7. `Collapsible.tsx`
- **Header e body agora são um único container** com uma única border.
  - Antes: header tinha border completa, body tinha border sem border-top.
    Isso criava uma costura horizontal visível quando aberto.
- Divisor entre header e body via `border-t` sutil no body expandido.
- Adicionado `aria-expanded` para acessibilidade.

### 8. `FABMenu.tsx`
- Removido `max-w-[500px]` no wrapper `fixed` (sem efeito útil, estava
  ancorado em `right-5`).
- Usa token `--z-fab` para coordenar com disclaimer/weight/search.
- Botão FAB agora usa classe `.touch-press` ao invés do scale global.
- `aria-label` e `aria-expanded` adicionados.

### 9. `WeightInput.tsx`
- **Sticky coordenado via CSS var**: `top: var(--h-disclaimer)`.
  Antes era `top-[41px]` (número mágico que quebrava se disclaimer mudasse).
- Altura controlada por `--h-weight` para que outros sticky (busca) se
  empilhem corretamente com `calc(var(--h-disclaimer) + var(--h-weight))`.
- Fundo `bg-bg-primary/95 backdrop-blur` em vez de card sólido — mais leve.

### 10. `DoseCalculator.tsx`
- **"Diluição" deixa de ter border-left azul** (não é um `AlertCard` — era
  um uso incorreto do padrão de alerta). Agora é um card de metadados com
  hierarquia tipográfica limpa.
- Diluições alternativas viram **segmented control** (pill único com
  indicador interno) em vez de botões separados competindo pelo accent.
- Range terapêutico passa a ser inline com o label da dose, eliminando
  um card cinza extra que não agregava.
- Grid de resultado usa border 1px (antes 2px gritante).
- `aria-label` em sliders e inputs.

### 11. `Hub.tsx`
- Removido `<Header title="" subtitle="" />` (passar props vazias era hack).
- Label "FERRAMENTAS" agora tem divisores laterais (linhas finas) e
  tracking mais discreto.
- Cards: ícone no topo-esquerda, nome ocupando resto do card alinhado ao
  fim — melhor hierarquia do que "ícone centralizado + nome centralizado"
  sem variação.
- **Badge "NOVO" vira pill** no canto superior direito, sem `rotate(45deg)`
  cafona.
- `<div onClick>` → `<button>` nativo (acessibilidade + teclado).
- Todos os accents mantidos como estavam (12 em `#FF5252`, Calculadoras em
  `#2196F3`) — nenhuma cor nova introduzida.

### 12. `InfusionGuide.tsx`
- **FABMenu removido** — os items eram placeholders que apenas limpavam a
  busca, sem função real.
- Busca sticky usa `top: calc(var(--h-disclaimer) + var(--h-weight))`
  em vez de `top-[66px]` hardcoded.
- Gate de peso: tipografia ajustada (título 17px, label "Obrigatório" como
  uppercase micro), botão usa `active:bg-accent-hover` em vez de opacity
  fade (mais coerente com o design system).
- `autoFocus` no input de peso (pequena redução de fricção).
- Animação `animate-fade-in` nas calculadoras que abrem.

## Impacto nas outras páginas (ainda não refatoradas)

As 12 outras páginas (`AirwayGuide`, `VmGuide`, `ShockPath`, etc.) **continuam
funcionando** porque:

- API dos componentes (`Collapsible`, `Card`, `Footer`, `Header`,
  `WeightInput`, `Disclaimer`) foi preservada.
- Apenas `Header.title` virou opcional — antes era obrigatório, mas todas
  as outras páginas já passam um título real.
- `Card` ganhou prop `spaced` opcional (default `false`). Páginas que
  dependiam de `mb-4` automático devem passar `spaced` ou migrar para
  `space-y-3` no container pai. **Isso pode afetar o spacing** em algumas
  telas — revisar visualmente após o deploy.

## Checklist pré-deploy (conforme CLAUDE.md §16)

- [x] `<Disclaimer />`, `<Header />`, `<Footer />` presentes no Hub e Infusion
- [x] Seções `<Collapsible />` iniciam FECHADAS (comportamento preservado)
- [x] Linguagem sugestiva preservada (nenhum texto clínico alterado)
- [x] Medicamentos com nome genérico (dados em `drugConfigs.ts` não tocados)
- [x] Zero emojis
- [x] Botões com min-height 44px+
- [x] `inputMode="decimal"` nos inputs numéricos
- [ ] Executar `cd v2 && npm run build` (aguardando validação)
- [ ] Testar em tela mobile (< 400px)

## Próximos passos sugeridos

1. `cd v2 && npm run build` — conferir zero erros de TS.
2. Rodar `npm run dev` e validar Hub + Infusion no iPhone SE (375px).
3. Se OK, replicar padrão coordenado de sticky (`var(--h-disclaimer)` etc.)
   nas 12 ferramentas restantes em PRs separados.
4. Considerar migrar as demais páginas para `space-y-3` no lugar do `mb-4`
   antigo do Card.
