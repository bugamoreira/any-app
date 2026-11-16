# Handoff — ANY App

Documento de transferência de contexto. Escrito para quem não participou das conversas
anteriores e não tem acesso ao banco nem ao repositório. Dados de 16/11/2026.

---

## 1. O produto

**ANY App** (Anyone, Anything, Anytime) — plataforma de apoio à decisão clínica para
medicina de emergência. SPA em React/TypeScript com 14 ferramentas: árvores de decisão,
pathways clínicos, calculadoras de dose e scores.

- **Regulatório:** SaMD Classe II (ANVISA RDC 657/2022) — exige notificação, não registro
  completo. Marca "ANY App" em registro no INPI.
- **Público:** plantonistas de pronto-socorro, principalmente emergencistas, mas também
  cirurgiões, ortopedistas e clínicos. Acessam **pelo celular durante o plantão**, sob
  pressão e com pouco tempo. 82% do uso é mobile.
- **Equipe:** Gustavo Moreira (CEO, médico emergencista — define conteúdo clínico e aprova
  entregas), Gabriela Feltrin (CFO, médica e cientista de dados), João Pedro Moreira
  (CTO, infraestrutura e deploy).
- **Domínio:** any.app.br. Antes anyapp.netlify.app. Deploy automático Netlify a partir
  de `v2/dist/`.

### Regras de produto que não são negociáveis

Estão no CLAUDE.md do repositório e valem para qualquer colaborador, humano ou IA:

- **Linguagem sugestiva, nunca imperativa.** "Considere carvão ativado", não "administrar
  carvão ativado". "Geralmente não recomendado", não "contraindicado". Isso não é estilo:
  sustenta o enquadramento regulatório de apoio à decisão em vez de prescrição.
- **Zero emoji** em qualquer arquivo. Ícones Lucide no lugar.
- **Nome genérico de medicamento sempre**, com apresentação da ampola.
- **Nunca inventar informação clínica.** Na dúvida, perguntar.
- **Títulos em sentence case**, acentuação rigorosa.
- Seções colapsáveis iniciam **fechadas**. Área de toque mínima de 44px.
- Fluxo de trabalho: brainstorming → esqueleto para validação → só então código.
  Nunca pular direto para a implementação.

---

## 2. Onde o código está — leia antes de tocar em qualquer coisa

Repositório: `github.com/bugamoreira/any-app`

**A branch viva é `v4`. Não é a `main`.** A `main` está 65 commits atrás e não contém
ferramentas que estão em produção.

Esse erro já custou uma rodada de trabalho nesta sessão: comparei o estado só contra
`origin/main`, concluí que produção estava à frente do repositório, e reimplementei um
rastreamento de analytics que já existia em `v4`. Um `git branch -r` no começo teria
evitado. Confira a branch antes de concluir qualquer coisa sobre o que existe ou não.

Branches no remoto: `main`, `v4`, `v2-preview`, `handoff/v2-pre-launch`, mais branches
`claude/*` de sessões anteriores.

### Estrutura

A pasta continua se chamando `v2/` mesmo na branch `v4`.

```
v2/src/
  pages/           14 ferramentas, uma por arquivo, export default, lazy loaded
  components/
    layout/        Disclaimer, Header, Footer, Container, FABMenu, Splash
    common/        Card, Button, Collapsible, Toggle, WeightInput, AlertCard,
                   Modal, Toast, AnswerButton, Breadcrumb, ErrorBoundary
    clinical/      DoseCalculator, StepperNav, calculadoras do Keto
  contexts/        AuthContext, WeightContext, ToastContext, MetronomeContext
  hooks/           useIsMobile, usePageview, useServerCalc
  data/            drugConfigs, calculatorData, paliaData, toxData, vmData
  App.tsx          rotas + PageviewTracker
  index.css        Tailwind v4 @theme — design system OLED Pure
```

**Stack:** React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4.2 (tokens via `@theme`, não
tailwind.config), React Router 7, Supabase JS 2.101.1, Lucide React.

**Design system OLED Pure:** fundo `#000000`, cards `#0A0A0A`, acento `#FF5252`,
texto `#FFFFFF` / `#A0A0A0` / `#666666`, bordas `#222222`. Tokens em `v2/src/index.css`.

**Build e deploy:** `cd v2 && npm run build` (roda `tsc -b && vite build`). Push dispara
Netlify. O lint do projeto acusa 127 problemas pré-existentes — não são regressão, mas
também não foram limpos.

### Ferramentas e rotas

