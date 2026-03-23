# CLAUDE.md — ANY App: Diretriz Completa de Desenvolvimento

> **Documento de referência obrigatória.** Leia integralmente antes de produzir qualquer código.
> Última atualização: Março 2026.

---

## 1. O que é o ANY App

**ANY App** (Anyone, Anything, Anytime) é uma plataforma de ferramentas de apoio à decisão clínica para medicina de emergência. Produz HTMLs interativos com árvores de decisão, pathways clínicos e calculadoras de dose para uso à beira-leito por médicos plantonistas.

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
Deploy automático via Netlify (git push → auto-deploy).

---

## 2. Ferramentas do ecossistema

### 2.1 Ferramentas integradas no monolito

| Key no `apps` | Pasta | Nome exibido | Descrição |
|----------------|-------|-------------|-----------|
| `hub` | `hub/` | Hub central | Tela inicial com grid de ferramentas |
| `vm` | `tools/vm-guide/` | VM Guide | Ventilação mecânica invasiva |
| `airway` | `tools/airway-guide/` | Airway Guide | Manejo de via aérea difícil |
| `infusion` | `tools/infusion-guide/` | Calculadora de Infusões | Drogas vasoativas e sedação |
| `tep` | `tools/tep-guide/` | TEP Guide | Tromboembolismo pulmonar |
| `seda` | `tools/seda-path/` | Seda Path | Sedação procedimental |
| `tox` | `tools/tox-path/` | Tox Path | Intoxicações e antídotos |
| `ped` | `tools/ped-guide/` | Ped Guide | Emergência pediátrica |
| `palia` | `tools/palia-path/` | Palia Path | Cuidados paliativos |
| `block` | `tools/block-path/` | Block Path | Bloqueios regionais (14 técnicas) |
| `acls` | `tools/acls/` | ACLS Guide | Gestão de PCR com metrônomo |
| `dengue` | `tools/dengue-path/` | Dengue Path | Manejo de dengue na emergência |

### 2.2 Para adicionar um novo app

1. Criar pasta `tools/[nome-kebab]/index.html`
2. Em `build_combined.py`: adicionar read, logo dedup, link fix, logo clickable, escape, apps object
3. Em `hub/index.html`: adicionar card na grid principal
4. Rebuild e testar: `python3 build_combined.py`

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
5. Produzir o HTML completo
6. Gustavo testa no navegador (validação visual)
7. Iterações de ajuste (se necessário)
8. Build: python3 build_combined.py
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

### 5.1 CSS Variables (copiar e colar em toda ferramenta)

```css
:root {
    /* Fundos */
    --bg-primary: #000000;       /* Fundo principal OLED puro */
    --bg-card: #0A0A0A;          /* Cards e seções */
    --bg-elevated: #111111;      /* Elementos elevados */
    --bg-hover: #1A1A1A;         /* Estados hover/interativos */

    /* Texto */
    --text-primary: #FFFFFF;     /* Texto principal */
    --text-secondary: #A0A0A0;   /* Texto secundário */
    --text-muted: #666666;       /* Texto desabilitado, hints */

    /* Accent */
    --accent: #FF5252;           /* Vermelho ANY — botões, CTAs, destaques */
    --accent-hover: #FF6B6B;     /* Hover do accent */
    --accent-muted: #FF525233;   /* Accent translúcido (backgrounds sutis) */

    /* Status clínico */
    --success: #4CAF50;          /* Verde — dose terapêutica, OK, meta atingida */
    --warning: #FFC107;          /* Amarelo — atenção, dose limítrofe */
    --danger: #F44336;           /* Vermelho — crítico, dose tóxica, alerta grave */
    --info: #2196F3;             /* Azul — informativo, links */

    /* Bordas */
    --border: #222222;           /* Borda padrão entre seções */
    --border-card: #333333;      /* Borda de cards (quando necessário) */
    --radius: 12px;              /* Border-radius padrão */
    --radius-sm: 8px;            /* Border-radius menor */

    /* Espaçamentos */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    /* Transições */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
}
```

