# CLAUDE.md — ANY App: Diretriz Completa de Desenvolvimento

> **Documento de referência obrigatória.** Leia integralmente antes de produzir qualquer código.
> Última atualização: Abril 2026.

---

## 1. O que é o ANY App

**ANY App** (Anyone, Anything, Anytime) é uma plataforma de ferramentas de apoio à decisão clínica para medicina de emergência. Construída como SPA (Single Page Application) em React/TypeScript, oferece árvores de decisão, pathways clínicos, calculadoras de dose e scores clínicos para uso à beira-leito por médicos plantonistas.

**Classificação regulatória:** SaMD Classe II (ANVISA RDC 657/2022) — exige notificação, não registro completo. Registro de marca "ANY App" em andamento no INPI.

### 1.1 Equipe

| Nome | Papel | Perfil |
|------|-------|--------|
| **Gustavo Moreira** | CEO / Coordenador Médico do DE | Médico emergencista. Define conteúdo clínico, valida interfaces, aprova entregas. |
| **Gabriela Feltrin** | CFO / Operações | Médica e data scientist. |
| **João Pedro Moreira** | CTO / Engenheiro de Software | Responsável pela infraestrutura e deploy. |

### 1.2 Público-alvo

Plantonistas médicos de departamentos de emergência — principalmente emergencistas, mas também cirurgiões, ortopedistas e clínicos. **Acessam pelo celular durante o plantão**, sob pressão, com pouco tempo.

### 1.3 Distribuição

Hub central: `https://anyapp.netlify.app`
Repositório: `github.com/bugamoreira/any-app.git` (branch `main`)
Deploy automático via Netlify (git push → auto-deploy de `v2/dist/`).

---

## 2. Ferramentas do ecossistema

### 2.1 Ferramentas da plataforma

| Rota | Página (`src/pages/`) | Nome exibido | Descrição |
|------|----------------------|-------------|-----------|
| `/` | `Hub.tsx` | Hub central | Tela inicial com grid de ferramentas |
| `/vm` | `VmGuide.tsx` | VM Guide | Ventilação mecânica invasiva |
| `/airway` | `AirwayGuide.tsx` | Airway Guide | Manejo de via aérea difícil |
| `/infusion` | `InfusionGuide.tsx` | Calculadora de Infusões | Drogas vasoativas e sedação |
| `/tep` | `TepGuide.tsx` | TEP Guide | Tromboembolismo pulmonar |
| `/seda` | `SedaPath.tsx` | Seda Path | Sedação procedimental |
| `/tox` | `ToxPath.tsx` | Tox Path | Intoxicações e antídotos |
| `/ped` | `PedGuide.tsx` | Ped Guide | Emergência pediátrica |
| `/palia` | `PaliaPath.tsx` | Palia Path | Cuidados paliativos |
| `/block` | `BlockPath.tsx` | Block Path | Bloqueios regionais (14 técnicas) |
| `/acls` | `AclsGuide.tsx` | ACLS Guide | Gestão de PCR com metrônomo |
| `/dengue` | `DenguePath.tsx` | Dengue Path | Manejo de dengue na emergência |
| `/shock` | `ShockPath.tsx` | Shock Path | Choque (ANDROMEDA-SHOCK 2 + VTI) |
| `/calculadoras` | `Calculators.tsx` | Calculadoras | 73 scores e ferramentas clínicas |

### 2.2 Para adicionar uma nova ferramenta

1. Criar arquivo `v2/src/pages/NomeFerramenta.tsx` com `export default`
2. Em `v2/src/App.tsx`: adicionar `lazy(() => import('./pages/NomeFerramenta'))` e `<Route path="/rota" ...>`
3. Em `v2/src/pages/Hub.tsx`: adicionar card na grid principal
4. Se necessário, criar arquivo de dados em `v2/src/data/`
5. Testar: `cd v2 && npm run dev`

---

## 3. Regras de ouro

### O que NUNCA fazer

1. **Não mexa em nada que não foi pedido.** Nada mesmo. Não altere cor, função, layout, texto ou qualquer elemento sem solicitação explícita.
2. **Não invente informações clínicas.** Se não sabe, pergunte. Nunca suponha dados médicos "porque fazem sentido".
3. **Não produza HTML antes de fechar todas as definições.** Sempre apresente o esqueleto estrutural e aguarde aprovação.
4. **Não execute mudanças sem consultar.** Seja de roteiro, cor, função, texto ou qualquer outro elemento.
5. **Não faça suposições sobre condutas médicas.** Se houver dúvida sobre qualquer dado clínico, questione antes de incluir.
6. **Não use emojis.** Zero emojis em qualquer arquivo. Substituir por texto descritivo ou SVG inline.

### O que SEMPRE fazer

1. **Brainstorming antes de produzir.** Discuta ideias, proponha soluções, tire dúvidas — só então produza.
2. **Traga o esqueleto primeiro.** Antes de codar, apresente a estrutura para validação.
3. **Confronte com argumentos.** Se identificar uma abordagem melhor, questione com argumentos estruturados.
4. **Sugira reduções de fricção.** Pense na cabeça do usuário (médico sob pressão, celular na mão, pouco tempo).
5. **Peça confirmação (ok) antes de criar arquivos.** Nunca produza sem aprovação prévia.
6. **Siga os padrões.** Confirme que o código está alinhado com as ferramentas já existentes.

---

## 4. Fluxo de trabalho

```
1. Gustavo apresenta demanda (nova ferramenta ou ajuste)
2. Brainstorming e discussão de abordagem
3. Apresentar esqueleto estrutural para validação
4. Gustavo aprova estrutura (ou ajusta)
5. Produzir o componente React completo
6. Gustavo testa no navegador (validação visual)
7. Iterações de ajuste (se necessário)
8. Build: cd v2 && npm run build
9. Deploy: git add + commit + push origin main
```

**Regra:** Nunca pular do passo 1 para o passo 5.