| Rota | Arquivo | Nome |
|---|---|---|
| `/` | Hub.tsx | Hub central |
| `/infusion` | InfusionGuide.tsx | Calculadora de Infusões |
| `/airway` | AirwayGuide.tsx | Airway Guide |
| `/vm` | VmGuide.tsx | VM Guide |
| `/acls` | AclsGuide.tsx | ACLS Guide (com metrônomo) |
| `/ped` | PedGuide.tsx | Ped Guide |
| `/seda` | SedaPath.tsx | Seda Path |
| `/palia` | PaliaPath.tsx | Palia Path |
| `/tep` | TepGuide.tsx | TEP Guide |
| `/shock` | ShockPath.tsx | Shock Path |
| `/tox` | ToxPath.tsx | Tox Path |
| `/dengue` | DenguePath.tsx | Dengue Path |
| `/block` | BlockPath.tsx | Block Path |
| `/calculadoras` | Calculators.tsx | 73 scores |
| — | componentes Keto* | Crises hiperglicêmicas (CAD/EHH) |

---

## 3. Analytics — como funciona e onde está cego

**Supabase**, projeto "ANY App", ref `meatbfomblpicftrzcsy`, região sa-east-1.

### Esquema

```
pageviews   id bigint, user_id uuid (nullable, FK profiles),
            tool text, action text default 'open',
            metadata jsonb (nullable), device text, created_at timestamptz
profiles    id uuid (FK auth.users), email, full_name, avatar_url,
            specialty, created_at, last_seen_at
```

**RLS:** insert em `pageviews` exige `auth.uid() = user_id`; existe política alternativa
aceitando `user_id IS NULL` mas só para o papel `authenticated` — ou seja, **visitante não
logado não consegue gravar evento nenhum**. `profiles` tem select e update próprios e
nenhuma política de insert (linha criada por trigger em auth.users).

### Como o registro acontece

`PageviewTracker` em `App.tsx` chama `usePageview(session ? tool : 'login')`, com o slug
derivado do pathname. Cobre todas as rotas automaticamente.

### O que está cego — isto é o ponto mais importante deste documento

- **`metadata` está nulo em 100% dos 8.231 eventos.** A coluna existe, é `jsonb`, nunca
  foi usada.
- **Só existem três valores de `action`:** `open`, `login`, `session_resume`. Nada
  registra o que acontece *dentro* de uma tela — nenhum cálculo concluído, passo
  abandonado, droga selecionada ou fluxo interrompido.
- Consequência prática: dá para saber que Infusões concentra 61% do uso, e **não** dá para
  saber qual das 16 drogas é aberta. Mesma cegueira em todas as outras.
- **`profiles.specialty` está nulo nos 156 registros.** O campo existe, nunca foi
  preenchido. Não há segmentação por especialidade.
- **125 eventos entre 21 e 24/08/2026 foram gravados sem `user_id`** — decisão de LGPD,
  revertida em 23/08. Não entram em nenhuma contagem por pessoa.
- **`last_seen_at` ficou congelado entre 30/08 e ~10/09**, porque a versão do hook em
  produção parou de atualizar o campo. Voltou depois. Para medir atividade, prefira
  `pageviews`, que nunca parou.
- **Não há guarda contra disparo duplo no hook** e o `main.tsx` usa `<StrictMode>`:
  cada `npm run dev` grava evento em dobro. Desenvolvimento polui o dado de produção,
  e não há marcação que permita separar.

### Onde instrumentar, se for mexer em uma coisa só

Em `v2/src/pages/InfusionGuide.tsx` existe um único ponto onde o usuário escolhe a droga:
`setOpenDrug`, chamado nas linhas 129, 155 e 181. Registrar ali com
`metadata: { drug: drug.id }` responde "o que é mais usado dentro de Infusões".

Não precisa de migração: a coluna `jsonb` já existe e a política de RLS só valida o
`user_id`. É mudança client-side pura. Nessa taxa de uso, duas semanas dariam cerca de
150 aberturas de droga — suficiente para ler concentração.

---

## 4. Números atuais (16/11/2026)

| | |
|---|---|
| Usuários cadastrados | 156 |
| Aberturas registradas | 8.231 |
| Aberturas no Hub | 4.514 (55% de tudo) |
| Aberturas em ferramentas | 2.456 (30%) |
| Ativos em 30 dias | 76 (recorde da série) |
| Mobile | 82% (últimos 60 dias) |
| Primeiro evento | 30/03/2026 |

### Por ferramenta

Alcance = % dos 156 usuários que já abriram. Retorno = dos que abriram, % que voltou em
outro dia. Tendência compara os últimos 30 dias com os 30 anteriores.

