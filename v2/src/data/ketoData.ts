/**
 * KetoPath — dados clinicos das crises hiperglicemicas (CAD e EHH).
 *
 * TODO o conteudo abaixo vem da spec `ketopath-spec.md` v1.0.0, validada pelo
 * Gustavo. Os textos marcados como TEXTO: na spec vao para a tela LITERALMENTE
 * — nao reescrever, nao resumir, nao "melhorar".
 *
 * Fontes e a hierarquia entre elas:
 *   [ADA]  Umpierrez GE et al. Diabetologia 2024;67:1455-1479 (CC BY 4.0)
 *   [UTD]  UpToDate — DKA in adults: Treatment / HHS in adults: Treatment
 *   [JBDS] Joint British Diabetes Societies — CAD 2022, EHH 2023
 *   [LIT]  literatura primaria citada no ponto
 *
 * Onde [ADA] e [UTD] divergem, PREVALECE [UTD]. Onde o UpToDate e silente,
 * usa-se [ADA]. Decisao da spec, tomada para o algoritmo ficar auditavel.
 */

export type Trilha = 'cad' | 'ehh' | 'misto'
export type Gravidade = 'leve' | 'moderada' | 'grave' | null
export type Cetonuria = '0' | '1+' | '2+' | '3+' | '4+'
export type Consciencia = 'alerta' | 'sonolento' | 'estupor-coma'

/** Rodape obrigatorio em qualquer tela que exiba potassio ou bicarbonato. */
export const NOTA_UNIDADES =
  'Para íons monovalentes como potássio e bicarbonato, 1 mEq/L equivale a 1 mmol/L. [UTD]'

// ─────────────────────────────────────────────────────────── 1. RECONHECIMENTO

export const QUANDO_SUSPEITAR = [
  'Sintomas comuns às duas condições: poliúria, polidipsia, perda de peso, vômitos, desidratação e alteração do estado cognitivo. [ADA]',
  'Na CAD, o intervalo entre os primeiros sintomas e a apresentação aguda costuma ser de horas a poucos dias. No EHH, pode levar dias a semanas. [ADA]',
  'Respiração de Kussmaul — inspirações profundas, com hálito cetônico — reflete a compensação respiratória da acidose metabólica. [ADA]',
  'Náusea, vômito e dor abdominal aparecem em mais da metade dos casos de CAD, mas são incomuns no EHH. [ADA]',
]

export const ALERTA_DOR_ABDOMINAL =
  'Atenção à dor abdominal. Pode ser consequência da própria CAD ou sinal de uma causa precipitante. Se não melhorar com a correção da desidratação e da acidose, considere investigação adicional. [ADA]'

export const CAD_EUGLICEMICA = [
  'Glicemia normal não descarta CAD.',
  'Cerca de 10% dos casos de CAD se apresentam com glicemia abaixo de 200 mg/dL. [ADA]',
  'Situações associadas: uso de inibidores de SGLT2, gestação, jejum prolongado, redução da ingesta alimentar, uso de álcool, insuficiência hepática e aplicação prévia de insulina. [ADA]',
  'Em uma série de pacientes em uso de inibidores de SGLT2 que apresentaram CAD, 35% tinham glicemia abaixo de 200 mg/dL. Em outra, 71% tinham glicemia igual ou inferior a 250 mg/dL. [ADA]',
]

/** Criterios D-K-A. Os tres componentes precisam estar presentes. [ADA] */
export const CRITERIOS_CAD = [
  { eixo: 'D — diabetes ou hiperglicemia', criterio: 'Glicemia ≥200 mg/dL ou história prévia de diabetes, independentemente da glicemia' },
  { eixo: 'K — cetose', criterio: 'Cetonúria ≥2+ ou BHB ≥3,0 mmol/L (BHB indisponível neste serviço)' },
  { eixo: 'A — acidose', criterio: 'pH venoso <7,3 e bicarbonato <18 mEq/L [UTD]' },
]

export const NOTA_CRITERIOS_CAD =
  '[ADA] aceita pH <7,30 ou bicarbonato <18. O KetoPath segue [UTD], conforme a hierarquia de fontes.'

export const NOTA_GASOMETRIA =
  'A gasometria venosa é suficiente para a avaliação ácido-base. Não é necessária amostra arterial. [JBDS]'

export const DISCORDANCIA_CETONURIA = [
  'A cetonúria pode enganar nas duas direções.',
  'O teste com nitroprussiato detecta acetoacetato, não beta-hidroxibutirato — que é o principal cetoácido produzido na CAD. [ADA]',
  'No início do quadro, a cetonúria SUBESTIMA a gravidade, porque a formação de acetoacetato é mais lenta. Uma cetonúria fraca não descarta CAD. [ADA]',
  'Na fase tardia, SUPERESTIMA: conforme a acidose melhora, o beta-hidroxibutirato é convertido em acetoacetato, e a cetonúria pode piorar enquanto o paciente melhora. Por isso a cetonúria não deve ser usada como critério de resolução. [ADA]',
  'Captopril e valproato podem gerar falso-positivo no teste de nitroprussiato. [ADA]',
]

export const SOBREPOSICAO_CAD_EHH = [
  'A sobreposição entre CAD e EHH aparece em mais de um terço dos casos de crise hiperglicêmica. [ADA]',
  'Em um estudo americano, 38% das internações por crise hiperglicêmica foram por CAD, 35% por EHH e 27% por quadro misto. [ADA]',
  'A mortalidade hospitalar é maior no quadro misto: 8%, contra 5% no EHH e 3% na CAD. [ADA]',
]