### 5.2 Cores de alerta (dentro de cards/seções)

| Tipo | Background | Border-left | Texto do título |
|------|-----------|-------------|-----------------|
| Sucesso | `rgba(105,240,174,0.08)` | `#69F0AE` | `#69F0AE` |
| Atenção | `rgba(255,215,64,0.08)` | `#FFD740` | `#FFD740` |
| Perigo | `rgba(255,82,82,0.08)` | `#FF5252` | `#FF5252` |
| Info | `rgba(33,150,243,0.08)` | `#2196F3` | `#2196F3` |

### 5.3 Cores de feedback clínico

```css
.dose-therapeutic { color: var(--success); }  /* #4CAF50 — verde */
.dose-caution     { color: var(--warning); }  /* #FFC107 — amarelo */
.dose-critical    { color: var(--danger);  }  /* #F44336 — vermelho */
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

## 6. Estrutura obrigatória do HTML

### 6.1 Ordem dos elementos (sequencial, sem exceção)

```
1. Disclaimer (faixa sticky no topo)
2. Header (logo ANY App clicável → hub)
3. Campo de peso (quando aplicável — calculadoras)
4. Conteúdo principal (cards, árvores de decisão, calculadoras)
5. Footer fixo (créditos da equipe)
6. FAB menu (hamburger, canto inferior direito)
```

### 6.2 Template base

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>NomeDaFerramenta — ANY App</title>
    <meta name="description" content="Descrição breve da ferramenta">
    <style>
        /* Reset + CSS Variables + Estilos */
    </style>
</head>
<body>
    <!-- 1. DISCLAIMER -->
    <div class="disclaimer">
        <strong>Ferramenta de apoio em teste</strong> — não substitui o julgamento clínico. Confirme antes de usar.
    </div>

    <!-- 2. HEADER (logo clicável → hub) -->
    <div class="header">
        <a href="#" onclick="event.preventDefault(); parent.loadApp('hub')" style="cursor:pointer;">
            <img src="__LOGO__" alt="ANY App" style="max-width:280px;width:100%;height:auto;">
        </a>
    </div>

    <!-- 3. CONTAINER -->
    <div class="container">
        <!-- Conteúdo principal -->
    </div>

    <!-- 4. FOOTER FIXO -->
    <footer class="footer">
        <div class="footer-names">Gustavo Moreira • Gabriela Feltrin • João Pedro Moreira</div>
        <div class="footer-version">NomeDaFerramenta v1.0.0 — ANY App</div>
    </footer>

    <!-- 5. FAB MENU -->
    <div class="fab-menu">
        <div class="fab-options" id="fabOptions">
            <a href="#" onclick="event.preventDefault();toggleFab();/* ação -->">Link 1</a>
        </div>
        <button class="fab-btn" id="fabBtn" onclick="toggleFab()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
        </button>
    </div>

    <script>
        // JavaScript aqui
    </script>
</body>
</html>
```

### 6.3 CSS dos componentes obrigatórios

```css
/* Disclaimer */
.disclaimer {
    background: var(--warning);
    color: #000;
    text-align: center;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 100;
}

/* Header */
.header {
    text-align: center;
    padding: 20px 16px;
    position: relative;
}
.header img { max-width: 280px; width: 100%; height: auto; }

/* Container */
.container {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 16px 100px;
}

/* Footer fixo */
.footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    padding: 12px 16px;
    background: var(--bg-primary);
    border-top: 1px solid var(--border);
    z-index: 50;
}
.footer-names { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 2px; }
.footer-version { font-size: 0.65rem; color: var(--text-muted); }

/* FAB */
.fab-menu { position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
.fab-btn { width: 56px; height: 56px; border-radius: 50%; background: #FF5252; border: none; color: #fff; cursor: pointer; box-shadow: 0 4px 12px rgba(255,82,82,0.4); display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
.fab-btn:active { transform: scale(0.95); }
.fab-btn.open { background: #D32F2F; }
.fab-options { position: absolute; bottom: 70px; right: 0; background: #111; border: 1px solid #333; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); padding: 8px; display: none; min-width: 200px; }
.fab-options.open { display: block; }
.fab-options a { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; text-decoration: none; color: #F5F5F5; font-size: 14px; font-weight: 500; }
.fab-options a:active { background: #1A1A1A; }
```

