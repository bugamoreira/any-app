# Contexto e arquitetura — ANY App v2

Leia antes de executar qualquer tarefa. Este documento resume o que você
precisa saber sobre o codebase para não tomar decisões contra o grão.

---

## 1. Stack

- **Framework:** React 19 (client-side SPA)
- **Linguagem:** TypeScript 5.9 (strict)
- **Bundler:** Vite 8
- **Estilização:** Tailwind CSS 4 via `@tailwindcss/vite`
- **Roteamento:** React Router 7
- **Ícones:** `lucide-react` (disponível, ainda sub-utilizado — ver ALTA-02)
- **Backend:** Supabase (cliente inicializado; uso mínimo atualmente)
- **Ofuscação de build:** `javascript-obfuscator` + `rollup-plugin-obfuscator`

Comandos:

```bash
cd v2
npm install
npm run dev     # vite dev server
npm run build   # tsc -b && vite build (precisa passar)
npm run lint    # eslint
npm run preview # preview do build
```

---

## 2. Estrutura de pastas

```
v2/
├── src/
│   ├── App.tsx                  # rotas (React Router)
│   ├── main.tsx                 # bootstrap + providers
│   ├── index.css                # tokens globais, resets, utilitários Tailwind
│   ├── assets/                  # logo.png, imagens
│   ├── contexts/
│   │   ├── WeightContext.tsx    # peso do paciente (global)
│   │   └── ToastContext.tsx     # notificações
│   ├── components/
│   │   ├── layout/              # Disclaimer, Header, Footer, Container, FABMenu
│   │   ├── common/              # Card, Collapsible, WeightInput, Modal, …
│   │   └── clinical/            # DoseCalculator, e primitivas clínicas (crescer aqui)
│   ├── pages/                   # 13 ferramentas, uma por arquivo (ver §4)
│   ├── data/                    # paliaData.ts, toxData.ts (bom padrão a expandir)
│   ├── utils/                   # helpers de cálculo
│   └── types/                   # tipos compartilhados
├── public/
├── handoff-claude-code/         # ⬅ você está aqui
├── package.json
├── tsconfig.app.json
├── vite.config.ts
└── CLAUDE.md                    # regras do projeto — PRIORIDADE MÁXIMA
```

---

## 3. Tokens e design system

### Cores

Tema **dark-first**, sem alternância de modo no momento.

- `bg-primary`: `#0A0A0A` (fundo base)
- `bg-card`: `#1A1A1A` (superfície de cards)
- `border`: `#222` (divisores)
- `border-card`: `#333` (bordas de card)
- Accents por ferramenta (cada ferramenta do Hub tem cor própria):
  - Padrão `#FF5252` (vermelho — emergência)
  - Calculadoras: `#2196F3` (azul)
  - Conferir em `v2/src/pages/Hub.tsx` para mapeamento completo

### Tipografia

Sistema em **px** (não rem por escolha — ver CLAUDE.md). Escalas comuns:
11, 12, 13, 14, 15, 17, 20, 24, 28. Sem fontes externas carregadas —
system-ui (pode evoluir futuramente; não é prioridade).

### Tokens sticky (após LAYOUT-01)

Definidos em `index.css`:

```css
--h-disclaimer: 32px;
--h-weight: 56px;
--z-disclaimer: 40;
--z-weight: 30;
--z-search: 20;
--z-fab: 50;
```

**Sempre use esses tokens**, nunca números mágicos (`top-[41px]` etc).

---

## 4. As 13 ferramentas (pages)

| Arquivo | Linhas | Descrição |
|---|---:|---|
| `Hub.tsx` | ~150 | Tela inicial, grid de ferramentas |
| `AirwayGuide.tsx` | ~1725 | Via aérea difícil, IOT, CRASH-H |
| `VmGuide.tsx` | ~900 | Ventilação mecânica, modos, SDRA |
| `AclsGuide.tsx` | ~1687 | PCR / ACLS com metrônomo e registro |
| `BlockPath.tsx` | ~500 | Bloqueios de nervo periférico (⚠ apenas 1/14) |
| `DenguePath.tsx` | ~1742 | Dengue, estadiamento e hidratação |
| `PaliaPath.tsx` | ~1200 | Cuidados paliativos, opioides |
| `PedGuide.tsx` | ~1500 | Pediatria, Broselow, infusões |
| `SedaPath.tsx` | ~1100 | Sedação procedural |
| `ShockPath.tsx` | ~2588 | Choque, VNERi, PAM |
| `TepGuide.tsx` | ~1793 | TEP, escores, manejo |
| `ToxPath.tsx` | ~1400 | Toxicologia, CIATox, antídotos |
| `Calculators.tsx` | ~500 | Calculadoras gerais |
| `InfusionGuide.tsx` | ~400 | Infusões (refatorado em LAYOUT) |
| `DoseCalculator.tsx` | componente | Calculadora de dose reutilizável |