/**
 * Criterios do EHH — REFERENCIA de consulta, nao classificacao automatica.
 * A figura 2b do consenso ADA nao e extraivel em texto; estes valores vem de
 * [JBDS] e foram validados por Gustavo Moreira. "Sem cetonemia significativa"
 * nao e computavel sem BHB, por isso a bifurcacao e escolha manual.
 */
export const CRITERIOS_EHH = [
  'Glicemia ≥540 mg/dL (30 mmol/L)',
  'Osmolaridade ≥320 mOsm/kg',
  'Sem cetonemia significativa',
  'pH >7,3 e bicarbonato ≥15 mEq/L',
]

export const NOTA_EHH =
  'Embora a maioria dos pacientes com EHH tenha pH ≥7,30 e bicarbonato ≥18 mEq/L na admissão, pode haver cetonemia leve. [ADA]'

export const NOTA_GRAVIDADE =
  'Nem todas as variáveis precisam estar presentes para definir a gravidade. O local de internação e o nível de cuidado são, em última análise, decisão clínica. [ADA]'

export const DIAGNOSTICO_DIFERENCIAL = [
  'Cetose de jejum — sugerida por ingesta alimentar abaixo de 500 kcal/dia, que reduz a concentração de insulina e leva à produção de cetonas. [ADA]',
  'Cetoacidose alcoólica — pessoas com uso crônico de etanol e episódio recente de ingesta intensa, seguido de vômitos e jejum, podem desenvolver cetoacidose com ou sem hiperglicemia. [ADA]',
  'Cetose da gestação e hiperêmese — os vômitos elevam os hormônios contrarregulatórios e predispõem à formação de cetonas. [ADA]',
]

// ────────────────────────────────────────────────────────── 2. EXAMES INICIAIS

export const PAINEL_INICIAL = [
  'Glicemia',
  'Eletrólitos séricos',
  'Gasometria venosa',
  'Hemograma completo',
  'Cetonas — sangue ou urina',
  'Eletrocardiograma',
]

export const NOTA_ECG =
  'Permite avaliar alterações de repolarização de origem bioquímica, como ondas T apiculadas na hipercalemia, e sinais de isquemia. [ADA]'

export const AVALIACAO_VOLEMIA = [
  'Taquicardia e hipotensão sugerem hipovolemia grave.',
  'Atenção: alguns pacientes mantêm estabilidade hemodinâmica apesar da depleção, porque a hipertonicidade da hiperglicemia desloca água do intracelular para o extracelular. [ADA]',
]

export const EXAMES_CONFORME_SUSPEITA = [
  { exame: 'Culturas e radiografia de tórax', gatilho: 'Suspeita de infecção' },
  { exame: 'Troponina', gatilho: 'Suspeita de isquemia miocárdica' },
  { exame: 'Amilase e lipase', gatilho: 'Dor abdominal persistente' },
  { exame: 'Enzimas hepáticas', gatilho: 'Suspeita de hepatopatia' },
  { exame: 'Beta-hCG', gatilho: 'Mulheres em idade fértil' },
]

// ──────────────────────────────────────────────────────────── 3. CALCULADORAS

export const NOTA_ANION_GAP =
  'O ânion-gap não é recomendado como critério diagnóstico ou de resolução de primeira linha, porque pode ser distorcido pela acidose hiperclorêmica que surge com grandes volumes de salina. Mantém utilidade em cenários onde a dosagem de cetonas não está disponível. [ADA]'

export const NOTA_SODIO_CORRIGIDO =
  'Fonte: UpToDate (fator 2,0). O consenso ADA 2024 utiliza fator 1,6. O KetoPath adota o fator 2,0 por coerência com o corte de 135 mEq/L usado na decisão de tonicidade, que vem da mesma fonte.'

export const NOTA_DEFICIT_AGUA =
  'O déficit calculado é uma estimativa para orientar o planejamento. A reposição deve ser guiada pela resposta clínica e pela velocidade de queda da osmolaridade.'

// ────────────────────────────────────────────────────────────────── 4. MANEJO

export const FLUIDO_INICIAL = [
  'Considere iniciar cristaloide isotônico — salina 0,9% ou cristaloide balanceado — a 1 L por hora. [UTD]',
  'Avalie a causa precipitante em paralelo. [UTD]',
]

export const PREFERENCIA_FLUIDO =
  'Preferência do KetoPath: Ringer lactato. Salina 0,9% é alternativa plenamente aceitável.'

/** Fase A — estratificacao pelo estado volemico. [UTD] */
export const ESTADOS_VOLEMICOS = [
  {
    id: 'grave',
    label: 'Hipovolemia grave, sem choque',
    conduta: 'Salina 0,9% ou cristaloide balanceado, aproximadamente 1 L/h, com ritmo ajustado pela avaliação clínica',
    extra: null as string | null,
  },
  {
    id: 'leve',
    label: 'Hipovolemia leve',
    conduta: 'Salina 0,9% ou cristaloide balanceado, ritmo definido pela avaliação clínica',
    // Este e o cenario da CAD euglicemica: a dextrose entra na largada, nao depois.
    extra: 'Se a glicemia inicial já estiver abaixo de 250 mg/dL, considere acrescentar dextrose a 5% ou 10% ao fluido desde o início do tratamento. [UTD]',
  },
  {
    id: 'cardiogenico',
    label: 'Choque cardiogênico',
    conduta: 'Monitorização hemodinâmica e vasopressor',
    extra: null as string | null,
  },
]

export const ALERTA_SOBRECARGA =
  'Cautela na reposição rápida em pessoas com risco de sobrecarga: idosos, gestantes e pacientes com doença cardíaca ou renal. Nesses casos, considere bolus menores, de 250 mL, com reavaliação hemodinâmica frequente. [ADA]'