### 4.1 Mensagens de commit

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `feat:` | Nova funcionalidade | `feat: adiciona calculadora de noradrenalina` |
| `fix:` | Correção de bug | `fix: corrige cálculo de dose pediátrica` |
| `docs:` | Documentação | `docs: atualiza referências do ToxPath` |
| `style:` | Formatação, CSS | `style: ajusta cores para OLED Pure` |
| `refactor:` | Refatoração | `refactor: reorganiza funções de cálculo` |

### 4.2 Versionamento semântico

**MAJOR.MINOR.PATCH** — Ex: v1.2.3
- **MAJOR:** Redesign completo, mudanças incompatíveis
- **MINOR:** Nova funcionalidade, compatível
- **PATCH:** Correção de bugs, ajustes menores

---

## 5. Design system — OLED Pure

> **Atenção:** PDFs de diretrizes v1.0 (Janeiro 2026) usavam a paleta antiga (#121212/#E53935). O padrão vigente é **OLED Pure** conforme descrito abaixo.

### 5.1 Tailwind v4 @theme (definido em `v2/src/index.css`)

```css
@import "tailwindcss";

@theme {
  /* Fundos OLED Pure */
  --color-bg-primary: #000000;
  --color-bg-card: #0A0A0A;
  --color-bg-elevated: #111111;
  --color-bg-hover: #1A1A1A;

  /* Texto */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A0A0A0;
  --color-text-muted: #666666;

  /* Accent ANY App */
  --color-accent: #FF5252;
  --color-accent-hover: #FF6B6B;
  --color-accent-muted: #FF525233;

  /* Status clínico */
  --color-success: #4CAF50;
  --color-warning: #FFC107;
  --color-danger: #F44336;
  --color-info: #2196F3;

  /* Bordas */
  --color-border: #222222;
  --color-border-card: #333333;

  /* Radius */
  --radius-default: 12px;
  --radius-sm: 8px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

**Uso em componentes:** Classes Tailwind referenciam os tokens do @theme diretamente (ex: `bg-bg-primary`, `text-accent`, `border-border-card`, `rounded-[--radius-default]`).

### 5.2 Cores de alerta (dentro de cards/seções)

| Tipo | Background | Border-left | Texto do título |
|------|-----------|-------------|-----------------|
| Sucesso | `rgba(105,240,174,0.08)` | `#69F0AE` | `#69F0AE` |
| Atenção | `rgba(255,215,64,0.08)` | `#FFD740` | `#FFD740` |
| Perigo | `rgba(255,82,82,0.08)` | `#FF5252` | `#FF5252` |
| Info | `rgba(33,150,243,0.08)` | `#2196F3` | `#2196F3` |

### 5.3 Cores de feedback clínico

```tsx
// Usar classes Tailwind ou inline styles
// Verde: text-success (#4CAF50) — dose terapêutica
// Amarelo: text-warning (#FFC107) — dose limítrofe
// Vermelho: text-danger (#F44336) — dose crítica
```

### 5.4 Tipografia

```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
}
```

| Elemento | Tamanho | Peso |
|----------|---------|------|
| Título principal | 24-28px | Bold (700) |
| Título de seção | 18-20px | Semibold (600) |
| Corpo de texto | 14-16px | Regular (400) |
| Labels/hints | 12-14px | Regular (400) |
| Botões | 14-16px | Medium (500) |
| Disclaimer | 12px | Semibold (600) |

---

## 6. Estrutura de componentes React

### 6.1 Ordem dos elementos (hierarquia de layout)

Toda página de ferramenta segue esta estrutura:

```tsx
export default function NomeFerramenta() {
  return (
    <>
      <Disclaimer />
      <Header title="Nome da ferramenta" subtitle="Subtítulo opcional" />
      <Container>
        {/* Campo de peso (quando aplicável — calculadoras) */}
        <WeightInput />
        {/* Conteúdo principal (cards, árvores de decisão, calculadoras) */}
      </Container>
      <Footer toolName="NomeFerramenta" version="1.0.0" />
      <FABMenu items={[{ label: 'Ação', icon: <Icon />, onClick: handler }]} />
    </>
  )
}
```

### 6.2 Componentes de layout (`src/components/layout/`)

| Componente | Arquivo | Props | Comportamento |
|------------|---------|-------|---------------|
| `<Disclaimer />` | `Disclaimer.tsx` | -- | Faixa amarela sticky no topo. Texto padrão: "Ferramenta de apoio em teste -- não substitui o julgamento clínico." |
| `<Header />` | `Header.tsx` | `title`, `subtitle` | Logo ANY App clicável (navega para `/`). Centralizado. |
| `<Footer />` | `Footer.tsx` | `toolName`, `version` | Fixo no bottom. Créditos: Gustavo Moreira, Gabriela Feltrin, João Pedro Moreira. |
| `<Container />` | `Container.tsx` | `children` | `max-w-[500px] mx-auto px-4 pb-[100px]` |
| `<FABMenu />` | `FABMenu.tsx` | `items[]` | Botão flutuante hamburger. Click-outside-to-close automático via `useEffect`. |
| `<Splash />` | `Splash.tsx` | -- | Tela de carregamento com logo. Usado no `Suspense fallback`. |

### 6.3 Componentes comuns (`src/components/common/`)

| Componente | Arquivo | Props | Uso |
|------------|---------|-------|-----|
| `<Card />` | `Card.tsx` | `borderColor?`, `children` | Card com border-left colorida |
| `<Button />` | `Button.tsx` | `variant`, `onClick`, `disabled` | Botão com min-height 44px |
| `<Collapsible />` | `Collapsible.tsx` | `title`, `badge?`, `children` | Seção colapsável (inicia FECHADA) |
| `<Toggle />` | `Toggle.tsx` | `checked`, `onChange`, `label` | Toggle para populações especiais |
| `<WeightInput />` | `WeightInput.tsx` | `range?` | Input de peso com validação e localStorage |
| `<AlertCard />` | `AlertCard.tsx` | `type`, `title`, `children` | Card de alerta (sucesso/atenção/perigo/info) |
| `<Modal />` | `Modal.tsx` | `open`, `onClose`, `children` | Modal overlay |
| `<Toast />` | `Toast.tsx` | `message`, `type` | Notificação temporária |

### 6.4 Componentes clínicos (`src/components/clinical/`)

| Componente | Arquivo | Props | Uso |
|------------|---------|-------|-----|
| `<DoseCalculator />` | `DoseCalculator.tsx` | `drugConfig` | Calculadora bidirecional dose-velocidade |
| `<StepperNav />` | `StepperNav.tsx` | `steps[]`, `currentStep` | Navegação de pathway passo-a-passo |

---

## 7. Comportamentos de interface

### 7.1 Seções colapsáveis

- **Estado inicial:** TODAS fechadas. Sem exceção.
- **Animação:** Transição suave (300-400ms) via `max-height` com `overflow-hidden` e `transition-all`.
- **Indicador:** Ícone Lucide (`ChevronDown`) com rotação animada indicando estado.

```tsx
// O componente <Collapsible /> já implementa este comportamento:
<Collapsible title="Nome da seção" badge="Opcional">
  {/* Conteúdo da seção */}
</Collapsible>
```

O componente gerencia o estado `isOpen` internamente e anima via `max-height`. Sempre inicia com `isOpen = false`.

### 7.2 Accordion (seções mutuamente exclusivas)

Quando apenas uma seção deve ficar aberta por vez, gerenciar estado no componente pai:

```tsx
const [openIndex, setOpenIndex] = useState<number | null>(null)

{sections.map((section, i) => (
  <Collapsible
    key={i}
    title={section.title}
    isOpen={openIndex === i}
    onToggle={() => setOpenIndex(openIndex === i ? null : i)}
  >
    {section.content}
  </Collapsible>
))}
```

### 7.3 Calculadoras de dose

| Requisito | Detalhe |
|-----------|---------|
| Sliders bidirecionais | Dose <-> Velocidade de infusão (tempo real) |
| Campo de peso | Sempre visível no topo via `<WeightInput />`. Adulto: 40-200 kg. Pediátrico: 0,5-50 kg. |
| Faixas de cor | Verde (terapêutico), Amarelo (atenção), Vermelho (crítico) |
| Validação | Impedir valores fora do range clínico seguro |
| Input numérico | `inputMode="decimal"` para teclado numérico no celular |
| Unidades | Sempre explícitas: mg, mcg, mL, mg/kg, mcg/kg/min |

O componente `<DoseCalculator />` recebe uma configuração tipada (`DrugConfig`) definida em `src/types/clinical.ts` e implementa sliders bidirecionais com faixas de cor automáticas.

### 7.4 Árvores de decisão

Usar classes Tailwind para estilizar nós de decisão:

```tsx
// Nó de decisão
<div className="bg-bg-hover border-2 border-info rounded-[--radius-default] p-4">
  {/* Pergunta */}
</div>

// Opção "sim"
<button className="bg-[rgba(105,240,174,0.1)] text-[#69F0AE] border border-[rgba(105,240,174,0.3)] rounded-lg p-3">
  Sim
</button>

// Opção "não"
<button className="bg-[rgba(255,82,82,0.1)] text-accent border border-[rgba(255,82,82,0.3)] rounded-lg p-3">
  Não
</button>
```

### 7.5 Selection UI — border-left colorida

Padrão para cards de seleção/módulos usando `<Card />`:

```tsx
<Card borderColor="#FF5252">Conteúdo</Card>  // Vermelho (padrão)
<Card borderColor="#10B981">Conteúdo</Card>  // Verde
<Card borderColor="#60A5FA">Conteúdo</Card>  // Azul
<Card borderColor="#F59E0B">Conteúdo</Card>  // Amarelo
<Card borderColor="#8B5CF6">Conteúdo</Card>  // Roxo
```

### 7.6 Slide horizontal (transições entre páginas)

Para fluxos passo-a-passo, usar a animação `slide-left` definida no `index.css`:

```css
/* Definido globalmente em index.css */
@keyframes slide-left {
    from { opacity: 0; transform: translateX(60px); }
    to { opacity: 1; transform: translateX(0); }
}
```

Aplicar via classe Tailwind inline: `className="animate-[slide-left_0.3s_ease]"`

### 7.7 Botões

Usar o componente `<Button />` que já implementa:
- Min-height 44px (área de toque mínima)
- Variantes: `primary` (accent), `secondary` (outlined), `ghost`
- Transição de hover/active
- Disabled state com feedback visual

### 7.8 Árvores de decisão e branching

Regras para fluxos de decisão clínica nas ferramentas:

#### Branching pós-decisão obrigatório
- Toda decisão binária (sucesso/falha, sim/não) deve ter **dois caminhos explícitos**
- Nunca assumir sucesso — sempre perguntar "Deu certo?"
- Exemplo: Intubação → "Intubou?" → Sim (confirmar) / Não (Plano B)

#### Sync de estado entre views
- Dados clínicos (checklists, scores) que aparecem em mais de um componente devem usar **estado compartilhado** via Context ou lifting state up
- Nunca duplicar estado em componentes separados sem sincronização
- Usar `useState` no componente pai ou Context API para estado global
- Ao toggle em um componente, refletir automaticamente no outro

#### Feedback explícito em vez de ocultar
- Botões escondidos devem ter mensagem explicando por quê
- Botões disabled devem mostrar texto inline com o requisito
- Nunca silenciar uma decisão do sistema — o médico precisa saber o que aconteceu

#### Populações especiais visíveis
- Toggle proeminente para populações especiais (gestante, pediátrico) via `<Toggle />`
- Nunca esconder atrás de link de texto pequeno
- Exemplo: TEP gestante → toggle no topo "Gestante / Não gestante"

#### Informação inline no fluxo
- Referências e calculadoras acessíveis sem trocar de view
- `<Collapsible />` inline > links para outras seções
- O médico não deve perder contexto para consultar uma dose ou esquema

#### Reclassificação bidirecional
- Todo grupo/categoria deve permitir escalar E desescalar
- Exceto extremos lógicos (ex: Grupo A não desescala, Grupo D não escala além)
- Botões de reclassificação sempre visíveis ao final de cada grupo

#### Linguagem consistentemente sugestiva
- Nunca "excluído", sempre "improvável" com ressalva
- Nunca "indicado/contraindicado", sempre "considere/geralmente não recomendado"
- Ver seção 9.2 para regras completas de tom sugestivo

---

## 8. Mobile-first

| Propriedade | Valor | Motivo |
|-------------|-------|--------|
| Max-width container | 500px | Otimizado para celular |
| Padding lateral | Mínimo 16px (`px-4`) | Texto não cola nas bordas |
| Área de toque | Min-height 44px | Recomendação Apple/Google |
| Font-size mínimo | 14px | Legibilidade em tela pequena |
| Input numérico | `inputMode="decimal"` | Teclado numérico no mobile |
| Body padding-bottom | 100px (`pb-[100px]`) | Espaço para o footer fixo |

Meta viewport configurada no `v2/index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

---

## 9. Linguagem clínica — como escrever

### 9.1 Princípio fundamental

> A medicina é complexa e cheia de incertezas. As ferramentas devem **apoiar** a decisão clínica, **não substituí-la**.

### 9.2 Tom sugestivo (NUNCA imperativo)

| Evitar (taxativo) | Preferir (sugestivo) |
|----------------------|------------------------|
| Administrar carvão ativado | Considere carvão ativado |
| Fazer IOT | É recomendado proteger via aérea |
| Indicado | Pode ser considerado |
| Contraindicado | Geralmente não recomendado |
| Internação em UTI | Considere UTI |
| Tratamento | Recomendações terapêuticas |
| OBRIGATÓRIO | Recomendado / Sugerido |

### 9.3 Nomenclatura de medicamentos

- **SEMPRE** nome genérico (nunca nome comercial)
- Incluir apresentação da ampola (ex: "cetamina 50 mg/mL — ampola 10 mL")
- Concentrações e diluições explícitas
- Unidades claras: mg, mcg, mL, mg/kg, mcg/kg/min
- Buscas devem reconhecer aliases comuns (ex: "precedex" -> dexmedetomidina)

### 9.4 Formatação de títulos

**Sentence case** — apenas primeira letra maiúscula:
- CERTO: "Critérios de disposição"
- ERRADO: "Critérios De Disposição"

### 9.5 Padrão linguístico — português rigoroso

- **Norma culta da língua portuguesa** — sem exceções
- Concordância verbal e nominal correta
- **Acentuação correta** — atenção especial a termos médicos:
  - cálcio, sódio, magnésio, potássio
  - Hidrogênio, Hipóxia, pneumotórax
  - trombólise, emergência, derivações
  - compressões, posição, Tensão
- Evitar anglicismos desnecessários
- Siglas: definir na primeira ocorrência (ex: "Sequência Rápida de Intubação (SRI)")

### 9.6 O que NUNCA escrever

- Emojis (zero, em qualquer contexto)
- Nomes comerciais de medicamentos
- Tom imperativo ("faça", "administre", "interne")
- Títulos em Title Case
- Informações clínicas não validadas por referência bibliográfica
- Texto sem acentuação correta

---

## 10. Logo ANY App

### 10.1 Versões

| Versão | Uso | Arquivo |
|--------|-----|---------|
| **Horizontal** (retangular, PNG) | Header das ferramentas | `v2/src/assets/logo.png` |
| **Quadrado** (JPEG) | Splash screen | `v2/public/splash-logo.jpeg` |

### 10.2 Como funciona na SPA

- O logo horizontal é importado em `<Header />` via `import logo from '@/assets/logo.png'`
- Vite processa e otimiza automaticamente (hashing, compressão)
- O splash logo quadrado vive em `v2/public/` e é referenciado diretamente

### 10.3 Regras

- Nunca distorcer ou alterar o logo
- Sempre usar a versão otimizada (Vite cuida da otimização no build)
- O logo no header é **sempre clicável** -> navega para `/` (Hub)
- Usar `<Link to="/">` ou `navigate('/')` do React Router
- Sem `target="_blank"` — abrir na mesma aba

---

## 11. Arquitetura — React/TypeScript SPA

### 11.1 Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19 | Framework UI |
| TypeScript | 5.9 | Tipagem estática |
| Vite | 8 | Build tool |
| Tailwind CSS | 4.2 (v4) | Estilização utility-first |
| React Router | 7 | Roteamento SPA |
| Supabase | 2.101.1 | Auth + Analytics + Edge Functions |
| Lucide React | 1.7 | Ícones (sem emojis) |

### 11.2 Estrutura de pastas

```
v2/
├── public/                      <- Assets estáticos (splash logo, _headers)
├── src/
│   ├── assets/                  <- Logo (processado pelo Vite)
│   ├── components/
│   │   ├── layout/              <- Disclaimer, Header, Footer, FABMenu, Container, Splash
│   │   ├── common/              <- Card, Button, Collapsible, Toggle, WeightInput, AlertCard, Modal, Toast
│   │   ├── clinical/            <- DoseCalculator, StepperNav
│   │   └── nav/                 <- Componentes de navegação
│   ├── contexts/
│   │   ├── AuthContext.tsx       <- Google OAuth (Supabase Auth)
│   │   ├── WeightContext.tsx     <- Peso compartilhado + localStorage
│   │   ├── ToastContext.tsx      <- Notificações globais
│   │   └── MetronomeContext.tsx  <- Metrônomo global persistente (ACLS)
│   ├── hooks/
│   │   ├── useIsMobile.ts       <- Breakpoint 768px
│   │   ├── usePageview.ts       <- Analytics automático
│   │   └── useServerCalc.ts     <- Edge Functions (fórmulas protegidas)
│   ├── data/
│   │   ├── drugConfigs.ts       <- 15 drogas tipadas (DrugConfig[])
│   │   ├── calculatorData.ts    <- 73 calculadoras/scores
│   │   ├── paliaData.ts         <- Dados Palia Path
│   │   ├── toxData.ts           <- Dados Tox Path
│   │   └── vmData.ts            <- Dados VM Guide
│   ├── pages/                   <- 14 ferramentas (1 arquivo cada, lazy loaded)
│   ├── types/
│   │   └── clinical.ts          <- Tipos (DrugConfig, PathwayStep, etc.)
│   ├── utils/
│   │   ├── calculations.ts      <- Fórmulas centralizadas
│   │   └── formatters.ts        <- fmt(), cores por status
│   ├── App.tsx                  <- Router com lazy loading + ProtectedRoute
│   ├── main.tsx                 <- Entry point com providers
│   └── index.css                <- Tailwind @theme OLED Pure + reset global
├── index.html                   <- Template HTML (meta viewport, title)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

### 11.3 Roteamento e code splitting

Cada ferramenta carrega sob demanda via `React.lazy()`. O Hub carrega eager (primeira tela).

```tsx
// App.tsx — padrão de rota
const NomeTool = lazy(() => import('./pages/NomeTool'))

<Route path="/rota" element={
  <ProtectedRoute>
    <LazyPage><NomeTool /></LazyPage>
  </ProtectedRoute>
} />
```

- **Bundle inicial:** ~380KB (React + Router + Auth + Hub)
- **Cada ferramenta:** 15-80KB adicional (carregado sob demanda)
- **Fallback:** `<Splash />` enquanto carrega

### 11.4 Contexts (estado global)

| Context | Arquivo | Responsabilidade |
|---------|---------|-----------------|
| `AuthContext` | `contexts/AuthContext.tsx` | Google OAuth via Supabase. `useAuth()` retorna `session`, `loading`, `signIn()`, `signOut()`. |
| `WeightContext` | `contexts/WeightContext.tsx` | Peso do paciente compartilhado entre ferramentas. Persiste no localStorage. |
| `ToastContext` | `contexts/ToastContext.tsx` | Notificações globais (sucesso, erro, info). `useToast()` retorna `showToast()`. |
| `MetronomeContext` | `contexts/MetronomeContext.tsx` | Metrônomo global (ACLS). Persiste entre navegação. Banner vermelho quando ativo. AudioContext + silent audio loop para iOS. |

### 11.5 Hooks customizados

| Hook | Arquivo | Uso |
|------|---------|-----|
| `useIsMobile()` | `hooks/useIsMobile.ts` | Retorna `true` se viewport < 768px |
| `usePageview()` | `hooks/usePageview.ts` | Registra pageview no Supabase Analytics |
| `useServerCalc()` | `hooks/useServerCalc.ts` | Chama Edge Functions para fórmulas protegidas. JWT obrigatório. Fallback local se servidor indisponível. |

### 11.6 Splash screen

- Logo quadrado JPEG com animação de reveal (blur -> nítido)
- Créditos: "Gustavo Moreira - Gabriela Feltrin - João Pedro Moreira" com fade-in atrasado
- Usado como fallback de `<Suspense>` e durante verificação de auth

### 11.7 Comandos de build e deploy

```bash
# Desenvolvimento
cd v2 && npm run dev

# Build de produção
cd v2 && npm run build

# Deploy (auto-deploy via Netlify de v2/dist/)
git add v2/
git commit -m "feat: descrição da mudança"
git push origin main
```

### 11.8 Edge Functions (Supabase)

| Function | Endpoint | O que protege |
|----------|----------|---------------|
| `calculate-dose` | `/functions/v1/calculate-dose` | Fórmulas de 15 drogas + VNERi |
| `get-tool-content` | `/functions/v1/get-tool-content` | Scores (Wells, HACOR, PESI) + protocolos |

Chamadas via `useServerCalc()` hook. JWT obrigatório. Fallback local se servidor indisponível.

---

## 12. Padrões de código

### 12.1 Componentes React/TypeScript

- Um componente por arquivo (`.tsx`)
- Props tipadas com `interface` (nunca `any`)
- Hooks no topo do componente (regras dos hooks)
- `export default` para páginas (compatível com `React.lazy()`)
- Named exports para componentes reutilizáveis
- Dados clínicos em arquivos separados (`src/data/`)

### 12.2 Nomenclatura

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Componentes | PascalCase | `DoseCalculator.tsx`, `WeightInput.tsx` |
| Páginas | PascalCase | `InfusionGuide.tsx`, `ShockPath.tsx` |
| Hooks | camelCase com `use` | `useServerCalc.ts`, `useIsMobile.ts` |
| Contexts | PascalCase + Context | `AuthContext.tsx`, `WeightContext.tsx` |
| Tipos/interfaces | PascalCase | `DrugConfig`, `PathwayStep` |
| Variáveis/funções | camelCase | `calcularDose`, `pesoAtual` |
| Classes Tailwind | kebab-case (padrão Tailwind) | `bg-bg-card`, `text-accent` |
| Arquivos de dados | camelCase | `drugConfigs.ts`, `toxData.ts` |
| Rotas | kebab-case (URL) | `/infusion`, `/calculadoras` |

### 12.3 Comentários no código

- Explicar lógica clínica complexa
- Documentar fórmulas de cálculos com referência
- Indicar fonte bibliográfica quando relevante

```typescript
// Dose de cetamina para ISR: 1,5 mg/kg (Walls Manual, 5th ed)
// Apresentação: 50 mg/mL (ampola 10 mL)
const doseCetamina = peso * 1.5
const volumeCetamina = doseCetamina / 50
```

### 12.4 Tipos clínicos (`src/types/clinical.ts`)

Todas as configurações de drogas, steps de pathway e dados de scores devem ser tipados. Usar `DrugConfig` para calculadoras, `PathwayStep` para navegação stepper.

---

## 13. Segurança clínica

### 13.1 Validação de inputs

| Parâmetro | Range adulto | Range pediátrico |
|-----------|-------------|-----------------|
| Peso | 40-200 kg | 0,5-50 kg |

- Sempre validar antes de calcular
- Exibir mensagens de erro claras
- Impedir valores fora do range clínico seguro
- O componente `<WeightInput />` já implementa validação com feedback visual

### 13.2 Alertas visuais

- **Verde** -> dose terapêutica / parâmetro normal
- **Amarelo** -> dose limítrofe / atenção necessária
- **Vermelho** -> dose crítica ou tóxica / alerta grave

### 13.3 Regras de segurança técnica

- HTTPS obrigatório (Netlify fornece SSL gratuito)
- Sem dados sensíveis no código (sem API keys, tokens ou senhas em arquivos commitados)
- Variáveis de ambiente via `.env` (não commitado) para Supabase URL e anon key
- localStorage apenas para preferências do usuário (peso, tema — não dados de pacientes)
- Console limpo: zero erros vermelhos antes do deploy

### 13.4 Segurança da aplicação

- **Edge Functions (Supabase):** Fórmulas de dose executam no servidor. O código das fórmulas nunca chega ao browser.
- **Ofuscação:** Variáveis renomeadas, strings embaralhadas no build de produção.
- **CSP:** Content Security Policy via `_headers` no Netlify.
- **RLS:** Row Level Security ativo no Supabase para todas as tabelas.
- **Auth:** Google OAuth obrigatório via Supabase Auth. Rotas protegidas com `<ProtectedRoute />`.

### 13.5 Regulatório

- Disclaimer obrigatório em todas as ferramentas (componente `<Disclaimer />`)
- Linguagem não-taxativa (apoio à decisão, não prescrição)
- Não armazenar dados de pacientes na fase atual

---

## 14. Erros comuns e lições aprendidas

### 14.1 Erros de React/TypeScript

| Erro | Causa | Solução |
|------|-------|---------|
| Estado não atualiza visualmente | Mutação direta de objeto/array | Sempre criar novo objeto: `setItems([...items, newItem])` |
| Re-render infinito | `useEffect` sem dependências corretas | Declarar todas as dependências no array. Usar `useCallback`/`useMemo` quando necessário. |
| Hydration mismatch | Renderização condicional baseada em `window` | Usar `useEffect` para valores client-only, nunca no corpo do componente |
| Lazy load falha silenciosamente | Export default ausente na página | Toda página deve ter `export default function NomePagina()` |
| Tipo `any` escondendo bugs | Pressa ao tipar props | Sempre criar interface explícita para props |
| Context undefined | Componente fora do Provider | Verificar que todos os providers estão em `main.tsx` |
| Tailwind classe não aplica | Token não definido no @theme | Verificar `index.css` @theme ou usar valor arbitrário `[#hex]` |

### 14.2 Erros de ortografia

Termos médicos em português que frequentemente aparecem sem acento:

| Errado | Correto |
|--------|---------|
| calcio | cálcio |
| sodio | sódio |
| magnesio | magnésio |
| Hidrogenio | Hidrogênio |
| Hipoxia | Hipóxia |
| pneumotorax | pneumotórax |
| trombolise | trombólise |
| emergencia | emergência |
| compressoes | compressões |
| derivacoes | derivações |
| toracica | torácica |
| cardiaco | cardíaco |
| antidoto | antídoto |

**Regra:** Antes de qualquer deploy, fazer grep por termos sem acento e corrigir.

### 14.3 Erros de UX

- Seções que iniciam abertas (devem sempre iniciar FECHADAS)
- Botões com área de toque < 44px
- Conteúdo cortado por falta de padding-bottom no container
- Footer inline em vez de fixo
- FAB sem click-outside-to-close

---

## 15. Referências bibliográficas

Fontes aceitas para validação de conteúdo clínico. **Nunca inventar dados.**

### Trauma e emergência
- ATLS — Advanced Trauma Life Support, 11a edição (2025)
- Rosen's Emergency Medicine, 10th ed
- Tintinalli's Emergency Medicine: A Comprehensive Study Guide

### Via aérea
- Walls Manual of Emergency Airway Management, 5th ed
- Strauss and Mayer's Emergency Department Resuscitation

### Ressuscitação
- AHA Guidelines 2025 — ACLS / PALS
- PALS — Pediatric Advanced Life Support (AHA 2020/2025)

### Pediatria
- Pediatric Drug Doses (Frank Shann), 17th Edition

### Bases de dados e guidelines
- UpToDate
- PubMed / MEDLINE
- Cochrane Library
- Baveno VII (varizes esofágicas)
- AASLD, ACG, ESGE Guidelines
- Protocolos UTI CTIA-HIAE (Einstein)

### Regra de ouro das referências

> Quando houver **qualquer** dúvida sobre informação clínica, **pergunte antes de incluir**. Nunca assuma. Nunca invente.

---

## 16. Checklist pré-deploy

Verificar **todos** os itens antes de considerar uma ferramenta pronta:

### Estrutura e conteúdo
- [ ] `<Disclaimer />` presente no topo da página
- [ ] `<Header />` com logo ANY App clicável -> Hub
- [ ] Seções `<Collapsible />` iniciam **FECHADAS**
- [ ] `<Footer />` fixo com créditos (Gustavo, Gabriela, João Pedro)
- [ ] `<FABMenu />` com click-outside-to-close
- [ ] Conteúdo clínico validado (não inventado)
- [ ] Linguagem **sugestiva** (não imperativa)
- [ ] Medicamentos com nome **genérico** e apresentação da ampola
- [ ] Sentence case em títulos
- [ ] Ortografia portuguesa rigorosa (acentuação correta)
- [ ] Zero emojis (usar Lucide icons)

### Visual e UX
- [ ] Fundo OLED puro (`#000000`) via `bg-bg-primary`
- [ ] Cores conforme paleta OLED Pure (@theme)
- [ ] Contraste adequado para leitura
- [ ] Botões com min-height 44px
- [ ] `<Container />` com padding lateral 16px
- [ ] Padding-bottom suficiente para footer fixo
- [ ] Testado em tela mobile (< 400px de largura)
- [ ] Animações suaves (300-400ms)

### Técnico
- [ ] TypeScript sem erros (`npm run build` passa)
- [ ] Props tipadas (sem `any`)
- [ ] `export default` na página (para `React.lazy()`)
- [ ] Rota adicionada em `App.tsx`
- [ ] Card adicionado no Hub
- [ ] Inputs numéricos com `inputMode="decimal"`
- [ ] Validação de peso via `<WeightInput />` (quando aplicável)
- [ ] Calculadoras com faixas de cor
- [ ] Console sem erros
- [ ] Sem dados sensíveis no código

### Deploy
- [ ] Build executado: `cd v2 && npm run build`
- [ ] Output verificado: `v2/dist/` gerado corretamente
- [ ] Commit com prefixo correto (feat/fix/style/etc.)
- [ ] Push para main: `git push origin main`
- [ ] URL acessível após auto-deploy Netlify

---

## 17. Diluição padrão pediátrica (Ped Guide)

Tabelas de referência para diluição de drogas em infusão contínua pediátrica. Três faixas de peso com diluições padronizadas. Fonte: protocolo institucional.

### 17.1 Crianças menores de 15 kg

| Droga | Apresentação | Droga (mL) | Diluente (mL) | Concentração | mL/h | Obs |
|-------|-------------|-----------|---------------|-------------|------|-----|
| Dobutamina | 12,5 | 10 | 60 | 1800 mcg/mL | Peso x dose x 0,033 | |
| Dopamina | 5 | 20 | 30 | 2000 mcg/mL | Peso x dose x 0,03 | |
| Epinefrina | 1 | 1 | 30 | 32,5 mcg/mL | Peso x dose x 2 | |
| Epinefrina | 10 mg/mL | 3 | 45 | 62,5 mcg/mL | Peso x dose | |
| Norepinefrina | 1 | 4 | 60 | 62,5 mcg/mL | Peso x dose | Diluir em SG 5% |
| Milrinona | 1 | 10 | 40 | 200 mcg/mL | Peso x dose x 0,3 | |
| Amiodarona | 50 | 3 | 47 | 3 mg/mL | Peso x dose x 0,02 | Diluir em SG 5% |
| Vasopressina | 20 U/mL | 1 | 49 | 0,4 U/mL | (Peso x dose) / 0,4 | |
| Nitroprussiato | 25 | 1 | 40 | 0,6 mg/mL | Peso x dose / 10 | Diluir em SG 5% |
| **Sedativos** | | | | | | |
| Fentanil | 50 | 10 | 40 | 10 mcg/mL | Peso x dose / 10 | |
| Fentanil | 50 | 10 | 30 | 13 mcg/mL | Peso x dose / 13 | |
| Midazolam | 5 | 10 | 40 | 1 mg/mL | Peso x dose | |
| Midazolam | 6 | 10 | 30 | 1 mg/mL | Peso x dose / 1,3 | |
| Ketamina | 50 | 6 | 54 | 5 mg/mL | Peso x dose x 0,012 | |
| Dexmedetomidina | 0,1 mg/mL | 2 | 48 | 4 mcg/mL | Peso x dose / 4 | |
| Morfina | 10 mg/mL | 1 | 49 | 0,2 mg/mL | Peso x dose / 200 | |
| Propofol 2% (50 mL) | 20 mg/mL | 50 | 50 | 10 mg/mL | Peso x dose / 10 | |
| Propofol (20 mL) | 10 mg/mL | 20 | 20 | 5 mg/mL | Peso x dose / 5 | |
| Rocurônio | 10 | 10 | 40 | 2 mg/mL | Peso x dose x 0,03 | |
| Cisatracúrio | 2 | 10 | 40 | 0,4 mg/mL | Peso x dose x 0,15 | |

### 17.2 Crianças 15 a 40 kg (peso ref: 40 kg)

| Droga | Apresentação | Droga (mL) | Diluente (mL) | Concentração | mL/h | Obs |
|-------|-------------|-----------|---------------|-------------|------|-----|
| Dobutamina | 12,5 | 20 | 120 | 1800 mcg/mL | Peso x dose x 0,033 | |
| Dopamina | 5 | 40 | 60 | 2000 mcg/mL | Peso x dose x 0,03 | |
| Epinefrina | 1 | 5 | 150 | 32,3 mcg/mL | Peso x dose x 2 | |
| Epinefrina | 10 mg/mL | 6 | 90 | 62,5 mcg/mL | Peso x dose | |
| Norepinefrina | 1 | 8 | 120 | 62,5 mcg/mL | Peso x dose | Diluir em SG 5% |
| Milrinona | 1 | 20 | 80 | 200 mcg/mL | Peso x dose x 0,3 | |
| Amiodarona | 50 | 6 | 95 | 3 mg/mL | Peso x dose x 0,02 | Diluir em SG 5% |
| Vasopressina | 20 U/mL | 2 | 98 | 0,4 U/mL | (Peso x dose) / 0,4 | |
| Nitroprussiato | 25 | 1 | 40 | 0,6 mg/mL | Peso x dose / 10 | Diluir em SG 5% |
| **Sedativos** | | | | | | |
| Fentanil | 50 | 20 | 80 | 10 mcg/mL | Peso x dose / 10 | |
| Fentanil | 50 | 20 | 50 | 14 mcg/mL | Peso x dose / 14 | |
| Midazolam | 5 | 20 | 80 | 1,9 mg/mL | Peso x dose | |
| Midazolam | 5 | 30 | 50 | 1,9 mg/mL | Peso x dose / 1,9 | |
| Ketamina | 50 | 6 | 54 | 5 mg/mL | Peso x dose x 0,012 | |
| Dexmedetomidina | 0,1 mg/mL | 4 | 95 | 4 mcg/mL | Peso x dose / 4 | |
| Morfina | 10 mg/mL | 2 | 98 | 0,2 mg/mL | Peso x dose / 200 | |
| Propofol 2% (50 mL) | 10 mg/mL | 50 | 0 | 10 mg/mL | Peso x dose / 10 | |
| Rocurônio | 10 | 20 | 80 | 2 mg/mL | Peso x dose x 0,03 | |
| Cisatracúrio | 2 | 15 | 60 | 0,4 mg/mL | Peso x dose x 0,15 | |

### 17.3 Adultos jovens > 40 kg (peso ref: 50 kg)

| Droga | Apresentação | Droga (mL) | Diluente (mL) | Concentração | mL/h | Obs |
|-------|-------------|-----------|---------------|-------------|------|-----|
| Dobutamina | 12,5 | 50 | 200 | 2500 mcg/mL | Peso x dose x 0,025 | |
| Dopamina | 5 | 100 | 150 | 2000 mcg/mL | Peso x dose x 0,03 | |
| Epinefrina | 1 | 6 | 200 | 29,1 mcg/mL | Peso x dose x 2 | |
| Epinefrina | 1 | 10 | 150 | 62,5 mcg/mL | Peso x dose | |
| Norepinefrina | 1 | 16 | 250 | 60 mcg/mL | Peso x dose | Diluir em SG 5% |
| Milrinona | 1 | 30 | 120 | 200 mcg/mL | Peso x dose x 0,3 | |
| Amiodarona | 50 | 9 | 140 | 3 mg/mL | Peso x dose x 0,02 | Diluir em SG 5% |
| Vasopressina | 20 U/mL | 3 | 147 | 0,4 U/mL | (Peso x dose) / 0,4 | |
| Nitroprussiato | 25 | 2 | 80 | 0,6 mg/mL | Peso x dose / 10 | Diluir em SG 5% |
| **Sedativos** | | | | | | |
| Fentanil | 50 | 60 | 90 | 20 mcg/mL | Peso x dose / 20 | |
| Midazolam | 5 | 60 | 90 | 2 mg/mL | Peso x dose / 2,0 | |
| Ketamina | 50 | 20 | 180 | 5 mg/mL | Peso x dose x 0,012 | |
| Dexmedetomidina | 0,1 mg/mL | 8 | 190 | 4 mcg/mL | Peso x dose / 4 | |
| Morfina | 10 mg/mL | 4 | 96 | 0,4 mg/mL | Peso x dose / 400 | |
| Propofol 2% (50 mL) | 20 mg/mL | 50 | 50 | 10 mg/mL | Peso x dose / 10 | |
| Rocurônio | 10 | 50 | 200 | 2 mg/mL | Peso x dose x 0,03 | |
| Cisatracúrio | 2 | 50 | 200 | 0,4 mg/mL | Peso x dose x 0,15 | |

---

## 18. Calculadoras e scores clínicos

73 scores e ferramentas clínicas organizados em 16 categorias com campo de busca.

Dados em: `v2/src/data/calculatorData.ts`
Página em: `v2/src/pages/Calculators.tsx`

### 18.1 Categorias

| Categoria | Quantidade | Exemplos |
|-----------|-----------|----------|
| Cardiologia / SCA | 7 | HEART, TIMI, GRACE, CHA2DS2-VASc |
| Neurologia / Neurocrítico | 11 | Hunt-Hess, Fisher, FOUR, NIHSS, CAM-ICU, RASS, ICH Score, ABC/2 |
| Gastro / Hepato | 7 | Rockall, Glasgow-Blatchford, Child-Pugh, MELD-Na, Alvarado |
| Trauma | 5 | TASH, mBIG, PECARN, Canadian C-Spine, Parkland |
| Hemodinâmica | 7 | DC por VTI, Gradiente A-a, Delta Gap, Anion Gap, Winters |
| Respiratório / Sepse | 7 | CURB-65, qSOFA, SOFA, NEWS2, APACHE II, Light |
| Via Aérea | 2 | Cormack-Lehane, Mallampati |
| Toxicologia | 5 | CIWA-AR, PSS, Rumack-Matthew, QTc, Gap osmolar |
| Farmacologia | 1 | Equivalência de corticoide |
| Renal / Metabólico | 7 | Adrogue-Madias, Cockcroft-Gault, CKD-EPI, Correção Ca/K |
| Infecção | 1 | CENTOR/McIsaac |
| Sedação / Dor | 3 | RASS, BPS, EVA/NRS |
| Vascular | 3 | ADD-RS, Caprini, PERC |
| Obstetrícia | 5 | DPP/DUM, IG, HELLP, MgSO4, Bishop |
| Procedimentos | 1 | Posicionamento CVC |
| POCUS / Hemodinâmica | 1 | Classificação VTI (Mercadal 2022) |

### 18.2 Estrutura de cada calculadora

Cada calculadora inclui:
- Cálculo interativo com resultado interpretado
- **Why**: por que o score existe
- **When to use**: quando usar
- **Pearls & Pitfalls**: dicas e armadilhas clínicas
- **Referência**: fonte bibliográfica

Scores existentes em pathways (Wells, HACOR, VNERi, etc.) conectam via badge "Disponível em [Tool]".

---

## 19. Shock Path — módulo VTI (choque indiferenciado)

Módulo adicional ao Shock Path para classificação hemodinâmica por VTI do LVOT (Mercadal et al. The Ultrasound Journal, 2022).

Home do Shock Path agora tem dois caminhos:
- **Choque séptico** (ANDROMEDA-SHOCK 2) — fluxo existente de 5 steps
- **Classificação hemodinâmica** (VTI-based) — novo fluxo com branching eco

Fluxo VTI:
1. VTI < 16 cm → baixo débito → pericárdio → VD → VE → valvar → responsividade
2. VTI 16-20 cm → zona cinzenta → ScvO2/Gap CO2/lactato → direcionar
3. VTI > 20 cm → distributivo → vasopressores

---

*Documento preparado para uso com qualquer colaborador (humano ou IA).*
*Atualizado em Abril 2026.*
