# Contexto historico — por que a v4

## A v1 (producao)

O monolito v1 esta em `deploy/index.html` (arquivo unico de ~2 MB com 13 ferramentas e Hub inline). HTML+CSS+JS puro. Em producao em https://anyapp.netlify.app desde marco de 2026. **21 usuarios ativos.** Validada por medicos reais em plantoes reais.

**V1 e a referencia visual absoluta.** Nao porque seja tecnologicamente superior — e PIXEL CONSOLIDADO. Cada escolha de cor, padding, border, font-size e conhecimento tacito cristalizado de uso real. Iteracoes v2 e v2.2 quebraram esse visual ao "modernizar" sem respeitar o que ja funcionava.

## A v2 (primeira tentativa de reescrita)

Em `v2/` — React 19 + TypeScript 5.9 + Vite 8 + Tailwind 4.2. Todas as 13 ferramentas portadas. Deployada em https://anyapp-v2-570.netlify.app. Logica clinica foi preservada corretamente, mas o visual tem regressoes vs v1 (home screens diferentes, spacing inconsistente, componentes com feeling proprio em cada pagina).

## A v2.2 (tentativa de polish via handoff Claude Design)

Em `handoff/v2-pre-launch` branch — 30 commits tentando elevar a v2 via handoff do Claude Design. Aplicou 29 de 41 tasks (LAYOUT + BLOCKER + ALTA quick wins + DEBITO subset). Deployada em https://anyapp-v2.netlify.app. **Visualmente regrediu ainda mais que v2.** Bordas ficaram sutis (#222/#333 vs #444 v1), footer virou static, hub ficou descentralizado, badges mudaram estilo. Gustavo reportou: "ta feio, por que/quando/como misturado, coisa horrorosa".

## Licoes aprendidas (CRITICAS para a v4)

1. **V1 e referencia absoluta — nao especulacao.** Se o CLAUDE.md diz que v1 e referencia, respeite sem questionar. O visual do v1 foi validado por uso clinico real. Qualquer "elevacao" deve ser ADITIVA, nao substitutiva.

2. **Handoffs de design tools NAO veem o contexto de producao.** Claude Design produziu um design coerente consigo mesmo mas diferente do v1. Nao tem informacao de "isso quebra padrao do v1". O agente humano deveria ter bloqueado o handoff onde divergia do v1.

3. **Mudanca de tokens globais (bordas, spacing, colors) afeta TODA a app.** Mudar `--color-border` de #444 para #222 parece inocuo, afeta 100% dos componentes. Resultado: visual fica "flutuando sem contorno".

4. **Estrutura informacional importa tanto quanto pixel.** O HEART score (e outras calculadoras) mistura inputs + Calcular + resultado + Por que usar + Quando usar + Dicas + Referencia em um scroll unico. Isso NAO e problema do handoff — e pre-existente. Medico sob pressao nao consegue separar uso clinico de conteudo educacional.

5. **MDCalc funciona** (https://mdcalc.com) — Gustavo sugeriu olhar. Principios: abas separam educacional (antes/depois) do calculo, sem botao Calcular (live update), result box dominante visualmente, row of buttons para inputs.

6. **"V1 + elevacoes pontuais" ganha de "redesign bonito diferente".** A v4 deve seguir isso.

## O que a v4 NAO pode repetir

- Mudar borders, spacing, typography de forma global sem teste visual em cada pagina
- Adotar design de handoff externo sem validar contra v1
- Misturar uso clinico com conteudo educacional em scroll unico
- Remover ancoragens visuais do v1 (footer fixed, logo 280px, disclaimer 40px) sem substituto claro
- Confiar em componentes "melhorados" sem ver o render final em mobile real

## O que a v4 precisa fazer

- Partir do visual do v1 como ponto zero
- Preservar os ganhos clinicos documentados em `PRESERVE.md`
- Reestruturar Calculadoras seguindo principios do MDCalc (ver `VISUAL-GUIDE.md`)
- Aplicar "UX Apple" como elevacao aditiva — so onde cabe, nunca substituindo o que ja funciona