export const REAVALIACAO_EXPANSAO = [
  'Reavalie o estado volêmico e de hidratação.',
  'A correção do déficit de volume pode ser planejada para as primeiras 24 horas. [UTD]',
  'Corrigido o déficit, o fluido subsequente pode ser ajustado pelo sódio sérico. [UTD]',
]

/** Fase B — manutencao governada pelo sodio corrigido. [UTD] */
export const FASE_B = {
  abaixo135: 'Salina 0,9% (isotônica), 250–500 mL/h',
  acima135: 'Salina 0,45% (meio-isotônica), 250–500 mL/h — para ofertar água livre',
}

export const GATILHO_DEXTROSE = [
  'Quando a glicemia cair abaixo de 250 mg/dL, considere mudar para dextrose a 5% ou 10% com salina a 0,45%, a 150–250 mL/h. [UTD]',
  'Isso previne hipoglicemia e permite manter a insulina até a correção da cetoacidose. [ADA]',
]

export const NOTA_VEICULO_DEXTROSE =
  'No algoritmo do UpToDate, a partir deste ponto o veículo passa a ser a salina a 0,45%, independentemente do que vinha sendo usado.'

export const EHH_VELOCIDADES = [
  'No EHH, a hiperglicemia costuma se resolver em 8 a 10 horas. [ADA]',
]

export const EHH_LIMITES = [
  'Queda da glicemia: não exceder 90–120 mg/dL por hora',
  'Queda do sódio sérico: não exceder 10 mEq/L em 24 horas',
  'Queda da osmolaridade: manter entre 3,0 e 8,0 mOsm/kg por hora',
]

export const EHH_ALERTA_SODIO =
  'A reposição inicial reduz glicemia e osmolaridade, deslocando água para o intracelular — o que pode elevar o sódio sérico. Uma redução de 100 mg/dL na glicemia eleva o sódio em cerca de 1,6 mEq/L. Essa elevação inicial é esperada. [ADA]'

export const EHH_DEFICIT_VOLUME = [
  'As perdas de fluido no EHH são estimadas entre 100 e 220 mL/kg. [JBDS]',
  'Cautela em idosos. A estimativa orienta o planejamento; a reposição deve ser guiada pela resposta clínica e pela velocidade de queda da osmolaridade.',
]

// ── 4.2 Potassio (GATE) ──────────────────────────────────────────────────────

export const POTASSIO_INTRO = [
  'A depleção corporal total de potássio na CAD é de 3 a 6 mmol/kg, por diurese osmótica prolongada, vômitos e hiperaldosteronismo. Mesmo assim, a maioria dos pacientes chega com potássio sérico normal ou elevado, porque a acidose e a deficiência de insulina deslocam o potássio para o extracelular. [ADA]',
  'A insulina, a correção da acidose, a expansão volêmica e o aumento da caliurese fazem o potássio cair. Nas primeiras 48 horas, a queda típica é de 1 a 2 mEq/L. [ADA]',
]

/** Gate anterior a tabela de condutas. */
export const GATE_FUNCAO_RENAL =
  'Confirme função renal adequada antes de repor potássio: débito urinário de aproximadamente 50 mL/h ou mais. [UTD]'

/** Conduta por faixa. [UTD] */
export const POTASSIO_FAIXAS = [
  { id: 'baixo',  faixa: '<3,5 mEq/L',      conduta: 'Adiar a insulina. Repor 10 a 20 mEq de KCl por hora até o potássio ultrapassar 3,5 mEq/L' },
  { id: 'alvo',   faixa: '3,5 a 5,0 mEq/L', conduta: 'Adicionar 10 a 20 mEq de KCl a cada litro de fluido, mantendo o potássio entre 4 e 5 mEq/L' },
  { id: 'alto',   faixa: '>5,0 mEq/L',      conduta: 'Não repor. Dosar o potássio a cada 2 horas' },
]

export const POTASSIO_ALERTA_BAIXO = [
  'Potássio baixo ou no limite inferior está presente na admissão em 5 a 10% dos casos de CAD. Iniciar insulina nessa situação pode levar a arritmia com risco de vida e fraqueza da musculatura respiratória. [ADA]',
  'Hipocalemia grave, igual ou abaixo de 2,5 mEq/L, durante o tratamento da CAD e do EHH foi associada a aumento de três vezes na mortalidade. [ADA]',
]

export const POTASSIO_MONITORIZACAO = [
  'Considere dosar o potássio 2 horas após o início da insulina e, depois, a cada 2 a 4 horas até a estabilização. [UTD]',
  'Com potássio acima de 5,0 mEq/L, dose a cada 2 horas antes de iniciar reposição. [UTD]',
]

/** Apresentacoes disponiveis no servico. mEq por ampola de 10 mL. */
export const KCL_APRESENTACOES = [
  { id: '10',   label: 'KCl 10%',   descricao: '1 g → ~13,4 mEq',    mEqPorAmpola: 13.4, mlPorAmpola: 10 },
  { id: '19.1', label: 'KCl 19,1%', descricao: '1,91 g → ~25,6 mEq', mEqPorAmpola: 25.6, mlPorAmpola: 10 },
]

/** Limites de concentracao — norma institucional. */
export const KCL_VIAS = [
  { id: 'periferica', label: 'Acesso periférico',      maxMEqPorLitro: 50 },
  { id: 'central',    label: 'Acesso venoso central',  maxMEqPorLitro: 100 },
]

