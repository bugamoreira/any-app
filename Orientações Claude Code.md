# CLAUDE.md — ANY App: Guia de Desenvolvimento

> **Documento de referência obrigatória.** Leia integralmente antes de produzir qualquer código.

---

## 1. Contexto do projeto

### 1.1 O que é o ANY App

ANY App (Anyone, Anything, Anytime) é uma plataforma de ferramentas de apoio à decisão clínica para medicina de emergência. Produz HTMLs interativos com árvores de decisão, pathways clínicos e calculadoras de dose para uso à beira-leito por médicos plantonistas.

### 1.2 Equipe

| Nome | Papel | Perfil |
|------|-------|--------|
| **Gustavo Moreira** | CEO / Coordenador Médico do DE | Médico emergencista. Define conteúdo clínico, valida interfaces, aprova entregas. |
| **Gabriela Feltrin** | CFO / Operações | Médica e data scientist. |
| **João Pedro Moreira** | CTO / Engenheiro de Software | Responsável pela infraestrutura e deploy. |

### 1.3 Público-alvo

Plantonistas médicos de departamentos de emergência — principalmente emergencistas, mas também cirurgiões, ortopedistas e clínicos. Acessam pelo celular durante o plantão.

### 1.4 Distribuição

HTMLs interativos hospedados no Netlify, compartilhados via links diretos. Hub central: `https://hubany.netlify.app`

### 1.5 Ferramentas já desenvolvidas

- **AirwayGuide** — Guia de manejo de via aérea difícil
- **Calculadora de Infusões** — Drogas vasoativas e sedação
- **ToxPath** — Intoxicações, toxíndromes, antídotos
- **SedaPath** — Sedação procedimental
- **PedPath** — Emergência pediátrica
- **BlockPath** — Bloqueios regionais (14 técnicas)
- **DonorsPath** — Manutenção de potencial doador
- **Trilha 5R Sepse** — Protocolo de sepse
- **Guia HDA** — Hemorragia digestiva alta
- **EvoGen** — Gerador de evoluções estruturadas

---

## 2. Regras de ouro

### ⛔ O que NUNCA fazer

1. **Não mexa em nada que não foi pedido.** Nada mesmo. Não altere cor, função, layout, texto ou qualquer elemento sem solicitação explícita.
2. **Não invente informações clínicas.** Se não sabe, pergunte. Nunca suponha dados médicos "porque fazem sentido".
3. **Não produza HTML antes de fechar todas as definições.** Sempre apresente o esqueleto estrutural e aguarde aprovação.
4. **Não execute mudanças sem consultar.** Seja de roteiro, cor, função, texto ou qualquer outro elemento.
5. **Não faça suposições sobre condutas médicas.** Se houver dúvida sobre qualquer dado clínico, questione antes de incluir.

### ✅ O que SEMPRE fazer

1. **Brainstorming antes de produzir.** Discuta ideias, proponha soluções, tire dúvidas — só então produza.
2. **Traga o esqueleto primeiro.** Antes de codar, apresente a estrutura para validação.
3. **Confronte com argumentos.** Se identificar uma abordagem melhor, questione com argumentos estruturados.
4. **Sugira reduções de fricção.** Pense na cabeça do usuário (médico sob pressão, celular na mão, pouco tempo).
5. **Peça confirmação (ok) antes de criar arquivos.** Nunca produza sem aprovação prévia.
6. **Siga os padrões.** Confirme que o código está alinhado com as ferramentas já existentes.

---

## 3. Design system — OLED Pure