| Ferramenta | Aberturas | Usuários | % da base | Ab./usuário | Retorno | 30d | 30d ant. | Mobile |
|---|---|---|---|---|---|---|---|---|
| Infusões | 1.507 | 103 | 66% | 14,6 | 59% | 347 | 258 | 89% |
| Airway | 142 | 55 | 35% | 2,6 | 35% | 41 | 13 | 88% |
| VM | 79 | 43 | 28% | 1,8 | 21% | 18 | 7 | 81% |
| ACLS | 83 | 37 | 24% | 2,2 | 19% | 19 | 5 | 83% |
| Seda | 67 | 34 | 22% | 2,0 | 32% | 14 | 7 | 88% |
| Palia | 57 | 33 | 21% | 1,7 | 12% | 14 | 2 | 79% |
| Ped | 87 | 32 | 21% | 2,7 | 34% | 13 | 7 | 78% |
| TEP | 55 | 30 | 19% | 1,8 | 33% | 9 | 6 | 78% |
| Calculadoras | 111 | 29 | 19% | 3,8 | 59% | 46 | 17 | 78% |
| Shock | 71 | 29 | 19% | 2,4 | 34% | 19 | 3 | 85% |
| Tox | 55 | 28 | 18% | 2,0 | 29% | 9 | 2 | 78% |
| Dengue | 59 | 25 | 16% | 2,4 | 20% | 21 | 1 | 80% |
| Keto | 46 | 22 | 14% | 2,1 | 27% | 21 | 4 | 87% |
| Block | 37 | 22 | 14% | 1,7 | 14% | 9 | 5 | 62% |

### Leituras que importam

**Infusões é o produto, não uma das ferramentas.** 61% de todo o uso de ferramentas, 103
dos 156 usuários, 14,6 aberturas por pessoa contra 3,8 da segunda colocada, e é a primeira
ferramenta que 55% dos usuários novos abrem. Qualquer priorização que trate as 14 como
pares está errada.

**Calculadoras tem o mesmo retorno de Infusões (59%) com um terço do alcance.** Quem acha,
volta. O gargalo é descoberta, não qualidade — o que aponta para o Hub.

**O Hub consome 55% de todo o tráfego.** Quase duas aberturas de Hub para cada abertura de
ferramenta. Isso é navegação, não uso.

**Retenção é estável e medíocre.** Quatro medições ao longo de três meses: 41,8%, 42,3%,
43,0%, 41,2% dos usuários usaram em um único dia e não voltaram. É platô estrutural, não
deterioração. O que melhorou: dos usuários que entraram no último mês, 49% voltaram num
segundo dia, contra 35% no mês anterior.

**Block é a única ferramenta majoritariamente fora do celular** (62% mobile contra 82% da
média). Pode indicar consulta de técnica na mesa, não à beira do leito.

### O que esses números não dizem

Ler "retorno baixo" como "ferramenta ruim" vai priorizar errado:

- Nada registra conclusão ou abandono dentro da tela. Quem abriu, resolveu e nunca mais
  precisou gera o mesmo dado de quem abriu, não entendeu e desistiu.
- **Consulta recorrente e classificação única não se comparam.** Infusões é aberta toda vez
  que alguém prepara uma droga — retorno alto é da natureza dela. Dengue classifica o
  paciente uma vez e acabou; TEP calcula o Wells e a decisão está tomada. Retorno baixo
  nessas pode ser a ferramenta funcionando como deveria.
- Palia com 12% é ambíguo: ferramenta ruim, ou cuidado paliativo aparece pouco no PS? O
  dado atual não separa as hipóteses, e a diferença muda o que fazer.

---

## 5. Matriz de priorização do refactor

Publicada como página em https://claude.ai/artifact/Rpor4dHMAGAzYnyZGEdEqL
(privada — precisa ser compartilhada para terceiros abrirem).

Cruza alcance contra retorno, cortando nas medianas das próprias ferramentas (20% de
alcance, 30% de retorno), o que divide as 14 em quatro grupos de tamanho parecido:

- **O motor** (alto alcance, alto retorno): Infusões, Airway, Ped, Seda
- **Vazamento** (alto alcance, baixo retorno): VM, ACLS, Palia
- **Pouco achadas** (baixo alcance, alto retorno): Calculadoras, Shock, TEP
- **Cauda**: Tox, Keto, Dengue, Block

### Ordem sugerida

1. **Infusões** — não por estar ruim, por não poder quebrar. É onde vale estabelecer a
   cobertura de teste e o padrão que as outras treze herdam.