Todas violam o limite de 1000 linhas (ver DEBITO-01).

---

## 5. Padrões de código

### State

- **Context API** para estado cross-ferramenta: peso do paciente, toasts.
- **useReducer** em fluxos com ≥3 estados interconectados
  (Airway, Shock, ACLS, Dengue, Seda, Palia). Cada um tem seu
  `type Action = …` e `function reducer(state, action)`.
- **useState** para UI local simples.

### Reducers

Padrão típico:

```tsx
type State = { step: number; data: Partial<FormData>; };
type Action =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_FIELD'; field: keyof FormData; value: unknown };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'NEXT': return { ...state, step: state.step + 1 };
    // …
  }
}
```

### Navegação dentro de fluxos

Cada ferramenta gerencia "telas internas" com state local (não rotas).
Ex: `SedaPath` usa um tipo `Screen` união e uma função `goTo(screen)`.

### Persistência

Hoje inconsistente — ver ALTA-04. Alguns usam `localStorage` direto
(Calculadoras favoritas, ACLS histórico, peso em ShockPath).
Não criar mais persistência sem centralizar via hook.

### Componentes reutilizáveis

- `<Card>` — container base. Prop `spaced` opcional, `borderColor` para
  faixa lateral colorida.
- `<Collapsible>` — seção expansível. Sempre inicia fechada.
- `<WeightInput>` — input de peso sticky, coordenado com disclaimer.
- `<Modal>` — ainda sem focus trap (ver ALTA-09).
- `<Disclaimer>`, `<Header>`, `<Footer>`, `<Container>`, `<FABMenu>` — layout.
- `<DoseCalculator>` — calculadora de dose genérica, usada pelo InfusionGuide.

Cada ferramenta também redefine localmente: `BackButton`, `StepHeader`,
`CheckItem`, `NavButtons`, etc. Ver DEBITO-04 para consolidação futura.

---

## 6. Regras do CLAUDE.md (prioridade máxima)

Se `v2/CLAUDE.md` existir, **ele manda**. Valores típicos a preservar:

- Sem emojis em UI.
- Medicamentos com nome **genérico** (dipirona, não Novalgina).
- Linguagem **sugestiva** — "considere", "pode-se optar" — nunca "administre".
- Botões com **min-height 44px**.
- `inputMode="decimal"` em inputs numéricos.
- Collapsibles sempre **iniciam fechados**.
- Disclaimer médico-legal presente em toda página.
- Imports de assets via `import` (não path `/` no public).
- Tokens sticky coordenados (`--h-disclaimer`, `--h-weight`) em vez de
  números mágicos.

---

## 7. Coisas a evitar

- Estilos inline (`style={{ ... }}`) exceto onde já existem e a tarefa
  pede explicitamente preservar.
- Introduzir bibliotecas novas sem justificar em PR.
- SVGs inline novos — use `lucide-react`.
- Emojis em qualquer UI.
- Refatorar arquivos >1000 linhas como efeito colateral — é tarefa própria
  (DEBITO-01).
- Alterar conteúdo clínico sem autorização explícita.
- Introduzir modo claro / theming dinâmico agora — fora de escopo.
- Mudar a stack (ex: "vou trocar React Router por X") — fora de escopo.

---

## 8. Testes

Não há testes atualmente (ver DEBITO-05). Ao corrigir bugs de cálculo
(ex: BLOCKER-05 AclsGuide recordNum), **adicione um teste unitário** se
a correção puder regredir. Use Vitest (alinhado com Vite) — configurar
como parte do próprio commit.

---

## 9. Build e ofuscação

O build final passa por obfuscator. Isso significa:

- Nomes de função longos/descritivos não custam em runtime.
- Logs com `console.log` vazam mesmo obfuscados — evite logs em produção.
- Se adicionar dependência, verifique que não tem issues conhecidos com
  obfuscator (raro, mas possível).

---

## 10. Referências externas

Links úteis documentados pelo time:

- Diretrizes clínicas citadas no app (AHA 2025 ACLS, Ministério da Saúde
  Dengue 2024, Global 2024 SDRA, ANDROMEDA-SHOCK 2, etc.). Ao editar
  referências, atualize o futuro `src/data/guidelines.ts` (DEBITO-07).

---

## 11. Em resumo

- **Mexer pouco, mexer cirurgicamente.**
- **Ler antes de escrever.**
- **Respeitar CLAUDE.md acima de qualquer coisa.**
- **Perguntar em dúvida clínica.**