export const KCL_VELOCIDADE = [
  'Na hipocalemia com potássio abaixo de 3,5 mEq/L, a reposição sugerida é de 10 a 20 mEq por hora, até que o potássio ultrapasse 3,5 mEq/L. [UTD]',
  'A reposição a velocidades acima de 20 a 30 mEq/h raramente é necessária. [UTD]',
]

export const KCL_MONITORIZACAO =
  'Bomba de infusão e monitorização contínua para todos os pacientes em CAD (norma institucional).'

/** Dispara quando a velocidade de reposicao ultrapassa 20 mEq/h. */
export const KCL_EFEITO_OSMOTICO = [
  'Sais de potássio têm efeito osmótico equivalente aos sais de sódio. Adicionar potássio a um fluido isotônico gera uma solução hipertônica. [UTD]',
  'Quando a reposição de potássio for alta, considere adicionar o cloreto de potássio à salina meio-isotônica (0,45%) em vez da isotônica (0,9%). [UTD]',
]

// ── 4.3 Insulina (bloqueada ate o potassio ser informado) ────────────────────

/**
 * Texto do bloqueio ativo quando K <3,5.
 * A spec traz este texto citando [ADA] com "10 mmol/h", mas a tabela 4.2 adota
 * [UTD] com 10 a 20 mEq/h e a hierarquia da propria spec resolve a favor do
 * UpToDate. Gustavo decidiu alinhar em mEq/h — o valor abaixo reflete isso.
 */
export const INSULINA_BLOQUEIO_ATIVO =
  'Potássio abaixo de 3,5 mEq/L. Considere adiar a insulina até que o potássio ultrapasse 3,5 mEq/L, repondo a 10 a 20 mEq/h. [UTD]'

export const INSULINA_GATE_VAZIO = 'Informe o potássio para liberar esta seção'

export const INSULINA_PREPARO =
  'Preparo padrão: 100 unidades de insulina regular em 100 mL de salina 0,9%, resultando em 1 U/mL.'

export const INSULINA_PURGA = [
  'Antes de conectar ao paciente, considere desprezar 20 mL da solução pelo equipo.',
  'A insulina adsorve ao plástico do equipo. Sem purga, a dose entregue fica cerca de 16% abaixo do previsto. Após 20 mL de purga, a concentração se torna indistinguível do valor máximo — purgar mais do que isso é desperdício. [LIT: Goldberg PA et al., Diabetes Technol Ther 2006]',
  'Não é necessário aguardar tempo de repouso. Após a purga, a infusão pode ser iniciada imediatamente. [LIT: Thompson CD et al., Diabetes Technol Ther 2012]',
]

export const INSULINA_PURGA_NOTA =
  'Na diluição de 1 U/mL, os 20 mL de purga correspondem a 20 unidades.'

export const INSULINA_DOSES = [
  { situacao: 'CAD',                        velocidade: '0,1 U/kg/h, sem bolus', taxa: 0.1 },
  { situacao: 'EHH sem cetose significativa', velocidade: '0,05 U/kg/h',          taxa: 0.05 },
  { situacao: 'Misto CAD-EHH',              velocidade: '0,1 U/kg/h',            taxa: 0.1 },
  { situacao: 'Após glicemia <250 mg/dL',   velocidade: 'Reduzir para 0,05 U/kg/h', taxa: 0.05 },
]

export const INSULINA_TEXTOS = [
  'A insulina de ação curta por infusão intravenosa contínua é a via preferida. Considere infusão de taxa fixa a 0,1 U/kg/h. [UTD]',
  'Insulina regular e análogos de ação rápida são igualmente eficazes por via intravenosa no tratamento da CAD. A insulina regular costuma ser preferida pela disponibilidade semelhante e custo bem menor. [UTD]',
  'Se o início da infusão for retardado — por dificuldade de acesso venoso, por exemplo — pode ser considerado um bolus de insulina regular de 0,1 U/kg, por via intravenosa ou intramuscular, seguido da infusão contínua. [UTD]',
]

export const INSULINA_TEXTO_EHH = [
  'No EHH sem cetose significativa e sem acidose, considere infusão de taxa fixa a 0,05 U/kg/h. Se houver cetonemia significativa — o que caracteriza quadro misto CAD-EHH — considere 0,1 U/kg/h. [ADA]',
  'Alguns autores recomendam adiar a insulina até que a glicemia pare de cair apenas com a reposição volêmica, para evitar queda rápida da osmolaridade. [ADA]',
]

export const INSULINA_APOS_REDUCAO =
  'Após a redução, a infusão pode ser ajustada para manter a glicemia em torno de 200 mg/dL, e mantida até a resolução da cetoacidose. [ADA]'

export const INSULINA_BOMBA_ATIVA = [
  'HGT a cada 1 hora enquanto a bomba de insulina estiver rodando.',
  'Confira também a vazão programada e o volume já infundido a cada verificação. Bombas param — por oclusão, bolsa vazia ou alarme silenciado — e a interrupção pode passar despercebida entre uma checagem e outra.',
]

export const INSULINA_BASAL = [
  'Em pessoas que já usavam insulina basal ou basal-bolus antes da admissão, o esquema pode ser mantido na dose habitual, com ajustes conforme necessário. [ADA]',
  'Vários estudos relatam que a administração conjunta de dose baixa de insulina basal — 0,15 a 0,3 U/kg — durante a infusão reduz o tempo até a resolução da CAD, a duração da infusão e o tempo de internação, além de prevenir hiperglicemia de rebote, sem aumento do risco de hipoglicemia. [ADA]',
  'A prática é adotada por muitos e evitada por outros, pelo receio de hipoglicemia ou hipocalemia. [ADA]',
]