2. **Hub** — maior volume do app e gargalo de descoberta.
3. **VM, ACLS e Palia** — os três piores retornos; maior ganho demonstrável.
4. **Calculadoras: não mexer.** Está funcionando; refatorar é risco sem contrapartida. O
   que ela precisa é lugar no Hub, já coberto no item 2.
5. **As outras oito em lote**, aplicando o padrão do item 1.

---

## 6. Decisões em aberto

**Modal de feedback — desenhado, não construído.** Objetivo: perguntar aos usuários se
estão gostando, agradecer e se colocar à disposição. Esqueleto acordado: modal (não card)
que aparece só no Hub, nunca dentro de uma ferramenta, para quem já usou em dois dias ou
mais; três botões de resposta mais um "Agora não" discreto; depois da resposta, campo de
texto opcional e botão que abre o WhatsApp do Gustavo (link já existe em `Hub.tsx:147`);
grava em tabela nova `feedback` com a mesma RLS de `pageviews`. Pendência: nada escrito.

**Notificação push — avaliada e descartada como primeiro passo.** O app é PWA instalável
(manifest completo, ícones 192/512) mas **não tem service worker registrado** — só existe
um dentro de `/public/hetrinped/`, que é outro app. Sem service worker não há push. Dois
motivos para não começar por aí: push só alcança quem já autorizou, e para autorizar a
pessoa precisa estar no app — ou seja, não alcança quem sumiu, que é justamente quem mais
interessa ouvir. E no iOS só funciona para quem instalou na tela de início. O modal é
pré-requisito da notificação, não alternativa: é nele que se pede a permissão.

**E-mail para os inativos.** 77 usuários sem acesso há mais de 30 dias. São os que o modal
nunca alcança. Todos têm e-mail do login Google. Não feito.

**Instrumentar Infusões.** Proposto, local exato identificado (seção 3). Não feito.

---

## 7. Nome da IA — estado do brainstorm

Está sendo criado um **copiloto clínico de IA** dentro do ANY. Busca-se nome com "IA"
embutido, no padrão de SophIA — reconhecido pelo próprio Gustavo como batido.

### Três objeções ao padrão

1. **O trocadilho morre na fala.** SophIA e Sofia são idênticos no ouvido. A piada só
   existe escrita, e o produto vive falado.
2. **Nome próprio feminino transforma copiloto em secretária.** Alexa, Siri, Cortana: IA
   feminizada é assistente de serviço. Registro errado para uma ferramenta cuja resposta
   tem consequência clínica.
3. **Briga com a marca-mãe.** ANY é curto, abstrato, três letras, sem gênero e sem persona.

### Correção de rota no meio da discussão

A primeira proposta foi abandonar o nome de pessoa e usar palavra que já termina em -ia
de verdade (VIA, VigIA, EvidêncIA, PrudêncIA, GuIA), para o IA virar significado em vez
de trocadilho. **Essa proposta foi descartada**: ela responde a pergunta errada.

Nome abstrato serve para recurso ("abra a VIA"). O que está sendo criado é **avatar** —
personagem com rosto, que cumprimenta e responde. Personagem com nome de substantivo
comum soa como produto fingindo ser gente. Para avatar, nome de pessoa conecta mais rápido
e sobrevive melhor na fala do plantão.

Da objeção original sobrevive só uma parte, mais estreita: **o clichê não é nome de
pessoa, é nome de mulher.** Alexa, Siri, Cortana, SophIA, Lívia, Letícia — IA feminizada
virou o padrão de assistente de serviço. Trocar o gênero descliva mais do que trocar a
palavra, e muda o registro de "atendente" para "colega".

### Candidatos atuais

- **Elias** (recomendação principal) — masculino, brasileiro, IA no meio (El**IA**s), som
  de colega sênior: alguém que se consulta no plantão, não alguém que executa tarefa. Em
  medicina de emergência o registro certo é esse — o copiloto não obedece, opina. Grafia
  pode ficar limpa, com o IA aparecendo só na marca quando interessar.
- **Lia** (segunda) — três letras, mesma escala do ANY, par visual quase perfeito. Nome
  real em português e, por acaso, **"lia" é o pretérito de ler**: a IA que leu o caso, leu
  a evidência. Duplo sentido que funciona falado, diferente de trocadilho de maiúscula.
  Contra: continua feminino e curto-fofo, perto do padrão a evitar.
- **Matias** — masculino mais macio que Elias.

A evitar: Sofia, Júlia, Letícia, Lúcia, Patrícia, Cecília. Não por serem ruins — por serem
exatamente o conjunto que todo mundo já usou.

