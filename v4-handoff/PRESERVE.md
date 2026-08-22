# Ganhos da v2.2 a preservar na v4

Estes sao os 20+ avanços da jornada de hoje (21/04/2026) que NAO sao esteticos — sao melhorias funcionais, de seguranca clinica, e de infra. Devem ser reimplementados ou portados para a v4 SEM negociar.

## Seguranca clinica (NAO NEGOCIAVEL)

### CRASH-H idempotente (AirwayGuide)
Quando Shock Index > 1.0, o app marca automaticamente o item H (Hipotensao). Antigo comportamento usava `TOGGLE_CRASH` que podia DESMARCAR se ja estivesse marcado. Novo: action `SET_CRASH` idempotente + toast informativo ao medico.

**Arquivo:** `v2/src/pages/AirwayGuide.tsx` commit BLOCKER-03 (hash 41b7e49)

### Carvao ativado calculado por peso (ToxPath)
Antes: mostrava "Adulto: 50 g (1 g/kg)" sem pedir peso. Em adolescente 40 kg, 50 g e overdose. Novo: componente `CarvaoAtivadoCalc` integra `useWeight`, calcula 1 g/kg com clamp 25-100 g.

**Arquivo:** `v2/src/pages/ToxPath.tsx` commit BLOCKER-04 (hash 3b64d59)

### PP sem closure stale (ShockPath)
Pressao de pulso calculada nos handlers de PAS/PAD podia usar valor stale. Novo: `useEffect` sincroniza PP a partir de state.pas/pad quando modo=calculado.

**Arquivo:** `v2/src/pages/ShockPath.tsx` commit BLOCKER-08 (hash 698e6b7)

### randomUUID nos records do AclsGuide
`record.id = Date.now()` podia colidir em cliques rapidos. Novo: `crypto.randomUUID()` com fallback seguro.

**Arquivo:** `v2/src/pages/AclsGuide.tsx` commit BLOCKER-05 (hash c28a92b)

### BlockPath "Em breve" (evita dead-end)
Antes: todos os 14 bloqueios apareciam na lista mas 13 levavam a tela vazia. Novo: badge "Em breve" + disabled nos 13 nao-implementados, so "plexo-cervical" funciona.

**Arquivo:** `v2/src/pages/BlockPath.tsx` commit BLOCKER-01 (hash 4a185be)

## Correcoes tecnicas (preservar)

### Params nao usados prefixados (SedaPath, VmGuide)
Eslint clean em `goTo(screen, _direction)` e remocao de import `interpretHACOR` nao usado.

**Commits:** BLOCKER-07 (4a466a7)

### TepGuide classAnswer com deps corretas
`classAnswer` usa `goToPanel` inline + `goToPanel` nas deps do useCallback.

**Commit:** BLOCKER-09 (b5b2022)

## Acessibilidade (preservar — a11y e regulatorio)

### Modal com focus trap
Modal tem: focus trap Tab/Shift-Tab cicla dentro, Esc fecha, foco inicial no primeiro elemento, restore focus ao fechar, `aria-modal="true"`, `aria-labelledby`.

**Arquivo:** `v2/src/components/common/Modal.tsx` commit ALTA-09 (021877d)

### aria-labels em botoes icon-only
FABMenu, Modal close button, WeightInput, DoseCalculator +/- buttons, Hub cards, BlockPath back buttons — todos com `aria-label` apropriado.

### aria-expanded + aria-controls no Collapsible
Todos os collapsibles tem acessibilidade de accordion (ARIA Authoring Practices).

### z-index explicito no dropdown Broselow do PedGuide
`z-[100]` evita que dropdown fique atras de cards em iOS Safari.

**Arquivo:** `v2/src/pages/PedGuide.tsx` commit ALTA-08 (33879b1)

## Conteudo (preservar)

### Ortografia corrigida em calculatorData.ts e toxData.ts
~30 palavras com acentuacao PT correta (apresentacao, sonolencia, confusao, descerebracao, estabilizacao, hidratacao, administracao, etc).

**Commit:** ALTA-06 (43f04fb)

## Infra (preservar)

### UnitContext + units.ts
Contexto para preferencia de unidade de lactato (mg/dL default). Persiste em localStorage. Util `convertLactate(value, from, to)`.

**Arquivos:** `v2/src/contexts/UnitContext.tsx`, `v2/src/utils/units.ts` commit BLOCKER-06 (8430b14)

### guidelines.ts
Centraliza diretrizes ativas por ferramenta. Footer pode consumir `getAllGuidelineNames()`.

**Arquivo:** `v2/src/data/guidelines.ts` commit DEBITO-07 (6baa7b7)

### config.ts (feature flags)
Permite desabilitar ferramenta sem redeploy. `FEATURES.block = false` esconde BlockPath do Hub, por exemplo.

**Arquivo:** `v2/src/config.ts` commit DEBITO-10 (97d33f8)

## Branding / PWA (preservar)

### Logos 38 e 39
- `38.svg` = logo horizontal do app (header, splash) — convertida para `logo.png` 1024x576 (286 KB) em `v2/src/assets/`
- `39.svg` = app icon quadrado (home screen do celular) — convertida em 180/192/512 em `v2/public/`

### Manifest + meta tags PWA
`v2/public/manifest.webmanifest` + meta tags em `v2/index.html` (apple-mobile-web-app-capable, theme-color, apple-touch-icon). Instalavel como app.

### V1 sincronizado
`deploy/index.html` tambem teve as logos substituidas (splash base64 trocado por externa `./logo.png`, LOGO_BASE64 interno atualizado, apple-touch-icon adicionado).

## O que NAO preservar (especialmente visual)

- Bordas #222/#333 — voltar #444 v1
- Disclaimer 32px texto curto — voltar 40px texto longo "Ferramenta de apoio em teste — nao substitui o julgamento clinico."
- Footer static — voltar fixed bottom
- Header logo 240px — voltar 280px
- Hub com icone top-left + nome bottom — voltar icone centralizado + nome centralizado
- Badge NOVO pill — voltar ribbon rotate(45deg)
- Collapsible unificado — voltar com costura (header + body em wrappers separados)
- Card box-shadow inset — voltar border-left 4px inline
- Card spaced default — voltar mb-4 automatico
- touch-press opt-in — voltar scale global em button:active
- Divisores laterais na label "Ferramentas" — voltar label centralizada sem divisores