// ── 4.4 Bicarbonato / 4.5 Fosfato ────────────────────────────────────────────

export const BICARBONATO_PH_ALTO = [
  'A administração rotineira de bicarbonato geralmente não é recomendada. A reposição volêmica e a insulina costumam ser suficientes para resolver a acidose metabólica da CAD. [ADA]',
  'Estudos observacionais e randomizados não mostraram vantagem do bicarbonato em desfechos cardíacos, neurológicos ou na velocidade de recuperação da hiperglicemia e da cetoacidose. [ADA]',
  'Efeitos potencialmente deletérios relatados: aumento do risco de hipocalemia, redução da captação tecidual de oxigênio, edema cerebral e acidose paradoxal do sistema nervoso central. [ADA]',
]

export const BICARBONATO_PH_BAIXO = [
  'Como a acidose metabólica grave pode ter efeitos vasculares adversos, o bicarbonato pode ser considerado quando o pH está abaixo de 7,0. [ADA]',
  'Preparo: diluir 100 mEq de bicarbonato de sódio em 400 mL de água estéril, infundindo ao longo de 2 horas. [UTD]',
  'A administração pode ser repetida a cada 2 horas até que o pH ultrapasse 7,0. [UTD]',
]

/** Exibida com destaque quando pH <7,0 E potassio <5,0. */
export const BICARBONATO_LINHA_KCL =
  'Se o potássio sérico estiver abaixo de 5,0 mEq/L, considere acrescentar 20 mEq de cloreto de potássio à solução. [UTD]'

export const FOSFATO = [
  'Na CAD há deslocamento de fosfato do intracelular para o extracelular, com perda urinária excessiva, levando à hipofosfatemia. As perdas corporais podem chegar a 1,0 mmol/kg. [ADA]',
  'A administração rotineira de fosfato geralmente não é indicada. Vários estudos randomizados prospectivos não demonstraram efeito benéfico da reposição sobre o desfecho clínico da CAD. [ADA]',
  'A reposição pode ser considerada quando houver evidência de fraqueza muscular, como comprometimento respiratório ou cardíaco, com fosfato abaixo de 1,0 mmol/L. [ADA]',
  'Quando necessária: 20 a 30 mmol de fosfato de potássio adicionados ao fluido de reposição. [ADA]',
  'A reposição excessivamente rápida pode precipitar hipocalcemia. [ADA]',
  'Os dados sobre deficiência e reposição de fosfato no EHH são escassos; recomenda-se abordagem semelhante. [ADA]',
]

// ─────────────────────────────────────────── 5. MONITORIZACAO E TITULACAO

export const CADENCIA_EXAMES = [
  { parametro: 'Glicemia capilar (HGT)', frequencia: 'a cada 1 h enquanto a bomba estiver ativa' },
  { parametro: 'Eletrólitos, ureia, creatinina, fósforo, pH venoso, glicemia sérica', frequencia: 'a cada 2–4 h, até estabilizar [UTD]' },
  { parametro: 'Potássio', frequencia: '2 h após iniciar insulina, depois a cada 2–4 h [UTD]' },
  { parametro: 'Osmolaridade (apenas EHH)', frequencia: 'a cada 4 h [ADA]' },
]

export const NOTA_BHB_INDISPONIVEL =
  'O algoritmo do UpToDate inclui beta-hidroxibutirato a cada 2 h. Indisponível neste serviço — a monitorização opera por pH venoso, bicarbonato e ânion-gap.'

export const CADENCIA_TEXTOS = [
  'A glicemia capilar pode ser verificada com glicosímetro calibrado pela instituição. As diretrizes sugerem intervalo de 1 a 2 horas. [ADA]',
  'Neste serviço, o padrão é HGT a cada 1 hora enquanto a bomba de insulina estiver ativa.',
]

export const RESPOSTA_ESPERADA = [
  'A infusão de insulina regular deve reduzir a glicemia em cerca de 50 a 70 mg/dL por hora. [UTD]',
  'Doses mais altas geralmente não produzem efeito hipoglicemiante mais intenso, provavelmente porque os receptores de insulina já estão saturados nas doses menores. [UTD]',
  'A queda da glicemia resulta da soma de dois efeitos: a ação da insulina e a reposição volêmica. A reposição volêmica isolada pode reduzir a glicemia em 35 a 70 mg/dL por hora. [UTD]',
]

export const QUEDA_INSUFICIENTE_INTRO =
  'Se a glicemia não cair pelo menos 50 a 70 mg/dL em relação ao valor inicial na primeira hora: [UTD]'

export const QUEDA_INSUFICIENTE_PASSOS = [
  'Verifique o acesso venoso e confirme que a insulina está sendo entregue.',
  'Verifique se há filtro de linha instalado no equipo — filtros podem ligar insulina.',
  'Afastadas essas possibilidades, a velocidade da infusão pode ser dobrada a cada hora, até que se obtenha queda constante dessa magnitude.',
]

export const TETO_QUEDA = 'A queda da glicemia não deve exceder 90 a 120 mg/dL por hora. [UTD]'

export const NOTA_TETO_QUEDA =
  'Este teto convive com a regra de dobrar a velocidade. Dobra-se enquanto a queda estiver abaixo de 50–70 mg/dL/h; interrompe-se a escalada ao se aproximar de 90–120 mg/dL/h.'

export const APOS_250 = [
  'Considere acrescentar dextrose a 5% ou 10% ao fluido e reduzir a infusão para 0,05 U/kg/h. [UTD]',
  'Se possível, evite que a glicemia caia rapidamente abaixo de 200 mg/dL — a queda abrupta pode favorecer o desenvolvimento de edema cerebral. [UTD]',
  'A glicemia pode ser mantida entre 150 e 200 mg/dL até a resolução da CAD. [UTD]',
]

