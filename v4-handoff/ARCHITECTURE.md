# Arquitetura tecnica v4

## Stack (igual v2)

- React 19 + TypeScript 5.9 (strict)
- Vite 8 + Tailwind CSS 4.2 via @tailwindcss/vite
- React Router 7
- lucide-react (icones)
- Supabase (auth + opcionalmente edge functions)
- javascript-obfuscator + rollup-plugin-obfuscator no build

## Por que NAO reescrever do zero

A v2 ja tem a logica clinica corretamente portada. A v4 **parte da v2** mas:
- Reset visual (volta para tokens v1)
- Reestrutura pagina Calculadoras (MDCalc)
- Elimina debts tecnicas escolhidas (ver abaixo)

**NAO comecar nova codebase.** Reusar `v2/` + nova branch `v4/`.

## Debts tecnicos a resolver na v4

1. **Split de arquivos >1000 linhas**. Prioritarios:
   - ShockPath (2588) → `pages/ShockPath/index.tsx` + `screens/` + `data.ts`
   - TepGuide (1793)
   - DenguePath (1742)
   - AirwayGuide (1725)
   - AclsGuide (1687)

2. **Consolidacao de primitivas clinicas** — mover BackButton, StepHeader, CheckItem, NavButtons, ResultCard, SectionTitle, BulletList, etc de cada pagina para `src/components/clinical/`.

3. **Extracao de dados clinicos** — cada ferramenta com seu `src/data/<tool>Data.ts` (ja existe padrao em `paliaData.ts`, `toxData.ts`).

4. **100+ hex hardcoded** em 8 paginas → usar tokens.

5. **3 aria-labels no codebase inteiro** → auditoria a11y completa (axe DevTools em cada page).

6. **Zero testes** → configurar Vitest + testes unitarios dos helpers de calculo (~50 funcoes) + E2E basico (Playwright) do Airway pathway.

## Features dormentes a ativar ou remover

- `MetronomeContext` — metronomo de PCR implementado mas nao conectado. **Acao:** conectar no AclsGuide ou remover.
- `useServerCalc` — Edge Function para calculos protegidos, DoseCalculator usa calc local. **Acao:** conectar (se quer proteger formulas) ou remover.
- `usePageview` — analytics, nao chamado. **Acao:** conectar com opt-in LGPD ou remover.

## Features novas proposta v4

1. **`usePersistentReducer` hook** — persistencia de sessao em fluxos longos. Refresh no meio do Airway/Dengue/TEP nao perde tudo.

2. **`<ToolHomeGrid />`** — home screen compartilhada. Unifica layout de "escolher subferramenta" em 13 paginas.

3. **PWA offline real** — `vite-plugin-pwa` + service worker + cache de bundle. Essencial para uso clinico em UTI com Wi-Fi ruim.

4. **Reestrutura Calculadoras estilo MDCalc** — `CalcTabs`, `InputRow`, `ResultBox` componentes novos em `src/components/clinical/`. Ver VISUAL-GUIDE.md §MDCalc.

## Ordem de execucao sugerida

### Sprint 1 — Reset visual (1 dia)
1. Criar branch `v4/` a partir do main atual (nao do handoff/v2-pre-launch)
2. Cherry-pick apenas os 18 commits de `PRESERVE.md`
3. Aplicar logos + manifest + apple-touch-icon
4. Deploy em anyapp-v4 (criar novo site Netlify)

### Sprint 2 — Calculadoras MDCalc (1-2 dias)
1. Criar `<CalcTabs>`, `<InputRow>`, `<ResultBox>` em `src/components/clinical/`
2. Estender `calculatorData.ts` com campos opcionais (`instructions`, `whyUse`, `whenToUse`, `pearls`, `references`, `nextSteps`)
3. Migrar 3 pilotos: HEART, Wells DVT, CURB-65
4. Validar com Gustavo
5. Migrar 70 restantes em lotes por categoria

### Sprint 3 — Debts tecnicos (2-3 dias)
1. Split de arquivos gigantes (um por um, comecando por ShockPath)
2. Consolidacao de primitivas clinicas
3. `usePersistentReducer` + aplicar nos pathways
4. `<ToolHomeGrid />` + aplicar nas 13 paginas

### Sprint 4 — PWA + Testes (1-2 dias)
1. vite-plugin-pwa + service worker
2. Vitest infra + testes de calculos
3. Playwright E2E basico

### Sprint 5 — Lancamento (pos-juridico)
1. Revisao juridica LGPD/CFM 2.311/2022 (NAO codigo)
2. Promover v4 a producao oficial

## Estrutura de pastas proposta

```
v2/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── assets/
│   │   └── logo.png
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── WeightContext.tsx
│   │   ├── ToastContext.tsx
│   │   ├── MetronomeContext.tsx
│   │   └── UnitContext.tsx
│   ├── hooks/
│   │   ├── useIsMobile.ts
│   │   ├── usePageview.ts
│   │   ├── useServerCalc.ts
│   │   └── usePersistentReducer.ts       ← NOVO
│   ├── components/
│   │   ├── layout/        (Header, Footer, Container, Disclaimer, FABMenu)
│   │   ├── common/        (Card, Button, Collapsible, Modal, Toast, Toggle, WeightInput, AlertCard)
│   │   └── clinical/
│   │       ├── DoseCalculator.tsx
│   │       ├── StepperNav.tsx
│   │       ├── ToolHomeGrid.tsx          ← NOVO
│   │       ├── CalcTabs.tsx              ← NOVO (MDCalc)
│   │       ├── InputRow.tsx              ← NOVO (MDCalc)
│   │       ├── ResultBox.tsx             ← NOVO (MDCalc)
│   │       └── primitives/               ← NOVO (consolidado)
│   │           ├── BackButton.tsx
│   │           ├── StepHeader.tsx
│   │           ├── CheckItem.tsx
│   │           └── ... (12+ primitivas)
│   ├── data/
│   │   ├── calculatorData.ts (+ campos novos)
│   │   ├── drugConfigs.ts
│   │   ├── guidelines.ts
│   │   ├── paliaData.ts
│   │   ├── toxData.ts
│   │   ├── vmData.ts
│   │   ├── airwayData.ts                 ← NOVO (extraido)
│   │   ├── shockData.ts                  ← NOVO
│   │   └── ...
│   ├── pages/
│   │   ├── Hub.tsx
│   │   ├── InfusionGuide.tsx
│   │   ├── Calculators.tsx               (refatorada estilo MDCalc)
│   │   ├── AirwayGuide/                  ← PASTA (split)
│   │   │   ├── index.tsx
│   │   │   ├── screens/
│   │   │   └── components/
│   │   ├── ShockPath/
│   │   ├── TepGuide/
│   │   ├── DenguePath/
│   │   └── ... (outras)
│   ├── types/
│   │   └── clinical.ts
│   ├── utils/
│   │   ├── calculations.ts
│   │   ├── formatters.ts
│   │   └── units.ts
│   └── config.ts
├── public/
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── manifest.webmanifest
│   ├── favicon.svg
│   └── logo.png (fallback, nao usado pelo Header)
└── index.html
```

## Regras inegociaveis

- CLAUDE.md do projeto tem prioridade maxima
- V1 monolito INTOCADO (exceto logos, ja atualizadas)
- Nao adicionar dependencias sem justificar em PR
- Commits atomicos em branch `v4/` com mensagem clara
- Build + lint zero erros antes de cada commit
- Em duvida clinica, PARAR e perguntar