### 6.4 JavaScript do FAB (obrigatório)

```javascript
function toggleFab() {
    var options = document.getElementById('fabOptions');
    var btn = document.getElementById('fabBtn');
    options.classList.toggle('open');
    btn.classList.toggle('open');
}
// Click-outside-to-close — OBRIGATÓRIO
document.addEventListener('click', function(e) {
    if (!e.target.closest('.fab-menu')) {
        document.getElementById('fabOptions').classList.remove('open');
        document.getElementById('fabBtn').classList.remove('open');
    }
});
```

---

## 7. Comportamentos de interface

### 7.1 Seções colapsáveis

- **Estado inicial:** TODAS fechadas. Sem exceção.
- **Animação:** Transição suave (300-400ms).
- **Indicador:** Chevron ou seta rotativa indicando estado.

```javascript
function toggleSection(header) {
    const content = header.nextElementSibling;
    const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
    if (isOpen) {
        content.style.maxHeight = '0px';
        header.classList.remove('active');
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        header.classList.add('active');
    }
}
```

### 7.2 Accordion (seções mutuamente exclusivas)

Quando apenas uma seção deve ficar aberta por vez: fechar todas antes de abrir a clicada.

```javascript
function toggleCriteria(header) {
    var body = header.nextElementSibling;
    var isOpen = body.classList.contains('open');
    document.querySelectorAll('.criteria-body.open').forEach(function(b) {
        b.classList.remove('open');
        b.parentElement.querySelector('.criteria-chevron').classList.remove('open');
    });
    if (!isOpen) {
        body.classList.add('open');
        header.querySelector('.criteria-chevron').classList.add('open');
    }
}
```

### 7.3 Calculadoras de dose

| Requisito | Detalhe |
|-----------|---------|
| Sliders bidirecionais | Dose <-> Velocidade de infusão (tempo real) |
| Campo de peso | Sempre visível no topo. Adulto: 40-200 kg. Pediátrico: 0,5-50 kg. |
| Faixas de cor | Verde (terapêutico), Amarelo (atenção), Vermelho (crítico) |
| Validação | Impedir valores fora do range clínico seguro |
| Input numérico | `inputmode="decimal"` para teclado numérico no celular |
| Unidades | Sempre explícitas: mg, mcg, mL, mg/kg, mcg/kg/min |

### 7.4 Árvores de decisão

```css
.decision-node {
    background: var(--bg-hover);
    border: 2px solid var(--info);
    border-radius: var(--radius);
    padding: var(--spacing-md);
}
.decision-option.yes {
    background: rgba(105, 240, 174, 0.1);
    color: #69F0AE;
    border: 1px solid rgba(105, 240, 174, 0.3);
}
.decision-option.no {
    background: rgba(255, 82, 82, 0.1);
    color: #FF5252;
    border: 1px solid rgba(255, 82, 82, 0.3);
}
```

### 7.5 Selection UI — border-left colorida

Padrão SedaPath para cards de seleção/módulos:

```css
.module-card { border-left: 4px solid #FF5252; }
.bl-green { border-left-color: #10B981 !important; }
.bl-blue { border-left-color: #60A5FA !important; }
.bl-red { border-left-color: #FF5252 !important; }
.bl-yellow { border-left-color: #F59E0B !important; }
.bl-purple { border-left-color: #8B5CF6 !important; }
```

**Cuidado com CSS specificity:** Se houver regra global `border-color: #1A1A1A !important`, trocar por `border-top/right/bottom-color` individuais para não sobrescrever a border-left colorida.