export const ALVO_MANUTENCAO = [
  { fase: 'Glicemia >250 mg/dL', alvo: 'Queda de 50–70 mg/dL/h' },
  { fase: 'Glicemia <250 mg/dL', alvo: 'Manter entre 150 e 200 mg/dL até a resolução' },
]

export const VELOCIDADE_CORRECAO_CAD =
  'A reposição volêmica isolada, sem insulina, já reduz a glicemia em cerca de 50 a 70 mg/dL por hora. [ADA]'

// ──────────────────────────────────────────────── 7. RESOLUCAO E TRANSICAO

export const RESOLUCAO_CAD_ADA =
  'A resolução da CAD é definida por cetona plasmática abaixo de 0,6 mmol/L associada a pH venoso ≥7,3 ou bicarbonato ≥18 mEq/L. Idealmente, a glicemia também deve estar abaixo de 200 mg/dL. [ADA]'

/** Adaptacao para este servico, que nao dispoe de BHB. */
export const RESOLUCAO_CAD_ADAPTADA = [
  { criterio: 'pH venoso ≥7,3 ou bicarbonato ≥18 mEq/L', valor: 'obrigatório' },
  { criterio: 'Glicemia <200 mg/dL', valor: 'desejável' },
  { criterio: 'Ânion-gap', valor: 'apoio, não critério isolado' },
]

export const NAO_USAR_RESOLUCAO = [
  'Cetonúria não deve ser usada como critério de resolução. Conforme a acidose melhora, o beta-hidroxibutirato é convertido em acetoacetato — e o exame pode piorar enquanto o paciente melhora. [ADA]',
  'O ânion-gap não é recomendado como critério isolado, porque pode ser distorcido pela acidose metabólica hiperclorêmica causada por grandes volumes de salina 0,9%. [ADA]',
  'A acidose hiperclorêmica com ânion-gap normal é comum após o tratamento bem-sucedido da CAD e pode atrasar a transição para insulina subcutânea se for confundida com CAD persistente. [ADA]',
]

export const RESOLUCAO_EHH_TEXTO =
  'Não há consenso formal sobre a definição de resolução do EHH. Considera-se resolvido quando a osmolaridade medida ou calculada cai abaixo de 300 mOsm/kg, a hiperglicemia foi corrigida, o débito urinário está acima de 0,5 mL/kg/h, o estado cognitivo melhorou e a glicemia está abaixo de 250 mg/dL. [ADA]'

export const RESOLUCAO_EHH_CHECKLIST = [
  'Osmolaridade abaixo de 300 mOsm/kg',
  'Hiperglicemia corrigida',
  'Débito urinário acima de 0,5 mL/kg/h',
  'Estado cognitivo melhorou',
  'Glicemia abaixo de 250 mg/dL',
]

export const TRANSICAO_TEXTOS = [
  'Após a resolução da CAD e quando o paciente estiver apto a se alimentar, considere iniciar esquema subcutâneo de múltiplas doses (basal-bolus). [UTD]',
  'A sobreposição com a infusão intravenosa depende do tipo de insulina subcutânea iniciada: [UTD]',
]

export const TRANSICAO_SOBREPOSICAO = [
  { id: 'rapido', tipo: 'Análogo de ação rápida', tempo: '1–2 h' },
  { id: 'curta',  tipo: 'Ação curta ou longa',    tempo: '2–4 h' },
]

export const TRANSICAO_NOTA_SOBREPOSICAO =
  'A sobreposição garante nível plasmático adequado de insulina e previne recorrência de hiperglicemia ou cetoacidose. [UTD]'

export const TRANSICAO_DDT = [
  { situacao: 'Sem uso prévio de insulina', dose: '0,5–0,6 U/kg/dia' },
  { situacao: 'Risco de hipoglicemia (insuficiência renal, fragilidade)', dose: '~0,3 U/kg/dia' },
  { situacao: 'Em uso prévio de insulina', dose: 'considerar o esquema prévio e a HbA1c' },
]

export const TRANSICAO_NOTA_REPARTICAO =
  'A calculadora não sugere a repartição entre basal e prandial. As fontes consultadas não especificam proporção; a divisão fica a critério clínico.'

export const TRANSICAO_TEXTOS_FINAIS = [
  'Todos os pacientes precisam de insulina basal por via subcutânea antes da suspensão da insulina intravenosa. [UTD]',
  'Pacientes com diabetes conhecido podem receber a insulina na dose que usavam antes da admissão. [ADA]',
  'Se houver preocupação com insulinização basal inadequada — por exemplo, HbA1c elevada — ou se algum fármaco precipitante contribuiu para o evento, o esquema pode ser alterado já na alta, em vez de adiar para o seguimento ambulatorial. [ADA]',
  'O esquema basal-bolus com análogos é o preferido, e foi associado a menor taxa de hipoglicemia após a transição em comparação com insulinas humanas. [ADA]',
]

// ──────────────────────────────────────────────────────────── 8. ARMADILHAS

