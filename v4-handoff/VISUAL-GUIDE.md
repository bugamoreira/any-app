# Diretrizes visuais v4

## Principio zero: v1 e referencia absoluta

Antes de criar qualquer componente novo ou pagina, abra o v1 monolito (`deploy/index.html`) em paralelo. Extraia o CSS exato. Reproduza no v4 com Tailwind + tokens.

**Tokens base (v1, NAO mexer):**

```css
--color-bg-primary: #000000
--color-bg-card:    #0A0A0A
--color-bg-elevated: #111111
--color-bg-hover:   #1A1A1A
--color-text-primary:   #FFFFFF
--color-text-secondary: #A0A0A0
--color-text-muted:     #888888
--color-accent:        #FF5252
--color-accent-hover:  #FF6B6B
--color-success: #4CAF50
--color-warning: #FFC107
--color-danger:  #F44336
--color-info:    #2196F3
--color-border:       #444444   (NAO #222)
--color-border-card:  #444444   (NAO #333)
--radius-default: 12px
--radius-sm: 8px
```

**Globals (v1):**
- Touch feedback global: `button:active, a:active, [role="button"]:active { transform: scale(0.98); transition: transform 100ms ease }` — **NAO remover**
- Footer fixed bottom com bg black + border-top #444 + z-50
- Container com `pb-[100px]` (reserva espaco do footer fixed)

## Componentes base (padroes v1)

### Card
- `bg: #0A0A0A`, `border: 1px solid #444`, `radius: 12px`, `padding: 16px` (default)
- Com borderColor: `borderLeft: 4px solid <color>` inline + `padding: 20px` + `border 1px #444` nos 3 lados
- `margin-bottom: 16px` (mb-4) como default

### Collapsible
- Wrapper `mb-3` simples
- Header: `<button>` com `bg-bg-elevated` + `border border-border-card` + `rounded-lg` + `padding: 14px` + `min-h-44px`
- Body: `<div>` com `bg-bg-card` + `border border-border-card border-t-0` + `rounded-b-lg` + `padding: 14px`
- **Mantem a costura** entre header e body (ajuda o olho a ver o que foi aberto)

### Disclaimer
- Sticky top, bg-warning, text black, centralizado
- Altura 40px (padding py-2.5)
- Font 12px, bold
- Texto: "Ferramenta de apoio em teste — nao substitui o julgamento clinico."

### Header
- Logo 280px (via `import logo from '../../assets/logo.png'`)
- Logo dentro de `<button aria-label="Ir para o Hub">` (a11y)
- Titulo 24px/bold
- Subtitulo 14px/muted
- Padding py-5

### Footer
- **Fixed bottom** (nao static)
- bg-black + border-top 1px #444 + z-50 + padding py-3
- Creditos + tool/version

### Hub cards
- Grid 2 colunas, gap 12px
- Cada card: bg-bg-card + border 1px #333 + radius 16px + padding 24px 16px + min-h 120px
- Icone centralizado, w-[40px] h-[40px] mb-3
- Nome centralizado, text-sm font-semibold
- Badge NOVO: ribbon diagonal `top-[10px] right-[-28px] rotate-45 bg-warning text-black text-[9px] py-[3px] px-[30px] tracking-[1px]`

### FABMenu
- Fixed bottom-5 right-5, z-[1000]
- Botao circular 56x56, bg-accent, shadow
- Menu abre com animate-fade-in 300ms
- Items com aria-label

### Button
- Primary: bg-accent + white
- Secondary: bg-bg-elevated + border border-border-card + text-primary
- Outline: bg-transparent + border + text-accent
- Danger: bg-danger + white
- Min-height 44px, radius 8px, padding 16px, font 16px/semibold

## Principios MDCalc para a pagina Calculadoras

**Nao e para TODAS as paginas — apenas para `/calculadoras` e afins onde o usuario preenche inputs e recebe um score/interpretacao.**

Origem: https://mdcalc.com — padrao ouro de calculadoras medicas online.

### 1. Separacao temporal do conteudo

**Antes do calculo:** abas no topo da pagina
- `Calculadora` (default — inputs + resultado)
- `Quando usar` (indicacoes, leitura opcional)
- `Pearls e pitfalls` (armadilhas clinicas)
- `Por que usar` (racional evidencial)

**Apos o calculo:** scroll continuo abaixo do result box
- `Proximos passos` (acoes clinicas sugeridas)
- `Evidencia` (estudos, referencia)
- `Sobre o criador` (opcional)
- `Referencias` (citacoes)

### 2. Sem botao "Calcular"

Live update. Usuario seleciona opcao → score atualiza em real-time. Zero clicks para ver resultado.

### 3. Row of buttons

Uma pergunta por linha. Opcoes lado a lado como botoes/pills. Pontos visiveis em cada opcao (`+2`, `+1`, `0`). Opcao selecionada: bg-accent/20 + border-accent + text-accent + bold.

### 4. Result box dominante

Quando todos inputs obrigatorios preenchidos, aparece o result box com:
- Score grande (text-3xl ou 4xl, bold)
- Interpretacao curta (1 frase)
- Cor bg-tinted por risco: verde (baixo) / amarelo (moderado) / laranja (alto) / vermelho (critico)
- Acoes em bullets

**Em mobile:** sticky bottom — score sempre visivel enquanto usuario rola inputs.

### 5. Instructions box opcional

Se a calculadora tem informacao critica pre-uso ("So aplique em pacientes com dor toracica aguda"), exibir em box azul suave antes dos inputs.

### Estrutura do template novo

```
Disclaimer sticky (40px, bg-warning)
Header sticky (toolName + backlink discreto)
<CalcTabs value="calc" /> [Calculadora | Quando usar | Pearls | Por que usar]

Se aba = "calc":
  (instructions box opcional)
  <InputRow pergunta1 opcoes1 />
  <InputRow pergunta2 opcoes2 />
  ...
  <ResultBox live score={currentScore} risk={currentRisk} />
  (depois do result)
  <Collapsible "Proximos passos" /> (recolhido)
  <Collapsible "Referencia" /> (recolhido)

Se aba = "quando": calc.whenToUse
Se aba = "pearls":  calc.pearls
Se aba = "por que": calc.whyUse

Footer (fixed)
```

## Obsessao UX Apple (aditiva, nao substitutiva)

- Transicoes suaves 300-400ms ease
- Touch targets 44px minimo
- Breathing room generoso (nunca apertar para caber mais)
- Feedback tatil em todo toque (scale 0.98 global)
- Tipografia clara com hierarquia
- Animacao slide-left entre steps de pathway

Estas sao COMPLEMENTOS ao visual v1 — nao mudam o v1, adicionam polish.