### 7.6 Slide horizontal (transições entre páginas)

Para fluxos passo-a-passo, usar `translateX()` em vez de fade simples.

```css
@keyframes slideLeft {
    from { opacity: 0; transform: translateX(60px); }
    to { opacity: 1; transform: translateX(0); }
}
.section { animation: slideLeft 0.3s ease; }
```

### 7.7 Botões

```css
.btn-primary {
    background: var(--accent);
    color: #FFFFFF;
    border: none;
    border-radius: var(--radius-sm);
    padding: 12px 24px;
    font-size: 15px;
    font-weight: 500;
    min-height: 44px;          /* área de toque mínima */
    cursor: pointer;
    transition: background var(--transition-fast);
}
.btn-primary:hover { background: var(--accent-hover); }
```

### 7.8 Árvores de decisão e branching

Regras para fluxos de decisão clínica nas ferramentas:

#### Branching pós-decisão obrigatório
- Toda decisão binária (sucesso/falha, sim/não) deve ter **dois caminhos explícitos**
- Nunca assumir sucesso — sempre perguntar "Deu certo?"
- Exemplo: Intubação → "Intubou?" → Sim (confirmar) / Não (Plano B)

#### Sync de estado entre views
- Dados clínicos (checklists, scores) que aparecem em mais de um screen devem usar **modelo de dados compartilhado**
- Nunca duplicar estado em DOM separados sem sincronização
- Usar `data-attributes` para identificar items e array JS para estado
- Ao toggle em uma view, refletir automaticamente na outra

#### Feedback explícito em vez de ocultar
- Botões escondidos devem ter mensagem explicando por quê
- Botões disabled devem mostrar texto inline com o requisito
- Nunca silenciar uma decisão do sistema — o médico precisa saber o que aconteceu

#### Populações especiais visíveis
- Toggle proeminente para populações especiais (gestante, pediátrico)
- Nunca esconder atrás de link de texto pequeno
- Exemplo: TEP gestante → toggle no topo "Gestante / Não gestante"

#### Informação inline no fluxo
- Referências e calculadoras acessíveis sem trocar de view
- Collapsibles inline > links para outras seções
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
| Padding lateral | Mínimo 16px | Texto não cola nas bordas |
| Área de toque | Min-height 44px | Recomendação Apple/Google |
| Font-size mínimo | 14px | Legibilidade em tela pequena |
| Input numérico | `inputmode="decimal"` | Teclado numérico no mobile |
| Body padding-bottom | 70px | Espaço para o footer fixo |

Meta viewport obrigatória:
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

| Versão | Uso | Largura web |
|--------|-----|-------------|
| **Horizontal** (retangular, PNG) | Header das ferramentas | 400px -> max-width 280px no CSS |
| **Quadrado** (JPEG) | Splash screen | 300px |

### 10.2 Como funciona no monolito

- O logo horizontal PNG é extraído do `hub/index.html` pelo `build_combined.py`
- Armazenado uma única vez como `LOGO_BASE64` no parent
- Sub-apps usam placeholder `__LOGO__` substituído em runtime
- O splash logo quadrado JPEG vive em `assets/splash-logo.jpeg`

### 10.3 Regras

- Nunca distorcer ou alterar o logo
- Sempre usar a versão otimizada (não o PNG original de alta resolução)
- O logo no header é **sempre clicável** -> redireciona para o hub
- No monolito: `onclick="event.preventDefault(); parent.loadApp('hub')"`
- Sem `target="_blank"` — abrir na mesma aba

---

## 11. Arquitetura combinada (monolito)

### 11.1 Estrutura de pastas