export const ARMADILHAS = [
  {
    titulo: 'Hipoglicemia',
    textos: [
      'Em estudos de tratamento da CAD, o risco de hipoglicemia abaixo de 70 mg/dL variou entre 16% e 28%; hipoglicemia grave, abaixo de 40 mg/dL, ocorreu em 2% dos casos. [ADA]',
      'Hipoglicemia abaixo de 40 mg/dL durante o tratamento foi associada a aumento de 4,8 vezes na mortalidade. [ADA]',
      'Mitigação: monitorização da glicemia a cada 1 a 2 horas; redução da insulina para 0,05 U/kg/h e acréscimo de dextrose quando a glicemia cair abaixo de 250 mg/dL. [ADA]',
    ],
  },
  {
    titulo: 'Hipocalemia',
    textos: [
      'Hipocalemia abaixo de 3,5 mEq/L ocorreu em cerca de 55% dos pacientes com CAD e 51% dos com EHH. Hipocalemia grave, abaixo de 2,5 mEq/L, em 16% dos casos de CAD e 9% dos de EHH. [ADA]',
      'Hipocalemia igual ou abaixo de 2,5 mEq/L foi associada a aumento da mortalidade hospitalar. [ADA]',
    ],
  },
  {
    titulo: 'Acidose hiperclorêmica',
    textos: [
      'Acidose com ânion-gap normal pode surgir na fase de recuperação da CAD, provavelmente por perda de cetoânions — que seriam metabolizados a bicarbonato — e pelo excesso de cloreto infundido durante o tratamento. [ADA]',
      'É autolimitada e com poucas consequências clínicas. Ocorre menos com soluções balanceadas e com infusão mais lenta de salina. [ADA]',
      'O risco prático é confundi-la com CAD persistente e atrasar a transição. [ADA]',
    ],
  },
  {
    titulo: 'Correção rápida — edema cerebral',
    textos: [
      'Edema cerebral é raro em adultos, estimado em menos de 0,1% dos eventos, mas com mortalidade relatada em torno de 30%. [ADA]',
      'Em adultos com EHH e CAD, mudanças rápidas de osmolaridade podem estar associadas ao quadro. Pode ser subclínico e visível apenas em exame de imagem. [ADA]',
      'Recomenda-se atenção a mudanças no estado mental e limiar baixo para neuroimagem. [ADA]',
    ],
  },
  {
    titulo: 'Síndrome de desmielinização osmótica',
    textos: [
      'Pode ocorrer com correção rápida de hiponatremia e complicar o tratamento do EHH, em que pacientes hiperosmolares podem estar relativamente hiponatrêmicos. [ADA]',
      'A queda da osmolaridade deve ficar entre 3,0 e 8,0 mOsm/kg por hora. [ADA]',
    ],
  },
  {
    titulo: 'Lesão renal aguda',
    textos: [
      'Cerca de 50% dos adultos admitidos com CAD e EHH apresentam lesão renal aguda. É mais comum em idosos, com osmolaridade mais alta e glicemia de admissão mais elevada. Costuma resolver com a hidratação. [ADA]',
    ],
  },
  {
    titulo: 'Desligar a infusão cedo demais',
    textos: [
      'Considere manter a sobreposição de 1 a 2 horas com a insulina subcutânea antes de desligar a infusão. [ADA]',
    ],
  },
]

// ──────────────────────────────────────────────────── 9. FATOR PRECIPITANTE

export const FATOR_PRECIPITANTE_INTRO =
  'A identificação e o tratamento da causa precipitante fazem parte do manejo. [ADA]'

export const FATORES_PRECIPITANTES = [
  { id: 'infeccao',    label: 'Infecção', nota: 'Causa mais comum no mundo, em 14 a 58% dos casos de CAD. No EHH, é o principal precipitante em 30 a 60%, com infecção urinária e pneumonia à frente. [ADA]' },
  { id: 'omissao',     label: 'Omissão ou uso insuficiente de insulina', nota: 'Causa maior, sobretudo em contexto psicossocial e socioeconômico desfavorável [ADA]' },
  { id: 'dm-recente',  label: 'Diabetes de início recente', nota: 'Entre 6% e 21% dos adultos abrem o diabetes tipo 1 com CAD [ADA]' },
  { id: 'iam',         label: 'Infarto agudo do miocárdio', nota: '[ADA]' },
  { id: 'avc',         label: 'Acidente vascular cerebral', nota: '[ADA]' },
  { id: 'pancreatite', label: 'Pancreatite aguda', nota: '[ADA]' },
  { id: 'tep',         label: 'Tromboembolismo pulmonar', nota: '[ADA]' },
  { id: 'trauma',      label: 'Trauma', nota: '[ADA]' },
  { id: 'alcool',      label: 'Álcool ou outras substâncias', nota: '[ADA]' },
  { id: 'cirurgia',    label: 'Cirurgia recente', nota: '[ADA]' },
  { id: 'isglt2',      label: 'Inibidor de SGLT2', nota: 'Ver nota abaixo' },
  { id: 'corticoide',  label: 'Corticosteroide', nota: '[ADA]' },
  { id: 'antipsico',   label: 'Antipsicótico', nota: '[ADA]' },
  { id: 'checkpoint',  label: 'Inibidor de checkpoint imunológico', nota: '1 a 2% desenvolvem diabetes autoimune de início recente [ADA]' },
]

/** Exibida quando o item iSGLT2 for marcado. */
export const NOTA_ISGLT2 = [
  'Inibidores de SGLT2 geralmente são suspensos na admissão. [ADA]',
  'Na CAD euglicêmica, a dextrose a 5% ou 10% pode ser acrescentada ao fluido intravenoso ou iniciada junto com a salina 0,9%. [ADA]',
]

export const RASTREIO_SAUDE_MENTAL =
  'A relação entre condições de saúde mental e crises hiperglicêmicas pode ser bidirecional. Recomenda-se que todas as pessoas que apresentam crise hiperglicêmica sejam rastreadas para questões de saúde mental. [ADA]'