> **Atenção:** Os PDFs de diretrizes v1.0 (Janeiro 2026) usavam a paleta antiga (#121212/#E53935). O padrão vigente é **OLED Pure** conforme descrito abaixo.

### 3.1 CSS Variables (copiar e colar em toda ferramenta)

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

### 3.2 Cores de alerta (dentro de cards/seções)

| Tipo | Background | Border-left | Texto do título |
|------|-----------|-------------|-----------------|
| Sucesso | `rgba(105,240,174,0.08)` | `#69F0AE` | `#69F0AE` |
| Atenção | `rgba(255,215,64,0.08)` | `#FFD740` | `#FFD740` |
| Perigo | `rgba(255,82,82,0.08)` | `#FF5252` | `#FF5252` |
| Info | `rgba(33,150,243,0.08)` | `#2196F3` | `#2196F3` |

### 3.3 Tipografia

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

## 4. Estrutura obrigatória do HTML

### 4.1 Ordem dos elementos (sequencial, sem exceção)

```
1. Disclaimer (faixa sticky no topo)
2. Header (logo ANY App clicável → hub)
3. Campo de peso (quando aplicável — calculadoras)
4. Conteúdo principal (cards, árvores de decisão, calculadoras)
5. Footer (créditos da equipe)
```

### 4.2 Template base

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>NomeDaFerramenta — ANY App</title>
    <meta name="description" content="Descrição breve da ferramenta">
    <meta property="og:title" content="NomeDaFerramenta — ANY App">
    <meta property="og:description" content="Descrição breve">
    <style>
        /* Reset + CSS Variables + Estilos */
    </style>
</head>
<body>
    <!-- 1. DISCLAIMER -->
    <div class="disclaimer">
        Versão em teste — use com dupla validação clínica
    </div>

    <!-- 2. HEADER (logo clicável → hub) -->
    <header class="header">
        <a href="https://hubany.netlify.app">
            <img src="data:image/png;base64,LOGO_BASE64_AQUI"
                 alt="ANY App™ — Medicina de Emergência"
                 style="max-width:280px;width:100%;height:auto;">
        </a>
    </header>

    <!-- 3. CONTAINER -->
    <div class="container">

        <!-- 3a. CAMPO DE PESO (se calculadora) -->
        <div class="weight-section">
            <label>Peso (kg)</label>
            <input type="number" id="peso" inputmode="decimal"
                   value="70" min="40" max="200">
        </div>

        <!-- 4. CONTEÚDO PRINCIPAL -->
        <main>
            <!-- Seções colapsáveis, cards, árvores de decisão -->
        </main>
    </div>

    <!-- 5. FOOTER -->
    <footer class="footer">
        <div class="footer-credits">
            Gustavo Moreira • Gabriela Feltrin • João Pedro Moreira
        </div>
        <div class="footer-version">v1.0.0 — Março 2026</div>
    </footer>

    <script>
        // JavaScript aqui
    </script>
</body>
</html>
```

### 4.3 Disclaimer — estilo padrão

```css
.disclaimer {
    background: var(--warning);  /* #FFC107 */
    color: #000;
    text-align: center;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 100;
}
```

### 4.4 Header — logo no lugar do texto

O header usa o logo ANY App em base64 (horizontal, ~400px largura). Sempre clicável, redirecionando para o hub (`https://hubany.netlify.app`). Abre na mesma aba (sem `target="_blank"`).

```css
.header {
    background: var(--bg-primary);
    padding: 20px 16px;
    text-align: center;
    border-bottom: 1px solid var(--border);
}

.header img {
    max-width: 280px;
    width: 100%;
    height: auto;
}
```

### 4.5 Footer — padrão fixo

```css
.footer {
    text-align: center;
    padding: 24px 16px;
    border-top: 1px solid var(--border);
    margin-top: 32px;
}

.footer-credits {
    font-size: 12px;
    color: var(--text-secondary);
}

.footer-version {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
}
```

---

## 5. Comportamentos de interface

### 5.1 Seções colapsáveis

- **Estado inicial:** TODAS fechadas. Sem exceção.
- **Animação:** Transição suave (300-400ms).
- **Indicador:** Chevron ou seta rotativa indicando estado.
- **Acessibilidade:** Usar `aria-expanded` nos botões.

```javascript
// Padrão de toggle para seções colapsáveis
function toggleSection(header) {
    const content = header.nextElementSibling;
    const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

    if (isOpen) {
        content.style.maxHeight = '0px';
        header.classList.remove('active');
        header.setAttribute('aria-expanded', 'false');
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        header.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
    }
}
```

### 5.2 Calculadoras de dose

| Requisito | Detalhe |
|-----------|---------|
| Sliders bidirecionais | Dose ↔ Velocidade de infusão (tempo real) |
| Campo de peso | Sempre visível no topo. Adulto: 40-200 kg. Pediátrico: 0,5-50 kg. |
| Faixas de cor | Verde (terapêutico), Amarelo (atenção), Vermelho (crítico) |
| Validação | Impedir valores fora do range clínico seguro |
| Input numérico | `inputmode="decimal"` para teclado numérico no celular |
| Unidades | Sempre explícitas: mg, mcg, mL, mg/kg, mcg/kg/min |

### 5.3 Cores de feedback clínico

```css
.dose-therapeutic { color: var(--success); }  /* #4CAF50 — verde */
.dose-caution     { color: var(--warning); }  /* #FFC107 — amarelo */
.dose-critical    { color: var(--danger);  }  /* #F44336 — vermelho */
```

### 5.4 Árvores de decisão

- Nós de decisão: fundo `#1A1A1A`, borda `var(--info)` (#2196F3)
- Opção "Sim": fundo translúcido verde, texto `#69F0AE`
- Opção "Não": fundo translúcido vermelho, texto `#FF5252`

```css
.decision-node {
    background: var(--bg-hover);
    border: 2px solid var(--info);
    border-radius: var(--radius);
    padding: var(--spacing-md);
    color: var(--text-primary);
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

### 5.5 Botões

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

.btn-primary:hover {
    background: var(--accent-hover);
}
```

---

## 6. Linguagem clínica

### 6.1 Princípio fundamental

> A medicina é complexa e cheia de incertezas. As ferramentas devem **apoiar** a decisão clínica, **não substituí-la**.

### 6.2 Tom sugestivo (não imperativo)

| ❌ Evitar (taxativo) | ✅ Preferir (sugestivo) |
|----------------------|------------------------|
| Administrar carvão ativado | Considere carvão ativado |
| Fazer IOT | É recomendado proteger via aérea |
| Indicado | Pode ser considerado |
| Contraindicado | Geralmente não recomendado |
| Internação em UTI | Considere UTI |
| Tratamento | Recomendações terapêuticas |
| OBRIGATÓRIO | Recomendado / Sugerido |

### 6.3 Nomenclatura de medicamentos

- **SEMPRE** nome genérico (nunca nome comercial)
- Incluir apresentação da ampola (ex: "cetamina 50 mg/mL — ampola 10 mL")
- Concentrações e diluições explícitas
- Unidades claras: mg, mcg, mL, mg/kg, mcg/kg/min
- Buscas devem reconhecer aliases comuns (ex: "precedex" → dexmedetomidina)

### 6.4 Formatação de títulos

**Sentence case** — apenas primeira letra maiúscula:
- ✅ "Critérios de disposição"
- ❌ "Critérios De Disposição"

### 6.5 Padrão linguístico

- Norma culta da língua portuguesa
- Concordância verbal e nominal correta
- Acentuação correta (atenção especial a termos médicos)
- Evitar anglicismos desnecessários
- Siglas: definir na primeira ocorrência (ex: "Sequência Rápida de Intubação (SRI)")

---

## 7. Design mobile-first

### 7.1 Especificações

| Propriedade | Valor | Motivo |
|-------------|-------|--------|
| Max-width container | 500px | Otimizado para celular |
| Padding lateral | Mínimo 16px | Texto não cola nas bordas |
| Área de toque | Min-height 44px | Recomendação Apple/Google |
| Font-size mínimo | 14px | Legibilidade em tela pequena |
| Input numérico | `inputmode="decimal"` | Teclado numérico no mobile |

### 7.2 Meta viewport obrigatória

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### 7.3 Container padrão

```css
.container {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 16px 100px;
}
```

---

## 8. Logo ANY App

### 8.1 Uso do logo

O logo é embutido como **base64** diretamente no HTML. Existem duas versões:

| Versão | Uso | Largura web |
|--------|-----|-------------|
| **Horizontal** (retangular) | Header das ferramentas | 400px → max-width 280px no CSS |
| **Quadrado** | Splash screen, favicon, OG image | 300px |

### 8.2 Como embutir

```html
<img src="data:image/png;base64,CONTEUDO_BASE64_AQUI"
     alt="ANY App™ — Medicina de Emergência">
```

O base64 do logo horizontal otimizado para web (400px, ~84KB) está no arquivo `logo-horizontal-base64.txt` na raiz do projeto. Para uso:

```bash
# Ler o base64 e inserir no HTML
LOGO=$(cat logo-horizontal-base64.txt)
```

### 8.3 Regra

- Nunca distorcer ou alterar o logo
- Sempre usar a versão otimizada (não o PNG original de alta resolução)
- O logo no header é **sempre clicável** → redireciona para `https://hubany.netlify.app`
- Abrir na mesma aba (sem `target="_blank"`)

---

## 9. Padrões de código

### 9.1 Arquivo único

Todo o código (HTML + CSS + JS) em **um só arquivo `.html`**. Sem dependências externas (exceto fontes do sistema). Deve funcionar offline após primeiro carregamento.

### 9.2 Nomenclatura

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Variáveis JS | camelCase | `calcularDose`, `pesoAtual` |
| Classes CSS | kebab-case | `section-header`, `dose-result` |
| Pastas | kebab-case | `airway-guide/`, `calc-infusoes/` |
| Arquivo principal | `index.html` | Sempre |
| IDs HTML | camelCase | `pesoInput`, `resultadoDose` |

### 9.3 Versionamento semântico

Formato: **MAJOR.MINOR.PATCH**

- **MAJOR:** Redesign completo, mudanças incompatíveis
- **MINOR:** Nova funcionalidade, compatível
- **PATCH:** Correção de bugs, ajustes menores

### 9.4 Mensagens de commit

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `feat:` | Nova funcionalidade | `feat: adiciona calculadora de noradrenalina` |
| `fix:` | Correção de bug | `fix: corrige cálculo de dose pediátrica` |
| `docs:` | Documentação | `docs: atualiza referências do ToxPath` |
| `style:` | Formatação, CSS | `style: ajusta cores para OLED Pure` |
| `refactor:` | Refatoração | `refactor: reorganiza funções de cálculo` |

### 9.5 Comentários no código

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

## 10. Segurança clínica

### 10.1 Validação de inputs

| Parâmetro | Range adulto | Range pediátrico |
|-----------|-------------|-----------------|
| Peso | 40-200 kg | 0,5-50 kg |

- Sempre validar antes de calcular
- Exibir mensagens de erro claras
- Impedir valores fora do range clínico seguro

### 10.2 Alertas visuais

- **Verde** → dose terapêutica / parâmetro normal
- **Amarelo** → dose limítrofe / atenção necessária
- **Vermelho** → dose crítica ou tóxica / alerta grave

### 10.3 Regras de segurança técnica

- HTTPS obrigatório (Netlify fornece SSL gratuito)
- Sem dados sensíveis no código (sem API keys, tokens ou senhas)
- localStorage apenas para preferências do usuário (não dados de pacientes)
- Console limpo: zero erros vermelhos antes do deploy

---

## 11. Deploy no Netlify

### 11.1 Processo

1. Arquivo nomeado exatamente como `index.html`
2. Criar ZIP com `index.html` na raiz (**sem subpasta**)
3. Método de compressão: `zip -0` (store, sem compressão)
4. Verificar HTML completo (termina com `</html>`)
5. Confirmar encoding UTF-8
6. Arrastar para `app.netlify.com/drop`

### 11.2 Comando de geração do ZIP

```bash
mkdir -p deploy-temp
cp index.html deploy-temp/
cd deploy-temp
zip -0 ../deploy.zip index.html
cd ..
rm -rf deploy-temp
```

### 11.3 Entrega ao CTO

Para cada ferramenta, entregar:

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Código completo, pronto para deploy |
| `deploy.zip` | ZIP com index.html na raiz |
| `README.md` | Descrição, instruções, referências (opcional) |

---

## 12. Referências bibliográficas

Fontes aceitas para validação de conteúdo clínico. **Nunca inventar dados.**

### Trauma e emergência
- ATLS — Advanced Trauma Life Support, 11ª edição (2025)
- Rosen's Emergency Medicine, 10th ed
- Tintinalli's Emergency Medicine: A Comprehensive Study Guide

### Via aérea
- Walls Manual of Emergency Airway Management, 5th ed
- Strauss and Mayer's Emergency Department Resuscitation

### Pediatria
- PALS — Pediatric Advanced Life Support (AHA 2020)
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

## 13. Checklist pré-deploy

Verificar **todos** os itens antes de considerar uma ferramenta pronta:

### Estrutura e conteúdo
- [ ] Disclaimer presente e sticky no topo
- [ ] Logo ANY App no header (base64, clicável → hub)
- [ ] Seções colapsáveis iniciam **FECHADAS**
- [ ] Footer com créditos (Gustavo • Gabriela • João Pedro)
- [ ] Conteúdo clínico validado (não inventado)
- [ ] Linguagem **sugestiva** (não imperativa)
- [ ] Medicamentos com nome **genérico** e apresentação da ampola
- [ ] Sentence case em títulos

### Visual e UX
- [ ] Fundo OLED puro (`#000000`)
- [ ] Cores conforme paleta OLED Pure
- [ ] Contraste adequado para leitura
- [ ] Botões com min-height 44px
- [ ] Padding lateral mínimo 16px
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

### Deploy
- [ ] Arquivo nomeado `index.html`
- [ ] ZIP criado com index.html na raiz (sem subpasta)
- [ ] ZIP com método store (`zip -0`)
- [ ] HTML completo (termina com `</html>`)
- [ ] Testado no Netlify Drop
- [ ] URL acessível e funcional

---

## 14. Regulatório (referência rápida)

O ANY App é classificado como **SaMD Classe II** (ANVISA RDC 657/2022), exigindo **notificação** (não registro completo). Pontos-chave:

- Disclaimer obrigatório em todas as ferramentas
- Linguagem não-taxativa (apoio à decisão, não prescrição)
- Não armazenar dados de pacientes na fase atual
- Registro de marca "ANY App" em andamento no INPI

---

## 15. Fluxo de trabalho com Claude

```
1. Gustavo apresenta demanda (nova ferramenta ou ajuste)
2. Brainstorming e discussão de abordagem
3. Claude apresenta esqueleto estrutural para validação
4. Gustavo aprova estrutura (ou ajusta)
5. Claude produz o HTML completo
6. Gustavo testa no navegador (validação visual)
7. Iterações de ajuste (se necessário)
8. Geração do deploy.zip para Netlify
9. Entrega final
```

**Regra:** Nunca pular do passo 1 para o passo 5.

---

## 16. Arquitetura combinada (monolito)

### 16.1 Como funciona

Todas as ferramentas vivem em `HTML segmentados/[NomeDaApp]/index.html`. O script `build_combined.py` combina todos em um unico `index.html` com iframe + `document.write()`.

```
HTML segmentados/
  HUB ANY/index.html
  VM GUIDE/index.html
  AIRWAY GUIDE/index.html
  Infusion Guide/index.html
  TEP GUIDE/index.html
  Seda Path/index.html
  Tox Path/index.html
  Ped Guide/index.html
  Palia Path/index.html
  Block Path/index.html
build_combined.py  --> index.html + deploy/ + .zip
```

### 16.2 Pipeline de build

1. Ler todos os HTMLs
2. Carregar splash logo (JPEG quadrado)
3. Extrair logo PNG do hub, substituir por `__LOGO__` em todos os apps (deduplicacao)
4. Substituir links externos por `parent.loadApp('nome')`
5. Tornar logo clicavel → hub em todos os sub-apps
6. Corrigir funcoes que usam `location.reload()` (quebra iframe)
7. Escapar tudo para template literals JS (backticks, `${}`, `</script>`)
8. Montar HTML combinado com objeto `apps = { hub: \`...\`, vm: \`...\` }`
9. Gerar `index.html`, pasta `deploy/`, e ZIP com deflate

### 16.3 Regras criticas do build

- **Nunca usar `location.reload()`** em sub-apps — quebra a navegacao no iframe. Usar reset de estado manual.
- **Template literals:** Backticks, `${}` e `</script>` devem ser escapados pela funcao `escape_for_template()`.
- **Logo deduplicacao:** O PNG do logo e armazenado uma unica vez como `LOGO_BASE64` no parent. Sub-apps usam placeholder `__LOGO__` substituido em runtime.
- **Navegacao entre apps:** Usar `parent.loadApp('nome')` com `event.preventDefault()`.
- **Deep links:** `parent.loadApp('infusion', 'noradrenalina')` — o segundo parametro e passado para `handleDeepLink()` no app destino.

### 16.4 Splash screen

- Logo quadrado JPEG com animacao de reveal (blur → nitido, 2.2s)
- Creditos: "Gustavo Moreira - Gabriela Feltrin - Joao Pedro Moreira" com fade-in atrasado
- Splash some apos 3s, iframe aparece com fade

### 16.5 Comando de build

```bash
python3 build_combined.py
cp index.html /tmp/anyapp_preview/   # para testar no preview local
```

---

## 17. Padroes de UI consolidados

### 17.1 Zero emojis

Nenhum emoji em nenhum arquivo. Substituir por texto descritivo ou SVG inline. Exemplos de substituicao:
- Icone de parametro: usar texto (`O2`, `PA`, `NC`) ou SVG
- Warning: usar `"!"` em CSS `content` em vez de emoji
- Secoes: usar titulo em texto puro

### 17.2 FAB hamburger menu

Todos os apps tem um FAB (Floating Action Button) no canto inferior direito com menu de navegacao interna.

```css
.fab-menu { position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
.fab-btn { width: 56px; height: 56px; border-radius: 50%; background: #FF5252; border: none; color: white; }
.fab-options { position: absolute; bottom: 70px; right: 0; background: #111; border: 1px solid #333; border-radius: 12px; padding: 8px; display: none; min-width: 200px; }
```

**Regras do FAB:**
- Icone: 3 barras (hamburger) quando fechado, X quando aberto
- Toggle via `toggleFab()` — usa `style.display` (nao classList.toggle)
- **Click-outside-to-close obrigatorio:** `document.addEventListener('click', ...)` que fecha se clique fora do `.fab-menu`
- Em apps com multiplas views (ex: ToxPath), usar `document.querySelector('.app-view.active')` para encontrar o FAB correto — nunca `document.getElementById` com IDs duplicados
- Links do FAB: navegacao interna do app (secoes/modulos)

### 17.3 Selection UI — border-left colorida

Padrao SedaPath para cards de selecao/modulos. Cards com `border-left: 4px solid [cor]` indicando categoria.

```css
.module-card { border-left: 4px solid #FF5252; }
.bl-green { border-left-color: #10B981 !important; }
.bl-blue { border-left-color: #60A5FA !important; }
.bl-red { border-left-color: #FF5252 !important; }
.bl-yellow { border-left-color: #F59E0B !important; }
.bl-purple { border-left-color: #8B5CF6 !important; }
```

**Cuidado com CSS specificity:** Se houver regra global `border-color: #1A1A1A !important`, trocar por `border-top/right/bottom-color` individuais para nao sobrescrever a border-left colorida.

### 17.4 Accordion (secoes mutuamente exclusivas)

Quando apenas uma secao deve ficar aberta por vez: fechar todas antes de abrir a clicada.

```javascript
function toggleCriteria(header) {
    var body = header.nextElementSibling;
    var isOpen = body.classList.contains('open');
    // Fecha todas
    document.querySelectorAll('.criteria-body.open').forEach(function(b) {
        b.classList.remove('open');
        b.parentElement.querySelector('.criteria-chevron').classList.remove('open');
    });
    // Abre a clicada (se estava fechada)
    if (!isOpen) {
        body.classList.add('open');
        header.querySelector('.criteria-chevron').classList.add('open');
    }
}
```

### 17.5 Slide horizontal (transicoes entre paginas)

Para fluxos passo-a-passo, usar `translateX()` em vez de fade simples.

```css
@keyframes slideLeft {
    from { opacity: 0; transform: translateX(60px); }
    to { opacity: 1; transform: translateX(0); }
}
.section { animation: slideLeft 0.3s ease; }
```

### 17.6 Header padrao (sub-apps)

Logo ANY App centralizado, clicavel para voltar ao hub. Sem botao de voltar separado — o logo e o botao de voltar.

```html
<a href="#" onclick="event.preventDefault(); parent.loadApp('hub')" style="cursor:pointer;">
    <img src="__LOGO__" alt="ANY App" style="max-width:280px;width:100%;height:auto;">
</a>
```

---

## 18. Ferramentas integradas no monolito

| Key no `apps` | Pasta | Nome exibido |
|----------------|-------|-------------|
| `hub` | HUB ANY | Hub central |
| `vm` | VM GUIDE | VM Guide |
| `airway` | AIRWAY GUIDE | Airway Guide |
| `infusion` | Infusion Guide | Calculadora de Infusoes |
| `tep` | TEP GUIDE | TEP Guide |
| `seda` | Seda Path | Seda Path |
| `tox` | Tox Path | Tox Path |
| `ped` | Ped Guide | Ped Guide |
| `palia` | Palia Path | Palia Path |
| `block` | Block Path | Block Path |

Para adicionar um novo app:
1. Criar pasta em `HTML segmentados/[Nome]/index.html`
2. Em `build_combined.py`: adicionar read, logo dedup, link fix, logo clickable, escape, apps object
3. Em `HUB ANY/index.html`: adicionar card na grid principal
4. Rebuild e testar

---

## 19. Diluicao padrao pediatrica (Ped Guide)

Tabelas de referencia para diluicao de drogas em infusao continua pediatrica. Tres faixas de peso com diluicoes padronizadas. Fonte: protocolo institucional.

### 19.1 Criancas menores de 15 kg

| Droga | Apresentacao | Droga (mL) | Diluente (mL) | Concentracao | mL/h | Obs |
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
| Rocuronio | 10 | 10 | 40 | 2 mg/mL | Peso x dose x 0,03 | |
| Cisatracurio | 2 | 10 | 40 | 0,4 mg/mL | Peso x dose x 0,15 | |

### 19.2 Criancas 15 a 40 kg (peso ref: 40 kg)

| Droga | Apresentacao | Droga (mL) | Diluente (mL) | Concentracao | mL/h | Obs |
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
| Rocuronio | 10 | 20 | 80 | 2 mg/mL | Peso x dose x 0,03 | |
| Cisatracurio | 2 | 15 | 60 | 0,4 mg/mL | Peso x dose x 0,15 | |

### 19.3 Adulto jovens > 40 kg (peso ref: 50 kg)

| Droga | Apresentacao | Droga (mL) | Diluente (mL) | Concentracao | mL/h | Obs |
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
| Rocuronio | 10 | 50 | 200 | 2 mg/mL | Peso x dose x 0,03 | |
| Cisatracurio | 2 | 50 | 200 | 0,4 mg/mL | Peso x dose x 0,15 | |

---

*Documento preparado para uso com Claude Code*
*Atualizado em Março 2026*