```
ANY APP/
├── hub/index.html              <- Hub central (tela inicial)
├── tools/
│   ├── acls/index.html         <- ACLS Guide
│   ├── airway-guide/index.html <- Airway Guide
│   ├── dengue-path/index.html  <- Dengue Path
│   ├── block-path/index.html   <- Block Path
│   ├── infusion-guide/index.html <- Calculadora de Infusões
│   ├── palia-path/index.html   <- Palia Path
│   ├── ped-guide/index.html    <- Ped Guide
│   ├── seda-path/index.html    <- Seda Path
│   ├── tep-guide/index.html    <- TEP Guide
│   ├── tox-path/index.html     <- Tox Path
│   └── vm-guide/index.html     <- VM Guide
├── build_combined.py           <- Script de build
├── deploy/index.html           <- Output do build (deploy)
├── assets/splash-logo.jpeg     <- Logo quadrado do splash
├── CLAUDE.md                   <- Este documento
├── .gitignore
└── README.md
```

### 11.2 Como funciona o build

O script `build_combined.py` combina todos os HTMLs em um único `index.html` com iframe + `document.write()`.

**Pipeline:**
1. Ler todos os HTMLs de `hub/` e `tools/*/`
2. Carregar splash logo (JPEG quadrado)
3. Extrair logo PNG do hub, substituir por `__LOGO__` em todos os apps (deduplicação)
4. Substituir links externos por `parent.loadApp('nome')`
5. Tornar logo clicável -> hub em todos os sub-apps
6. Corrigir funções que usam `location.reload()` (quebra iframe)
7. Escapar tudo para template literals JS (backticks, `${}`, `</script>`)
8. Montar HTML combinado com objeto `apps = { hub: \`...\`, vm: \`...\` }`
9. Gerar `deploy/index.html`

### 11.3 Regras críticas do build

- **Nunca usar `location.reload()`** em sub-apps — quebra a navegação no iframe. Usar reset de estado manual.
- **Template literals:** Backticks, `${}` e `</script>` devem ser escapados pela função `escape_for_template()`.
- **Logo deduplicação:** O PNG do logo é armazenado uma única vez como `LOGO_BASE64` no parent. Sub-apps usam placeholder `__LOGO__` substituído em runtime.
- **Navegação entre apps:** Usar `parent.loadApp('nome')` com `event.preventDefault()`.
- **Deep links:** `parent.loadApp('infusion', 'noradrenalina')` — o segundo parâmetro é passado para `handleDeepLink()` no app destino.

### 11.4 Splash screen

- Logo quadrado JPEG com animação de reveal (blur -> nítido, 2.2s)
- Créditos: "Gustavo Moreira - Gabriela Feltrin - João Pedro Moreira" com fade-in atrasado
- Splash some após 3s, iframe aparece com fade

### 11.5 Comandos de build e deploy

```bash
# Build
python3 build_combined.py

# Deploy (auto-deploy via Netlify)
git add tools/[app]/index.html build_combined.py deploy/index.html
git commit -m "feat: descrição da mudança"
git push origin main
```

---

## 12. Padrões de código

### 12.1 Arquivo único

Todo o código (HTML + CSS + JS) em **um só arquivo `.html`**. Sem dependências externas (exceto fontes do sistema). Deve funcionar offline após primeiro carregamento.

### 12.2 Nomenclatura

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Variáveis JS | camelCase | `calcularDose`, `pesoAtual` |
| Classes CSS | kebab-case | `section-header`, `dose-result` |
| Pastas de tools | kebab-case | `airway-guide/`, `seda-path/` |
| Arquivo principal | `index.html` | Sempre |
| IDs HTML | camelCase | `pesoInput`, `resultadoDose` |

### 12.3 Comentários no código

- Explicar lógica clínica complexa
- Documentar fórmulas de cálculos com referência
- Indicar fonte bibliográfica quando relevante

```javascript
// Dose de cetamina para ISR: 1,5 mg/kg (Walls Manual, 5th ed)
// Apresentação: 50 mg/mL (ampola 10 mL)
const doseCetamina = peso * 1.5;
const volumeCetamina = doseCetamina / 50;
```

---

## 13. Segurança clínica

### 13.1 Validação de inputs