// ───────────────────────────────────────────────────────────── 10. DISPOSICAO

export const DISPOSICAO = {
  leve:     'Unidade regular ou de observação',
  moderada: 'Unidade intermediária ou de cuidados semi-intensivos',
  grave:    'UTI',
}

export const DISPOSICAO_TEXTOS = [
  'A maioria das pessoas com CAD leve ou moderada não complicada pode ser tratada no departamento de emergência ou em unidade intermediária, desde que haja supervisão de enfermagem e monitorização adequadas. [ADA]',
  'Comparações entre tratar CAD em UTI e em unidades intermediárias ou de internação geral não demonstraram diferença clara em mortalidade, tempo de internação ou tempo até a resolução da cetoacidose. A internação em UTI de pessoas com CAD leve foi associada a mais exames laboratoriais e custo mais alto. [ADA]',
  'Considere UTI para pessoas com CAD grave ou EHH, para aquelas cuja causa precipitante seja uma condição crítica — como infarto do miocárdio, sangramento gastrointestinal ou sepse — e para as que apresentam alteração do estado mental. [ADA]',
]

// ──────────────────────────────────────────────────────────── 11. REFERENCIAS

export const REFERENCIAS = [
  { texto: 'Umpierrez GE, Davis GM, ElSayed NA, et al. Hyperglycaemic crises in adults with diabetes: a consensus report. Diabetologia 2024;67:1455–1479.', url: 'https://doi.org/10.1007/s00125-024-06183-8' },
  { texto: 'Dhatariya KK, Joint British Diabetes Societies for Inpatient Care. The management of diabetic ketoacidosis in adults. Diabet Med 2022;39:e14788.', url: 'https://doi.org/10.1111/dme.14788' },
  { texto: 'Mustafa OG, Haq M, Dashora U, Castro E. Management of hyperosmolar hyperglycaemic state (HHS) in adults. Diabet Med 2023;40:e15005.', url: 'https://doi.org/10.1111/dme.15005' },
  { texto: 'Goldberg PA, et al. "Waste not, want not": determining the optimal priming volume for intravenous insulin infusions. Diabetes Technol Ther 2006.', url: 'https://doi.org/10.1089/dia.2006.8.598' },
  { texto: 'Thompson CD, et al. The effect of tubing dwell time on insulin adsorption during intravenous insulin infusions. Diabetes Technol Ther 2012.', url: null },
  { texto: 'UpToDate — Diabetic ketoacidosis in adults: Treatment; Hyperosmolar hyperglycemic state in adults: Treatment (consultado)', url: null },
]

// ────────────────────────────────────────────────── ESTADO GLOBAL DA FERRAMENTA

/**
 * Inserido uma vez no painel do topo, consumido por todas as secoes.
 * Persiste durante a sessao; nao guarda historico entre sessoes.
 * O peso vem do WeightContext, compartilhado com as outras ferramentas.
 */
export interface KetoDados {
  glicemia: number | null
  sodio: number | null
  potassio: number | null
  cloro: number | null
  bicarbonato: number | null
  phVenoso: number | null
  ureia: number | null
  cetonuria: Cetonuria | null
  nivelConsciencia: Consciencia | null
}

export const KETO_DADOS_VAZIO: KetoDados = {
  glicemia: null, sodio: null, potassio: null, cloro: null,
  bicarbonato: null, phVenoso: null, ureia: null,
  cetonuria: null, nivelConsciencia: null,
}

/** Faixas de validacao do painel. */
export const KETO_CAMPOS = [
  { id: 'glicemia',     label: 'Glicemia',    unidade: 'mg/dL', min: 20,  max: 1500, obrigatorio: true },
  { id: 'sodio',        label: 'Sódio',       unidade: 'mEq/L', min: 100, max: 190,  obrigatorio: true },
  { id: 'potassio',     label: 'Potássio',    unidade: 'mEq/L', min: 1,   max: 9,    obrigatorio: true },
  { id: 'cloro',        label: 'Cloro',       unidade: 'mEq/L', min: 60,  max: 140,  obrigatorio: true },
  { id: 'bicarbonato',  label: 'Bicarbonato', unidade: 'mEq/L', min: 1,   max: 40,   obrigatorio: true },
  { id: 'phVenoso',     label: 'pH venoso',   unidade: '',      min: 6.5, max: 7.7,  obrigatorio: true },
  { id: 'ureia',        label: 'Ureia',       unidade: 'mg/dL', min: 5,   max: 300,  obrigatorio: false },
] as const

export const CETONURIA_OPCOES: Cetonuria[] = ['0', '1+', '2+', '3+', '4+']

export const CONSCIENCIA_OPCOES: { id: Consciencia; label: string }[] = [
  { id: 'alerta',       label: 'Alerta' },
  { id: 'sonolento',    label: 'Sonolento' },
  { id: 'estupor-coma', label: 'Estupor ou coma' },
]

/** Grade de acesso rapido, fixa no topo. */
export const KETO_SECOES = [
  { id: 'reconhecimento', label: 'Reconhecimento' },
  { id: 'exames',         label: 'Exames' },
  { id: 'calculadoras',   label: 'Calculadoras' },
  { id: 'manejo',         label: 'Manejo' },
  { id: 'monitorizacao',  label: 'Monitorização' },
  { id: 'planilha',       label: 'Planilha' },
  { id: 'resolucao',      label: 'Resolução' },
  { id: 'armadilhas',     label: 'Armadilhas' },
  { id: 'precipitante',   label: 'Precipitante' },
  { id: 'disposicao',     label: 'Disposição' },
  { id: 'referencias',    label: 'Referências' },
]