### Cuidado que vale mais que o nome

O ANY é SaMD Classe II, com disclaimer de "não substitui o julgamento clínico" em toda
tela e linguagem deliberadamente sugestiva. **Um avatar realista com cara de médico,
jaleco e estetoscópio trabalha contra isso**: sugere que a coisa pratica medicina e
convida excesso de confiança justamente no público que não se quer que desligue o
julgamento.

A combinação que funciona é **nome humano com forma claramente não-humana** — algo
abstrato e geométrico, que reaja mas não finja ser pessoa, construído a partir do preto e
do `#FF5252` que já existem. O nome cria o vínculo; a forma mantém honesto o que a coisa
é. É também a diferença entre um avatar que envelhece bem e um que vira constrangimento
em dois anos.

### Alerta de registro

Nomes próprios comuns (Elias, Lia, Matias) são registráveis como marca, mas em classe de
software e saúde a chance de colidir com registro existente é real — Lia, por ser curto e
genérico, mais ainda. Vale busca no INPI antes de virar logo, já que o ANY App está com
registro em andamento. Substantivos comuns como "Via" ou "Guia" seriam piores: marca
nominativa difícil ou impossível, dependendo de figurativa ou de composição.

### Três perguntas que decidem

1. ~~Personagem ou recurso?~~ **Respondido: é personagem, com avatar.** Por isso nome de
   pessoa, e por isso a primeira proposta caiu.
2. Vai aparecer sozinho ou sempre colado em ANY? Composição ajuda no registro de marca.
3. Entra antes da decisão, junto com ela, ou revisando depois? Muda a personalidade do
   personagem — quem abre caminho, quem acompanha, ou quem confere.
4. Gênero está definido? É a decisão que mais separa o resultado do lugar-comum.

### Marca visual

Existe um artifact de Design System em
https://claude.ai/artifact/RFtB7F5SZdEnvpPqETGWik — publicado fora da organização, o
conteúdo carrega em runtime e não foi possível lê-lo. Quem for continuar precisa pedir os
tokens exportados. O que se sabe vem do `index.css`: OLED Pure, preto puro, acento
`#FF5252`.

---

## 8. Consultas úteis

Projeto Supabase `meatbfomblpicftrzcsy`.

```sql
-- panorama
select
  (select count(*) from profiles) usuarios,
  (select count(*) from pageviews) pv_total,
  (select count(distinct user_id) from pageviews
     where created_at >= now() - interval '30 days') ativos_30d,
  (select max(created_at) from pageviews) ultimo_evento;

-- por ferramenta, com alcance e retorno
with base as (select count(*)::numeric n from profiles),
t as (select tool, count(*) pv, count(distinct user_id) alcance,
             count(*) filter (where created_at >= now() - interval '30 days') pv_30d
      from pageviews where tool not in ('hub','login') group by 1),
volta as (select tool, count(*) filter (where vezes >= 2) voltaram, count(*) total
          from (select tool, user_id, count(distinct created_at::date) vezes
                from pageviews where tool not in ('hub','login') and user_id is not null
                group by 1,2) x group by 1)
select t.tool, t.pv, t.alcance,
       round(100.0*t.alcance/(select n from base),0) pct_base,
       round(100.0*v.voltaram/nullif(v.total,0),0) pct_voltou, t.pv_30d
from t join volta v using (tool) order by t.alcance desc;

-- retenção
with d as (select user_id, count(distinct created_at::date) dias, max(created_at) ultimo
           from pageviews where user_id is not null group by 1)
select count(*) usuarios,
       count(*) filter (where dias=1) um_dia_so,
       count(*) filter (where dias>=5) cinco_mais,
       count(*) filter (where ultimo < now() - interval '30 days') sumidos_30d
from d;

-- atenção: medir atividade por pageviews, não por profiles.last_seen_at,
-- que ficou congelado entre 30/08 e 10/09/2026
```

---

## 9. Para quem pegar daqui

Antes de concluir qualquer coisa sobre o estado do código, confirme a branch (`v4`) e rode
`git branch -r`. Antes de tratar um número de retorno como qualidade de ferramenta, leia a
seção 4. Antes de propor instrumentação nova, confira que `metadata` continua nulo — se
alguém tiver implementado o evento de Infusões, metade das perguntas abertas aqui já tem
resposta.

E siga o fluxo do CLAUDE.md: discussão e esqueleto antes de código. O Gustavo valida
conteúdo clínico e aprova entrega; não assuma conduta médica em nenhuma hipótese.