| Parâmetro | Range adulto | Range pediátrico |
|-----------|-------------|-----------------|
| Peso | 40-200 kg | 0,5-50 kg |

- Sempre validar antes de calcular
- Exibir mensagens de erro claras
- Impedir valores fora do range clínico seguro

### 13.2 Alertas visuais

- **Verde** -> dose terapêutica / parâmetro normal
- **Amarelo** -> dose limítrofe / atenção necessária
- **Vermelho** -> dose crítica ou tóxica / alerta grave

### 13.3 Regras de segurança técnica

- HTTPS obrigatório (Netlify fornece SSL gratuito)
- Sem dados sensíveis no código (sem API keys, tokens ou senhas)
- localStorage apenas para preferências do usuário (não dados de pacientes)
- Console limpo: zero erros vermelhos antes do deploy

### 13.4 Regulatório

- Disclaimer obrigatório em todas as ferramentas
- Linguagem não-taxativa (apoio à decisão, não prescrição)
- Não armazenar dados de pacientes na fase atual

---

## 14. Erros comuns e lições aprendidas

### 14.1 Erros de build

| Erro | Causa | Solução |
|------|-------|---------|
| CSS quebrado após merge de seções | Chaves `}` órfãs desbalanceando o CSS | Conferir contagem de `{` vs `}` antes e depois |
| `showTab()` crash ao chamar programaticamente | `event.target` undefined fora de click event | Usar busca por atributo em vez de `event.target` |
| Variáveis JS com mesmo nome em seções merged | `var answers = {}` sobrescrevendo `var answers = []` | Prefixar variáveis por contexto (ex: `deconAnswers`) |
| Logo não aparece no sub-app | Regex de deduplicação não casou com variante do `<img>` | Usar regex flexível: `<img\s[^>]*__LOGO__[^>]*>` |
| `location.reload()` quebra iframe | Recarrega o parent, não o sub-app | Usar reset de estado manual |
| FAB chama função errada | Funções renomeadas durante refactor | Sempre verificar nome da função chamada no onclick |

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
- Conteúdo cortado por falta de padding-bottom no body
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
- [ ] Disclaimer presente e sticky no topo (texto padrão)
- [ ] Logo ANY App no header (base64/`__LOGO__`, clicável -> hub)
- [ ] Seções colapsáveis iniciam **FECHADAS**
- [ ] Footer fixo com créditos (Gustavo, Gabriela, João Pedro)
- [ ] FAB menu hamburger com click-outside-to-close
- [ ] Conteúdo clínico validado (não inventado)
- [ ] Linguagem **sugestiva** (não imperativa)
- [ ] Medicamentos com nome **genérico** e apresentação da ampola
- [ ] Sentence case em títulos
- [ ] Ortografia portuguesa rigorosa (acentuação correta)
- [ ] Zero emojis

### Visual e UX
- [ ] Fundo OLED puro (`#000000`)
- [ ] Cores conforme paleta OLED Pure
- [ ] Contraste adequado para leitura
- [ ] Botões com min-height 44px
- [ ] Padding lateral mínimo 16px
- [ ] Body com padding-bottom 70px
- [ ] Testado em tela mobile (< 400px de largura)
- [ ] Animações suaves (300-400ms)

### Técnico
- [ ] Arquivo único (HTML + CSS + JS)
- [ ] Meta viewport configurada
- [ ] Encoding UTF-8
- [ ] Inputs numéricos com `inputmode="decimal"`
- [ ] Validação de peso (quando aplicável)
- [ ] Calculadoras com faixas de cor
- [ ] Console sem erros
- [ ] Funciona offline após primeiro carregamento
- [ ] `location.reload()` não utilizado (usar reset manual)

### Deploy
- [ ] Build executado: `python3 build_combined.py`
- [ ] Output verificado: `deploy/index.html` existe e não está truncado
- [ ] HTML completo (termina com `</html>`)
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

*Documento preparado para uso com qualquer colaborador (humano ou IA).*
*Atualizado em Março 2026.*
