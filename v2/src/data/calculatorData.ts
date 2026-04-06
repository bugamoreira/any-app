// ==========================================
// Calculadoras Clinicas — Dados tipados
// ANY App v2
// ==========================================
// Fontes: MDCalc, UpToDate, referencias originais de cada score
// NUNCA inventar pontuacoes ou interpretacoes clinicas.
// ==========================================

// ----- Tipos -----

export interface ScoreItem {
  id: string
  label: string
  options: { label: string; value: number }[]
}

export interface InputField {
  id: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue?: number
  inputMode?: 'numeric' | 'decimal'
}

export interface SelectField {
  id: string
  label: string
  options: { label: string; value: string | number }[]
}

export interface Interpretation {
  label: string
  color: string   // Tailwind text color class or hex
  action: string
}

export type CalculatorType = 'score' | 'formula' | 'classification' | 'table'

export interface Calculator {
  id: string
  name: string
  aliases: string[]
  category: string
  type: CalculatorType
  description: string
  why: string
  whenToUse: string
  pearlsPitfalls: string[]
  reference: string
  items?: ScoreItem[]
  inputs?: InputField[]
  selects?: SelectField[]
  interpret: (score: number, values?: Record<string, number>) => Interpretation
  formula?: (values: Record<string, number>) => number
  /** Se a calculadora ja existe em um pathway */
  availableIn?: { tool: string; route: string }
}

export interface CalculatorCategory {
  id: string
  name: string
  color: string  // hex for border-left
  calculators: Calculator[]
}

// ----- Helper de interpretacao -----

function interp(label: string, color: string, action: string): Interpretation {
  return { label, color, action }
}

// ==========================================
// CARDIOLOGIA / SCA
// ==========================================

const heartScore: Calculator = {
  id: 'heart-score',
  name: 'HEART Score',
  aliases: ['heart', 'sca', 'síndrome coronariana', 'dor torácica', 'chest pain'],
  category: 'Cardiologia / SCA',
  type: 'score',
  description: 'Estratificacao de risco em síndrome coronariana aguda na emergência.',
  why: 'Desenvolvido especificamente para estratificação de dor torácica no departamento de emergência, superando TIMI e GRACE nesse contexto.',
  whenToUse: 'Pacientes com dor torácica sugestiva de SCA no DE. Não usar em pacientes com IAMCSST óbvio.',
  pearlsPitfalls: [
    'O componente "History" e o mais subjetivo — considere se a historia e altamente, moderadamente ou levemente sugestiva de SCA.',
    'Troponina deve ser interpretada conforme o ensaio local (convencional vs alta sensibilidade).',
    'Score <= 3 com troponina negativa seriada tem valor preditivo negativo > 99%.',
    'Nao substitui o julgamento clínico em apresentacoes atipicas.'
  ],
  reference: 'Six AJ et al. Chest pain in the emergency room: value of the HEART score. Neth Heart J. 2008;16(6):191-6.',
  items: [
    {
      id: 'history',
      label: 'Historia clinica',
      options: [
        { label: 'Levemente suspeita', value: 0 },
        { label: 'Moderadamente suspeita', value: 1 },
        { label: 'Altamente suspeita', value: 2 }
      ]
    },
    {
      id: 'ecg',
      label: 'ECG',
      options: [
        { label: 'Normal', value: 0 },
        { label: 'Alteracao inespecifica de repolarizacao', value: 1 },
        { label: 'Desvio significativo de ST', value: 2 }
      ]
    },
    {
      id: 'age',
      label: 'Idade',
      options: [
        { label: '< 45 anos', value: 0 },
        { label: '45-64 anos', value: 1 },
        { label: '>= 65 anos', value: 2 }
      ]
    },
    {
      id: 'risk',
      label: 'Fatores de risco',
      options: [
        { label: 'Nenhum fator de risco conhecido', value: 0 },
        { label: '1-2 fatores de risco (HAS, DM, tabagismo, dislipidemia, obesidade, historia familiar)', value: 1 },
        { label: '>= 3 fatores de risco ou historia de DAC', value: 2 }
      ]
    },
    {
      id: 'troponin',
      label: 'Troponina',
      options: [
        { label: 'Normal (<=1x LSN)', value: 0 },
        { label: '1-3x o limite superior da normalidade', value: 1 },
        { label: '>3x o limite superior da normalidade', value: 2 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score <= 3) return interp('Baixo risco', '#4CAF50', 'MACE em 6 semanas: 0,9-1,7%. Considere alta precoce com seguimento ambulatorial.')
    if (score <= 6) return interp('Risco moderado', '#FFC107', 'MACE em 6 semanas: 12-16,6%. Considere observacao, troponina seriada e avaliacao complementar.')
    return interp('Alto risco', '#F44336', 'MACE em 6 semanas: 50-65%. Considere internacao e estratificação invasiva precoce.')
  }
}

const timiNstemi: Calculator = {
  id: 'timi-nstemi',
  name: 'TIMI Risk Score (NSTEMI)',
  aliases: ['timi', 'nstemi', 'iamssst', 'angina instavel'],
  category: 'Cardiologia / SCA',
  type: 'score',
  description: 'Risco de eventos adversos em 14 dias no IAMSSST/angina instavel.',
  why: 'Validado no estudo TIMI 11B e ESSENCE, prediz morte, IAM e revascularizacao urgente em 14 dias.',
  whenToUse: 'Pacientes com diagnóstico de IAMSSST ou angina instavel. Menos util como triagem inicial no DE (preferir HEART).',
  pearlsPitfalls: [
    'Originalmente derivado de populacao de ensaio clínico — pode subestimar risco em populacoes de DE.',
    'Uso de AAS nos ultimos 7 dias e um item — reflete doenca cronica.',
    'Estenose >= 50% exige conhecimento previo de cateterismo.',
    'Nao inclui funcao renal ou insuficiencia cardiaca, que sao preditores independentes.'
  ],
  reference: 'Antman EM et al. The TIMI risk score for unstable angina/non-ST elevation MI. JAMA. 2000;284(7):835-42.',
  items: [
    { id: 'age65', label: 'Idade >= 65 anos', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'cad', label: '>= 3 fatores de risco para DAC (HAS, DM, dislipidemia, tabagismo, historia familiar)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'stenosis', label: 'Estenose coronariana conhecida >= 50%', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'stdev', label: 'Desvio de ST >= 0,5 mm no ECG de admissao', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'angina', label: '>= 2 episódios de angina nas últimas 24h', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'asa', label: 'Uso de AAS nos ultimos 7 dias', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'troponin', label: 'Elevação de marcadores cardíacos (troponina)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score <= 2) return interp('Baixo risco', '#4CAF50', 'Risco de evento em 14 dias: 4,7-8,3%. Considere abordagem conservadora.')
    if (score <= 4) return interp('Risco intermediario', '#FFC107', 'Risco de evento em 14 dias: 13,2-19,9%. Considere estratificação nao invasiva ou invasiva.')
    return interp('Alto risco', '#F44336', 'Risco de evento em 14 dias: 26,2-40,9%. Considere estratificação invasiva precoce.')
  }
}

const graceScore: Calculator = {
  id: 'grace-score',
  name: 'GRACE Score',
  aliases: ['grace', 'sca', 'síndrome coronariana', 'mortalidade iam'],
  category: 'Cardiologia / SCA',
  type: 'formula',
  description: 'Mortalidade intra-hospitalar e em 6 meses pos-SCA (GRACE 2.0).',
  why: 'Mais preciso que TIMI para predizer mortalidade, recomendado pela ESC para decisao de estrategia invasiva.',
  whenToUse: 'Apos diagnóstico de SCA (IAMCSST ou IAMSSST) para guiar tempo de cateterismo e nivel de cuidado.',
  pearlsPitfalls: [
    'A versao 2.0 permite cálculo mesmo sem todas as variaveis (usando imputacao).',
    'Killip III-IV e PCR na admissao sao os maiores preditores de mortalidade.',
    'O calculador original usa um nomograma nao-linear — a versao simplificada aqui e uma aproximacao.',
    'Creatinina elevada pode refletir doenca renal cronica previa, nao apenas disfuncao aguda.'
  ],
  reference: 'Fox KA et al. Prediction of risk of death and myocardial infarction in the six months after presentation with acute coronary syndrome: prospective multinational observational study (GRACE). BMJ. 2006;333(7578):1091.',
  inputs: [
    { id: 'age', label: 'Idade', unit: 'anos', min: 18, max: 120, step: 1, inputMode: 'numeric' },
    { id: 'hr', label: 'Frequencia cardiaca', unit: 'bpm', min: 30, max: 250, step: 1, inputMode: 'numeric' },
    { id: 'sbp', label: 'Pressao arterial sistolica', unit: 'mmHg', min: 40, max: 300, step: 1, inputMode: 'numeric' },
    { id: 'creatinine', label: 'Creatinina', unit: 'mg/dL', min: 0.1, max: 20, step: 0.1, inputMode: 'decimal' }
  ],
  selects: [
    { id: 'killip', label: 'Classe de Killip', options: [
      { label: 'I — sem sinais de IC', value: 0 },
      { label: 'II — estertores, B3', value: 20 },
      { label: 'III — edema pulmonar', value: 39 },
      { label: 'IV — choque cardiogenico', value: 59 }
    ]},
    { id: 'arrest', label: 'Parada cardiaca na admissao', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 39 }] },
    { id: 'stdev', label: 'Desvio de segmento ST', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 28 }] },
    { id: 'troponin', label: 'Troponina elevada', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 14 }] }
  ],
  formula: (v) => {
    // GRACE simplificado (aproximacao)
    let score = 0
    // Idade
    if (v.age < 30) score += 0
    else if (v.age < 40) score += 8
    else if (v.age < 50) score += 25
    else if (v.age < 60) score += 41
    else if (v.age < 70) score += 58
    else if (v.age < 80) score += 75
    else if (v.age < 90) score += 91
    else score += 100
    // FC
    if (v.hr < 50) score += 0
    else if (v.hr < 70) score += 3
    else if (v.hr < 90) score += 9
    else if (v.hr < 110) score += 15
    else if (v.hr < 150) score += 24
    else if (v.hr < 200) score += 38
    else score += 46
    // PAS
    if (v.sbp < 80) score += 58
    else if (v.sbp < 100) score += 53
    else if (v.sbp < 120) score += 43
    else if (v.sbp < 140) score += 34
    else if (v.sbp < 160) score += 24
    else if (v.sbp < 200) score += 10
    else score += 0
    // Creatinina
    if (v.creatinine < 0.4) score += 1
    else if (v.creatinine < 0.8) score += 4
    else if (v.creatinine < 1.2) score += 7
    else if (v.creatinine < 1.6) score += 10
    else if (v.creatinine < 2.0) score += 13
    else if (v.creatinine < 4.0) score += 21
    else score += 28
    // Selects
    score += (v.killip || 0) + (v.arrest || 0) + (v.stdev || 0) + (v.troponin || 0)
    return score
  },
  interpret: (score: number) => {
    if (score <= 108) return interp('Baixo risco', '#4CAF50', 'Mortalidade intra-hospitalar < 1%. Considere abordagem nao invasiva.')
    if (score <= 140) return interp('Risco intermediario', '#FFC107', 'Mortalidade intra-hospitalar 1-3%. Considere estratificação invasiva em < 72h.')
    return interp('Alto risco', '#F44336', 'Mortalidade intra-hospitalar > 3%. Considere estratificação invasiva em < 24h.')
  }
}

const chadsVasc: Calculator = {
  id: 'chadsvasc',
  name: 'CHA2DS2-VASc',
  aliases: ['chads', 'chadsvasc', 'fibrilacao atrial', 'fa', 'avc', 'anticoagulacao'],
  category: 'Cardiologia / SCA',
  type: 'score',
  description: 'Risco de AVC em fibrilacao atrial para decisao de anticoagulacao.',
  why: 'Substituiu o CHADS2, melhor discriminacao em pacientes de baixo risco. Recomendado pelas diretrizes ESC e AHA.',
  whenToUse: 'Todo paciente com fibrilacao atrial nao valvar para decidir sobre anticoagulacao cronica.',
  pearlsPitfalls: [
    'Sexo feminino so pontua se houver outro fator de risco — isoladamente nao indica anticoagulacao.',
    'Score 0 em homens (ou 1 em mulheres por sexo isolado) = nao anticoagular.',
    'Score >= 2 em homens ou >= 3 em mulheres = anticoagulacao recomendada.',
    'Sempre avaliar HAS-BLED em conjunto para balancear risco-beneficio.'
  ],
  reference: 'Lip GY et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation. Chest. 2010;137(2):263-72.',
  items: [
    { id: 'chf', label: 'ICC / disfuncao ventricular (C)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'htn', label: 'Hipertensao (H)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'age75', label: 'Idade >= 75 anos (A2)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'dm', label: 'Diabetes mellitus (D)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'stroke', label: 'AVC / AIT / tromboembolismo previo (S2)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'vascular', label: 'Doenca vascular (IAM previo, DAP, placa aortica) (V)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'age65', label: 'Idade 65-74 anos (A)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'sex', label: 'Sexo feminino (Sc)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Baixo risco', '#4CAF50', 'Risco anual de AVC ~0%. Anticoagulacao geralmente nao recomendada.')
    if (score === 1) return interp('Risco baixo-intermediario', '#FFC107', 'Risco anual de AVC ~1,3%. Considere anticoagulacao (recomendado em homens; em mulheres se score 1 por sexo isolado, nao anticoagular).')
    if (score <= 3) return interp('Risco moderado', '#FFC107', 'Risco anual de AVC 2,2-3,2%. Anticoagulacao oral recomendada.')
    return interp('Alto risco', '#F44336', `Risco anual de AVC >= 4%. Anticoagulacao oral fortemente recomendada.`)
  }
}

const hasBled: Calculator = {
  id: 'has-bled',
  name: 'HAS-BLED',
  aliases: ['hasbled', 'sangramento', 'anticoagulacao', 'risco hemorragico'],
  category: 'Cardiologia / SCA',
  type: 'score',
  description: 'Risco de sangramento maior em pacientes anticoagulados com FA.',
  why: 'Identifica fatores de risco modificaveis de sangramento. Nao deve ser usado para contraindicar anticoagulacao isoladamente.',
  whenToUse: 'Em conjunto com CHA2DS2-VASc para avaliar risco-beneficio de anticoagulacao em FA.',
  pearlsPitfalls: [
    'Score alto NAO contraindica anticoagulacao — indica necessidade de monitoramento mais proximo.',
    'Fatores modificaveis: HAS nao controlada, INR labil, uso de AINEs/antiplaquetarios, etilismo.',
    'Corrigir fatores modificaveis pode reduzir o risco de sangramento significativamente.',
    'Aplicavel a pacientes com FA nao valvar; validacao limitada em valvopatas.'
  ],
  reference: 'Pisters R et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation. Chest. 2010;138(5):1093-100.',
  items: [
    { id: 'htn', label: 'Hipertensao nao controlada (PAS > 160 mmHg) (H)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'renal', label: 'Insuficiencia renal (dialise, transplante, Cr > 2,26 mg/dL) (A)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'liver', label: 'Insuficiencia hepatica (cirrose, bilirrubina > 2x, transaminases > 3x) (A)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'stroke', label: 'AVC previo (S)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'bleeding', label: 'Historia de sangramento maior ou predisposicao (B)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'inr', label: 'INR labil (tempo na faixa terapêutica < 60%) (L)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'age', label: 'Idade > 65 anos (E)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'drugs', label: 'Uso de antiplaquetarios ou AINEs (D)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'alcohol', label: 'Etilismo (>= 8 doses/semana) (D)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score <= 1) return interp('Baixo risco', '#4CAF50', 'Risco de sangramento maior em 1 ano: 1,02-1,88%. Anticoagulacao segura.')
    if (score === 2) return interp('Risco moderado', '#FFC107', 'Risco de sangramento maior em 1 ano: 1,88-3,74%. Monitorar de perto, corrigir fatores modificaveis.')
    return interp('Alto risco', '#F44336', 'Risco de sangramento maior em 1 ano: >= 3,74%. Monitoramento frequente, corrigir fatores modificaveis. NAO contraindicar anticoagulacao isoladamente.')
  }
}

const egsys: Calculator = {
  id: 'egsys',
  name: 'EGSYS Score',
  aliases: ['egsys', 'sincope', 'sincope cardiaca', 'perda de consciencia'],
  category: 'Cardiologia / SCA',
  type: 'score',
  description: 'Probabilidade de sincope de causa cardiaca.',
  why: 'Permite identificar rápidamente sincopes de alto risco no DE, que necessitam investigacao e internacao.',
  whenToUse: 'Pacientes com sincope no DE para diferenciar causa cardiaca de nao cardiaca.',
  pearlsPitfalls: [
    'Score >= 3 tem sensibilidade de 92% e especificidade de 69% para sincope cardiaca.',
    'Palpitacao antes da sincope e o maior preditor positivo.',
    'Predromos neurovegetativos (nausea, calor) reduzem a probabilidade de causa cardiaca.',
    'Nao exclui causas potencialmente graves nao cardiacas (ex: embolia pulmonar).'
  ],
  reference: 'Del Rosso A et al. Clinical predictors of cardiac syncope at initial evaluation in patients referred urgently to a general hospital. Heart. 2008;94(12):1620-6.',
  items: [
    { id: 'ecg_abnormal', label: 'ECG anormal e/ou cardiopatia', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 3 }] },
    { id: 'palpitation', label: 'Palpitacao antes da sincope', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 4 }] },
    { id: 'effort', label: 'Sincope durante esforco', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 3 }] },
    { id: 'supine', label: 'Sincope em posicao supina', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'prodrome', label: 'Predromos neurovegetativos (nausea, calor)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: -1 }] },
    { id: 'precipitant', label: 'Fatores predisponentes/precipitantes (quente, ortostatismo prolongado, medo, dor, emocao)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: -1 }] }
  ],
  interpret: (score: number) => {
    if (score < 3) return interp('Baixa probabilidade de sincope cardiaca', '#4CAF50', 'Causa cardiaca improvavel. Considere causas reflexas ou ortostaticas.')
    return interp('Alta probabilidade de sincope cardiaca', '#F44336', 'Investigacao cardiologica recomendada. Considere monitoramento, ecocardiograma e internacao.')
  }
}

const sfSyncope: Calculator = {
  id: 'sf-syncope',
  name: 'San Francisco Syncope Rule',
  aliases: ['sfsyncope', 'chess', 'san francisco', 'sincope', 'alto risco sincope'],
  category: 'Cardiologia / SCA',
  type: 'score',
  description: 'Identifica pacientes com sincope de alto risco no DE (regra CHESS).',
  why: 'Regra simples para triagem rápida de sincope no DE — qualquer criterio positivo indica risco de evento grave em 30 dias.',
  whenToUse: 'Triagem de pacientes com sincope no DE para decisao de alta vs investigacao.',
  pearlsPitfalls: [
    'CHESS: Congestive heart failure, Hematocrit < 30%, ECG abnormal, Shortness of breath, Systolic BP < 90.',
    'Sensibilidade ~ 96-98%, mas especificidade baixa (~ 56%).',
    'Validacao externa variavel — considerar como ferramenta de triagem, nao decisao final.',
    'Qualquer criterio positivo = alto risco. Todos negativos = considere alta com seguimento.'
  ],
  reference: 'Quinn JV et al. Derivation of the San Francisco Syncope Rule to predict patients with short-term serious outcomes. Ann Emerg Med. 2004;43(2):224-32.',
  items: [
    { id: 'chf', label: 'Historia de insuficiencia cardiaca congestiva (C)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'hematocrit', label: 'Hematocrito < 30% (H)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'ecg', label: 'ECG anormal (novo ou nao sinusal) (E)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'sob', label: 'Dispneia (S)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'sbp', label: 'PAS < 90 mmHg na triagem (S)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Baixo risco', '#4CAF50', 'Nenhum criterio CHESS positivo. Risco de evento grave em 30 dias < 2%. Considere alta com seguimento.')
    return interp('Alto risco', '#F44336', 'Pelo menos 1 criterio CHESS positivo. Risco de evento grave em 30 dias ~12%. Considere investigacao complementar e internacao.')
  }
}

// ==========================================
// NEUROLOGIA
// ==========================================

const huntHess: Calculator = {
  id: 'hunt-hess',
  name: 'Escala de Hunt-Hess',
  aliases: ['hunt hess', 'hsa', 'hemorragia subaracnoidea', 'aneurisma'],
  category: 'Neurologia',
  type: 'classification',
  description: 'Classificação clinica de gravidade da hemorragia subaracnoidea.',
  why: 'Prediz mortalidade e desfecho funcional. Guia urgencia do tratamento do aneurisma.',
  whenToUse: 'Pacientes com HSA confirmada para estratificação de gravidade e comunicacao entre equipes.',
  pearlsPitfalls: [
    'Graus I-III geralmente recebem tratamento precoce do aneurisma (< 72h).',
    'Graus IV-V tem mortalidade > 50% — decisao de tratamento deve ser individualizada.',
    'A avaliacao pode flutuar — reavaliar apos estabilizacao hemodinâmica.',
    'Comorbidades e idade influenciam prognostico independentemente do grau.'
  ],
  reference: 'Hunt WE, Hess RM. Surgical risk as related to time of intervention in the repair of intracranial aneurysms. J Neurosurg. 1968;28(1):14-20.',
  items: [
    {
      id: 'grade',
      label: 'Apresentacao clinica',
      options: [
        { label: 'Grau I — assintomatico ou cefaleia minima, rigidez de nuca leve', value: 1 },
        { label: 'Grau II — cefaleia moderada a intensa, rigidez de nuca, sem deficit focal (exceto paralisia de nervo craniano)', value: 2 },
        { label: 'Grau III — sonolencia, confusao ou deficit focal leve', value: 3 },
        { label: 'Grau IV — estupor, hemiparesia moderada a grave, possivel rigidez de descerebração precoce', value: 4 },
        { label: 'Grau V — coma profundo, rigidez de descerebracao, aparencia moribunda', value: 5 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 1) return interp('Grau I', '#4CAF50', 'Mortalidade cirurgica ~1%. Tratamento precoce do aneurisma recomendado.')
    if (score === 2) return interp('Grau II', '#4CAF50', 'Mortalidade cirurgica ~5%. Tratamento precoce do aneurisma recomendado.')
    if (score === 3) return interp('Grau III', '#FFC107', 'Mortalidade cirurgica ~19%. Tratamento precoce geralmente indicado apos estabilizacao.')
    if (score === 4) return interp('Grau IV', '#F44336', 'Mortalidade cirurgica ~42%. Decisao individualizada; considere estabilizacao clinica antes.')
    return interp('Grau V', '#F44336', 'Mortalidade cirurgica ~77%. Prognostico reservado; tratamento conservador pode ser considerado.')
  }
}

const fisherModificado: Calculator = {
  id: 'fisher-modificado',
  name: 'Escala de Fisher modificada',
  aliases: ['fisher', 'hsa', 'tc', 'tomografia', 'vasoespasmo', 'hemorragia subaracnoidea'],
  category: 'Neurologia',
  type: 'classification',
  description: 'Risco de vasoespasmo cerebral baseado na TC inicial da HSA.',
  why: 'Prediz risco de vasoespasmo sintomatico, guiando intensidade de monitoramento e tratamento profilatico.',
  whenToUse: 'Apos TC confirmatoria de HSA para classificar quantidade e distribuicao do sangue.',
  pearlsPitfalls: [
    'A escala modificada inclui hemorragia intraventricular como fator de risco adicional.',
    'Fisher 3-4 tem alto risco de vasoespasmo — monitoramento com Doppler transcraniano recomendado.',
    'TC realizada tardiamente pode subestimar a quantidade de sangue (clearance do sangue).',
    'Nao prediz ressangramento — apenas vasoespasmo.'
  ],
  reference: 'Frontera JA et al. Prediction of symptomatic vasospasm after subarachnoid hemorrhage: the modified Fisher scale. Neurosurgery. 2006;59(1):21-7.',
  items: [
    {
      id: 'grade',
      label: 'Achados na TC',
      options: [
        { label: 'Grau 0 — sem HSA ou hemorragia intraventricular (HIV)', value: 0 },
        { label: 'Grau 1 — HSA fina sem HIV', value: 1 },
        { label: 'Grau 2 — HSA fina com HIV', value: 2 },
        { label: 'Grau 3 — HSA espessa (cisterna > 1 mm) sem HIV', value: 3 },
        { label: 'Grau 4 — HSA espessa com HIV', value: 4 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Grau 0', '#4CAF50', 'Risco de vasoespasmo sintomatico: 0%. Monitoramento padrao.')
    if (score === 1) return interp('Grau 1', '#4CAF50', 'Risco de vasoespasmo sintomatico: ~24%. Monitoramento com Doppler transcraniano.')
    if (score === 2) return interp('Grau 2', '#FFC107', 'Risco de vasoespasmo sintomatico: ~33%. Monitoramento frequente.')
    if (score === 3) return interp('Grau 3', '#F44336', 'Risco de vasoespasmo sintomatico: ~33%. Monitoramento frequente, considere nimodipina.')
    return interp('Grau 4', '#F44336', 'Risco de vasoespasmo sintomatico: ~40%. Alto risco. Monitoramento intensivo, nimodipina, considere angiografia se deterioracao.')
  }
}

const fourScore: Calculator = {
  id: 'four-score',
  name: 'Escala FOUR',
  aliases: ['four', 'coma', 'consciencia', 'uti', 'neurologia'],
  category: 'Neurologia',
  type: 'score',
  description: 'Avaliacao de consciencia mais detalhada que a GCS, especialmente em pacientes intubados.',
  why: 'Avalia reflexos de tronco cerebral e padrao respiratorio, permitindo uso em pacientes intubados onde a GCS e limitada.',
  whenToUse: 'Pacientes com rebaixamento de consciencia, especialmente intubados. Complementar ou substituir a GCS na UTI.',
  pearlsPitfalls: [
    'Vantagem principal: nao depende de resposta verbal (utilizavel em intubados).',
    'Escore 0 em todos os 4 componentes sugere morte encefalica — iniciar protocolo.',
    'O componente respiratorio detecta padrao de Cheyne-Stokes e respiracao ataxica.',
    'E0 + M0 + B0 + R0 = considerar investigacao de morte encefalica.'
  ],
  reference: 'Wijdicks EF et al. Validation of a new coma scale: The FOUR score. Ann Neurol. 2005;58(4):585-93.',
  items: [
    {
      id: 'eye', label: 'Resposta ocular (E)',
      options: [
        { label: 'E0 — palpebras fechadas sem abertura a dor', value: 0 },
        { label: 'E1 — palpebras fechadas, abertura a dor', value: 1 },
        { label: 'E2 — palpebras fechadas, abertura a voz', value: 2 },
        { label: 'E3 — palpebras abertas sem rastreamento', value: 3 },
        { label: 'E4 — palpebras abertas, rastreamento ou piscar a comando', value: 4 }
      ]
    },
    {
      id: 'motor', label: 'Resposta motora (M)',
      options: [
        { label: 'M0 — sem resposta a dor ou status mioclonico generalizado', value: 0 },
        { label: 'M1 — resposta extensora a dor', value: 1 },
        { label: 'M2 — resposta flexora a dor', value: 2 },
        { label: 'M3 — localizacao a dor', value: 3 },
        { label: 'M4 — polegar para cima, punho fechado ou sinal de paz a comando', value: 4 }
      ]
    },
    {
      id: 'brainstem', label: 'Reflexos de tronco (B)',
      options: [
        { label: 'B0 — reflexo pupilar e corneano ausentes', value: 0 },
        { label: 'B1 — reflexo pupilar E corneano ausentes', value: 1 },
        { label: 'B2 — reflexo pupilar OU corneano ausente', value: 2 },
        { label: 'B3 — uma pupila fixa e dilatada', value: 3 },
        { label: 'B4 — reflexos pupilares e corneal presentes', value: 4 }
      ]
    },
    {
      id: 'respiration', label: 'Padrao respiratorio (R)',
      options: [
        { label: 'R0 — apneia ou respiracao com frequencia de backup do ventilador', value: 0 },
        { label: 'R1 — frequencia acima do ventilador', value: 1 },
        { label: 'R2 — nao intubado, respiracao irregular', value: 2 },
        { label: 'R3 — nao intubado, padrao de Cheyne-Stokes', value: 3 },
        { label: 'R4 — nao intubado, padrao respiratorio regular', value: 4 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Pontuacao 0 — considere investigacao de morte encefalica', '#F44336', 'Todos os componentes zerados. Iniciar protocolo de morte encefalica se aplicavel.')
    if (score <= 6) return interp('Gravemente comprometido', '#F44336', 'Coma profundo. Considere prognostico reservado, avaliar causa tratavel.')
    if (score <= 11) return interp('Moderadamente comprometido', '#FFC107', 'Rebaixamento significativo. Monitoramento em UTI recomendado.')
    return interp('Levemente comprometido', '#4CAF50', 'Nivel de consciencia relativamente preservado.')
  }
}

const ottawaHsa: Calculator = {
  id: 'ottawa-hsa',
  name: 'Ottawa SAH Rule',
  aliases: ['ottawa', 'hsa', 'cefaleia', 'thunderclap', 'hemorragia subaracnoidea', 'regra de ottawa'],
  category: 'Neurologia',
  type: 'score',
  description: 'Criterios para exclusao de HSA em cefaleia aguda nao traumatica no DE.',
  why: 'Sensibilidade de 100% para HSA quando todos os criterios sao negativos, potencialmente evitando punção lombar.',
  whenToUse: 'Pacientes alertas (GCS 15) com cefaleia aguda nao traumatica atingindo intensidade maxima em 1 hora.',
  pearlsPitfalls: [
    'So aplicavel se GCS 15 e cefaleia aguda nao traumatica.',
    'QUALQUER criterio positivo = investigar (TC + punção lombar ou angioTC).',
    'Todos negativos = sensibilidade 100% para HSA (VPN elevadissimo).',
    'Nao validada para cefaleias cronicas ou traumaticas.',
    'Idade >= 40 anos e um criterio — nao significa que todos >= 40 tem HSA.'
  ],
  reference: 'Perry JJ et al. Clinical decision rules to rule out subarachnoid hemorrhage for acute headache. JAMA. 2013;310(12):1248-55.',
  items: [
    { id: 'age40', label: 'Idade >= 40 anos', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'neck', label: 'Dor ou rigidez cervical', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'witness', label: 'Perda de consciencia presenciada', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'onset', label: 'Inicio durante esforco fisico', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'thunderclap', label: 'Cefaleia "thunderclap" (intensidade maxima instantanea)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'flexion', label: 'Limitacao de flexao cervical ao exame', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Todos os criterios negativos', '#4CAF50', 'Sensibilidade ~100% para excluir HSA. Investigacao adicional pode nao ser necessaria se clinica compativel.')
    return interp('Pelo menos 1 criterio positivo', '#F44336', 'HSA nao pode ser excluida clinicamente. Investigar com TC de cranio +/- punção lombar ou angioTC.')
  }
}

const hintsPlus: Calculator = {
  id: 'hints-plus',
  name: 'HINTS Plus',
  aliases: ['hints', 'vertigem', 'tontura', 'avc', 'vestibular', 'central', 'periferico', 'nistagmo'],
  category: 'Neurologia',
  type: 'score',
  description: 'Diferencia vertigem central (AVC) de periferica no síndrome vestibular agudo.',
  why: 'Sensibilidade de 99,2% para AVC de fossa posterior em síndrome vestibular agudo — superior a RM nas primeiras 48h.',
  whenToUse: 'Pacientes com síndrome vestibular agudo (vertigem + nistagmo + instabilidade de marcha continua por > 24h).',
  pearlsPitfalls: [
    'APENAS aplicavel em síndrome vestibular agudo contínuo — nao usar em vertigem episodica.',
    'Requer treinamento no exame: Head Impulse, Nistagmo, Test of Skew.',
    'HI normal (sem sacada corretiva) = CENTRAL ate que se prove o contrario.',
    'Nistagmo que muda de direcao com o olhar = CENTRAL.',
    'Plus = perda auditiva nova, que sugere infarto de AICA.',
    'HINTS periferico: HI positivo (sacada corretiva) + nistagmo unidirecional + sem skew + sem perda auditiva.'
  ],
  reference: 'Kattah JC et al. HINTS to diagnose stroke in the acute vestibular syndrome. Stroke. 2009;40(11):3504-10.',
  items: [
    {
      id: 'hi', label: 'Head Impulse Test',
      options: [
        { label: 'Positivo (sacada corretiva presente) — sugere periferico', value: 0 },
        { label: 'Normal/negativo (sem sacada corretiva) — sugere central', value: 1 }
      ]
    },
    {
      id: 'nystagmus', label: 'Nistagmo',
      options: [
        { label: 'Unidirecional (bate para um lado) — sugere periferico', value: 0 },
        { label: 'Bidirecional ou vertical — sugere central', value: 1 }
      ]
    },
    {
      id: 'skew', label: 'Test of Skew (cover-uncover)',
      options: [
        { label: 'Ausente (sem desalinhamento vertical) — sugere periferico', value: 0 },
        { label: 'Presente (desalinhamento vertical) — sugere central', value: 1 }
      ]
    },
    {
      id: 'hearing', label: 'Plus: perda auditiva nova',
      options: [
        { label: 'Ausente', value: 0 },
        { label: 'Presente (sugere infarto de AICA)', value: 1 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Padrao periferico', '#4CAF50', 'Todos os testes sugerem causa periferica (ex: neurite vestibular). RM geralmente desnecessaria.')
    return interp('Padrao central — considere AVC', '#F44336', 'Pelo menos 1 achado central. Considere AVC de fossa posterior mesmo com RM normal nas primeiras 48h. Neuroimagem e avaliacao vascular recomendadas.')
  }
}

const camIcu: Calculator = {
  id: 'cam-icu',
  name: 'CAM-ICU',
  aliases: ['cam', 'delirium', 'confusao', 'agitacao', 'uti', 'rebaixamento'],
  category: 'Neurologia',
  type: 'score',
  description: 'Diagnostico de delirium em pacientes criticos (intubados ou nao).',
  why: 'Delirium e subdiagnosticado na UTI e associado a aumento de mortalidade e tempo de internacao. CAM-ICU tem sensibilidade de 80% e especificidade de 96%.',
  whenToUse: 'Avaliacao diaria de delirium em pacientes internados em UTI, especialmente sob sedacao ou ventilacao mecanica.',
  pearlsPitfalls: [
    'Requer RASS >= -3 para aplicacao (paciente com alguma resposta a voz).',
    'Feature 1 (inicio agudo) E Feature 2 (inatenção) devem estar presentes.',
    'Alem disso, Feature 3 (pensamento desorganizado) OU Feature 4 (nivel de consciencia alterado) deve estar presente.',
    'Testar inatenção com o teste de letras: "Aperte minha mao quando eu disser a letra A" — SAVEAHAART.',
    'Delirium hipoativo e mais comum que hiperativo e frequentemente nao diagnosticado.'
  ],
  reference: 'Ely EW et al. Evaluation of delirium in critically ill patients: validation of the Confusion Assessment Method for the Intensive Care Unit (CAM-ICU). Crit Care Med. 2001;29(7):1370-9.',
  items: [
    { id: 'f1', label: 'Feature 1: inicio agudo ou curso flutuante', options: [{ label: 'Ausente', value: 0 }, { label: 'Presente', value: 1 }] },
    { id: 'f2', label: 'Feature 2: inatenção (erro >= 2 no teste de letras)', options: [{ label: 'Ausente', value: 0 }, { label: 'Presente', value: 1 }] },
    { id: 'f3', label: 'Feature 3: pensamento desorganizado (erro >= 1 em perguntas simples ou nao segue comandos)', options: [{ label: 'Ausente', value: 0 }, { label: 'Presente', value: 1 }] },
    { id: 'f4', label: 'Feature 4: nivel de consciencia alterado (RASS diferente de 0)', options: [{ label: 'Ausente', value: 0 }, { label: 'Presente', value: 1 }] }
  ],
  interpret: (_score: number, values?: Record<string, number>) => {
    const f1 = values?.f1 || 0
    const f2 = values?.f2 || 0
    const f3 = values?.f3 || 0
    const f4 = values?.f4 || 0
    if (f1 && f2 && (f3 || f4)) {
      return interp('CAM-ICU positivo — delirium presente', '#F44336', 'Delirium confirmado. Investigar causas reversiveis (infeccao, disturbio metabolico, drogas). Considere medidas nao farmacologicas.')
    }
    return interp('CAM-ICU negativo — delirium ausente', '#4CAF50', 'Sem criterios de delirium no momento. Reavaliar diariamente.')
  }
}

const nihss: Calculator = {
  id: 'nihss',
  name: 'NIHSS',
  aliases: ['nihss', 'avc', 'acidente vascular cerebral', 'stroke', 'escala de avc', 'gravidade avc'],
  category: 'Neurologia',
  type: 'score',
  description: 'Quantifica gravidade do deficit neurologico no AVC agudo.',
  why: 'Padrao-ouro para quantificar gravidade do AVC. Guia decisao de trombolise e trombectomia mecanica.',
  whenToUse: 'Todo paciente com suspeita de AVC agudo, antes e apos tratamento, e para monitorar evolucao.',
  pearlsPitfalls: [
    'NIHSS >= 6 com oclusao de grande vaso = considerar trombectomia mecanica.',
    'NIHSS pode subestimar AVC de circulação posterior (vertebrobasilar).',
    'Afasia eleva desproporcionalmente o score — nao assumir que NIHSS alto = deficit motor grave.',
    'Avaliar e pontuar o que o paciente FAZ, nao o que voce acha que ele pode fazer.',
    'Score 0 nao exclui AVC — AVCs lacunares podem ter NIHSS normal.'
  ],
  reference: 'Brott T et al. Measurements of acute cerebral infarction: a clinical examination scale. Stroke. 1989;20(7):864-70.',
  items: [
    { id: '1a', label: '1a. Nivel de consciencia', options: [
      { label: 'Alerta', value: 0 }, { label: 'Nao alerta, despertavel com estimulo minimo', value: 1 },
      { label: 'Nao alerta, requer estimulacao repetida', value: 2 }, { label: 'Coma / sem resposta', value: 3 }
    ]},
    { id: '1b', label: '1b. Perguntas de orientacao (mes e idade)', options: [
      { label: 'Ambas corretas', value: 0 }, { label: 'Uma correta', value: 1 }, { label: 'Nenhuma correta', value: 2 }
    ]},
    { id: '1c', label: '1c. Comandos (abrir/fechar olhos, apertar/soltar mao)', options: [
      { label: 'Ambos corretos', value: 0 }, { label: 'Um correto', value: 1 }, { label: 'Nenhum correto', value: 2 }
    ]},
    { id: '2', label: '2. Olhar conjugado', options: [
      { label: 'Normal', value: 0 }, { label: 'Paralisia parcial do olhar', value: 1 }, { label: 'Desvio forcado do olhar', value: 2 }
    ]},
    { id: '3', label: '3. Campo visual', options: [
      { label: 'Sem perda visual', value: 0 }, { label: 'Hemianopsia parcial', value: 1 },
      { label: 'Hemianopsia completa', value: 2 }, { label: 'Cegueira bilateral', value: 3 }
    ]},
    { id: '4', label: '4. Paralisia facial', options: [
      { label: 'Normal', value: 0 }, { label: 'Paralisia minima (apagamento do sulco nasolabial)', value: 1 },
      { label: 'Paralisia parcial (face inferior)', value: 2 }, { label: 'Paralisia completa (face superior e inferior)', value: 3 }
    ]},
    { id: '5a', label: '5a. Motor membro superior esquerdo (90 graus sentado / 45 supino)', options: [
      { label: 'Sem queda em 10s', value: 0 }, { label: 'Queda parcial antes de 10s', value: 1 },
      { label: 'Algum esforco contra gravidade, mas nao sustenta', value: 2 }, { label: 'Sem esforco contra gravidade', value: 3 }, { label: 'Sem movimento', value: 4 }
    ]},
    { id: '5b', label: '5b. Motor membro superior direito', options: [
      { label: 'Sem queda em 10s', value: 0 }, { label: 'Queda parcial antes de 10s', value: 1 },
      { label: 'Algum esforco contra gravidade, mas nao sustenta', value: 2 }, { label: 'Sem esforco contra gravidade', value: 3 }, { label: 'Sem movimento', value: 4 }
    ]},
    { id: '6a', label: '6a. Motor membro inferior esquerdo (30 graus supino)', options: [
      { label: 'Sem queda em 5s', value: 0 }, { label: 'Queda parcial antes de 5s', value: 1 },
      { label: 'Algum esforco contra gravidade', value: 2 }, { label: 'Sem esforco contra gravidade', value: 3 }, { label: 'Sem movimento', value: 4 }
    ]},
    { id: '6b', label: '6b. Motor membro inferior direito', options: [
      { label: 'Sem queda em 5s', value: 0 }, { label: 'Queda parcial antes de 5s', value: 1 },
      { label: 'Algum esforco contra gravidade', value: 2 }, { label: 'Sem esforco contra gravidade', value: 3 }, { label: 'Sem movimento', value: 4 }
    ]},
    { id: '7', label: '7. Ataxia de membros', options: [
      { label: 'Ausente', value: 0 }, { label: 'Presente em 1 membro', value: 1 }, { label: 'Presente em 2 membros', value: 2 }
    ]},
    { id: '8', label: '8. Sensibilidade', options: [
      { label: 'Normal', value: 0 }, { label: 'Hipoestesia leve a moderada', value: 1 }, { label: 'Anestesia', value: 2 }
    ]},
    { id: '9', label: '9. Linguagem (afasia)', options: [
      { label: 'Sem afasia', value: 0 }, { label: 'Afasia leve a moderada', value: 1 },
      { label: 'Afasia grave', value: 2 }, { label: 'Mutismo / afasia global', value: 3 }
    ]},
    { id: '10', label: '10. Disartria', options: [
      { label: 'Normal', value: 0 }, { label: 'Disartria leve a moderada', value: 1 }, { label: 'Anartria / ininteligivel', value: 2 }
    ]},
    { id: '11', label: '11. Extincao / inatenção', options: [
      { label: 'Sem anormalidade', value: 0 }, { label: 'Inatenção em uma modalidade', value: 1 }, { label: 'Hemi-inatenção profunda ou em mais de uma modalidade', value: 2 }
    ]}
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Sem deficit', '#4CAF50', 'NIHSS 0. Considere que AVC lacunar pode ter NIHSS normal.')
    if (score <= 4) return interp('Deficit menor', '#4CAF50', 'AVC menor. Trombolise pode nao ser indicada se deficit nao incapacitante.')
    if (score <= 15) return interp('Deficit moderado', '#FFC107', 'AVC moderado. Considere trombolise IV. Se oclusao de grande vaso, considere trombectomia.')
    if (score <= 20) return interp('Deficit moderado-grave', '#F44336', 'AVC grave. Trombolise IV e trombectomia mecanica fortemente recomendadas se dentro da janela.')
    return interp('Deficit grave', '#F44336', 'AVC muito grave. Trombolise IV +/- trombectomia. Prognostico reservado. Risco de transformacao hemorragica.')
  }
}

const gcs: Calculator = {
  id: 'gcs',
  name: 'Escala de Coma de Glasgow (GCS)',
  aliases: ['gcs', 'glasgow', 'coma', 'consciencia', 'tce', 'trauma'],
  category: 'Neurologia',
  type: 'score',
  description: 'Avaliacao padronizada do nivel de consciencia.',
  why: 'Escala universal para comunicacao rápida sobre nivel de consciencia entre equipes.',
  whenToUse: 'Todo paciente com alteracao de consciencia — trauma, AVC, intoxicacao, pos-PCR.',
  pearlsPitfalls: [
    'Sempre reportar os componentes individuais (ex: E3V4M6 = 13).',
    'GCS <= 8 = via aerea desprotegida — considere intubação.',
    'Resposta motora e o componente com maior valor prognostico isolado.',
    'Fatores confundidores: intoxicacao, sedacao, paralisia, afasia, edema palpebral.',
    'Reatividade pupilar deve ser avaliada em conjunto (GCS-P).'
  ],
  reference: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness. Lancet. 1974;2(7872):81-4.',
  items: [
    { id: 'eye', label: 'Abertura ocular (E)', options: [
      { label: 'E1 — nenhuma', value: 1 }, { label: 'E2 — a pressao/dor', value: 2 },
      { label: 'E3 — a voz', value: 3 }, { label: 'E4 — espontanea', value: 4 }
    ]},
    { id: 'verbal', label: 'Resposta verbal (V)', options: [
      { label: 'V1 — nenhuma', value: 1 }, { label: 'V2 — sons incompreensiveis', value: 2 },
      { label: 'V3 — palavras inapropriadas', value: 3 }, { label: 'V4 — confuso', value: 4 },
      { label: 'V5 — orientado', value: 5 }
    ]},
    { id: 'motor', label: 'Resposta motora (M)', options: [
      { label: 'M1 — nenhuma', value: 1 }, { label: 'M2 — extensao a dor (descerebração)', value: 2 },
      { label: 'M3 — flexao anormal (decorticação)', value: 3 }, { label: 'M4 — retirada a dor', value: 4 },
      { label: 'M5 — localizacao a dor', value: 5 }, { label: 'M6 — obedece comandos', value: 6 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 8) return interp('Grave (GCS 3-8)', '#F44336', 'Via aerea desprotegida. Considere intubação. Investigar causa e imagem de urgencia.')
    if (score <= 12) return interp('Moderado (GCS 9-12)', '#FFC107', 'Monitoramento proximo. Considere TC e causa reversivel.')
    return interp('Leve (GCS 13-15)', '#4CAF50', 'Nivel de consciencia levemente rebaixado ou preservado.')
  }
}

const abcd2: Calculator = {
  id: 'abcd2',
  name: 'ABCD2 Score',
  aliases: ['abcd', 'ait', 'ataque isquemico transitorio', 'risco avc'],
  category: 'Neurologia',
  type: 'score',
  description: 'Risco de AVC em 2-7-90 dias apos um ataque isquemico transitorio.',
  why: 'Estratifica urgencia de investigacao e internacao apos AIT. Score alto indica necessidade de avaliacao vascular rápida.',
  whenToUse: 'Pacientes com diagnóstico clínico de AIT no DE.',
  pearlsPitfalls: [
    'Score >= 4 sugere internacao ou investigacao acelerada (imagem vascular em < 24h).',
    'Nao substitui imagem vascular — mesmo scores baixos podem ter estenose carotidea significativa.',
    'Duracao >= 60 min e deficit motor sao os maiores preditores.',
    'AIT com RM positiva (lesão isquemica) = risco ainda maior que o score sugere.'
  ],
  reference: 'Johnston SC et al. Validation and refinement of scores to predict very early stroke risk after transient ischaemic attack. Lancet. 2007;369(9558):283-92.',
  items: [
    { id: 'age', label: 'Idade >= 60 anos (A)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'bp', label: 'PA >= 140/90 mmHg na apresentação (B)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'clinical', label: 'Apresentação clinica (C)', options: [
      { label: 'Outro sintoma', value: 0 },
      { label: 'Alteração de fala sem fraqueza', value: 1 },
      { label: 'Fraqueza unilateral', value: 2 }
    ]},
    { id: 'duration', label: 'Duracao dos sintomas (D)', options: [
      { label: '< 10 minutos', value: 0 },
      { label: '10-59 minutos', value: 1 },
      { label: '>= 60 minutos', value: 2 }
    ]},
    { id: 'diabetes', label: 'Diabetes mellitus (D)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score <= 3) return interp('Baixo risco', '#4CAF50', 'Risco de AVC em 2 dias: ~1%. Seguimento ambulatorial pode ser considerado se imagem vascular acessivel.')
    if (score <= 5) return interp('Risco moderado', '#FFC107', 'Risco de AVC em 2 dias: ~4,1%. Investigação acelerada recomendada (imagem vascular em 24h).')
    return interp('Alto risco', '#F44336', 'Risco de AVC em 2 dias: ~8,1%. Considere internação para investigação urgente.')
  }
}

const ichScore: Calculator = {
  id: 'ich-score',
  name: 'ICH Score',
  aliases: ['ich', 'avch', 'hemorragia intracerebral', 'hematoma cerebral', 'avc hemorragico', 'hemphill'],
  category: 'Neurologia',
  type: 'score',
  description: 'Predição de mortalidade em 30 dias no AVCh espontâneo.',
  why: 'Score mais validado para prognóstico de AVCh. Simples, rápido e reprodutível. Auxilia na comunicação com familiares e na tomada de decisão sobre nível de cuidado.',
  whenToUse: 'Pacientes com hemorragia intracerebral espontânea confirmada por TC. Não usar para trauma ou hemorragia subaracnóidea (usar Hunt-Hess/Fisher).',
  pearlsPitfalls: [
    'NÃO usar isoladamente para limitar cuidados — viés de profecia autorrealizável (retirada precoce de suporte).',
    'Volume do hematoma: usar fórmula ABC/2 (disponível nesta página).',
    'Infratentorial (cerebelo/tronco) tem pior prognóstico independentemente do volume.',
    'Recalcular após expansão do hematoma (TC de controle em 6h).',
    'Score 0 não significa ausência de risco — mortalidade ainda pode ser significativa.',
  ],
  reference: 'Hemphill JC et al. The ICH Score: a simple, reliable grading scale for intracerebral hemorrhage. Stroke. 2001;32(4):891-7.',
  items: [
    { id: 'gcs_ich', label: 'Glasgow (GCS)', options: [
      { label: '13-15', value: 0 }, { label: '5-12', value: 1 }, { label: '3-4', value: 2 }
    ]},
    { id: 'volume', label: 'Volume do hematoma', options: [
      { label: '< 30 mL', value: 0 }, { label: '≥ 30 mL', value: 1 }
    ]},
    { id: 'hiv', label: 'Hemorragia intraventricular', options: [
      { label: 'Não', value: 0 }, { label: 'Sim', value: 1 }
    ]},
    { id: 'infratentorial', label: 'Origem infratentorial', options: [
      { label: 'Não (supratentorial)', value: 0 }, { label: 'Sim (cerebelo ou tronco)', value: 1 }
    ]},
    { id: 'age80', label: 'Idade ≥ 80 anos', options: [
      { label: 'Não', value: 0 }, { label: 'Sim', value: 1 }
    ]},
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('ICH Score 0 — mortalidade ~0%', '#4CAF50', 'Bom prognóstico. Manter suporte agressivo e monitorização em UTI.')
    if (score === 1) return interp('ICH Score 1 — mortalidade ~13%', '#4CAF50', 'Prognóstico favorável. Controle pressórico rigoroso, reversão de anticoagulação se aplicável.')
    if (score === 2) return interp('ICH Score 2 — mortalidade ~26%', '#FFC107', 'Prognóstico intermediário. Considere UTI, neurocirurgia se hematoma cerebelar > 3 cm.')
    if (score === 3) return interp('ICH Score 3 — mortalidade ~72%', '#FF9800', 'Prognóstico reservado. Discussão com família sobre objetivos de cuidado.')
    if (score === 4) return interp('ICH Score 4 — mortalidade ~97%', '#F44336', 'Prognóstico muito reservado. Considere cuidados de conforto conforme valores do paciente.')
    if (score === 5) return interp('ICH Score 5 — mortalidade ~100%', '#F44336', 'Prognóstico extremamente reservado.')
    return interp('ICH Score 6 — mortalidade ~100%', '#F44336', 'Prognóstico incompatível com sobrevida na maioria dos casos.')
  }
}

const abc2: Calculator = {
  id: 'abc2',
  name: 'Volume do hematoma (ABC/2)',
  aliases: ['abc', 'volume hematoma', 'avch volume', 'calculo hematoma', 'abc/2'],
  category: 'Neurologia',
  type: 'formula',
  description: 'Estimativa rápida do volume de hematoma intracerebral pela TC.',
  why: 'Método padrão para estimar volume de hematoma sem software de volumetria. Necessário para calcular o ICH Score (limiar de 30 mL). Amplamente validado e aceito nas diretrizes AHA/ASA.',
  whenToUse: 'Qualquer hemorragia intracerebral na TC. Medir nos cortes axiais.',
  pearlsPitfalls: [
    'A = maior diâmetro do hematoma no corte com maior área (cm).',
    'B = maior diâmetro perpendicular a A, no mesmo corte (cm).',
    'C = número de cortes com hematoma × espessura do corte (cm). Alternativa: contar cortes onde o hematoma ocupa > 75% da área (conta como 1) e > 25% (conta como 0,5).',
    'Tende a superestimar hematomas irregulares e subestimar os regulares.',
    'Repetir em TC de controle (6-24h) para avaliar expansão (aumento > 33% ou > 6 mL é significativo).',
    'Para hematomas subdurais ou epidurais, usar fórmulas específicas.',
  ],
  reference: 'Kothari RU et al. The ABCs of measuring intracerebral hemorrhage volumes. Stroke. 1996;27(8):1304-5.',
  inputs: [
    { id: 'a_cm', label: 'A — maior diâmetro (cm)', unit: 'cm', min: 0.1, max: 15, step: 0.1, inputMode: 'decimal' as const },
    { id: 'b_cm', label: 'B — perpendicular a A (cm)', unit: 'cm', min: 0.1, max: 15, step: 0.1, inputMode: 'decimal' as const },
    { id: 'c_cm', label: 'C — profundidade (cm)', unit: 'cm', min: 0.1, max: 15, step: 0.1, inputMode: 'decimal' as const },
  ],
  interpret: (score: number) => {
    if (score < 10) return interp(`Volume: ${score.toFixed(1)} mL — pequeno`, '#4CAF50', 'Hematoma pequeno (< 10 mL). ICH Score: usar "< 30 mL". Monitorização e controle pressórico.')
    if (score < 30) return interp(`Volume: ${score.toFixed(1)} mL — moderado`, '#FFC107', 'Hematoma moderado (10-29 mL). ICH Score: usar "< 30 mL". Considere TC de controle em 6h para avaliar expansão.')
    if (score < 60) return interp(`Volume: ${score.toFixed(1)} mL — grande`, '#FF9800', 'Hematoma grande (≥ 30 mL). ICH Score: usar "≥ 30 mL". Considere neurocirurgia se cerebelar > 3 cm ou deterioração neurológica.')
    return interp(`Volume: ${score.toFixed(1)} mL — muito grande`, '#F44336', 'Hematoma muito grande (≥ 60 mL). Prognóstico reservado. Discussão sobre objetivos de cuidado.')
  },
  formula: (inputs: Record<string, number>) => {
    const a = inputs['a_cm'] || 0
    const b = inputs['b_cm'] || 0
    const c = inputs['c_cm'] || 0
    return (a * b * c) / 2
  }
}

// ==========================================
// GASTRO / HEPATO
// ==========================================

const rockall: Calculator = {
  id: 'rockall',
  name: 'Rockall Score',
  aliases: ['rockall', 'hda', 'hemorragia digestiva', 'sangramento gi alto'],
  category: 'Gastro / Hepato',
  type: 'score',
  description: 'Risco de ressangramento e mortalidade em hemorragia digestiva alta.',
  why: 'Versao pre-endoscopica permite estratificação antes da endoscopia. Versao completa inclui achados endoscopicos.',
  whenToUse: 'Pacientes com hemorragia digestiva alta no DE.',
  pearlsPitfalls: [
    'Score pre-endoscopico (0-7) usa idade, choque e comorbidades.',
    'Score completo (0-11) adiciona diagnóstico endoscopico e sinais de sangramento recente.',
    'Score pre-endoscopico 0 = mortalidade ~0,2%, considere alta com EDA ambulatorial.',
    'Nao avalia necessidade de transfusao — usar Glasgow-Blatchford para essa decisao.'
  ],
  reference: 'Rockall TA et al. Risk assessment after acute upper gastrointestinal haemorrhage. Gut. 1996;38(3):316-21.',
  items: [
    { id: 'age', label: 'Idade', options: [
      { label: '< 60 anos', value: 0 }, { label: '60-79 anos', value: 1 }, { label: '>= 80 anos', value: 2 }
    ]},
    { id: 'shock', label: 'Sinais de choque', options: [
      { label: 'Sem choque (FC < 100, PAS >= 100)', value: 0 },
      { label: 'Taquicardia (FC >= 100, PAS >= 100)', value: 1 },
      { label: 'Hipotensão (PAS < 100)', value: 2 }
    ]},
    { id: 'comorbidity', label: 'Comorbidades', options: [
      { label: 'Nenhuma comorbidade maior', value: 0 },
      { label: 'IC, DCI ou outra comorbidade maior', value: 2 },
      { label: 'Insuficiencia renal, insuficiencia hepatica ou cancer disseminado', value: 3 }
    ]},
    { id: 'diagnosis', label: 'Diagnostico endoscopico (se disponivel)', options: [
      { label: 'Nao avaliado / sem EDA', value: 0 },
      { label: 'Mallory-Weiss, sem lesao ou sem sinais de sangramento recente', value: 0 },
      { label: 'Todos os outros diagnósticos', value: 1 },
      { label: 'Neoplasia do TGI alto', value: 2 }
    ]},
    { id: 'stigmata', label: 'Sinais de sangramento recente na EDA', options: [
      { label: 'Nao avaliado / base limpa ou mancha plana', value: 0 },
      { label: 'Sangue no TGI alto, coagulo aderente, vaso visivel ou jato', value: 2 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 2) return interp('Baixo risco', '#4CAF50', 'Mortalidade ~0-5%. Considere alta precoce com EDA ambulatorial se score pre-endoscopico 0.')
    if (score <= 4) return interp('Risco intermediario', '#FFC107', 'Mortalidade ~5-11%. Internação e EDA dentro de 24h recomendadas.')
    return interp('Alto risco', '#F44336', 'Mortalidade ~24-40%. EDA urgente, UTI, suporte hemodinamico.')
  }
}

const glasgowBlatchford: Calculator = {
  id: 'glasgow-blatchford',
  name: 'Glasgow-Blatchford Score',
  aliases: ['blatchford', 'gbs', 'hda', 'hemorragia digestiva', 'transfusao', 'sangramento gi'],
  category: 'Gastro / Hepato',
  type: 'score',
  description: 'Necessidade de intervencao (transfusão, endoscopia, cirurgia) em HDA.',
  why: 'Score 0 identifica pacientes que podem ser manejados ambulatorialmente com segurança — VPN > 99%.',
  whenToUse: 'Triagem de pacientes com HDA no DE, antes da endoscopia.',
  pearlsPitfalls: [
    'Score 0 = risco muito baixo; considere alta com EDA ambulatorial.',
    'Superior ao Rockall pre-endoscopico para prever necessidade de intervencao.',
    'Inclui hemoglobina e ureia, que devem ser coletadas na admissao.',
    'Melena e sincope sao avaliadas clinicamente.'
  ],
  reference: 'Blatchford O et al. A risk score to predict need for treatment for upper-gastrointestinal haemorrhage. Lancet. 2000;356(9238):1318-21.',
  items: [
    { id: 'bun', label: 'Ureia sanguinea', options: [
      { label: '< 6,5 mmol/L (< 18,2 mg/dL)', value: 0 },
      { label: '6,5-7,9 mmol/L (18,2-22,3 mg/dL)', value: 2 },
      { label: '8,0-9,9 mmol/L (22,4-27,9 mg/dL)', value: 3 },
      { label: '10,0-24,9 mmol/L (28-69,9 mg/dL)', value: 4 },
      { label: '>= 25 mmol/L (>= 70 mg/dL)', value: 6 }
    ]},
    { id: 'hb_male', label: 'Hemoglobina (homens)', options: [
      { label: '>= 13 g/dL', value: 0 },
      { label: '12,0-12,9 g/dL', value: 1 },
      { label: '10,0-11,9 g/dL', value: 3 },
      { label: '< 10 g/dL', value: 6 },
      { label: 'Nao aplicavel (sexo feminino)', value: 0 }
    ]},
    { id: 'hb_female', label: 'Hemoglobina (mulheres)', options: [
      { label: '>= 12 g/dL', value: 0 },
      { label: '10,0-11,9 g/dL', value: 1 },
      { label: '< 10 g/dL', value: 6 },
      { label: 'Nao aplicavel (sexo masculino)', value: 0 }
    ]},
    { id: 'sbp', label: 'Pressao arterial sistolica', options: [
      { label: '>= 110 mmHg', value: 0 },
      { label: '100-109 mmHg', value: 1 },
      { label: '90-99 mmHg', value: 2 },
      { label: '< 90 mmHg', value: 3 }
    ]},
    { id: 'hr', label: 'Frequencia cardiaca >= 100 bpm', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'melena', label: 'Melena', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'syncope', label: 'Sincope', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'liver', label: 'Doenca hepatica', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'chf', label: 'Insuficiencia cardiaca', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Muito baixo risco', '#4CAF50', 'Pode ser considerado para manejo ambulatorial. VPN > 99% para necessidade de intervencao.')
    if (score <= 5) return interp('Baixo risco', '#4CAF50', 'Baixa probabilidade de intervencao urgente. EDA dentro de 24h.')
    if (score <= 11) return interp('Risco intermediario', '#FFC107', 'Internação e EDA recomendadas. Monitorar hemoglobina seriada.')
    return interp('Alto risco', '#F44336', 'Alta probabilidade de necessidade de intervencao. EDA urgente, considere transfusão e UTI.')
  }
}

const forrest: Calculator = {
  id: 'forrest',
  name: 'Classificação de Forrest',
  aliases: ['forrest', 'ulcera', 'sangramento', 'endoscopia', 'hda'],
  category: 'Gastro / Hepato',
  type: 'classification',
  description: 'Classificação endoscopica de ulcera peptica e risco de ressangramento.',
  why: 'Guia decisão de tratamento endoscopico e necessidade de internação pos-EDA.',
  whenToUse: 'Classificação durante endoscopia digestiva alta por ulcera peptica sangrante.',
  pearlsPitfalls: [
    'Forrest Ia/Ib = tratamento endoscopico obrigatorio.',
    'Forrest IIa (vaso visivel) = tratamento endoscopico recomendado.',
    'Forrest IIb (coagulo aderente) = decisao individualizada (remover coagulo e tratar).',
    'Forrest IIc e III = baixo risco, geralmente sem necessidade de tratamento endoscopico.'
  ],
  reference: 'Forrest JA et al. Endoscopy in gastrointestinal bleeding. Lancet. 1974;2(7877):394-7.',
  items: [
    {
      id: 'class',
      label: 'Achado endoscopico',
      options: [
        { label: 'Ia — sangramento ativo em jato (arterial)', value: 6 },
        { label: 'Ib — sangramento ativo em gotejamento (babação)', value: 5 },
        { label: 'IIa — vaso visivel nao sangrante', value: 4 },
        { label: 'IIb — coagulo aderente', value: 3 },
        { label: 'IIc — mancha plana pigmentada (hematina)', value: 2 },
        { label: 'III — base limpa (fibrina)', value: 1 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score >= 5) return interp('Forrest I — sangramento ativo', '#F44336', 'Ressangramento ~55-90%. Tratamento endoscopico obrigatorio. IBP IV em dose alta.')
    if (score === 4) return interp('Forrest IIa — vaso visivel', '#F44336', 'Ressangramento ~43%. Tratamento endoscopico recomendado.')
    if (score === 3) return interp('Forrest IIb — coagulo aderente', '#FFC107', 'Ressangramento ~22%. Considere remocao de coagulo e tratamento endoscopico.')
    if (score === 2) return interp('Forrest IIc — mancha plana', '#4CAF50', 'Ressangramento ~10%. Tratamento endoscopico geralmente desnecessario.')
    return interp('Forrest III — base limpa', '#4CAF50', 'Ressangramento ~5%. Baixo risco. Alta precoce com IBP oral pode ser considerada.')
  }
}

const childPugh: Calculator = {
  id: 'child-pugh',
  name: 'Child-Pugh Score',
  aliases: ['child', 'pugh', 'cirrose', 'hepatopatia', 'insuficiencia hepatica'],
  category: 'Gastro / Hepato',
  type: 'score',
  description: 'Classificação de gravidade da doenca hepatica cronica (cirrose).',
  why: 'Prediz sobrevida em 1-2 anos e guia indicação de transplante hepático.',
  whenToUse: 'Pacientes com cirrose hepatica para estratificação de gravidade e prognostico.',
  pearlsPitfalls: [
    'Child A (5-6) = sobrevida 1 ano ~100%. Child C (10-15) = sobrevida 1 ano ~45%.',
    'Encefalopatia e ascite sao avaliações clinicas subjetivas — pode haver variabilidade.',
    'MELD e preferido para lista de transplante; Child-Pugh para prognostico geral.',
    'Albumina e tempo de protrombina refletem funcao sintetica hepatica.'
  ],
  reference: 'Pugh RN et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973;60(8):646-9.',
  items: [
    { id: 'bilirubin', label: 'Bilirrubina total', options: [
      { label: '< 2 mg/dL', value: 1 }, { label: '2-3 mg/dL', value: 2 }, { label: '> 3 mg/dL', value: 3 }
    ]},
    { id: 'albumin', label: 'Albumina', options: [
      { label: '> 3,5 g/dL', value: 1 }, { label: '2,8-3,5 g/dL', value: 2 }, { label: '< 2,8 g/dL', value: 3 }
    ]},
    { id: 'inr', label: 'INR (tempo de protrombina)', options: [
      { label: '< 1,7', value: 1 }, { label: '1,7-2,3', value: 2 }, { label: '> 2,3', value: 3 }
    ]},
    { id: 'ascites', label: 'Ascite', options: [
      { label: 'Ausente', value: 1 }, { label: 'Leve (controlada com diureticos)', value: 2 }, { label: 'Moderada a grave (refrataria)', value: 3 }
    ]},
    { id: 'encephalopathy', label: 'Encefalopatia hepatica', options: [
      { label: 'Ausente', value: 1 }, { label: 'Grau I-II (leve, controlada)', value: 2 }, { label: 'Grau III-IV (grave, refrataria)', value: 3 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 6) return interp('Child A — doenca compensada', '#4CAF50', 'Sobrevida em 1 ano ~100%. Sobrevida em 2 anos ~85%. Cirurgia geralmente bem tolerada.')
    if (score <= 9) return interp('Child B — comprometimento funcional significativo', '#FFC107', 'Sobrevida em 1 ano ~81%. Sobrevida em 2 anos ~57%. Cirurgia com risco elevado.')
    return interp('Child C — doenca descompensada', '#F44336', 'Sobrevida em 1 ano ~45%. Sobrevida em 2 anos ~35%. Considere avaliação para transplante.')
  }
}

const meldNa: Calculator = {
  id: 'meld-na',
  name: 'MELD-Na',
  aliases: ['meld', 'transplante hepático', 'cirrose', 'mortalidade hepatica'],
  category: 'Gastro / Hepato',
  type: 'formula',
  description: 'Gravidade de doenca hepatica e priorizacao para transplante.',
  why: 'Padrao para lista de transplante hepático. MELD-Na adiciona sódio, melhorando predição em pacientes com hiponatremia.',
  whenToUse: 'Pacientes com cirrose para estimar mortalidade em 90 dias e prioridade de transplante.',
  pearlsPitfalls: [
    'Creatinina limitada a 4,0 mg/dL. Se dialise >= 2x na semana, usar Cr = 4,0.',
    'INR e bilirrubina minimos de 1,0 no cálculo.',
    'Sodio limitado a 125-137 mEq/L na formula.',
    'MELD >= 15 = beneficio de transplante supera risco.',
    'MELD >= 40 = mortalidade em 3 meses > 71%.'
  ],
  reference: 'Kim WR et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. N Engl J Med. 2008;359(10):1018-26.',
  inputs: [
    { id: 'bilirubin', label: 'Bilirrubina total', unit: 'mg/dL', min: 0.1, max: 50, step: 0.1, inputMode: 'decimal' },
    { id: 'inr', label: 'INR', unit: '', min: 0.5, max: 10, step: 0.1, inputMode: 'decimal' },
    { id: 'creatinine', label: 'Creatinina', unit: 'mg/dL', min: 0.1, max: 15, step: 0.1, inputMode: 'decimal' },
    { id: 'sodium', label: 'Sodio', unit: 'mEq/L', min: 100, max: 160, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const bili = Math.max(1, v.bilirubin)
    const inr = Math.max(1, v.inr)
    const cr = Math.min(4, Math.max(1, v.creatinine))
    const na = Math.min(137, Math.max(125, v.sodium))
    const meld = 10 * (0.957 * Math.log(cr) + 0.378 * Math.log(bili) + 1.120 * Math.log(inr) + 0.643)
    const meldRound = Math.round(meld)
    const meldNa = meldRound + 1.32 * (137 - na) - 0.033 * meldRound * (137 - na)
    return Math.round(Math.max(6, Math.min(40, meldNa)))
  },
  interpret: (score: number) => {
    if (score <= 9) return interp('MELD-Na <= 9', '#4CAF50', 'Mortalidade em 3 meses: ~2%. Acompanhamento ambulatorial.')
    if (score <= 19) return interp('MELD-Na 10-19', '#FFC107', 'Mortalidade em 3 meses: ~6%. Monitoramento regular. Listar se MELD >= 15.')
    if (score <= 29) return interp('MELD-Na 20-29', '#F44336', 'Mortalidade em 3 meses: ~20%. Prioridade na lista de transplante.')
    if (score <= 39) return interp('MELD-Na 30-39', '#F44336', 'Mortalidade em 3 meses: ~52%. Urgencia para transplante.')
    return interp('MELD-Na >= 40', '#F44336', 'Mortalidade em 3 meses: ~71%. Maxima prioridade para transplante.')
  }
}

const bonacini: Calculator = {
  id: 'bonacini',
  name: 'Bonacini Cirrhosis Discriminant Score',
  aliases: ['bonacini', 'fibrose', 'cirrose', 'hepatopatia cronica'],
  category: 'Gastro / Hepato',
  type: 'score',
  description: 'Discrimina presença de cirrose significativa usando dados laboratoriais simples.',
  why: 'Alternativa nao invasiva a biopsia hepatica para estimar fibrose significativa.',
  whenToUse: 'Pacientes com hepatopatia cronica quando biopsia nao esta disponivel ou desejavel.',
  pearlsPitfalls: [
    'Score >= 7 sugere cirrose com boa especificidade.',
    'Usa relacao AST/ALT, contagem de plaquetas e INR.',
    'Nao substitui biopsia em cenarios duvidosos.',
    'Menos validado que FIB-4 e APRI, porem util como ferramenta complementar.'
  ],
  reference: 'Bonacini M et al. Utility of a discriminant score for diagnosing advanced fibrosis or cirrhosis in patients with chronic hepatitis C virus infection. Am J Gastroenterol. 1997;92(8):1302-4.',
  items: [
    { id: 'ratio', label: 'Relação AST/ALT', options: [
      { label: '< 1,1', value: 0 }, { label: '1,1-1,4', value: 1 }, { label: '>= 1,4', value: 2 }
    ]},
    { id: 'platelets', label: 'Plaquetas', options: [
      { label: '>= 280.000/mm3', value: 0 }, { label: '220.000-279.000', value: 1 },
      { label: '160.000-219.000', value: 2 }, { label: '100.000-159.000', value: 3 },
      { label: '40.000-99.000', value: 4 }, { label: '< 40.000', value: 5 }
    ]},
    { id: 'inr', label: 'INR', options: [
      { label: '< 1,1', value: 0 }, { label: '1,1-1,4', value: 1 }, { label: '> 1,4', value: 2 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 3) return interp('Baixa probabilidade de cirrose', '#4CAF50', 'Fibrose significativa improvavel. Monitoramento e investigação conforme indicação clinica.')
    if (score <= 6) return interp('Probabilidade intermediaria', '#FFC107', 'Considere investigação adicional (elastografia, biopsia) para confirmar grau de fibrose.')
    return interp('Alta probabilidade de cirrose', '#F44336', 'Fibrose avancada/cirrose provavel. Rastreio de complicações (varizes, HCC).')
  }
}

// ==========================================
// TRAUMA
// ==========================================

const tash: Calculator = {
  id: 'tash',
  name: 'TASH Score',
  aliases: ['tash', 'transfusao maciça', 'trauma', 'hemorragia', 'choque hemorragico'],
  category: 'Trauma',
  type: 'score',
  description: 'Probabilidade de necessidade de transfusao maciça no trauma.',
  why: 'Permite ativação precoce do protocolo de transfusão maciça, reduzindo mortalidade.',
  whenToUse: 'Pacientes com trauma grave e suspeita de hemorragia significativa.',
  pearlsPitfalls: [
    'Score >= 16 = probabilidade > 50% de necessidade de transfusao macica.',
    'Considere ativar protocolo de transfusao macica com score >= 15.',
    'Inclui dados clínicos e laboratoriais simples disponiveis na admissao.',
    'Sensibilidade aumenta se combinado com avaliação clinica (ABC score).'
  ],
  reference: 'Yucel N et al. Trauma Associated Severe Hemorrhage (TASH)-Score: probability of mass transfusion as surrogate for life threatening hemorrhage after multiple trauma. J Trauma. 2006;60(6):1228-36.',
  items: [
    { id: 'sbp', label: 'Pressao arterial sistolica', options: [
      { label: '>= 120 mmHg', value: 0 }, { label: '100-119 mmHg', value: 1 },
      { label: '< 100 mmHg', value: 4 }
    ]},
    { id: 'hb', label: 'Hemoglobina', options: [
      { label: '>= 12 g/dL', value: 0 }, { label: '< 12 g/dL', value: 2 },
      { label: '< 11 g/dL', value: 3 }, { label: '< 10 g/dL', value: 4 },
      { label: '< 9 g/dL', value: 6 }, { label: '< 7 g/dL', value: 8 }
    ]},
    { id: 'fast', label: 'Liquido livre intra-abdominal (FAST)', options: [{ label: 'Negativo', value: 0 }, { label: 'Positivo', value: 3 }] },
    { id: 'fracture', label: 'Fratura instavel de pelve', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 6 }] },
    { id: 'hr', label: 'Frequencia cardiaca >= 120 bpm', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'be', label: 'Base excess <= -10', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 4 }] },
    { id: 'sex', label: 'Sexo masculino', options: [{ label: 'Feminino', value: 0 }, { label: 'Masculino', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score < 10) return interp('Baixa probabilidade', '#4CAF50', 'Probabilidade de transfusao macica < 10%. Manter monitoramento e reposição padrao.')
    if (score < 16) return interp('Probabilidade moderada', '#FFC107', 'Probabilidade de transfusao macica 10-50%. Considere reservar hemocomponentes e ativar protocolo.')
    return interp('Alta probabilidade', '#F44336', 'Probabilidade de transfusao macica > 50%. Ativar protocolo de transfusao macica imediatamente.')
  }
}

const pecarn: Calculator = {
  id: 'pecarn',
  name: 'PECARN',
  aliases: ['pecarn', 'tce', 'pediatrico', 'crianca', 'trauma craniano', 'tomografia pediatrica'],
  category: 'Trauma',
  type: 'score',
  description: 'Necessidade de TC de cranio em TCE leve pediatrico.',
  why: 'Reduz TC desnecessarias em criancas com TCE leve, evitando radiação sem perder lesoes clinicamente importantes.',
  whenToUse: 'Criancas com GCS 14-15 apos trauma craniano. Duas versoes: < 2 anos e >= 2 anos.',
  pearlsPitfalls: [
    'GCS < 14 = TC indicada independentemente do PECARN.',
    'Criterios diferentes para < 2 anos e >= 2 anos.',
    '< 2 anos: hematoma parietal/temporal nao frontal e mecanismo grave sao preditores.',
    '>= 2 anos: cefaleia intensa e sinais de fratura de base de cranio sao preditores.',
    'Risco muito baixo (todos negativos) = VPN > 99,9% para lesao intracraniana clinicamente importante.'
  ],
  reference: 'Kuppermann N et al. Identification of children at very low risk of clinically-important brain injuries after head trauma: a prospective cohort study. Lancet. 2009;374(9696):1160-70.',
  items: [
    {
      id: 'age_group', label: 'Faixa etaria',
      options: [
        { label: '< 2 anos', value: 0 },
        { label: '>= 2 anos', value: 1 }
      ]
    },
    { id: 'gcs_alt', label: 'GCS alterada (nao age-appropriate) ou estado mental alterado', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 4 }] },
    { id: 'skull', label: 'Fratura de cranio palpavel (< 2a) ou sinais de fratura de base (>= 2a)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 4 }] },
    { id: 'hematoma', label: 'Hematoma subgaleal nao frontal (< 2a) ou cefaleia intensa (>= 2a)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'loc', label: 'Perda de consciencia >= 5 segundos', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'mechanism', label: 'Mecanismo de trauma grave (queda > 90 cm em < 2a, > 1,5 m em >= 2a; MVC com ejecao/capotamento/obito; atropelamento; ciclista sem capacete)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'behavior', label: 'Comportamento nao habitual segundo os pais', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Risco muito baixo', '#4CAF50', 'Risco de lesao intracraniana clinicamente importante < 0,02%. TC geralmente nao recomendada. Observação e orientações de alta.')
    if (score <= 2) return interp('Risco intermediario', '#FFC107', 'Considere observação por 4-6h vs TC de cranio, conforme clinica e preferencia familiar.')
    return interp('Alto risco', '#F44336', 'TC de cranio recomendada. Risco de lesao intracraniana clinicamente importante elevado.')
  }
}

const mBig: Calculator = {
  id: 'mbig',
  name: 'mBIG Score',
  aliases: ['mbig', 'big', 'tce', 'pediatrico', 'criança', 'trauma craniano leve'],
  category: 'Trauma',
  type: 'score',
  description: 'Estratificacao de TCE leve pediatrico para necessidade de neuroimagem e internacao.',
  why: 'Complementa o PECARN com dados mais recentes, especialmente para decisao de internação.',
  whenToUse: 'TCE leve (GCS 13-15) em criancas para decidir entre observacao, TC e internacao.',
  pearlsPitfalls: [
    'Derivado de banco de dados multicêntrico pediatrico.',
    'Foca em achados clínicos de facil identificacao no DE.',
    'Nao substitui PECARN — usar em conjunto para decisao.',
    'Baixo risco = observação e alta segura.'
  ],
  reference: 'Borgialli DA et al. Performance of the Pediatric Glasgow Coma Scale Score in the Evaluation of Children With Blunt Head Trauma. Acad Emerg Med. 2016;23(8):878-84.',
  items: [
    { id: 'gcs', label: 'GCS', options: [
      { label: '15', value: 0 }, { label: '14', value: 1 }, { label: '13', value: 2 }
    ]},
    { id: 'skull_fx', label: 'Fratura de cranio suspeitada ou confirmada', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'scalp', label: 'Hematoma subgaleal', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'mechanism', label: 'Mecanismo grave', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Risco muito baixo', '#4CAF50', 'TC e internação provavelmente desnecessarias. Observação e orientações.')
    if (score <= 2) return interp('Risco baixo a moderado', '#FFC107', 'Considere TC de cranio. Observação prolongada se TC nao realizada.')
    return interp('Risco elevado', '#F44336', 'TC de cranio recomendada. Considere internação para observação.')
  }
}

const canadianCSpine: Calculator = {
  id: 'canadian-cspine',
  name: 'Canadian C-Spine Rule',
  aliases: ['c-spine', 'cervical', 'coluna', 'colar cervical', 'rx coluna', 'trauma cervical'],
  category: 'Trauma',
  type: 'score',
  description: 'Necessidade de imagem da coluna cervical em trauma com paciente alerta.',
  why: 'Reduz radiografias cervicais desnecessarias em > 40% mantendo sensibilidade de ~100% para lesao significativa.',
  whenToUse: 'Adultos alertas (GCS 15) e estáveis apos trauma com possivel lesao cervical.',
  pearlsPitfalls: [
    'So aplicavel se GCS 15, estavel e alerta.',
    'NAO usar em < 16 anos, trauma penetrante, doença espinhal conhecida ou gestantes.',
    'Pergunta 1: alto risco? Se sim → imagem. Se nao → Pergunta 2: baixo risco permite exame clínico? Se sim → Pergunta 3: rotação ativa >= 45 graus? Se sim e sem dor → sem imagem.',
    'Superior ao NEXUS em sensibilidade e especificidade.'
  ],
  reference: 'Stiell IG et al. The Canadian C-spine rule versus the NEXUS low-risk criteria in patients with trauma. N Engl J Med. 2003;349(26):2510-8.',
  items: [
    { id: 'high_risk', label: 'Fator de alto risco presente? (Idade >= 65, mecanismo perigoso, parestesia em extremidades)', options: [
      { label: 'Nao', value: 0 }, { label: 'Sim', value: 3 }
    ]},
    { id: 'low_risk', label: 'Se sem alto risco: fator de baixo risco presente que permita exame? (Colisao traseira simples, sentado no DE, deambulou, dor cervical tardia, ausencia de dor em linha media)', options: [
      { label: 'Nenhum fator de baixo risco (nao pode avaliar rotação)', value: 2 },
      { label: 'Sim, pelo menos 1 fator de baixo risco', value: 0 }
    ]},
    { id: 'rotation', label: 'Se baixo risco presente: rotação ativa >= 45 graus para ambos os lados sem dor?', options: [
      { label: 'Nao consegue / dor presente', value: 1 },
      { label: 'Sim, rotação sem dor bilateralmente', value: 0 }
    ]}
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Imagem cervical nao necessaria', '#4CAF50', 'Sensibilidade ~100%. Retirar imobilização cervical. Sem necessidade de radiografia/TC.')
    return interp('Imagem cervical recomendada', '#F44336', 'Manter imobilização. TC de coluna cervical recomendada (superior a radiografia simples).')
  }
}

const parkland: Calculator = {
  id: 'parkland',
  name: 'Formula de Parkland',
  aliases: ['parkland', 'queimadura', 'queimado', 'scq', 'reposição volemica', 'grande queimado'],
  category: 'Trauma',
  type: 'formula',
  description: 'Volume de reposição volemica nas primeiras 24h em grandes queimados.',
  why: 'Padrao-ouro para ressuscitacao volemica inicial em queimaduras. Previne choque hipovolemico.',
  whenToUse: 'Queimaduras >= 20% SCQ em adultos ou >= 10% SCQ em criancas, nas primeiras 24h.',
  pearlsPitfalls: [
    'Formula: 4 mL x peso (kg) x %SCQ. Metade nas primeiras 8h, metade nas 16h seguintes.',
    'Conta a partir da hora da queimadura, NAO da chegada ao hospital.',
    'Guiar reposição por diurese: adulto 0,5-1 mL/kg/h, crianca 1 mL/kg/h.',
    'Superestima volume em queimaduras > 50% SCQ — usar 50% como maximo.',
    'Queimadura por inalação pode exigir 30-40% mais volume.'
  ],
  reference: 'Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci. 1968;150(3):874-94.',
  inputs: [
    { id: 'weight', label: 'Peso', unit: 'kg', min: 1, max: 200, step: 0.5, inputMode: 'decimal' },
    { id: 'scq', label: 'Superficie corporal queimada', unit: '%', min: 1, max: 100, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const scq = Math.min(v.scq, 50) // Cap at 50%
    return Math.round(4 * v.weight * scq)
  },
  interpret: (score: number) => {
    const first8h = Math.round(score / 2)
    const next16h = score - first8h
    return interp(
      `Volume total 24h: ${score} mL`,
      '#2196F3',
      `Primeiras 8h (desde a queimadura): ${first8h} mL (${Math.round(first8h / 8)} mL/h). Proximas 16h: ${next16h} mL (${Math.round(next16h / 16)} mL/h). Guiar por diurese.`
    )
  }
}

// ==========================================
// HEMODINAMICA
// ==========================================

const dcVti: Calculator = {
  id: 'dc-vti',
  name: 'Débito Cardiaco por VTI',
  aliases: ['vti', 'débito cardíaco', 'lvot', 'ecocardiograma', 'cardiac output'],
  category: 'Hemodinamica',
  type: 'formula',
  description: 'Cálculo do débito cardíaco por ecocardiografia (VTI x area LVOT x FC).',
  why: 'Método não invasivo para estimar débito cardíaco a beira-leito com eco point-of-care.',
  whenToUse: 'Avaliação hemodinâmica de pacientes criticos com eco point-of-care.',
  pearlsPitfalls: [
    'LVOT e geralmente medido em janela paraesternal eixo longo (diametro em cm).',
    'VTI e medido no LVOT com Doppler pulsado na janela apical 5 camaras.',
    'DC normal: 4-8 L/min. IC normal: 2,5-4,0 L/min/m2.',
    'Erro mais comum: medida incorreta do diametro do LVOT (eleva ao quadrado).'
  ],
  reference: 'Defined by echocardiographic hemodynamic principles. Ref: Oh JK et al. The Echo Manual. 3rd ed.',
  inputs: [
    { id: 'vti', label: 'VTI (LVOT)', unit: 'cm', min: 1, max: 50, step: 0.1, inputMode: 'decimal' },
    { id: 'lvot', label: 'Diametro LVOT', unit: 'cm', min: 0.5, max: 4, step: 0.1, defaultValue: 2.0, inputMode: 'decimal' },
    { id: 'hr', label: 'Frequencia cardiaca', unit: 'bpm', min: 20, max: 250, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const area = Math.PI * Math.pow(v.lvot / 2, 2)
    const sv = area * v.vti // volume sistolico em cm3 = mL
    const co = (sv * v.hr) / 1000 // L/min
    return Math.round(co * 100) / 100
  },
  interpret: (score: number) => {
    if (score < 2.5) return interp(`DC: ${score} L/min — baixo`, '#F44336', 'Débito cardíaco reduzido. Considere causas de baixo débito e suporte inotrópico.')
    if (score <= 4.0) return interp(`DC: ${score} L/min — borderline`, '#FFC107', 'Débito cardíaco no limite inferior. Avaliar contexto clínico.')
    if (score <= 8.0) return interp(`DC: ${score} L/min — normal`, '#4CAF50', 'Débito cardíaco dentro da faixa normal (4-8 L/min).')
    return interp(`DC: ${score} L/min — elevado`, '#FFC107', 'Débito cardíaco elevado. Considere estados hiperdinâmicos (sepse, anemia, hipertireoidismo).')
  }
}

const gradienteAa: Calculator = {
  id: 'gradiente-aa',
  name: 'Gradiente Alveolo-Arterial (A-a)',
  aliases: ['gradiente', 'a-a', 'pao2', 'alveolar', 'hipoxemia', 'gasometria'],
  category: 'Hemodinamica',
  type: 'formula',
  description: 'Diferença entre O2 alveolar e arterial — identifica causa de hipoxemia.',
  why: 'Diferencia hipoxemia por hipoventilacao (gradiente normal) de shunt/V-Q mismatch (gradiente elevado).',
  whenToUse: 'Pacientes com hipoxemia para identificar causa: hipoventilacao vs shunt vs V-Q mismatch.',
  pearlsPitfalls: [
    'PAO2 = FiO2 x (Patm - PH2O) - PaCO2/QR. Usar Patm = 760, PH2O = 47, QR = 0,8.',
    'Gradiente normal esperado: (idade/4) + 4 mmHg (aproximação).',
    'Gradiente elevado com FiO2 100% que nao corrige = shunt verdadeiro.',
    'Nao aplicavel se paciente em ventilacao mecanica com FiO2 > 60% (impreciso).'
  ],
  reference: 'Respiratory physiology principles. Ref: West JB. Respiratory Physiology: The Essentials. 10th ed.',
  inputs: [
    { id: 'fio2', label: 'FiO2', unit: '%', min: 21, max: 100, step: 1, defaultValue: 21, inputMode: 'numeric' },
    { id: 'paco2', label: 'PaCO2', unit: 'mmHg', min: 10, max: 120, step: 0.1, inputMode: 'decimal' },
    { id: 'pao2', label: 'PaO2', unit: 'mmHg', min: 20, max: 600, step: 0.1, inputMode: 'decimal' },
    { id: 'age', label: 'Idade', unit: 'anos', min: 18, max: 120, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const pao2_alv = (v.fio2 / 100) * (760 - 47) - (v.paco2 / 0.8)
    const gradient = pao2_alv - v.pao2
    return Math.round(gradient * 10) / 10
  },
  interpret: (score: number, values?: Record<string, number>) => {
    const age = values?.age || 40
    const expected = Math.round(age / 4 + 4)
    if (score <= expected) return interp(`Gradiente A-a: ${score} mmHg (normal para idade)`, '#4CAF50', `Esperado para idade: ~${expected} mmHg. Hipoxemia por hipoventilacao (se presente). Considere causas centrais ou neuromusculares.`)
    return interp(`Gradiente A-a: ${score} mmHg (elevado)`, '#F44336', `Esperado para idade: ~${expected} mmHg. Gradiente elevado sugere: shunt, disturbio V/Q, ou comprometimento da difusao.`)
  }
}

const deltaGap: Calculator = {
  id: 'delta-gap',
  name: 'Delta Gap e Razao Delta/Delta',
  aliases: ['delta gap', 'delta delta', 'razao delta', 'anion gap', 'acidose metabolica', 'gasometria'],
  category: 'Hemodinamica',
  type: 'formula',
  description: 'Identifica disturbios acido-basicos mistos em acidose com AG elevado.',
  why: 'Em acidose metabolica com AG elevado, avalia se ha disturbio acido-basico concomitante oculto.',
  whenToUse: 'Pacientes com acidose metabolica e anion gap elevado para detectar disturbios mistos.',
  pearlsPitfalls: [
    'Delta Gap = (AG - 12) - (24 - HCO3). Se positivo, alcalose metabolica associada. Se negativo, acidose hipercloremca associada.',
    'Razao Delta = (AG - 12) / (24 - HCO3). Normal: 1-2.',
    'Razao > 2: alcalose metabolica coexistente.',
    'Razao < 1: acidose hipercloremca (AG normal) coexistente.',
    'AG corrigido para albumina: AG + 2,5 x (4,0 - albumina).'
  ],
  reference: 'Emmett M, Narins RG. Clinical use of the anion gap. Medicine (Baltimore). 1977;56(1):38-54.',
  inputs: [
    { id: 'ag', label: 'Anion Gap', unit: 'mEq/L', min: 0, max: 50, step: 0.1, inputMode: 'decimal' },
    { id: 'hco3', label: 'Bicarbonato (HCO3)', unit: 'mEq/L', min: 1, max: 50, step: 0.1, inputMode: 'decimal' }
  ],
  formula: (v) => {
    const deltaAG = v.ag - 12
    const deltaHCO3 = 24 - v.hco3
    if (deltaHCO3 === 0) return 999 // Avoid division by zero
    return Math.round((deltaAG / deltaHCO3) * 100) / 100
  },
  interpret: (score: number, values?: Record<string, number>) => {
    const ag = values?.ag || 12
    const hco3 = values?.hco3 || 24
    const deltaGap = (ag - 12) - (24 - hco3)
    if (score === 999) return interp('HCO3 normal', '#4CAF50', 'Bicarbonato normal. Calcular apenas se HCO3 reduzido.')
    if (score < 1) return interp(`Razao ${score} — acidose hipercloremca concomitante`, '#FFC107', `Delta Gap: ${deltaGap.toFixed(1)}. Razao < 1 sugere acidose metabolica com AG normal associada (hipercloremca).`)
    if (score <= 2) return interp(`Razao ${score} — acidose AG elevado pura`, '#4CAF50', `Delta Gap: ${deltaGap.toFixed(1)}. Razao entre 1-2 sugere acidose com AG elevado sem disturbio misto significativo.`)
    return interp(`Razao ${score} — alcalose metabolica concomitante`, '#FFC107', `Delta Gap: ${deltaGap.toFixed(1)}. Razao > 2 sugere alcalose metabolica associada.`)
  }
}

const shockIndex: Calculator = {
  id: 'shock-index',
  name: 'Indice de Choque',
  aliases: ['indice de choque', 'shock index', 'si', 'fc/pas', 'hemorragia', 'hipoperfusão'],
  category: 'Hemodinamica',
  type: 'formula',
  description: 'Relação FC/PAS como marcador precoce de instabilidade hemodinâmica.',
  why: 'Mais sensivel que FC ou PAS isolados para detectar hipovolemia precoce.',
  whenToUse: 'Triagem rápida de instabilidade hemodinâmica em trauma, hemorragia, sepse.',
  pearlsPitfalls: [
    'Normal: 0,5-0,7. >= 0,9 sugere choque.',
    'Indice > 1,0 em trauma = considere ativar protocolo de transfusao macica.',
    'Limitacoes: betabloqueadores, marca-passo, atletas, gestantes.',
    'Indice de choque modificado (ISM) inclui PAM — nao consensual.'
  ],
  reference: 'Allgower M, Burri C. Shock index. Dtsch Med Wochenschr. 1967;92(43):1947-50.',
  inputs: [
    { id: 'hr', label: 'Frequencia cardiaca', unit: 'bpm', min: 30, max: 250, step: 1, inputMode: 'numeric' },
    { id: 'sbp', label: 'Pressao arterial sistolica', unit: 'mmHg', min: 40, max: 300, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => Math.round((v.hr / v.sbp) * 100) / 100,
  interpret: (score: number) => {
    if (score < 0.7) return interp(`IC: ${score} — normal`, '#4CAF50', 'Indice de choque dentro da faixa normal.')
    if (score < 0.9) return interp(`IC: ${score} — limítrofe`, '#FFC107', 'Indice de choque no limite. Monitorar de perto.')
    if (score < 1.3) return interp(`IC: ${score} — choque provavel`, '#F44336', 'Instabilidade hemodinâmica provavel. Avaliar causa e iniciar ressuscitacao.')
    return interp(`IC: ${score} — choque grave`, '#F44336', 'Choque grave. Ressuscitacao agressiva imediata. Considere transfusao macica em trauma.')
  }
}

const pam: Calculator = {
  id: 'pam',
  name: 'Pressao Arterial Media (PAM)',
  aliases: ['pam', 'pressao arterial media', 'map', 'mean arterial pressure'],
  category: 'Hemodinamica',
  type: 'formula',
  description: 'Cálculo da pressao arterial media: (2xPAD + PAS) / 3.',
  why: 'PAM e o principal determinante da perfusão orgânica. Meta terapêutica em choque séptico e neuro.',
  whenToUse: 'Todo paciente critico para guiar metas hemodinâmicas.',
  pearlsPitfalls: [
    'Meta geral: PAM >= 65 mmHg (Surviving Sepsis Campaign).',
    'Neuro: PAM >= 80-85 mmHg em HSA com vasoespasmo.',
    'PAM < 60 mmHg = perfusão orgânica comprometida.',
    'Monitoramento invasivo (cateter arterial) mais preciso que auscultatório em choque.'
  ],
  reference: 'Surviving Sepsis Campaign 2021. Intensive Care Med. 2021;47(11):1181-247.',
  inputs: [
    { id: 'sbp', label: 'Pressao arterial sistolica', unit: 'mmHg', min: 40, max: 300, step: 1, inputMode: 'numeric' },
    { id: 'dbp', label: 'Pressao arterial diastolica', unit: 'mmHg', min: 20, max: 200, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => Math.round((2 * v.dbp + v.sbp) / 3),
  interpret: (score: number) => {
    if (score < 60) return interp(`PAM: ${score} mmHg — hipoperfusão`, '#F44336', 'Abaixo do limiar de perfusão orgânica. Considere vasopressores e reposição volemica.')
    if (score < 65) return interp(`PAM: ${score} mmHg — limítrofe`, '#FFC107', 'Proximo ao limiar minimo. Monitorar e considere intervencao.')
    if (score <= 100) return interp(`PAM: ${score} mmHg — adequada`, '#4CAF50', 'PAM dentro da meta terapêutica (>= 65 mmHg).')
    return interp(`PAM: ${score} mmHg — elevada`, '#FFC107', 'PAM elevada. Avaliar necessidade de controle pressórico.')
  }
}

// ==========================================
// RESPIRATORIO / SEPSE
// ==========================================

const curb65: Calculator = {
  id: 'curb65',
  name: 'CURB-65',
  aliases: ['curb', 'pneumonia', 'pac', 'pneumonia adquirida comunidade', 'mortalidade pneumonia'],
  category: 'Respiratorio / Sepse',
  type: 'score',
  description: 'Gravidade de pneumonia adquirida na comunidade e local de tratamento.',
  why: 'Rapido, sem laboratorio complexo. Guia decisao ambulatorio vs internacao vs UTI.',
  whenToUse: 'Pacientes com pneumonia adquirida na comunidade no DE.',
  pearlsPitfalls: [
    'CURB-65: Confusion, Urea > 42 mg/dL, Respiratory rate >= 30, Blood pressure (PAS < 90 ou PAD <= 60), >= 65 anos.',
    'CRB-65 (sem ureia) pode ser usado na atencao primaria.',
    'Score 0-1: tratamento ambulatorial. Score 2: internacao curta. Score >= 3: UTI.',
    'Nao avalia comorbidades ou fatores sociais — julgamento clínico sempre necessario.'
  ],
  reference: 'Lim WS et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003;58(5):377-82.',
  items: [
    { id: 'confusion', label: 'Confusao mental (nova desorientação em pessoa, tempo ou lugar)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'urea', label: 'Ureia > 42 mg/dL (>7 mmol/L)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'rr', label: 'Frequencia respiratoria >= 30 irpm', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'bp', label: 'Pressao arterial: PAS < 90 ou PAD <= 60 mmHg', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'age', label: 'Idade >= 65 anos', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score <= 1) return interp('Baixa gravidade', '#4CAF50', 'Mortalidade ~1,5%. Considere tratamento ambulatorial.')
    if (score === 2) return interp('Gravidade moderada', '#FFC107', 'Mortalidade ~9,2%. Considere internacao hospitalar curta ou observação.')
    return interp('Alta gravidade', '#F44336', `Mortalidade ~${score >= 4 ? '> 30' : '22'}%. Internação hospitalar recomendada. Score >= 4: considere UTI.`)
  }
}

const qsofa: Calculator = {
  id: 'qsofa',
  name: 'qSOFA',
  aliases: ['qsofa', 'quick sofa', 'sepse', 'sepsis', 'triagem sepse'],
  category: 'Respiratorio / Sepse',
  type: 'score',
  description: 'Triagem rápida de sepse fora da UTI.',
  why: 'Rapido (sem laboratorio), identifica pacientes com infecção em risco de desfecho ruim.',
  whenToUse: 'Triagem a beira-leito de pacientes com infecção suspeitada fora da UTI.',
  pearlsPitfalls: [
    'qSOFA >= 2 = investigar disfunção orgânica (SOFA completo).',
    'NAO e criterio diagnóstico de sepse — e ferramenta de triagem.',
    'Sensibilidade moderada — nao usar para excluir sepse.',
    'Tres criterios: FR >= 22, PAS <= 100, alteracao do nivel de consciencia (GCS < 15).'
  ],
  reference: 'Singer M et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-10.',
  items: [
    { id: 'rr', label: 'Frequencia respiratoria >= 22 irpm', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'sbp', label: 'Pressao arterial sistolica <= 100 mmHg', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'gcs', label: 'Alteração do nivel de consciencia (GCS < 15)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score < 2) return interp('qSOFA < 2', '#4CAF50', 'Baixo risco pela triagem. Nao exclui sepse — manter vigilancia clinica se infecção suspeitada.')
    return interp('qSOFA >= 2', '#F44336', 'Alto risco de desfecho ruim. Avaliar disfunção orgânica (SOFA). Considere coleta de lactato, hemoculturas e inicio precoce de antibioticos.')
  }
}

const sofa: Calculator = {
  id: 'sofa',
  name: 'SOFA Score',
  aliases: ['sofa', 'sequential organ failure', 'sepse', 'disfuncao orgânica', 'mortalidade uti'],
  category: 'Respiratorio / Sepse',
  type: 'score',
  description: 'Avaliacao sequencial de disfuncao orgânica — 6 orgaos, 0-24 pontos.',
  why: 'Define sepse (Sepsis-3): infecção + aumento >= 2 pontos no SOFA. Prediz mortalidade na UTI.',
  whenToUse: 'Pacientes com infecção suspeitada ou confirmada na UTI. Monitorar diariamente.',
  pearlsPitfalls: [
    'Variação do SOFA (delta-SOFA) >= 2 em relacao ao basal sugere sepse.',
    'SOFA basal presume-se 0 se sem disfunção orgânica previa.',
    'Inclui: PaO2/FiO2, plaquetas, bilirrubina, PAM/vasopressores, GCS, creatinina/diurese.',
    'SOFA >= 10 = mortalidade > 50%.',
    'Utero de cada sistema: avaliar o pior valor do dia.'
  ],
  reference: 'Vincent JL et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. Intensive Care Med. 1996;22(7):707-10.',
  items: [
    { id: 'resp', label: 'Respiratorio (PaO2/FiO2)', options: [
      { label: '>= 400', value: 0 }, { label: '300-399', value: 1 }, { label: '200-299', value: 2 },
      { label: '100-199 (com suporte ventilatorio)', value: 3 }, { label: '< 100 (com suporte ventilatorio)', value: 4 }
    ]},
    { id: 'coag', label: 'Coagulação (plaquetas x10^3/mm3)', options: [
      { label: '>= 150', value: 0 }, { label: '100-149', value: 1 }, { label: '50-99', value: 2 },
      { label: '20-49', value: 3 }, { label: '< 20', value: 4 }
    ]},
    { id: 'liver', label: 'Hepatico (bilirrubina mg/dL)', options: [
      { label: '< 1,2', value: 0 }, { label: '1,2-1,9', value: 1 }, { label: '2,0-5,9', value: 2 },
      { label: '6,0-11,9', value: 3 }, { label: '>= 12,0', value: 4 }
    ]},
    { id: 'cardio', label: 'Cardiovascular', options: [
      { label: 'PAM >= 70 mmHg', value: 0 }, { label: 'PAM < 70 mmHg', value: 1 },
      { label: 'Dopamina <= 5 ou dobutamina (qualquer dose)', value: 2 },
      { label: 'Dopamina > 5, epinefrina <= 0,1 ou norepinefrina <= 0,1', value: 3 },
      { label: 'Dopamina > 15, epinefrina > 0,1 ou norepinefrina > 0,1', value: 4 }
    ]},
    { id: 'neuro', label: 'Neurologico (GCS)', options: [
      { label: '15', value: 0 }, { label: '13-14', value: 1 }, { label: '10-12', value: 2 },
      { label: '6-9', value: 3 }, { label: '< 6', value: 4 }
    ]},
    { id: 'renal', label: 'Renal (creatinina mg/dL ou diurese)', options: [
      { label: '< 1,2', value: 0 }, { label: '1,2-1,9', value: 1 }, { label: '2,0-3,4', value: 2 },
      { label: '3,5-4,9 ou diurese < 500 mL/dia', value: 3 }, { label: '>= 5,0 ou diurese < 200 mL/dia', value: 4 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 3) return interp('Disfuncao leve', '#4CAF50', 'Mortalidade < 10%. Monitorar e repetir diariamente.')
    if (score <= 6) return interp('Disfuncao moderada', '#FFC107', 'Mortalidade ~10-20%. Investigar e tratar causa. Sepse se aumento >= 2 do basal.')
    if (score <= 9) return interp('Disfuncao grave', '#F44336', 'Mortalidade ~20-50%. Suporte organico intensivo.')
    return interp('Disfuncao muito grave', '#F44336', `Mortalidade > 50%. Suporte maximo. Considere cuidados paliativos se refratario.`)
  }
}

const tempoO2: Calculator = {
  id: 'tempo-o2',
  name: 'Tempo de O2 Torpedo',
  aliases: ['torpedo', 'o2', 'oxigenio', 'cilindro', 'transporte', 'autonomia'],
  category: 'Respiratorio / Sepse',
  type: 'formula',
  description: 'Autonomia de oxigenio em cilindro pressurizado (torpedo).',
  why: 'Essencial para planejar transporte intra e inter-hospitalar com segurança.',
  whenToUse: 'Antes de transporte de paciente em uso de O2 suplementar com torpedo.',
  pearlsPitfalls: [
    'Formula: (Volume cilindro x Pressao) / Fluxo. Volume em litros, pressao em bar ou psi.',
    'Torpedo padrao D: 340 L. Torpedo E: 680 L.',
    'Cilindro cheio = ~200 bar. Reserva de segurança: nao usar abaixo de 30 bar.',
    'Sempre superestimar o fluxo necessario (pacientes podem precisar de mais O2 durante transporte).',
    'Considere margem de segurança de 30% no cálculo.'
  ],
  reference: 'Standard respiratory therapy and transport oxygen calculations.',
  inputs: [
    { id: 'volume', label: 'Volume do cilindro', unit: 'litros', min: 1, max: 10000, step: 1, inputMode: 'numeric' },
    { id: 'pressure', label: 'Pressao atual', unit: 'bar', min: 1, max: 300, step: 1, inputMode: 'numeric' },
    { id: 'flow', label: 'Fluxo de O2', unit: 'L/min', min: 0.5, max: 60, step: 0.5, inputMode: 'decimal' }
  ],
  formula: (v) => {
    const totalLiters = v.volume * v.pressure
    const minutes = totalLiters / v.flow
    return Math.round(minutes)
  },
  interpret: (score: number) => {
    const hours = Math.floor(score / 60)
    const mins = score % 60
    if (score < 30) return interp(`Autonomia: ${score} min`, '#F44336', 'Autonomia critica. Insuficiente para transporte seguro. Trocar cilindro.')
    if (score < 60) return interp(`Autonomia: ${score} min`, '#FFC107', `Autonomia limitada. Planejar rota mais curta ou cilindro adicional.`)
    return interp(`Autonomia: ${hours}h${mins > 0 ? mins + 'min' : ''}`, '#4CAF50', `Autonomia de ${hours}h${mins > 0 ? mins + 'min' : ''}. Considere margem de segurança de 30%.`)
  }
}

// ==========================================
// TOXICOLOGIA
// ==========================================

const ciwaAr: Calculator = {
  id: 'ciwa-ar',
  name: 'CIWA-Ar',
  aliases: ['ciwa', 'abstinencia', 'alcoolismo', 'delirium tremens', 'síndrome de abstinencia'],
  category: 'Toxicologia',
  type: 'score',
  description: 'Gravidade da síndrome de abstinencia alcoolica e guia de tratamento com benzodiazepínicos.',
  why: 'Permite tratamento protocol-driven com benzodiazepínicos baseado em sintomas, evitando sub ou sobretratamento.',
  whenToUse: 'Pacientes com síndrome de abstinencia alcoolica confirmada ou suspeitada, para guiar doses de benzodiazepínicos.',
  pearlsPitfalls: [
    'Avaliar a cada 1-2h durante tratamento ativo.',
    'CIWA >= 8: considere benzodiazepínico.',
    'CIWA >= 20: abstinencia grave — risco de convulsao e delirium tremens.',
    'Nao e aplicavel em pacientes intubados ou nao cooperativos.',
    'Diazepam ou lorazepam sao as opcoes mais comuns para tratar.'
  ],
  reference: 'Sullivan JT et al. Assessment of alcohol withdrawal: the revised Clinical Institute Withdrawal Assessment for Alcohol scale (CIWA-Ar). Br J Addict. 1989;84(11):1353-7.',
  availableIn: { tool: 'Tox Path', route: '/tox' },
  items: [
    { id: 'nausea', label: 'Nausea e vomitos', options: [
      { label: 'Sem nausea ou vomitos (0)', value: 0 }, { label: 'Nausea leve sem vomitos (1-3)', value: 2 },
      { label: 'Nausea intermitente com ansia (4-6)', value: 5 }, { label: 'Nausea constante, ansia e vomitos (7)', value: 7 }
    ]},
    { id: 'tremor', label: 'Tremor (bracos estendidos, dedos separados)', options: [
      { label: 'Sem tremor (0)', value: 0 }, { label: 'Nao visivel, sentido nos dedos (1-3)', value: 2 },
      { label: 'Moderado, com bracos estendidos (4-6)', value: 5 }, { label: 'Grave, mesmo sem bracos estendidos (7)', value: 7 }
    ]},
    { id: 'sweat', label: 'Sudorese paroxistica', options: [
      { label: 'Sem sudorese visivel (0)', value: 0 }, { label: 'Sudorese leve, palmas umidas (1-3)', value: 2 },
      { label: 'Sudorese visivel na fronte (4-6)', value: 5 }, { label: 'Sudorese profusa (7)', value: 7 }
    ]},
    { id: 'anxiety', label: 'Ansiedade', options: [
      { label: 'Sem ansiedade, tranquilo (0)', value: 0 }, { label: 'Levemente ansioso (1-3)', value: 2 },
      { label: 'Moderadamente ansioso ou inquieto (4-6)', value: 5 }, { label: 'Panico, ansiedade grave (7)', value: 7 }
    ]},
    { id: 'agitation', label: 'Agitacao', options: [
      { label: 'Atividade normal (0)', value: 0 }, { label: 'Atividade um pouco acima do normal (1-3)', value: 2 },
      { label: 'Moderadamente inquieto e agitado (4-6)', value: 5 }, { label: 'Deambula durante a entrevista ou agitação constante (7)', value: 7 }
    ]},
    { id: 'tactile', label: 'Alterações tateis (prurido, queimacao, dormencia, formigamento)', options: [
      { label: 'Nenhuma (0)', value: 0 }, { label: 'Leve (1-2)', value: 1 },
      { label: 'Moderada (3-4)', value: 3 }, { label: 'Alucinações tateis continuas (5-7)', value: 6 }
    ]},
    { id: 'auditory', label: 'Alterações auditivas', options: [
      { label: 'Nenhuma (0)', value: 0 }, { label: 'Leve (sons mais agudos, assustam) (1-2)', value: 1 },
      { label: 'Moderada (3-4)', value: 3 }, { label: 'Alucinações auditivas continuas (5-7)', value: 6 }
    ]},
    { id: 'visual', label: 'Alterações visuais (sensibilidade a luz, visão alterada)', options: [
      { label: 'Nenhuma (0)', value: 0 }, { label: 'Leve (sensibilidade a luz) (1-2)', value: 1 },
      { label: 'Moderada (3-4)', value: 3 }, { label: 'Alucinações visuais continuas (5-7)', value: 6 }
    ]},
    { id: 'headache', label: 'Cefaleia, sensação de cabeça pesada', options: [
      { label: 'Nenhuma (0)', value: 0 }, { label: 'Leve (1-2)', value: 1 },
      { label: 'Moderada (3-4)', value: 3 }, { label: 'Grave (5-7)', value: 6 }
    ]},
    { id: 'orientation', label: 'Orientação e turvação da consciencia', options: [
      { label: 'Orientado, capaz de fazer soma seriada (0)', value: 0 },
      { label: 'Incerto sobre data (1)', value: 1 },
      { label: 'Desorientado em data (< 2 dias) (2)', value: 2 },
      { label: 'Desorientado em data (> 2 dias) (3)', value: 3 },
      { label: 'Desorientado em pessoa e/ou lugar (4)', value: 4 }
    ]}
  ],
  interpret: (score: number) => {
    if (score < 8) return interp('Abstinencia leve', '#4CAF50', 'CIWA < 8. Monitoramento a cada 4-8h. Benzodiazepínico geralmente nao necessario.')
    if (score < 16) return interp('Abstinencia moderada', '#FFC107', 'CIWA 8-15. Considere benzodiazepínico (ex: diazepam 5-10 mg VO). Reavaliar a cada 1-2h.')
    if (score < 20) return interp('Abstinencia moderada-grave', '#F44336', 'CIWA 16-19. Benzodiazepínico recomendado. Monitoramento proximo. Risco de convulsao.')
    return interp('Abstinencia grave', '#F44336', 'CIWA >= 20. Alto risco de delirium tremens e convulsao. Benzodiazepínico IV. Considere UTI.')
  }
}

// ==========================================
// FARMACOLOGIA
// ==========================================

const corticoidEquiv: Calculator = {
  id: 'corticoide-equiv',
  name: 'Equivalencia de corticoides',
  aliases: ['corticoide', 'cortisol', 'prednisona', 'dexametasona', 'hidrocortisona', 'metilprednisolona', 'equivalencia'],
  category: 'Farmacologia',
  type: 'formula',
  description: 'Tabela de conversão entre corticoides com potencias relativas.',
  why: 'Permite conversao segura entre diferentes corticoides mantendo equivalencia terapêutica.',
  whenToUse: 'Quando necessario trocar um corticoide por outro ou comparar doses entre esquemas.',
  pearlsPitfalls: [
    'Referência: prednisona 5 mg = 1 unidade de equivalencia.',
    'Potencia anti-inflamatoria e mineralocorticoide variam independentemente.',
    'Meia-vida e duracao de efeito devem ser consideradas na troca.',
    'Doses altas por tempo prolongado: considere desmame, nao suspensao abrupta.',
    'Tabela: Hidrocortisona 20 mg = Prednisona 5 mg = Metilprednisolona 4 mg = Dexametasona 0,75 mg.'
  ],
  reference: 'Schimmer BP, Funder JW. ACTH, adrenal steroids, and pharmacology of the adrenal cortex. In: Goodman & Gilman\'s The Pharmacological Basis of Therapeutics. 13th ed.',
  inputs: [
    { id: 'dose', label: 'Dose atual', unit: 'mg', min: 0.1, max: 2000, step: 0.1, inputMode: 'decimal' }
  ],
  selects: [
    { id: 'from', label: 'Corticoide de origem', options: [
      { label: 'Hidrocortisona (equiv. 20 mg)', value: 20 },
      { label: 'Cortisona (equiv. 25 mg)', value: 25 },
      { label: 'Prednisona (equiv. 5 mg)', value: 5 },
      { label: 'Prednisolona (equiv. 5 mg)', value: 5 },
      { label: 'Metilprednisolona (equiv. 4 mg)', value: 4 },
      { label: 'Triancinolona (equiv. 4 mg)', value: 4 },
      { label: 'Dexametasona (equiv. 0,75 mg)', value: 0.75 }
    ]}
  ],
  formula: (v) => {
    // Returns prednisone-equivalent dose
    const fromEquiv = v.from || 5
    return Math.round((v.dose / fromEquiv) * 5 * 100) / 100
  },
  interpret: (score: number) => {
    const hydro = Math.round(score * 4 * 100) / 100
    const methyl = Math.round(score * 0.8 * 100) / 100
    const dexa = Math.round(score * 0.15 * 100) / 100
    return interp(
      `Equivalencia em prednisona: ${score} mg`,
      '#2196F3',
      `Hidrocortisona: ${hydro} mg | Metilprednisolona: ${methyl} mg | Dexametasona: ${dexa} mg`
    )
  }
}

// ==========================================
// RENAL / METABOLICO
// ==========================================

const akinKdigo: Calculator = {
  id: 'akin-kdigo',
  name: 'AKIN/KDIGO',
  aliases: ['akin', 'kdigo', 'ira', 'insuficiencia renal', 'lesao renal aguda', 'creatinina'],
  category: 'Renal / Metabolico',
  type: 'classification',
  description: 'Estadiamento de lesao renal aguda por creatinina e diurese.',
  why: 'Criterios unificados KDIGO para classificar gravidade da IRA e guiar manejo.',
  whenToUse: 'Pacientes com aumento de creatinina ou oliguria para classificar estagio de IRA.',
  pearlsPitfalls: [
    'Estagio 1: Cr aumento >= 0,3 mg/dL ou 1,5-1,9x basal ou diurese < 0,5 mL/kg/h por 6-12h.',
    'Estagio 2: Cr 2,0-2,9x basal ou diurese < 0,5 mL/kg/h por >= 12h.',
    'Estagio 3: Cr >= 3x basal ou >= 4,0 mg/dL ou inicio de dialise ou diurese < 0,3 mL/kg/h por >= 24h ou anuria >= 12h.',
    'Creatinina basal: usar valor mais recente dos ultimos 7-90 dias.',
    'Diurese sozinha pode classificar IRA — nao depende apenas de creatinina.'
  ],
  reference: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2(1):1-138.',
  items: [
    {
      id: 'stage', label: 'Criterio de creatinina ou diurese (usar o pior)',
      options: [
        { label: 'Sem criterio de IRA', value: 0 },
        { label: 'Estagio 1: Cr >= 0,3 mg/dL acima do basal ou 1,5-1,9x basal ou diurese < 0,5 mL/kg/h por 6-12h', value: 1 },
        { label: 'Estagio 2: Cr 2,0-2,9x basal ou diurese < 0,5 mL/kg/h por >= 12h', value: 2 },
        { label: 'Estagio 3: Cr >= 3x basal ou >= 4,0 mg/dL ou dialise ou anuria >= 12h', value: 3 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Sem IRA', '#4CAF50', 'Nao preenche criterios de lesao renal aguda. Monitorar se fatores de risco.')
    if (score === 1) return interp('KDIGO Estagio 1', '#FFC107', 'IRA leve. Otimizar volemia, suspender nefrotoxicos, monitorar creatinina e diurese.')
    if (score === 2) return interp('KDIGO Estagio 2', '#F44336', 'IRA moderada. Monitoramento intensivo. Considere avaliacao nefrologica.')
    return interp('KDIGO Estagio 3', '#F44336', 'IRA grave. Avaliar indicação de terapia de substituição renal. Nefrologia urgente.')
  }
}

const correçãoNa: Calculator = {
  id: 'correção-na',
  name: 'Correção de Sodio (Katz)',
  aliases: ['sódio', 'hiponatremia', 'correção sódio', 'katz', 'nacio3'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Estima variação de sódio sérico apos infusão de solução salina.',
  why: 'Guia reposição segura de sódio em hiponatremia, prevenindo correção excessivamente rápida.',
  whenToUse: 'Pacientes com hiponatremia que necessitam correção com solução salina.',
  pearlsPitfalls: [
    'Formula de Adrogué-Madias: variação Na = (Na infusato - Na paciente) / (ACT + 1).',
    'ACT = peso x fator (0,6 homens, 0,5 mulheres, 0,45 idosos).',
    'Meta: corrigir no maximo 8-10 mEq/L nas primeiras 24h (risco de mielinolise).',
    'Hiponatremia grave sintomática: NaCl 3% 150 mL em 20 min, pode repetir ate 3x.',
    'Monitorar sódio a cada 2-4h durante correção ativa.'
  ],
  reference: 'Adrogué HJ, Madias NE. Hyponatremia. N Engl J Med. 2000;342(21):1581-9.',
  inputs: [
    { id: 'na_patient', label: 'Sodio do paciente', unit: 'mEq/L', min: 100, max: 160, step: 1, inputMode: 'numeric' },
    { id: 'na_infusate', label: 'Sodio do infusato', unit: 'mEq/L', min: 0, max: 855, step: 1, defaultValue: 513, inputMode: 'numeric' },
    { id: 'weight', label: 'Peso', unit: 'kg', min: 20, max: 200, step: 0.5, inputMode: 'decimal' },
    { id: 'act_factor', label: 'Fator de agua corporal total', unit: '', min: 0.4, max: 0.6, step: 0.05, defaultValue: 0.6, inputMode: 'decimal' }
  ],
  formula: (v) => {
    const act = v.weight * v.act_factor
    const delta = (v.na_infusate - v.na_patient) / (act + 1)
    return Math.round(delta * 100) / 100
  },
  interpret: (score: number) => {
    return interp(
      `Variacao estimada: ${score} mEq/L por litro de infusato`,
      '#2196F3',
      `Cada litro de infusato eleva o sódio sérico em ~${score} mEq/L. Meta: não ultrapassar 8-10 mEq/L em 24h. NaCl 3% = 513 mEq/L. SF 0,9% = 154 mEq/L.`
    )
  }
}

const deficitAgua: Calculator = {
  id: 'deficit-agua',
  name: 'Deficit de Agua Livre',
  aliases: ['deficit agua', 'hipernatremia', 'agua livre', 'desidratacao'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Cálculo do deficit de agua livre em hipernatremia.',
  why: 'Estima volume de agua livre necessario para normalizar sódio sérico.',
  whenToUse: 'Pacientes com hipernatremia (Na > 145 mEq/L) para planejar reposição.',
  pearlsPitfalls: [
    'Formula: ACT x (Na atual/140 - 1). ACT = peso x fator.',
    'Corrigir no maximo 10-12 mEq/L em 24h para evitar edema cerebral.',
    'Nao esquecer de repor perdas insensíveis e urinarias em andamento.',
    'Hipernatremia cronica (> 48h): correção lenta. Aguda (< 48h): pode corrigir mais rapido.'
  ],
  reference: 'Adrogué HJ, Madias NE. Hypernatremia. N Engl J Med. 2000;342(20):1493-9.',
  inputs: [
    { id: 'na', label: 'Sodio atual', unit: 'mEq/L', min: 130, max: 200, step: 1, inputMode: 'numeric' },
    { id: 'weight', label: 'Peso', unit: 'kg', min: 20, max: 200, step: 0.5, inputMode: 'decimal' },
    { id: 'act_factor', label: 'Fator de agua corporal total', unit: '', min: 0.4, max: 0.6, step: 0.05, defaultValue: 0.6, inputMode: 'decimal' }
  ],
  formula: (v) => {
    const act = v.weight * v.act_factor
    const deficit = act * ((v.na / 140) - 1)
    return Math.round(deficit * 100) / 100
  },
  interpret: (score: number) => {
    return interp(
      `Deficit de agua livre: ${score} L`,
      '#2196F3',
      `Repor ${score} litros de agua livre. Corrigir maximo 10-12 mEq/L em 24h. Adicionar perdas insensíveis em andamento. Usar SG 5% ou agua livre via enteral.`
    )
  }
}

const osmolaridade: Calculator = {
  id: 'osmolaridade',
  name: 'Osmolaridade Serica Calculada',
  aliases: ['osmolaridade', 'osmolalidade', 'gap osmotico', 'gap osmolar', 'intoxicacao'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Calcula osmolaridade serica e gap osmolar.',
  why: 'Gap osmolar elevado sugere presença de osmol nao medido (metanol, etilenoglicol, etanol).',
  whenToUse: 'Suspeita de intoxicacao por alcool toxico, avaliacao de disturbios osmolares.',
  pearlsPitfalls: [
    'Formula: 2 x Na + glicose/18 + ureia/6 (em mg/dL).',
    'Gap osmolar = osmolaridade medida - osmolaridade calculada.',
    'Gap > 10 mOsm/kg: considere alcool toxico (metanol, etilenoglicol).',
    'Etanol contribui: cada 100 mg/dL de etanol = ~22 mOsm.',
    'Acidose metabolica AG elevado + gap osmolar elevado = intoxicação por alcool toxico ate que se prove o contrario.'
  ],
  reference: 'Kraut JA, Kurtz I. Toxic alcohol ingestions: clinical features, diagnosis, and management. Clin J Am Soc Nephrol. 2008;3(1):208-25.',
  inputs: [
    { id: 'na', label: 'Sodio', unit: 'mEq/L', min: 100, max: 180, step: 1, inputMode: 'numeric' },
    { id: 'glucose', label: 'Glicose', unit: 'mg/dL', min: 20, max: 1000, step: 1, inputMode: 'numeric' },
    { id: 'urea', label: 'Ureia', unit: 'mg/dL', min: 1, max: 300, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    return Math.round((2 * v.na + v.glucose / 18 + v.urea / 6) * 10) / 10
  },
  interpret: (score: number) => {
    if (score < 275) return interp(`Osmolaridade: ${score} mOsm/L — hipoosmolar`, '#FFC107', 'Osmolaridade abaixo do normal (275-295). Investigar causa de hiponatremia/hipoosmolaridade.')
    if (score <= 295) return interp(`Osmolaridade: ${score} mOsm/L — normal`, '#4CAF50', 'Osmolaridade dentro da faixa normal (275-295 mOsm/L).')
    return interp(`Osmolaridade: ${score} mOsm/L — hiperosmolar`, '#F44336', 'Osmolaridade elevada. Calcule gap osmolar (medida - calculada). Gap > 10 = considere alcool toxico.')
  }
}

// ==========================================
// VASCULAR
// ==========================================

const addRs: Calculator = {
  id: 'add-rs',
  name: 'ADD-RS (Aortic Dissection Detection Risk Score)',
  aliases: ['add', 'disseccao', 'aortica', 'dissecção aortica', 'dor torácica rasgando'],
  category: 'Vascular',
  type: 'score',
  description: 'Estratificação de risco pre-teste para dissecção aguda de aorta.',
  why: 'Guia necessidade de angioTC ou D-dimero para investigação de dissecção aórtica no DE.',
  whenToUse: 'Pacientes com dor torácica, dorsal ou abdominal aguda sugestiva de dissecção.',
  pearlsPitfalls: [
    'ADD-RS 0 + D-dimero negativo: pode excluir dissecção com segurança.',
    'ADD-RS >= 1: angioTC recomendada (D-dimero nao exclui).',
    'Avalia 3 dominios: condicoes de alto risco, dor de alto risco, achados de alto risco.',
    'Cada dominio pontua 0 ou 1 — score total 0-3.',
    'Sensibilidade elevada quando combinado com D-dimero.'
  ],
  reference: 'Defined by: Rogers AM et al. Sensitivity of the aortic dissection detection risk score (ADD-RS), a novel guideline-based tool for identification of acute aortic dissection at initial presentation. Circulation. 2011;123(20):2213-8.',
  items: [
    { id: 'condition', label: 'Condicoes de alto risco (qualquer): Marfan, Ehlers-Danlos, historia familiar de doenca aortica, valva aortica bicuspide, cirurgia cardiaca ou aortica previa, aneurisma de aorta conhecido', options: [
      { label: 'Nenhuma', value: 0 }, { label: 'Pelo menos 1 presente', value: 1 }
    ]},
    { id: 'pain', label: 'Dor de alto risco (qualquer): dor torácica/dorsal/abdominal de inicio abrupto, dor de forte intensidade, dor tipo "rasgando" ou "dilacerando"', options: [
      { label: 'Nenhuma', value: 0 }, { label: 'Pelo menos 1 presente', value: 1 }
    ]},
    { id: 'exam', label: 'Achados de alto risco ao exame (qualquer): deficit de perfusão (assimetria de PA > 20 mmHg, deficit de pulso, deficit neurologico focal), sopro diastolico aortico novo, hipotensao/choque', options: [
      { label: 'Nenhum', value: 0 }, { label: 'Pelo menos 1 presente', value: 1 }
    ]}
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('ADD-RS 0 — baixo risco', '#4CAF50', 'Se D-dimero < 500 ng/mL: dissecção aortica excluída com segurança. Se D-dimero positivo: considere angioTC.')
    if (score === 1) return interp('ADD-RS 1 — risco intermediario', '#FFC107', 'D-dimero pode ser considerado, mas angioTC e preferida. Se D-dimero positivo: angioTC obrigatoria.')
    return interp('ADD-RS >= 2 — alto risco', '#F44336', 'AngioTC recomendada diretamente, sem aguardar D-dimero. D-dimero nao exclui.')
  }
}

const caprini: Calculator = {
  id: 'caprini',
  name: 'Caprini Score',
  aliases: ['caprini', 'tev', 'tvp', 'trombose venosa', 'profilaxia', 'tromboprofilaxia'],
  category: 'Vascular',
  type: 'score',
  description: 'Risco de tromboembolismo venoso em pacientes cirurgicos para guiar profilaxia.',
  why: 'Estratifica pacientes cirurgicos para definir tipo e duracao de tromboprofilaxia.',
  whenToUse: 'Pacientes cirurgicos (pre ou pos-operatorio) para decidir sobre tromboprofilaxia.',
  pearlsPitfalls: [
    'Score 0-1: deambulação precoce. Score 2: profilaxia mecanica (meias ou compressão). Score 3-4: farmacológica. Score >= 5: farmacológica estendida.',
    'Cada fator pontua 1-5 pontos conforme gravidade.',
    'Incluir comorbidades, tipo de cirurgia, mobilidade e historia previa.',
    'Profilaxia estendida (4 semanas) em cirurgias oncologicas de grande porte.'
  ],
  reference: 'Caprini JA. Thrombosis risk assessment as a guide to quality patient care. Dis Mon. 2005;51(2-3):70-8.',
  items: [
    { id: 'age', label: 'Idade', options: [
      { label: '< 41 anos', value: 0 }, { label: '41-60 anos', value: 1 }, { label: '61-74 anos', value: 2 }, { label: '>= 75 anos', value: 3 }
    ]},
    { id: 'surgery', label: 'Tipo de cirurgia', options: [
      { label: 'Sem cirurgia / cirurgia menor', value: 0 },
      { label: 'Cirurgia de grande porte (> 45 min)', value: 2 },
      { label: 'Cirurgia de grande porte (> 45 min) com artroplastia ou fratura de quadril/pelve/perna', value: 5 }
    ]},
    { id: 'immobility', label: 'Imobilidade', options: [
      { label: 'Deambulando', value: 0 }, { label: 'Restrição ao leito > 72h', value: 2 }
    ]},
    { id: 'bmi', label: 'IMC > 25', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'vte_hx', label: 'Historia de TVP/TEP', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 3 }] },
    { id: 'family', label: 'Historia familiar de TEV', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 3 }] },
    { id: 'cancer', label: 'Neoplasia ativa', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'varicose', label: 'Varizes de membros inferiores', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'pregnancy', label: 'Gestacao ou puerperio', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'sepsis', label: 'Sepse (< 1 mes)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'pneumonia', label: 'Doenca pulmonar grave (incluindo pneumonia < 1 mes)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'chf', label: 'ICC (< 1 mes)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'iam', label: 'IAM (< 1 mes)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'stroke', label: 'AVC (< 1 mes)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 5 }] },
    { id: 'cvc', label: 'Acesso venoso central', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] }
  ],
  interpret: (score: number) => {
    if (score <= 1) return interp('Risco muito baixo', '#4CAF50', 'TEV em 60 dias: < 0,5%. Deambulacao precoce. Profilaxia farmacologica geralmente desnecessaria.')
    if (score === 2) return interp('Risco baixo', '#4CAF50', 'TEV em 60 dias: ~1,5%. Profilaxia mecanica (meias compressivas ou CPI).')
    if (score <= 4) return interp('Risco moderado', '#FFC107', 'TEV em 60 dias: ~3%. Profilaxia farmacologica (heparina ou HBPM) + mecanica.')
    return interp('Risco alto', '#F44336', `TEV em 60 dias: ~6%. Profilaxia farmacologica + mecanica. Score >= 5 com cirurgia oncologica: considere profilaxia estendida (4 semanas).`)
  }
}

// ==========================================
// PROCEDIMENTOS
// ==========================================

const posicaoCvc: Calculator = {
  id: 'posicao-cvc',
  name: 'Posicionamento de CVC',
  aliases: ['cvc', 'cateter venoso central', 'posicao', 'profundidade', 'jugular', 'subclavia', 'femoral'],
  category: 'Procedimentos',
  type: 'classification',
  description: 'Profundidade estimada de insercao de cateter venoso central por sitio de acesso.',
  why: 'Previne complicacoes por posicionamento muito profundo (arritmia, perfuração) ou superficial (mau funcionamento).',
  whenToUse: 'Durante insercao de CVC para estimar profundidade ideal antes da confirmacao radiologica.',
  pearlsPitfalls: [
    'Ponta ideal: juncao cava superior-atrio direito (~T4-T5 na radiografia).',
    'Jugular interna direita: 12-15 cm. Jugular interna esquerda: 15-18 cm.',
    'Subclavia direita: 13-15 cm. Subclavia esquerda: 15-18 cm.',
    'Femoral: 20-25 cm (ponta na VCI infra-renal para hemodialise).',
    'Sempre confirmar posicao com radiografia de torax pos-procedimento.',
    'Altura do paciente influencia: pacientes mais altos = profundidade maior.'
  ],
  reference: 'Lum P. A new formula-based measurement guide for optimal positioning of central venous catheters. JAVA. 2004;9(2):80-5. Czepizak CA et al. Optimal depth of central venous catheter insertion. Chest. 1995;107(6):1662-4.',
  items: [
    {
      id: 'site', label: 'Sitio de acesso',
      options: [
        { label: 'Jugular interna direita — 12-15 cm', value: 1 },
        { label: 'Jugular interna esquerda — 15-18 cm', value: 2 },
        { label: 'Subclavia direita — 13-15 cm', value: 3 },
        { label: 'Subclavia esquerda — 15-18 cm', value: 4 },
        { label: 'Femoral — 20-25 cm (hemodialise: ponta VCI infra-renal)', value: 5 }
      ]
    }
  ],
  interpret: (score: number) => {
    const depths: Record<number, string> = {
      1: 'JID: 12-15 cm. Ponta ideal na juncao VCS-AD.',
      2: 'JIE: 15-18 cm. Atravessa veia braquiocefalica — mais longo que direita.',
      3: 'SCD: 13-15 cm. Entrada pela veia subclavia direita.',
      4: 'SCE: 15-18 cm. Caminho mais longo via braquiocefalica esquerda.',
      5: 'Femoral: 20-25 cm. Para hemodialise: ponta na VCI infra-renal.'
    }
    return interp('Profundidade estimada', '#2196F3', `${depths[score] || 'Selecione o sitio de acesso.'} Sempre confirmar com radiografia de torax.`)
  }
}

// ==========================================
// VIA AEREA
// ==========================================

const cormackLehane: Calculator = {
  id: 'cormack-lehane',
  name: 'Cormack-Lehane',
  aliases: ['cormack', 'lehane', 'laringoscopia', 'via aerea', 'intubacao', 'visualizacao'],
  category: 'Via Aerea',
  type: 'classification',
  description: 'Classificação da visualizacao laringoscopica durante intubacao orotraqueal.',
  why: 'Padrao universal para comunicar dificuldade de visualizacao glotica entre equipes.',
  whenToUse: 'Durante laringoscopia direta ou videolaringoscopia para registrar grau de visualizacao.',
  pearlsPitfalls: [
    'Grau I: cordas vocais completamente visiveis — intubacao facil.',
    'Grau II: visualizacao parcial das cordas vocais — geralmente possivel com bougie.',
    'Grau III: apenas epiglote visivel — considere bougie ou dispositivo supraglotico.',
    'Grau IV: nem epiglote visivel — via aerea dificil, considere plano alternativo.',
    'Manipulacao laringea externa (BURP) pode melhorar a visualizacao em 1 grau.'
  ],
  reference: 'Cormack RS, Lehane J. Difficult tracheal intubation in obstetrics. Anaesthesia. 1984;39(11):1105-11.',
  items: [
    {
      id: 'grade',
      label: 'Visualizacao laringoscopica',
      options: [
        { label: 'Grau I — cordas vocais completamente visiveis', value: 1 },
        { label: 'Grau II — visualizacao parcial das cordas vocais (comissura posterior)', value: 2 },
        { label: 'Grau III — apenas epiglote visivel, cordas vocais nao visiveis', value: 3 },
        { label: 'Grau IV — nem epiglote visivel (apenas palato mole)', value: 4 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 1) return interp('Grau I — visualizacao completa', '#4CAF50', 'Cordas vocais completamente visiveis. Intubacao geralmente facil.')
    if (score === 2) return interp('Grau II — visualizacao parcial', '#4CAF50', 'Visualizacao parcial das cordas vocais. Intubacao geralmente possivel; considere bougie se dificuldade.')
    if (score === 3) return interp('Grau III — apenas epiglote', '#FFC107', 'Apenas epiglote visivel. Considere bougie, videolaringoscopio ou dispositivo supraglotico.')
    return interp('Grau IV — sem visualizacao', '#F44336', 'Nem epiglote visivel. Via aerea dificil. Considere dispositivo supraglotico, cricotireoidostomia se emergência.')
  }
}

const mallampati: Calculator = {
  id: 'mallampati',
  name: 'Mallampati',
  aliases: ['mallampati', 'via aerea', 'avaliacao', 'intubacao dificil', 'preoperatorio'],
  category: 'Via Aerea',
  type: 'classification',
  description: 'Classificação da orofaringe para predição de via aerea dificil.',
  why: 'Avaliacao pre-intubacao rápida que ajuda a prever dificuldade de laringoscopia.',
  whenToUse: 'Avaliacao pre-intubacao de qualquer paciente para estimar dificuldade de via aerea.',
  pearlsPitfalls: [
    'Classe I: pilares, palato mole e uvula completamente visiveis.',
    'Classe II: pilares e palato mole visiveis, uvula parcialmente visivel.',
    'Classe III: apenas palato mole visivel.',
    'Classe IV: apenas palato duro visivel.',
    'Mallampati III-IV isolado tem sensibilidade limitada (~50%) — usar com outros preditores.',
    'Avaliar com paciente sentado, boca aberta, lingua protrusa, sem fonacao.'
  ],
  reference: 'Mallampati SR et al. A clinical sign to predict difficult tracheal intubation: a prospective study. Can Anaesth Soc J. 1985;32(4):429-34.',
  items: [
    {
      id: 'class',
      label: 'Classificação orofaringea',
      options: [
        { label: 'Classe I — pilares amigdalianos, palato mole e uvula completamente visiveis', value: 1 },
        { label: 'Classe II — pilares e palato mole visiveis, uvula parcialmente visivel', value: 2 },
        { label: 'Classe III — apenas palato mole visivel', value: 3 },
        { label: 'Classe IV — apenas palato duro visivel', value: 4 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 1) return interp('Classe I — baixo risco', '#4CAF50', 'Via aerea provavelmente facil. Uvula e pilares completamente visiveis.')
    if (score === 2) return interp('Classe II — risco baixo a moderado', '#4CAF50', 'Via aerea geralmente sem dificuldade significativa.')
    if (score === 3) return interp('Classe III — risco moderado a alto', '#FFC107', 'Visualizacao limitada. Considere videolaringoscopio e bougie disponivel.')
    return interp('Classe IV — alto risco', '#F44336', 'Alta probabilidade de via aerea dificil. Planejar abordagem alternativa. Ter dispositivo supraglotico e cricotireoidostomia acessiveis.')
  }
}

// ==========================================
// INFECCAO
// ==========================================

const centorMcisaac: Calculator = {
  id: 'centor-mcisaac',
  name: 'Centor/McIsaac',
  aliases: ['centor', 'mcisaac', 'faringite', 'amigdalite', 'dor de garganta', 'streptococcus', 'teste rapido'],
  category: 'Infeccao',
  type: 'score',
  description: 'Probabilidade de faringite estreptococica e indicacao de teste ou tratamento.',
  why: 'Reduz uso desnecessario de antibioticos em faringite, orientando solicitacao de teste rapido ou cultura.',
  whenToUse: 'Pacientes com faringite aguda para decidir entre tratamento empirico, teste rapido ou observacao.',
  pearlsPitfalls: [
    '0-1 ponto: risco de Strep A < 10%. Nao testar, nao tratar.',
    '2-3 pontos: risco 15-30%. Considere teste rapido; tratar se positivo.',
    '4-5 pontos: risco 50-60%. Considere tratamento empirico ou teste rapido.',
    'McIsaac adicionou ajuste por idade (bonus < 15 anos, penalidade >= 45 anos).',
    'Antibiotico de escolha: penicilina V ou amoxicilina por 10 dias.'
  ],
  reference: 'McIsaac WJ et al. A clinical score to reduce unnecessary antibiotic use in patients with sore throat. CMAJ. 1998;158(1):75-83.',
  items: [
    { id: 'temp', label: 'Temperatura >= 38 graus Celsius', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'cough', label: 'Ausencia de tosse', options: [{ label: 'Tosse presente', value: 0 }, { label: 'Sem tosse', value: 1 }] },
    { id: 'nodes', label: 'Linfonodos cervicais anteriores dolorosos e aumentados', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'exudate', label: 'Exsudato ou edema amigdaliano', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'age', label: 'Idade (ajuste de McIsaac)', options: [
      { label: '3-14 anos (+1)', value: 1 },
      { label: '15-44 anos (0)', value: 0 },
      { label: '>= 45 anos (-1)', value: -1 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 0) return interp('Risco muito baixo', '#4CAF50', 'Probabilidade de Strep A < 5%. Teste rapido e antibiotico geralmente desnecessarios. Tratamento sintomatico.')
    if (score === 1) return interp('Risco baixo', '#4CAF50', 'Probabilidade de Strep A ~5-10%. Teste rapido e antibiotico geralmente desnecessarios.')
    if (score <= 3) return interp('Risco moderado', '#FFC107', 'Probabilidade de Strep A ~15-30%. Considere teste rapido; tratar apenas se positivo.')
    return interp('Risco alto', '#F44336', 'Probabilidade de Strep A ~50-60%. Considere tratamento empirico com penicilina ou amoxicilina, ou teste rapido antes.')
  }
}

// ==========================================
// SEDACAO / DOR
// ==========================================

const rass: Calculator = {
  id: 'rass',
  name: 'RASS (Richmond Agitation-Sedation Scale)',
  aliases: ['rass', 'richmond', 'sedacao', 'agitacao', 'nivel de sedacao', 'uti'],
  category: 'Sedacao / Dor',
  type: 'classification',
  description: 'Escala padronizada de sedacao e agitacao para pacientes criticos.',
  why: 'Referencia para titulacao de sedativos na UTI e pre-requisito para avaliacao de delirium (CAM-ICU).',
  whenToUse: 'Avaliacao de nivel de sedacao/agitacao em pacientes de UTI, especialmente sob ventilacao mecanica.',
  pearlsPitfalls: [
    'RASS 0 = alerta e calmo. Meta habitual: RASS -2 a 0.',
    'RASS -3: necessario para aplicar CAM-ICU (paciente responde a voz).',
    'RASS -4 e -5: sedacao profunda — nao aplicar CAM-ICU.',
    'RASS +1 a +4: agitacao — avaliar causa (dor, delirium, hipoxia) antes de sedar.',
    'Avaliar a cada 4h ou conforme protocolo institucional.'
  ],
  reference: 'Sessler CN et al. The Richmond Agitation-Sedation Scale: validity and reliability in adult intensive care unit patients. Am J Respir Crit Care Med. 2002;166(10):1338-44.',
  items: [
    {
      id: 'level',
      label: 'Nivel de sedacao/agitacao',
      options: [
        { label: '+4 Combativo — violento, perigo imediato para equipe', value: 4 },
        { label: '+3 Muito agitado — puxa ou remove tubos/cateteres, agressivo', value: 3 },
        { label: '+2 Agitado — movimentos frequentes sem proposito, assincronia com ventilador', value: 2 },
        { label: '+1 Inquieto — ansioso mas sem movimentos agressivos ou vigorosos', value: 1 },
        { label: '0 Alerta e calmo', value: 0 },
        { label: '-1 Sonolento — nao completamente alerta, mas desperta sustentadamente ao estimulo verbal (> 10s)', value: -1 },
        { label: '-2 Sedacao leve — desperta brevemente ao estimulo verbal, contato visual (< 10s)', value: -2 },
        { label: '-3 Sedacao moderada — movimento ou abertura ocular ao estimulo verbal, sem contato visual', value: -3 },
        { label: '-4 Sedacao profunda — sem resposta ao estimulo verbal, movimento ou abertura ocular ao estimulo fisico', value: -4 },
        { label: '-5 Nao despertavel — sem resposta a estimulo verbal ou fisico', value: -5 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score >= 3) return interp(`RASS +${score} — agitacao grave`, '#F44336', 'Agitacao grave. Investigar causa (dor, delirium, hipoxia, abstinencia). Considere tratamento da causa antes de sedacao.')
    if (score >= 1) return interp(`RASS +${score} — agitacao leve`, '#FFC107', 'Agitacao leve a moderada. Avaliar causa. Medidas nao farmacologicas primeiro.')
    if (score === 0) return interp('RASS 0 — alerta e calmo', '#4CAF50', 'Estado ideal na maioria dos cenarios. Meta atingida.')
    if (score >= -2) return interp(`RASS ${score} — sedacao leve`, '#4CAF50', 'Sedacao leve. Meta habitual para maioria dos pacientes em VM (-2 a 0).')
    if (score === -3) return interp('RASS -3 — sedacao moderada', '#FFC107', 'Sedacao moderada. Aplicavel o CAM-ICU. Considere reduzir sedacao se possivel.')
    return interp(`RASS ${score} — sedacao profunda`, '#F44336', 'Sedacao profunda. Nao aplicar CAM-ICU. Considere reduzir sedacao se nao houver indicacao de sedacao profunda.')
  }
}

const bps: Calculator = {
  id: 'bps',
  name: 'BPS (Behavioral Pain Scale)',
  aliases: ['bps', 'dor', 'sedacao', 'uti', 'intubado', 'behavioral pain'],
  category: 'Sedacao / Dor',
  type: 'score',
  description: 'Avaliacao comportamental de dor em pacientes sedados ou intubados.',
  why: 'Permite identificar dor em pacientes que nao conseguem comunicar verbalmente.',
  whenToUse: 'Pacientes intubados ou sedados na UTI para guiar analgesia.',
  pearlsPitfalls: [
    'BPS 3 = sem dor. BPS > 5 = dor significativa, considere analgesia.',
    'Avaliar expressao facial, movimentos de membros superiores e sincronia com ventilador.',
    'Não usar se bloqueio neuromuscular (paciente nao pode expressar dor).',
    'Avaliar antes, durante e apos procedimentos dolorosos.',
    'Meta: BPS <= 5 (ou conforme protocolo institucional).'
  ],
  reference: 'Payen JF et al. Assessing pain in critically ill sedated patients by using a behavioral pain scale. Crit Care Med. 2001;29(12):2258-63.',
  items: [
    { id: 'face', label: 'Expressao facial', options: [
      { label: 'Relaxada', value: 1 },
      { label: 'Parcialmente tensa (ex: sobrancelhas franzidas)', value: 2 },
      { label: 'Totalmente tensa (ex: palpebras cerradas)', value: 3 },
      { label: 'Careta/esgar', value: 4 }
    ]},
    { id: 'upper', label: 'Membros superiores', options: [
      { label: 'Sem movimento', value: 1 },
      { label: 'Parcialmente fletidos', value: 2 },
      { label: 'Totalmente fletidos com flexao de dedos', value: 3 },
      { label: 'Permanentemente retraidos', value: 4 }
    ]},
    { id: 'ventilator', label: 'Sincronia com ventilador', options: [
      { label: 'Tolerando ventilacao', value: 1 },
      { label: 'Tossindo, mas tolerando na maior parte do tempo', value: 2 },
      { label: 'Lutando contra o ventilador', value: 3 },
      { label: 'Incapaz de controlar ventilacao', value: 4 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 3) return interp('BPS 3 — sem dor', '#4CAF50', 'Sem evidencia comportamental de dor.')
    if (score <= 5) return interp(`BPS ${score} — dor leve`, '#4CAF50', 'Dor leve. Manter analgesia atual. Reavaliar regularmente.')
    if (score <= 8) return interp(`BPS ${score} — dor moderada`, '#FFC107', 'Dor moderada. Considere ajuste de analgesia. Avaliar causa.')
    return interp(`BPS ${score} — dor intensa`, '#F44336', 'Dor intensa. Analgesia urgente recomendada. Investigar causa e tratar.')
  }
}

const evaNrs: Calculator = {
  id: 'eva-nrs',
  name: 'EVA/NRS (Escala de Dor)',
  aliases: ['eva', 'nrs', 'escala de dor', 'dor', 'escala visual analogica', 'escala numerica'],
  category: 'Sedacao / Dor',
  type: 'classification',
  description: 'Escala numerica de dor autorreferida de 0 a 10.',
  why: 'Padrao universal para quantificar dor em pacientes que conseguem comunicar. Guia tratamento analgesico.',
  whenToUse: 'Qualquer paciente consciente e orientado com queixa de dor.',
  pearlsPitfalls: [
    '0 = sem dor. 10 = pior dor imaginavel.',
    'Dor leve (1-3): analgesia simples (paracetamol, dipirona, AINEs).',
    'Dor moderada (4-6): analgesia combinada, considere opioide fraco.',
    'Dor intensa (7-10): opioide forte, considere bloqueio regional.',
    'Reavaliar apos intervencao. Meta: reducao >= 2 pontos ou EVA < 4.'
  ],
  reference: 'Hjermstad MJ et al. Studies comparing Numerical Rating Scales, Visual Analogue Scales, and Verbal Rating Scales for assessment of pain intensity in adults. J Pain Symptom Manage. 2011;41(6):1073-93.',
  items: [
    {
      id: 'pain',
      label: 'Intensidade da dor (autorreferida)',
      options: [
        { label: '0 — sem dor', value: 0 },
        { label: '1 — dor muito leve', value: 1 },
        { label: '2 — dor leve', value: 2 },
        { label: '3 — dor leve a moderada', value: 3 },
        { label: '4 — dor moderada', value: 4 },
        { label: '5 — dor moderada', value: 5 },
        { label: '6 — dor moderada a intensa', value: 6 },
        { label: '7 — dor intensa', value: 7 },
        { label: '8 — dor muito intensa', value: 8 },
        { label: '9 — dor quase insuportavel', value: 9 },
        { label: '10 — pior dor imaginavel', value: 10 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('Sem dor', '#4CAF50', 'EVA/NRS 0. Sem necessidade de analgesia.')
    if (score <= 3) return interp('Dor leve (1-3)', '#4CAF50', 'Analgesia simples: paracetamol, dipirona ou AINE. Reavaliar em 30-60 min.')
    if (score <= 6) return interp('Dor moderada (4-6)', '#FFC107', 'Analgesia combinada. Considere opioide fraco (tramadol, codeina) ou bloqueio regional. Reavaliar em 30 min.')
    return interp('Dor intensa (7-10)', '#F44336', 'Analgesia imediata. Considere opioide forte (morfina, fentanil) e/ou bloqueio regional. Reavaliar em 15-30 min.')
  }
}

// ==========================================
// OBSTETRICIA
// ==========================================

const dppDum: Calculator = {
  id: 'dpp-dum',
  name: 'Data Provavel do Parto (DPP)',
  aliases: ['dpp', 'dum', 'data provavel parto', 'idade gestacional', 'gestacao', 'naegele'],
  category: 'Obstetricia',
  type: 'formula',
  description: 'Calcula data provavel do parto pela regra de Naegele (DUM + 280 dias).',
  why: 'Estimativa rápida da data provável do parto para planejamento e classificação de idade gestacional.',
  whenToUse: 'Gestantes para estimar data provavel do parto e idade gestacional atual.',
  pearlsPitfalls: [
    'Regra de Naegele: DUM + 280 dias (40 semanas).',
    'Assume ciclos regulares de 28 dias — ajustar se ciclos irregulares.',
    'Ultrassom do 1o trimestre e mais preciso que DUM para datar gestacao.',
    'DUM confiavel: se a paciente tem certeza da data e ciclos regulares.'
  ],
  reference: 'Regra de Naegele. Standard obstetric practice.',
  inputs: [
    { id: 'dum_day', label: 'Dia da DUM', unit: '', min: 1, max: 31, step: 1, inputMode: 'numeric' },
    { id: 'dum_month', label: 'Mes da DUM', unit: '', min: 1, max: 12, step: 1, inputMode: 'numeric' },
    { id: 'dum_year', label: 'Ano da DUM', unit: '', min: 2020, max: 2030, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const dum = new Date(v.dum_year, v.dum_month - 1, v.dum_day)
    const dpp = new Date(dum.getTime() + 280 * 24 * 60 * 60 * 1000)
    const today = new Date()
    const diffMs = today.getTime() - dum.getTime()
    const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
    const days = Math.floor((diffMs % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
    // Encode DPP info: weeks in integer, days in decimal
    return weeks * 100 + days + dpp.getDate() / 1000 + dpp.getMonth() / 100000 + dpp.getFullYear() / 10000000
  },
  interpret: (_score: number, values?: Record<string, number>) => {
    if (!values) return interp('Preencha os campos', '#2196F3', 'Insira a data da ultima menstruacao.')
    const dum = new Date(values.dum_year, values.dum_month - 1, values.dum_day)
    const dpp = new Date(dum.getTime() + 280 * 24 * 60 * 60 * 1000)
    const today = new Date()
    const diffMs = today.getTime() - dum.getTime()
    const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    const weeks = Math.floor(totalDays / 7)
    const days = totalDays % 7
    const dppStr = `${dpp.getDate().toString().padStart(2, '0')}/${(dpp.getMonth() + 1).toString().padStart(2, '0')}/${dpp.getFullYear()}`
    if (weeks < 0) return interp('DUM no futuro', '#FFC107', 'Verifique a data informada.')
    return interp(
      `IG: ${weeks}s${days}d | DPP: ${dppStr}`,
      '#2196F3',
      `Idade gestacional: ${weeks} semanas e ${days} dias. Data provavel do parto (Naegele): ${dppStr}. Confirmar com ultrassom do 1o trimestre.`
    )
  }
}

const bishopScore: Calculator = {
  id: 'bishop',
  name: 'Bishop Score',
  aliases: ['bishop', 'maturidade cervical', 'induçao', 'parto', 'cervix'],
  category: 'Obstetricia',
  type: 'score',
  description: 'Avaliacao de maturidade cervical para predição de sucesso de inducao do parto.',
  why: 'Bishop >= 8 indica colo favoravel com alta probabilidade de parto vaginal espontaneo. Bishop < 6 pode necessitar preparo cervical.',
  whenToUse: 'Antes de indicar inducao de trabalho de parto para avaliar maturidade cervical.',
  pearlsPitfalls: [
    'Bishop >= 8: colo favoravel, inducao com ocitocina geralmente suficiente.',
    'Bishop < 6: colo desfavoravel, considere preparo cervical (misoprostol ou sonda de Foley).',
    'Avaliação subjetiva — variabilidade inter-examinador existe.',
    'Nao prediz cesariana — apenas probabilidade de sucesso da inducao.'
  ],
  reference: 'Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol. 1964;24:266-8.',
  items: [
    { id: 'dilation', label: 'Dilatacao cervical', options: [
      { label: 'Fechado', value: 0 }, { label: '1-2 cm', value: 1 }, { label: '3-4 cm', value: 2 }, { label: '>= 5 cm', value: 3 }
    ]},
    { id: 'effacement', label: 'Esvaecimento', options: [
      { label: '0-30%', value: 0 }, { label: '40-50%', value: 1 }, { label: '60-70%', value: 2 }, { label: '>= 80%', value: 3 }
    ]},
    { id: 'station', label: 'Plano de De Lee', options: [
      { label: '-3', value: 0 }, { label: '-2', value: 1 }, { label: '-1/0', value: 2 }, { label: '+1/+2', value: 3 }
    ]},
    { id: 'consistency', label: 'Consistencia do colo', options: [
      { label: 'Firme', value: 0 }, { label: 'Medio', value: 1 }, { label: 'Amolecido', value: 2 }
    ]},
    { id: 'position', label: 'Posicao do colo', options: [
      { label: 'Posterior', value: 0 }, { label: 'Medio', value: 1 }, { label: 'Anterior', value: 2 }
    ]}
  ],
  interpret: (score: number) => {
    if (score < 6) return interp('Colo desfavoravel', '#F44336', 'Bishop < 6. Considere preparo cervical antes de inducao (misoprostol, sonda de Foley ou dilatadores osmoticos).')
    if (score < 8) return interp('Colo intermediario', '#FFC107', 'Bishop 6-7. Inducao pode ser tentada; preparo cervical pode beneficiar.')
    return interp('Colo favoravel', '#4CAF50', 'Bishop >= 8. Alta probabilidade de sucesso de inducao com ocitocina.')
  }
}

// ==========================================
// GASTRO — EXTRAS
// ==========================================

const alvaradoScore: Calculator = {
  id: 'alvarado',
  name: 'Alvarado Score',
  aliases: ['alvarado', 'mantrels', 'apendicite', 'dor abdominal', 'fossa iliaca direita'],
  category: 'Gastro / Hepato',
  type: 'score',
  description: 'Probabilidade de apendicite aguda baseada em criterios clínicos e laboratoriais.',
  why: 'Auxilia na triagem de pacientes com dor abdominal para investigacao de apendicite.',
  whenToUse: 'Pacientes com dor abdominal sugestiva de apendicite para guiar solicitacao de imagem.',
  pearlsPitfalls: [
    'MANTRELS: Migration, Anorexia, Nausea, Tenderness RLQ, Rebound, Elevation temp, Leukocytosis, Shift left.',
    'Score <= 4: apendicite improvavel. Score 5-6: possivel (considere imagem). Score >= 7: provavel.',
    'Nao substitui imagem (TC ou ultrassom) em casos duvidosos.',
    'Sensibilidade varia conforme populacao — menor em mulheres e idosos.',
    'Score 9-10 tem valor preditivo positivo > 90%.'
  ],
  reference: 'Alvarado A. A practical score for the early diagnosis of acute appendicitis. Ann Emerg Med. 1986;15(5):557-64.',
  items: [
    { id: 'migration', label: 'Migracao da dor para fossa iliaca direita', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'anorexia', label: 'Anorexia', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'nausea', label: 'Nausea ou vomitos', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'tenderness', label: 'Dor a palpacao em fossa iliaca direita', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'rebound', label: 'Descompressao brusca dolorosa (Blumberg)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'temp', label: 'Temperatura >= 37,3 graus Celsius', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'leukocytosis', label: 'Leucocitose (> 10.000/mm3)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 2 }] },
    { id: 'shift', label: 'Desvio a esquerda (neutrofilia > 75%)', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score <= 4) return interp('Apendicite improvavel', '#4CAF50', 'Score <= 4. Probabilidade baixa de apendicite. Considere diagnósticos alternativos. Observacao.')
    if (score <= 6) return interp('Apendicite possivel', '#FFC107', 'Score 5-6. Probabilidade moderada. Considere TC de abdome ou ultrassom para confirmar.')
    if (score <= 8) return interp('Apendicite provavel', '#F44336', 'Score 7-8. Alta probabilidade. Considere avaliacao cirurgica e imagem confirmatoria.')
    return interp('Apendicite muito provavel', '#F44336', 'Score 9-10. Probabilidade > 90%. Avaliacao cirurgica recomendada.')
  }
}

// ==========================================
// RENAL / METABOLICO — EXTRAS
// ==========================================

const correçãoNaAdrogueMadias: Calculator = {
  id: 'correção-na-adrogue',
  name: 'Correção de Sodio (Adrogue-Madias)',
  aliases: ['adrogue', 'madias', 'sódio', 'hiponatremia', 'correção sódio', 'nacl3'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Estima variação de sódio por litro de infusato pela formula de Adrogue-Madias.',
  why: 'Formula padrao para planejar correção segura de disnatremia, prevenindo correção excessiva.',
  whenToUse: 'Pacientes com hiponatremia ou hipernatremia para calcular velocidade de correção.',
  pearlsPitfalls: [
    'Mudanca Na = (Na infusato - Na paciente) / (agua corporal total + 1).',
    'Agua corporal total = peso x fator (0,6 homem jovem, 0,5 mulher/idoso homem, 0,45 idosa).',
    'NaCl 3% = 513 mEq/L. SF 0,9% = 154 mEq/L. Ringer lactato ~130 mEq/L.',
    'Nao corrigir > 8 mEq/L em 24h na hiponatremia cronica (risco de mielinolise).',
    'Em hiponatremia grave sintomatica: bolus NaCl 3% 100-150 mL em 10-20 min.'
  ],
  reference: 'Adrogue HJ, Madias NE. Hyponatremia. N Engl J Med. 2000;342(21):1581-9.',
  inputs: [
    { id: 'na_patient', label: 'Sodio do paciente', unit: 'mEq/L', min: 100, max: 180, step: 1, inputMode: 'numeric' },
    { id: 'na_infusate', label: 'Sodio do infusato', unit: 'mEq/L', min: 0, max: 855, step: 1, defaultValue: 513, inputMode: 'numeric' },
    { id: 'weight', label: 'Peso', unit: 'kg', min: 20, max: 200, step: 0.5, inputMode: 'decimal' }
  ],
  selects: [
    { id: 'sex_age', label: 'Sexo / idade (fator de agua corporal)', options: [
      { label: 'Homem jovem (0,6)', value: 0.6 },
      { label: 'Mulher jovem ou homem idoso (0,5)', value: 0.5 },
      { label: 'Mulher idosa (0,45)', value: 0.45 }
    ]}
  ],
  formula: (v) => {
    const factor = v.sex_age || 0.6
    const act = v.weight * factor
    const delta = (v.na_infusate - v.na_patient) / (act + 1)
    return Math.round(delta * 100) / 100
  },
  interpret: (score: number) => {
    return interp(
      `Variacao estimada: ${score} mEq/L por litro de infusato`,
      '#2196F3',
      `Cada litro do infusato eleva o sódio sérico em ~${score} mEq/L. Meta: não ultrapassar 8 mEq/L em 24h (hiponatremia cronica). NaCl 3% = 513 mEq/L. SF 0,9% = 154 mEq/L.`
    )
  }
}

const cockcroftGault: Calculator = {
  id: 'cockcroft-gault',
  name: 'Cockcroft-Gault',
  aliases: ['cockcroft', 'gault', 'clearance creatinina', 'funcao renal', 'tfg', 'clcr'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Estimativa do clearance de creatinina para ajuste de dose de medicamentos.',
  why: 'Muitos medicamentos utilizam ClCr pela Cockcroft-Gault como referencia para ajuste posologico.',
  whenToUse: 'Ajuste de dose de medicamentos eliminados por via renal (antibioticos, anticoagulantes, etc.).',
  pearlsPitfalls: [
    'Formula: (140 - idade) x peso / (72 x Cr). Multiplicar por 0,85 se sexo feminino.',
    'Usar peso real. Em obesos, considere peso ideal ou ajustado.',
    'Nao e a mesma coisa que TFG (CKD-EPI). Cockcroft-Gault estima clearance de creatinina.',
    'Superestima em pacientes obesos e subestima em caquexia.',
    'Creatinina deve estar em mg/dL.'
  ],
  reference: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.',
  inputs: [
    { id: 'age', label: 'Idade', unit: 'anos', min: 18, max: 120, step: 1, inputMode: 'numeric' },
    { id: 'weight', label: 'Peso', unit: 'kg', min: 30, max: 250, step: 0.5, inputMode: 'decimal' },
    { id: 'creatinine', label: 'Creatinina serica', unit: 'mg/dL', min: 0.1, max: 20, step: 0.01, inputMode: 'decimal' }
  ],
  selects: [
    { id: 'sex', label: 'Sexo', options: [
      { label: 'Masculino', value: 1 },
      { label: 'Feminino', value: 0.85 }
    ]}
  ],
  formula: (v) => {
    const factor = v.sex || 1
    const clcr = ((140 - v.age) * v.weight) / (72 * v.creatinine) * factor
    return Math.round(clcr * 10) / 10
  },
  interpret: (score: number) => {
    if (score >= 90) return interp(`ClCr: ${score} mL/min — normal`, '#4CAF50', 'Funcao renal normal. Ajuste de dose geralmente desnecessario.')
    if (score >= 60) return interp(`ClCr: ${score} mL/min — reducao leve`, '#4CAF50', 'Reducao leve. Verificar necessidade de ajuste conforme cada medicamento.')
    if (score >= 30) return interp(`ClCr: ${score} mL/min — reducao moderada`, '#FFC107', 'Reducao moderada. Ajuste de dose recomendado para muitos medicamentos.')
    if (score >= 15) return interp(`ClCr: ${score} mL/min — reducao grave`, '#F44336', 'Reducao grave. Ajuste de dose obrigatorio. Considere avaliacao nefrologica.')
    return interp(`ClCr: ${score} mL/min — falencia renal`, '#F44336', 'Falencia renal. Considere terapia de substituicao renal. Consultar nefrologia.')
  }
}

const ckdEpi: Calculator = {
  id: 'ckd-epi',
  name: 'CKD-EPI 2021',
  aliases: ['ckd-epi', 'tfg', 'taxa filtracao glomerular', 'funcao renal', 'estagio renal', 'doenca renal cronica'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Taxa de filtracao glomerular estimada pela equacao CKD-EPI 2021 (sem ajuste racial).',
  why: 'Padrao atual para estimar TFG e estadiar doenca renal cronica. Versao 2021 nao utiliza raca.',
  whenToUse: 'Avaliacao de funcao renal em adultos para estadiamento e acompanhamento de DRC.',
  pearlsPitfalls: [
    'CKD-EPI 2021 nao inclui ajuste por raca (recomendacao NKF/ASN 2021).',
    'Formula: 142 x min(Cr/k, 1)^a x max(Cr/k, 1)^-1.2 x 0.9938^idade x 1.012 (se feminino).',
    'k = 0,7 (F) ou 0,9 (M). a = -0,241 (F) ou -0,302 (M).',
    'TFG < 60 por >= 3 meses = doenca renal cronica.',
    'Não usar em pacientes em dialise ou com variação aguda de creatinina.'
  ],
  reference: 'Inker LA et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-49.',
  inputs: [
    { id: 'age', label: 'Idade', unit: 'anos', min: 18, max: 120, step: 1, inputMode: 'numeric' },
    { id: 'creatinine', label: 'Creatinina serica', unit: 'mg/dL', min: 0.1, max: 20, step: 0.01, inputMode: 'decimal' }
  ],
  selects: [
    { id: 'sex', label: 'Sexo', options: [
      { label: 'Masculino', value: 1 },
      { label: 'Feminino', value: 2 }
    ]}
  ],
  formula: (v) => {
    const isFemale = v.sex === 2
    const k = isFemale ? 0.7 : 0.9
    const a = isFemale ? -0.241 : -0.302
    const sexFactor = isFemale ? 1.012 : 1
    const crk = v.creatinine / k
    const gfr = 142 * Math.pow(Math.min(crk, 1), a) * Math.pow(Math.max(crk, 1), -1.200) * Math.pow(0.9938, v.age) * sexFactor
    return Math.round(gfr * 10) / 10
  },
  interpret: (score: number) => {
    if (score >= 90) return interp(`TFG: ${score} mL/min/1,73m2 — G1`, '#4CAF50', 'Funcao renal normal ou elevada (G1). Monitorar se fatores de risco.')
    if (score >= 60) return interp(`TFG: ${score} mL/min/1,73m2 — G2`, '#4CAF50', 'Reducao leve (G2). Monitorar anualmente.')
    if (score >= 45) return interp(`TFG: ${score} mL/min/1,73m2 — G3a`, '#FFC107', 'Reducao leve a moderada (G3a). Acompanhamento nefrologico recomendado.')
    if (score >= 30) return interp(`TFG: ${score} mL/min/1,73m2 — G3b`, '#FFC107', 'Reducao moderada a grave (G3b). Nefrologia e ajuste de medicamentos.')
    if (score >= 15) return interp(`TFG: ${score} mL/min/1,73m2 — G4`, '#F44336', 'Reducao grave (G4). Preparar para terapia de substituicao renal.')
    return interp(`TFG: ${score} mL/min/1,73m2 — G5`, '#F44336', 'Falencia renal (G5). Considere dialise ou transplante.')
  }
}

const correçãoCalcio: Calculator = {
  id: 'correção-calcio',
  name: 'Correção de calcio pela albumina',
  aliases: ['calcio', 'calcio corrigido', 'albumina', 'hipocalcemia', 'hipercalcemia'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Cálculo do calcio corrigido pela albumina serica.',
  why: 'Calcio total e influenciado pela albumina. A correção evita diagnósticos falsos de hipo ou hipercalcemia.',
  whenToUse: 'Pacientes com hipoalbuminemia para interpretar corretamente o calcio sérico total.',
  pearlsPitfalls: [
    'Formula: Ca corrigido = Ca medido + 0,8 x (4,0 - albumina).',
    'Cada 1 g/dL de reducao na albumina abaixo de 4 reduz o calcio total em ~0,8 mg/dL.',
    'Calcio ionizado e o padrao-ouro, mas nem sempre esta disponivel.',
    'Nao e preciso em acidose ou alcalose graves (alteram ligacao calcio-albumina).',
    'Albumina de referencia: 4,0 g/dL.'
  ],
  reference: 'Payne RB et al. Interpretation of serum calcium in patients with abnormal serum proteins. Br Med J. 1973;4(5893):643-6.',
  inputs: [
    { id: 'calcium', label: 'Calcio total medido', unit: 'mg/dL', min: 2, max: 20, step: 0.1, inputMode: 'decimal' },
    { id: 'albumin', label: 'Albumina serica', unit: 'g/dL', min: 0.5, max: 6, step: 0.1, inputMode: 'decimal' }
  ],
  formula: (v) => {
    return Math.round((v.calcium + 0.8 * (4.0 - v.albumin)) * 100) / 100
  },
  interpret: (score: number) => {
    if (score < 8.5) return interp(`Ca corrigido: ${score} mg/dL — hipocalcemia`, '#FFC107', 'Calcio corrigido abaixo do normal (8,5-10,5). Investigar causa e considere reposição.')
    if (score <= 10.5) return interp(`Ca corrigido: ${score} mg/dL — normal`, '#4CAF50', 'Calcio corrigido dentro da faixa normal (8,5-10,5 mg/dL).')
    return interp(`Ca corrigido: ${score} mg/dL — hipercalcemia`, '#F44336', 'Calcio corrigido elevado. Investigar causa (hiperparatireoidismo, neoplasia). Hidratação.')
  }
}

const correçãoPotassio: Calculator = {
  id: 'correção-potassio',
  name: 'Correção de potassio (deficit estimado)',
  aliases: ['potassio', 'hipocalemia', 'deficit potassio', 'reposição kcl', 'potassio baixo'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Estimativa do deficit de potassio corporal total em hipocalemia.',
  why: 'Guia a reposição de potassio estimando o deficit corporal total.',
  whenToUse: 'Pacientes com hipocalemia para planejar velocidade e quantidade de reposição.',
  pearlsPitfalls: [
    'Regra pratica: cada 0,3 mEq/L abaixo de 4,0 mEq/L = ~100 mEq de deficit corporal total.',
    'Reposicao maxima IV: 10-20 mEq/h em veia periferica, 40 mEq/h em acesso central (com monitoramento).',
    'Nao esquecer de corrigir magnesio simultaneamente — hipomagnesemia impede correção do potassio.',
    'Potassio < 2,5 mEq/L: reposição agressiva, ECG continuo.',
    'Esta formula e uma estimativa — o deficit real pode ser maior (potassio intracelular).'
  ],
  reference: 'Gennari FJ. Hypokalemia. N Engl J Med. 1998;339(7):451-8.',
  inputs: [
    { id: 'k', label: 'Potassio sérico', unit: 'mEq/L', min: 1.0, max: 6.5, step: 0.1, inputMode: 'decimal' }
  ],
  formula: (v) => {
    if (v.k >= 4.0) return 0
    const deficit = Math.round(((4.0 - v.k) / 0.3) * 100)
    return deficit
  },
  interpret: (score: number, values?: Record<string, number>) => {
    const k = values?.k || 4.0
    if (k >= 4.0) return interp('Potassio normal', '#4CAF50', 'Potassio >= 4,0 mEq/L. Sem deficit estimado.')
    if (k >= 3.5) return interp(`Deficit estimado: ~${score} mEq`, '#FFC107', `K+ ${k} mEq/L. Hipocalemia leve. Considere reposição oral (KCl 600 mg = 8 mEq). Corrigir magnesio.`)
    if (k >= 3.0) return interp(`Deficit estimado: ~${score} mEq`, '#FFC107', `K+ ${k} mEq/L. Hipocalemia moderada. Reposicao oral ou IV. Verificar magnesio.`)
    if (k >= 2.5) return interp(`Deficit estimado: ~${score} mEq`, '#F44336', `K+ ${k} mEq/L. Hipocalemia grave. Reposicao IV recomendada. ECG. Monitoramento.`)
    return interp(`Deficit estimado: ~${score} mEq`, '#F44336', `K+ ${k} mEq/L. Hipocalemia critica. Reposicao IV urgente com monitoramento continuo. Risco de arritmia.`)
  }
}

const anionGap: Calculator = {
  id: 'anion-gap',
  name: 'Anion Gap',
  aliases: ['anion gap', 'ag', 'acidose metabolica', 'gasometria', 'gap anionico'],
  category: 'Renal / Metabolico',
  type: 'formula',
  description: 'Cálculo do anion gap com correção por albumina.',
  why: 'Diferencia acidose metabolica com AG elevado (cetonas, lactato, toxicos) de AG normal (hipercloremca).',
  whenToUse: 'Pacientes com acidose metabolica para classificar etiologia.',
  pearlsPitfalls: [
    'AG = Na - (Cl + HCO3). Normal: 12 +/- 2 mEq/L.',
    'Corrigir por albumina: AG corrigido = AG + 2,5 x (4,0 - albumina).',
    'AG elevado: cetoacidose, acidose latica, uremia, intoxicacao (metanol, etilenoglicol, salicilato).',
    'AG normal com acidose: perda de HCO3 (diarreia, acidose tubular renal, salina excessiva).',
    'Sempre calcular delta gap (delta/delta) quando AG elevado.'
  ],
  reference: 'Emmett M, Narins RG. Clinical use of the anion gap. Medicine (Baltimore). 1977;56(1):38-54.',
  inputs: [
    { id: 'na', label: 'Sodio', unit: 'mEq/L', min: 100, max: 180, step: 1, inputMode: 'numeric' },
    { id: 'cl', label: 'Cloro', unit: 'mEq/L', min: 60, max: 140, step: 1, inputMode: 'numeric' },
    { id: 'hco3', label: 'Bicarbonato (HCO3)', unit: 'mEq/L', min: 1, max: 50, step: 0.1, inputMode: 'decimal' },
    { id: 'albumin', label: 'Albumina (opcional, para correção)', unit: 'g/dL', min: 0.5, max: 6, step: 0.1, defaultValue: 4.0, inputMode: 'decimal' }
  ],
  formula: (v) => {
    const ag = v.na - (v.cl + v.hco3)
    const agCorrected = ag + 2.5 * (4.0 - (v.albumin || 4.0))
    return Math.round(agCorrected * 10) / 10
  },
  interpret: (score: number, values?: Record<string, number>) => {
    const rawAg = (values?.na || 140) - ((values?.cl || 100) + (values?.hco3 || 24))
    if (score <= 14) return interp(`AG corrigido: ${score} mEq/L — normal`, '#4CAF50', `AG bruto: ${rawAg.toFixed(1)}. AG corrigido normal (<=14). Se acidose presente, considere causa com AG normal (hipercloremca).`)
    if (score <= 20) return interp(`AG corrigido: ${score} mEq/L — elevado`, '#FFC107', `AG bruto: ${rawAg.toFixed(1)}. AG elevado. Investigar: lactato, cetonas, funcao renal, toxicos. Calcular delta gap.`)
    return interp(`AG corrigido: ${score} mEq/L — muito elevado`, '#F44336', `AG bruto: ${rawAg.toFixed(1)}. AG muito elevado. Causas: cetoacidose, acidose latica, uremia, intoxicacao (metanol, etilenoglicol, salicilato). Investigar e tratar urgentemente.`)
  }
}

// ==========================================
// HEMODINAMICA — EXTRAS
// ==========================================

const formulaWinters: Calculator = {
  id: 'formula-winters',
  name: 'Formula de Winters',
  aliases: ['winters', 'pco2 esperada', 'compensacao respiratoria', 'acidose metabolica', 'gasometria'],
  category: 'Hemodinamica',
  type: 'formula',
  description: 'Calcula a pCO2 esperada na compensacao respiratoria de acidose metabolica.',
  why: 'Permite identificar disturbio respiratorio concomitante em pacientes com acidose metabolica.',
  whenToUse: 'Pacientes com acidose metabolica primaria para verificar se a compensacao respiratoria e adequada.',
  pearlsPitfalls: [
    'pCO2 esperada = 1,5 x HCO3 + 8 (+/- 2).',
    'Se pCO2 medida > esperada: acidose respiratoria concomitante.',
    'Se pCO2 medida < esperada: alcalose respiratoria concomitante.',
    'So valida para acidose metabolica primaria.',
    'O limite inferior da pCO2 compensatoria e ~10 mmHg.'
  ],
  reference: 'Winters RW et al. The body fluids in pediatrics. Little, Brown & Co; 1973.',
  inputs: [
    { id: 'hco3', label: 'Bicarbonato (HCO3)', unit: 'mEq/L', min: 1, max: 50, step: 0.1, inputMode: 'decimal' },
    { id: 'pco2', label: 'pCO2 medida (gasometria)', unit: 'mmHg', min: 5, max: 120, step: 0.1, inputMode: 'decimal' }
  ],
  formula: (v) => {
    return Math.round((1.5 * v.hco3 + 8) * 10) / 10
  },
  interpret: (score: number, values?: Record<string, number>) => {
    const pco2 = values?.pco2 || 40
    const lower = score - 2
    const upper = score + 2
    if (pco2 >= lower && pco2 <= upper) {
      return interp(`pCO2 esperada: ${score} mmHg (+/- 2) — compensacao adequada`, '#4CAF50', `pCO2 medida (${pco2}) dentro da faixa esperada (${lower}-${upper}). Acidose metabolica simples com compensacao respiratoria adequada.`)
    }
    if (pco2 > upper) {
      return interp(`pCO2 esperada: ${score} mmHg (+/- 2) — acidose respiratoria concomitante`, '#F44336', `pCO2 medida (${pco2}) acima do esperado (${lower}-${upper}). Acidose respiratoria concomitante. Investigar causa respiratoria.`)
    }
    return interp(`pCO2 esperada: ${score} mmHg (+/- 2) — alcalose respiratoria concomitante`, '#FFC107', `pCO2 medida (${pco2}) abaixo do esperado (${lower}-${upper}). Alcalose respiratoria concomitante.`)
  }
}

// ==========================================
// RESPIRATORIO — EXTRAS
// ==========================================

const news2: Calculator = {
  id: 'news2',
  name: 'NEWS2 (National Early Warning Score)',
  aliases: ['news', 'news2', 'alerta precoce', 'deterioracao clinica', 'triagem', 'early warning'],
  category: 'Respiratorio / Sepse',
  type: 'score',
  description: 'Escore de alerta precoce para deterioracao clinica em pacientes internados.',
  why: 'Detecta precocemente pacientes em risco de deterioracao clinica, permitindo intervencao rápida.',
  whenToUse: 'Avaliacao rotineira de pacientes internados em enfermaria. Monitoramento de pacientes com risco de deterioracao.',
  pearlsPitfalls: [
    'Inclui 7 parametros: FR, SpO2, O2 suplementar, temperatura, PAS, FC, consciencia (ACVPU).',
    'NEWS >= 5 (ou 3 em parametro unico): considere revisao medica urgente.',
    'NEWS >= 7: emergência clinica, considere transferencia para UTI.',
    'Escala 2 de SpO2 para pacientes com insuficiencia respiratoria hipercapnica cronica (meta SpO2 88-92%).',
    'Frequencia de monitoramento deve aumentar conforme o score.'
  ],
  reference: 'Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS. Updated report of a working party. London: RCP, 2017.',
  items: [
    { id: 'rr', label: 'Frequencia respiratoria (irpm)', options: [
      { label: '<= 8', value: 3 }, { label: '9-11', value: 1 }, { label: '12-20', value: 0 },
      { label: '21-24', value: 2 }, { label: '>= 25', value: 3 }
    ]},
    { id: 'spo2', label: 'SpO2 (escala 1 — padrao)', options: [
      { label: '<= 91%', value: 3 }, { label: '92-93%', value: 2 }, { label: '94-95%', value: 1 },
      { label: '>= 96%', value: 0 }
    ]},
    { id: 'o2', label: 'O2 suplementar', options: [
      { label: 'Ar ambiente', value: 0 }, { label: 'O2 suplementar em uso', value: 2 }
    ]},
    { id: 'temp', label: 'Temperatura (graus Celsius)', options: [
      { label: '<= 35,0', value: 3 }, { label: '35,1-36,0', value: 1 }, { label: '36,1-38,0', value: 0 },
      { label: '38,1-39,0', value: 1 }, { label: '>= 39,1', value: 2 }
    ]},
    { id: 'sbp', label: 'Pressao arterial sistolica (mmHg)', options: [
      { label: '<= 90', value: 3 }, { label: '91-100', value: 2 }, { label: '101-110', value: 1 },
      { label: '111-219', value: 0 }, { label: '>= 220', value: 3 }
    ]},
    { id: 'hr', label: 'Frequencia cardiaca (bpm)', options: [
      { label: '<= 40', value: 3 }, { label: '41-50', value: 1 }, { label: '51-90', value: 0 },
      { label: '91-110', value: 1 }, { label: '111-130', value: 2 }, { label: '>= 131', value: 3 }
    ]},
    { id: 'consciousness', label: 'Nivel de consciencia', options: [
      { label: 'Alerta (A)', value: 0 },
      { label: 'Confusao nova (C)', value: 3 },
      { label: 'Responde a voz (V)', value: 3 },
      { label: 'Responde a dor (P)', value: 3 },
      { label: 'Nao responsivo (U)', value: 3 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 4) return interp('Baixo risco', '#4CAF50', `NEWS2: ${score}. Monitoramento de rotina (minimo a cada 12h). Manter vigilancia clinica.`)
    if (score <= 6) return interp('Risco medio', '#FFC107', `NEWS2: ${score}. Monitoramento a cada 4-6h. Considere revisao medica urgente.`)
    return interp('Alto risco', '#F44336', `NEWS2: ${score}. Emergencia clinica. Revisao medica imediata. Considere transferencia para UTI. Monitoramento continuo.`)
  }
}

const criteriosLight: Calculator = {
  id: 'criterios-light',
  name: 'Criterios de Light',
  aliases: ['light', 'derrame pleural', 'transudato', 'exsudato', 'liquido pleural', 'toracocentese'],
  category: 'Respiratorio / Sepse',
  type: 'formula',
  description: 'Diferenciacao entre transudato e exsudato pleural (criterios de Light).',
  why: 'Classificar o derrame pleural como transudato ou exsudato direciona a investigacao etiologica.',
  whenToUse: 'Apos toracocentese diagnostica para classificar o liquido pleural.',
  pearlsPitfalls: [
    'Exsudato se QUALQUER criterio positivo: (1) proteina LP/soro > 0,5; (2) LDH LP/soro > 0,6; (3) LDH LP > 2/3 do limite superior do normal sérico.',
    'Se nenhum criterio positivo: transudato.',
    'Sensibilidade ~98% para exsudato, mas especificidade ~77% — pode classificar transudatos como exsudatos.',
    'Se transudato em uso de diuretico: pode ser falsamente classificado como exsudato.',
    'Gradiente albumina soro-LP > 1,2 sugere transudato (complementar quando duvida).'
  ],
  reference: 'Light RW et al. Pleural effusions: the diagnostic separation of transudates and exudates. Ann Intern Med. 1972;77(4):507-13.',
  inputs: [
    { id: 'prot_lp', label: 'Proteina do liquido pleural', unit: 'g/dL', min: 0.1, max: 10, step: 0.1, inputMode: 'decimal' },
    { id: 'prot_serum', label: 'Proteina serica', unit: 'g/dL', min: 1, max: 15, step: 0.1, inputMode: 'decimal' },
    { id: 'ldh_lp', label: 'LDH do liquido pleural', unit: 'U/L', min: 10, max: 10000, step: 1, inputMode: 'numeric' },
    { id: 'ldh_serum', label: 'LDH sérico', unit: 'U/L', min: 10, max: 5000, step: 1, inputMode: 'numeric' },
    { id: 'ldh_upper', label: 'Limite superior normal do LDH sérico', unit: 'U/L', min: 100, max: 500, step: 1, defaultValue: 250, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const crit1 = v.prot_lp / v.prot_serum > 0.5 ? 1 : 0
    const crit2 = v.ldh_lp / v.ldh_serum > 0.6 ? 1 : 0
    const crit3 = v.ldh_lp > (2 / 3) * v.ldh_upper ? 1 : 0
    return crit1 + crit2 + crit3
  },
  interpret: (score: number, values?: Record<string, number>) => {
    const protRatio = values ? (values.prot_lp / values.prot_serum).toFixed(2) : '?'
    const ldhRatio = values ? (values.ldh_lp / values.ldh_serum).toFixed(2) : '?'
    if (score === 0) {
      return interp('Transudato', '#4CAF50', `Nenhum criterio de Light positivo. Prot LP/soro: ${protRatio}. LDH LP/soro: ${ldhRatio}. Causas comuns: IC, cirrose, síndrome nefrotica.`)
    }
    return interp(`Exsudato (${score}/3 criterios positivos)`, '#FFC107', `Prot LP/soro: ${protRatio}. LDH LP/soro: ${ldhRatio}. Exsudato: investigar causa (infeccao, neoplasia, TEP, colagenose, pancreatite). Se suspeita de transudato classificado erroneamente: calcular gradiente albumina soro-LP.`)
  }
}

// ==========================================
// TOXICOLOGIA — EXTRAS
// ==========================================

const pss: Calculator = {
  id: 'pss',
  name: 'PSS (Poisoning Severity Score)',
  aliases: ['pss', 'intoxicacao', 'envenenamento', 'gravidade', 'toxicologia'],
  category: 'Toxicologia',
  type: 'classification',
  description: 'Classificação de gravidade da intoxicacao aguda em 4 graus.',
  why: 'Padrao internacional para classificar gravidade de intoxicacoes, facilitando comunicacao e pesquisa.',
  whenToUse: 'Pacientes com intoxicacao aguda para classificar gravidade e guiar nivel de cuidado.',
  pearlsPitfalls: [
    'Grau 0 (nenhum): sem sinais ou sintomas.',
    'Grau 1 (leve): sintomas leves e transitórios, resolvem espontaneamente.',
    'Grau 2 (moderado): sintomas pronunciados ou prolongados, potencialmente ameacadores.',
    'Grau 3 (grave): sintomas graves ou potencialmente fatais.',
    'Avaliar no pior momento clínico. Pode ser retrospectivo.'
  ],
  reference: 'Persson HE et al. Poisoning severity score. Grading of acute poisoning. J Toxicol Clin Toxicol. 1998;36(3):205-13.',
  items: [
    {
      id: 'grade',
      label: 'Gravidade da intoxicacao',
      options: [
        { label: 'Grau 0 — nenhum: sem sinais ou sintomas relacionados a intoxicacao', value: 0 },
        { label: 'Grau 1 — leve: sintomas leves, transitórios, resolvem espontaneamente', value: 1 },
        { label: 'Grau 2 — moderado: sintomas pronunciados ou prolongados', value: 2 },
        { label: 'Grau 3 — grave: sintomas graves ou potencialmente fatais', value: 3 },
        { label: 'Fatal — obito causado diretamente pela intoxicacao ou suas complicacoes', value: 4 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('PSS 0 — nenhum', '#4CAF50', 'Sem sintomas. Observacao conforme agente envolvido. Alta apos periodo de observacao adequado.')
    if (score === 1) return interp('PSS 1 — leve', '#4CAF50', 'Intoxicacao leve. Sintomas transitórios. Observacao e tratamento de suporte. Alta provavel.')
    if (score === 2) return interp('PSS 2 — moderado', '#FFC107', 'Intoxicacao moderada. Monitoramento proximo. Tratamento de suporte e considere antidoto especifico.')
    if (score === 3) return interp('PSS 3 — grave', '#F44336', 'Intoxicacao grave. UTI recomendada. Tratamento agressivo de suporte e antidoto.')
    return interp('Fatal', '#F44336', 'Obito relacionado a intoxicacao.')
  }
}

const nomogramaRumack: Calculator = {
  id: 'nomograma-rumack',
  name: 'Nomograma de Rumack-Matthew (paracetamol)',
  aliases: ['rumack', 'matthew', 'paracetamol', 'acetaminofeno', 'intoxicacao', 'nac', 'n-acetilcisteina'],
  category: 'Toxicologia',
  type: 'formula',
  description: 'Avalia necessidade de N-acetilcisteina em intoxicacao por paracetamol.',
  why: 'Identifica pacientes com risco de hepatotoxicidade que necessitam tratamento com NAC.',
  whenToUse: 'Pacientes com ingestao aguda de paracetamol com nivel sérico disponivel 4-24h pos-ingestao.',
  pearlsPitfalls: [
    'A linha de tratamento original inicia em 200 mcg/mL as 4h e 25 mcg/mL as 16h.',
    'Nos EUA, usa-se a linha de Rumack-Matthew (150 mcg/mL as 4h). No Brasil, considere a mesma.',
    'Nivel acima da linha de tratamento = iniciar NAC imediatamente.',
    'Nao aplicavel se hora de ingestao desconhecida ou > 24h — tratar empiricamente.',
    'Se apresentacao > 8h pos-ingestao: iniciar NAC empiricamente e esperar nivel.',
    'NAC e mais eficaz se iniciada < 8h pos-ingestao.'
  ],
  reference: 'Rumack BH, Matthew H. Acetaminophen poisoning and toxicity. Pediatrics. 1975;55(6):871-6.',
  inputs: [
    { id: 'hours', label: 'Horas apos ingestao', unit: 'h', min: 4, max: 24, step: 0.5, inputMode: 'decimal' },
    { id: 'level', label: 'Nivel sérico de paracetamol', unit: 'mcg/mL', min: 0, max: 1000, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    // Linha de tratamento (Rumack-Matthew): log-linear de 150 mcg/mL em 4h ate ~4.7 mcg/mL em 24h
    // Formula: threshold = 150 * 10^(-0.048 * (hours - 4)) [aproximacao da linha de tratamento]
    const threshold = 150 * Math.pow(10, -0.048 * (v.hours - 4))
    return Math.round(threshold * 10) / 10
  },
  interpret: (score: number, values?: Record<string, number>) => {
    const level = values?.level || 0
    const hours = values?.hours || 4
    if (level >= score) {
      return interp(`Nivel (${level}) ACIMA da linha de tratamento (${score} mcg/mL em ${hours}h)`, '#F44336', `Risco de hepatotoxicidade. Iniciar N-acetilcisteina (NAC) imediatamente. Protocolo IV 21h ou oral 72h.`)
    }
    return interp(`Nivel (${level}) ABAIXO da linha de tratamento (${score} mcg/mL em ${hours}h)`, '#4CAF50', `Nivel abaixo da linha de tratamento. NAC provavelmente desnecessaria neste momento. Monitorar funcao hepatica.`)
  }
}

const qtcCorrigido: Calculator = {
  id: 'qtc-corrigido',
  name: 'QTc corrigido (Bazett e Fridericia)',
  aliases: ['qtc', 'qt corrigido', 'bazett', 'fridericia', 'intervalo qt', 'arritmia', 'torsades'],
  category: 'Toxicologia',
  type: 'formula',
  description: 'Calcula intervalo QT corrigido pela frequencia cardiaca.',
  why: 'QTc prolongado (> 500 ms) associado a risco de torsades de pointes e morte subita.',
  whenToUse: 'Avaliacao de ECG em pacientes com medicamentos que prolongam QT ou suspeita de intoxicacao.',
  pearlsPitfalls: [
    'Bazett: QTc = QT / raiz quadrada de RR (intervalo em segundos). Mais usado, mas impreciso em FC extremas.',
    'Fridericia: QTc = QT / raiz cubica de RR. Mais preciso em taquicardia e bradicardia.',
    'QTc normal: < 440 ms (homens), < 460 ms (mulheres).',
    'QTc > 500 ms: risco significativo de torsades. Revisar medicamentos e eletrólitos.',
    'Drogas comuns que prolongam QT: haloperidol, ondansetrona, amiodarona, fluoroquinolonas, metadona.'
  ],
  reference: 'Bazett HC. An analysis of the time-relations of electrocardiograms. Heart. 1920;7:353-70. Fridericia LS. Die Systolendauer im Elektrokardiogramm bei normalen Menschen und bei Herzkranken. Acta Med Scand. 1920;53:469-86.',
  inputs: [
    { id: 'qt', label: 'Intervalo QT medido', unit: 'ms', min: 200, max: 800, step: 1, inputMode: 'numeric' },
    { id: 'hr', label: 'Frequencia cardiaca', unit: 'bpm', min: 30, max: 250, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const rr = 60 / v.hr // RR em segundos
    const qtSec = v.qt / 1000
    const bazett = Math.round((qtSec / Math.sqrt(rr)) * 1000)
    return bazett
  },
  interpret: (score: number, values?: Record<string, number>) => {
    const hr = values?.hr || 60
    const qt = values?.qt || 400
    const rr = 60 / hr
    const qtSec = qt / 1000
    const fridericia = Math.round((qtSec / Math.pow(rr, 1 / 3)) * 1000)
    if (score < 440) return interp(`QTc Bazett: ${score} ms | Fridericia: ${fridericia} ms — normal`, '#4CAF50', 'QTc dentro dos limites normais. Sem risco aumentado de arritmia.')
    if (score < 500) return interp(`QTc Bazett: ${score} ms | Fridericia: ${fridericia} ms — prolongado`, '#FFC107', 'QTc prolongado. Revisar medicamentos e eletrólitos (K+, Mg2+, Ca2+). Monitorar.')
    return interp(`QTc Bazett: ${score} ms | Fridericia: ${fridericia} ms — muito prolongado`, '#F44336', 'QTc > 500 ms. Risco significativo de torsades de pointes. Suspender drogas que prolongam QT. Corrigir eletrólitos. Considere magnesio IV profilatico.')
  }
}

const intervaloOsmolar: Calculator = {
  id: 'intervalo-osmolar',
  name: 'Intervalo osmolar (gap osmolar)',
  aliases: ['gap osmolar', 'osmolar gap', 'metanol', 'etilenoglicol', 'intoxicacao alcool toxico'],
  category: 'Toxicologia',
  type: 'formula',
  description: 'Diferença entre osmolaridade medida e calculada para detectar osmois nao medidos.',
  why: 'Gap osmolar > 10 sugere presenca de soluto nao medido (metanol, etilenoglicol, etanol).',
  whenToUse: 'Suspeita de intoxicacao por alcool toxico ou avaliacao de disturbios osmolares.',
  pearlsPitfalls: [
    'Gap = osmolaridade medida - osmolaridade calculada.',
    'Calculada: 2 x Na + glicose/18 + ureia/6.',
    'Normal: < 10 mOsm/kg.',
    'Gap elevado + acidose AG elevado = alcool toxico ate prova em contrario.',
    'Etanol contribui: cada 100 mg/dL ~22 mOsm. Subtrair se etanol medido.',
    'Gap normal nao exclui intoxicacao em fase tardia (metabolizado).'
  ],
  reference: 'Kraut JA, Kurtz I. Toxic alcohol ingestions: clinical features, diagnosis, and management. Clin J Am Soc Nephrol. 2008;3(1):208-25.',
  inputs: [
    { id: 'osm_measured', label: 'Osmolaridade medida', unit: 'mOsm/kg', min: 200, max: 500, step: 1, inputMode: 'numeric' },
    { id: 'na', label: 'Sodio', unit: 'mEq/L', min: 100, max: 180, step: 1, inputMode: 'numeric' },
    { id: 'glucose', label: 'Glicose', unit: 'mg/dL', min: 20, max: 1000, step: 1, inputMode: 'numeric' },
    { id: 'urea', label: 'Ureia', unit: 'mg/dL', min: 1, max: 300, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const osmCalc = 2 * v.na + v.glucose / 18 + v.urea / 6
    return Math.round((v.osm_measured - osmCalc) * 10) / 10
  },
  interpret: (score: number) => {
    if (score < 10) return interp(`Gap osmolar: ${score} mOsm/kg — normal`, '#4CAF50', 'Gap osmolar normal (< 10). Alcool toxico improvavel (porem nao excluido em fase tardia de metabolismo).')
    if (score < 20) return interp(`Gap osmolar: ${score} mOsm/kg — elevado`, '#FFC107', `Gap osmolar elevado. Considere: etanol, metanol, etilenoglicol, isopropanol, acetona. Medir alcool sérico se disponivel.`)
    return interp(`Gap osmolar: ${score} mOsm/kg — muito elevado`, '#F44336', `Gap osmolar muito elevado. Alta suspeita de alcool toxico. Considere fomepizol ou etanol IV e hemodialise se acidose grave. Medir niveis especificos.`)
  }
}

// ==========================================
// OBSTETRICIA — EXTRAS
// ==========================================

const idadeGestacional: Calculator = {
  id: 'idade-gestacional',
  name: 'Idade gestacional por DUM',
  aliases: ['ig', 'idade gestacional', 'dum', 'data ultima menstruacao', 'semanas gestacao'],
  category: 'Obstetricia',
  type: 'formula',
  description: 'Calcula idade gestacional atual em semanas e dias a partir da data da ultima menstruacao.',
  why: 'Estimativa rápida da idade gestacional para classificar trimestre e planejar cuidados.',
  whenToUse: 'Gestantes atendidas na emergência para estimar idade gestacional rápidamente.',
  pearlsPitfalls: [
    'Assume ciclos regulares de 28 dias.',
    'Ultrassom do primeiro trimestre e mais preciso que DUM.',
    'Se DUM incerta, considerar datacao por ultrassonografia.',
    '< 14 semanas: primeiro trimestre. 14-28: segundo. > 28: terceiro.',
    'Termo: 37-41 semanas. Pos-termo: >= 42 semanas.'
  ],
  reference: 'Standard obstetric practice. ACOG Committee Opinion.',
  inputs: [
    { id: 'dum_day', label: 'Dia da DUM', unit: '', min: 1, max: 31, step: 1, inputMode: 'numeric' },
    { id: 'dum_month', label: 'Mes da DUM', unit: '', min: 1, max: 12, step: 1, inputMode: 'numeric' },
    { id: 'dum_year', label: 'Ano da DUM', unit: '', min: 2020, max: 2030, step: 1, inputMode: 'numeric' }
  ],
  formula: (v) => {
    const dum = new Date(v.dum_year, v.dum_month - 1, v.dum_day)
    const today = new Date()
    const diffMs = today.getTime() - dum.getTime()
    const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    return totalDays
  },
  interpret: (_score: number, values?: Record<string, number>) => {
    if (!values) return interp('Preencha os campos', '#2196F3', 'Insira a data da ultima menstruacao.')
    const dum = new Date(values.dum_year, values.dum_month - 1, values.dum_day)
    const today = new Date()
    const diffMs = today.getTime() - dum.getTime()
    const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    const weeks = Math.floor(totalDays / 7)
    const days = totalDays % 7
    if (weeks < 0) return interp('DUM no futuro', '#FFC107', 'Verifique a data informada.')
    let trimester = 'primeiro trimestre'
    if (weeks >= 28) trimester = 'terceiro trimestre'
    else if (weeks >= 14) trimester = 'segundo trimestre'
    return interp(
      `IG: ${weeks} semanas e ${days} dias`,
      '#2196F3',
      `Idade gestacional: ${weeks}s${days}d (${trimester}). Confirmar com ultrassom do primeiro trimestre se DUM incerta.`
    )
  }
}

const hellpCriteria: Calculator = {
  id: 'hellp',
  name: 'Criterios de HELLP (classificação de Mississippi)',
  aliases: ['hellp', 'pre-eclampsia', 'síndrome hellp', 'mississippi', 'plaquetas', 'ldh', 'tgo'],
  category: 'Obstetricia',
  type: 'classification',
  description: 'Classificação de gravidade da síndrome HELLP pela classificação de Mississippi.',
  why: 'Classifica gravidade da síndrome HELLP para guiar manejo e decisao de parto.',
  whenToUse: 'Gestantes com suspeita de pre-eclampsia grave ou síndrome HELLP.',
  pearlsPitfalls: [
    'HELLP: Hemolysis, Elevated Liver enzymes, Low Platelets.',
    'Mississippi Classe 1 (mais grave): plaquetas <= 50.000.',
    'Mississippi Classe 2: plaquetas 50.000-100.000.',
    'Mississippi Classe 3: plaquetas 100.000-150.000.',
    'Criterios laboratoriais: plaquetas < 150.000, LDH > 600 U/L, TGO > 70 U/L.',
    'Tratamento definitivo: parto. Corticoide para maturacao fetal se < 34 semanas.'
  ],
  reference: 'Martin JN Jr et al. The spectrum of severe preeclampsia: comparative analysis by HELLP (hemolysis, elevated liver enzyme levels, and low platelet count) syndrome classification. Am J Obstet Gynecol. 1999;180(6 Pt 1):1373-84.',
  items: [
    {
      id: 'platelets',
      label: 'Contagem de plaquetas',
      options: [
        { label: '>= 150.000/mm3 — sem criterio', value: 0 },
        { label: '100.000-150.000/mm3 — Classe 3', value: 1 },
        { label: '50.000-100.000/mm3 — Classe 2', value: 2 },
        { label: '<= 50.000/mm3 — Classe 1', value: 3 }
      ]
    },
    { id: 'ldh', label: 'LDH > 600 U/L', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'tgo', label: 'TGO > 70 U/L', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (_score: number, values?: Record<string, number>) => {
    const plat = values?.platelets || 0
    const ldh = values?.ldh || 0
    const tgo = values?.tgo || 0
    if (plat === 0) return interp('Sem criterio de HELLP (plaquetas normais)', '#4CAF50', 'Plaquetas >= 150.000. Nao preenche criterio de HELLP. Investigar outras causas se clinica sugestiva.')
    if (ldh === 0 && tgo === 0) return interp('HELLP incompleta', '#FFC107', 'Plaquetopenia isolada sem elevação de LDH ou TGO. Considere HELLP incompleta. Monitorar laboratorio seriado.')
    if (plat === 3) return interp('HELLP — Mississippi Classe 1 (mais grave)', '#F44336', 'Plaquetas <= 50.000. Classe mais grave. Considere parto imediato. Risco de CIVD. Suporte transfusional.')
    if (plat === 2) return interp('HELLP — Mississippi Classe 2', '#F44336', 'Plaquetas 50.000-100.000. Considere parto. Corticoide se < 34 semanas. Monitoramento intensivo.')
    return interp('HELLP — Mississippi Classe 3', '#FFC107', 'Plaquetas 100.000-150.000. Forma mais branda. Monitoramento laboratorial seriado. Parto conforme indicacao obstetrica.')
  }
}

const mgso4Dose: Calculator = {
  id: 'mgso4-dose',
  name: 'Dose de sulfato de magnesio (eclampsia/pre-eclampsia)',
  aliases: ['magnesio', 'sulfato de magnesio', 'mgso4', 'eclampsia', 'pre-eclampsia', 'zuspan', 'pritchard'],
  category: 'Obstetricia',
  type: 'classification',
  description: 'Esquemas de sulfato de magnesio para prevencao e tratamento de eclampsia.',
  why: 'Sulfato de magnesio e o padrao-ouro para prevencao e tratamento de convulsoes eclampsicas.',
  whenToUse: 'Gestantes com pre-eclampsia grave ou eclampsia para anticonvulsoterapia.',
  pearlsPitfalls: [
    'Zuspan (IV puro): ataque 4 g IV em 20 min + manutencao 1-2 g/h IV.',
    'Pritchard (IV + IM): ataque 4 g IV + 10 g IM (5 g cada gluteo) + manutencao 5 g IM 4/4h.',
    'Monitorar: reflexo patelar, frequencia respiratoria (>= 16), diurese (>= 25 mL/h).',
    'Nivel terapeutico: 4-7 mEq/L. Nivel toxico: > 7 mEq/L.',
    'Antidoto: gluconato de calcio 1 g IV em 3-5 min se toxicidade.',
    'Manter por 24h apos parto ou 24h apos ultima convulsao.'
  ],
  reference: 'MAGPIE Trial. Do women with pre-eclampsia, and their babies, benefit from magnesium sulphate? The Magpie Trial: a randomised placebo-controlled trial. Lancet. 2002;359(9321):1877-90.',
  items: [
    {
      id: 'regimen',
      label: 'Esquema posologico',
      options: [
        { label: 'Zuspan (IV puro) — mais utilizado em centros com bomba de infusão', value: 1 },
        { label: 'Pritchard (IV + IM) — util quando bomba de infusão nao disponivel', value: 2 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 1) {
      return interp('Zuspan — IV puro', '#2196F3',
        'ATAQUE: MgSO4 4 g IV em 20 min (diluir 8 mL de MgSO4 50% em 100 mL SF 0,9%). MANUTENCAO: 1-2 g/h IV (bomba de infusão). Monitorar reflexo patelar, FR >= 16 irpm, diurese >= 25 mL/h. Manter por 24h pos-parto. Antidoto: gluconato de calcio 1 g IV se toxicidade.')
    }
    return interp('Pritchard — IV + IM', '#2196F3',
      'ATAQUE: MgSO4 4 g IV em 20 min + 10 g IM (5 g em cada gluteo, agulha 20G). MANUTENCAO: 5 g IM a cada 4h (alternando gluteos). Antes de cada dose IM: verificar reflexo patelar, FR >= 16 irpm, diurese >= 25 mL/h nas últimas 4h. Manter por 24h pos-parto. Antidoto: gluconato de calcio 1 g IV se toxicidade.')
  }
}

// ==========================================
// VASCULAR — EXTRAS
// ==========================================

const percRule: Calculator = {
  id: 'perc-rule',
  name: 'PERC Rule',
  aliases: ['perc', 'tep', 'embolia pulmonar', 'tromboembolismo', 'd-dimero', 'exclusao'],
  category: 'Vascular',
  type: 'score',
  description: 'Exclui tromboembolismo pulmonar sem necessidade de D-dimero quando todos os criterios sao negativos.',
  why: 'Em pacientes com probabilidade pre-teste baixa, PERC totalmente negativo exclui TEP sem D-dimero.',
  whenToUse: 'Pacientes com suspeita de TEP e probabilidade pre-teste baixa (Wells < 2 ou gestalt < 15%).',
  pearlsPitfalls: [
    'TODOS os 8 criterios devem ser negativos para excluir TEP.',
    'Qualquer criterio positivo = nao passa no PERC, solicitar D-dimero.',
    'So aplicar em pacientes com probabilidade pre-teste BAIXA.',
    'Não usar em pacientes com alta probabilidade clinica de TEP.',
    'Sensibilidade ~97%. Taxa de TEP perdido < 2% (aceitavel clinicamente).'
  ],
  reference: 'Kline JA et al. Clinical criteria to prevent unnecessary diagnostic testing in emergency department patients with suspected pulmonary embolism. J Thromb Haemost. 2004;2(8):1247-55.',
  items: [
    { id: 'age', label: 'Idade >= 50 anos', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'hr', label: 'FC >= 100 bpm', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'spo2', label: 'SpO2 < 95% em ar ambiente', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'hemoptysis', label: 'Hemoptise', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'estrogen', label: 'Uso de estrogeno', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'surgery', label: 'Cirurgia ou trauma com hospitalizacao nas últimas 4 semanas', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'dvt', label: 'Historia de TVP ou TEP previo', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] },
    { id: 'leg', label: 'Edema unilateral de membro inferior', options: [{ label: 'Nao', value: 0 }, { label: 'Sim', value: 1 }] }
  ],
  interpret: (score: number) => {
    if (score === 0) return interp('PERC negativo — TEP excluido', '#4CAF50', 'Todos os 8 criterios negativos. Em paciente com baixa probabilidade pre-teste, TEP pode ser excluido sem D-dimero. Risco residual < 2%.')
    return interp(`PERC positivo (${score} criterio${score > 1 ? 's' : ''})`, '#FFC107', 'PERC nao exclui TEP. Solicitar D-dimero. Se D-dimero positivo, prosseguir com angioTC.')
  }
}

// ==========================================
// SEPSE — EXTRAS
// ==========================================

const apacheII: Calculator = {
  id: 'apache-ii',
  name: 'APACHE II',
  aliases: ['apache', 'mortalidade uti', 'gravidade', 'prognostico uti', 'escore prognostico'],
  category: 'Respiratorio / Sepse',
  type: 'score',
  description: 'Escore de gravidade e predição de mortalidade em UTI (12 variaveis fisiologicas + idade + doenca cronica).',
  why: 'Padrao historico para comparacao de gravidade entre UTIs e ensaios clínicos.',
  whenToUse: 'Primeiras 24h de internacao em UTI para estimar gravidade e mortalidade.',
  pearlsPitfalls: [
    'Usar os piores valores das primeiras 24h de UTI.',
    'Score total: APS (0-60) + pontos por idade (0-6) + pontos por doenca cronica (0-5).',
    'APACHE II 0-4: ~4% mortalidade. APACHE II >= 35: ~88% mortalidade.',
    'Limitacao: nao inclui diagnóstico de admissao (APACHE III e IV incluem).',
    'Versao simplificada: aqui usamos os parametros mais impactantes para uma estimativa rápida.'
  ],
  reference: 'Knaus WA et al. APACHE II: a severity of disease classification system. Crit Care Med. 1985;13(10):818-29.',
  items: [
    { id: 'temp', label: 'Temperatura retal (graus Celsius) — pior valor 24h', options: [
      { label: '36-38,4', value: 0 }, { label: '38,5-38,9 ou 34-35,9', value: 1 },
      { label: '39-40,9 ou 32-33,9', value: 3 }, { label: '>= 41 ou <= 31,9', value: 4 }
    ]},
    { id: 'pam_val', label: 'PAM (mmHg) — pior valor 24h', options: [
      { label: '70-109', value: 0 }, { label: '110-129 ou 50-69', value: 2 },
      { label: '130-159', value: 3 }, { label: '>= 160 ou <= 49', value: 4 }
    ]},
    { id: 'hr_val', label: 'Frequencia cardiaca — pior valor 24h', options: [
      { label: '70-109', value: 0 }, { label: '110-139 ou 55-69', value: 2 },
      { label: '140-179 ou 40-54', value: 3 }, { label: '>= 180 ou <= 39', value: 4 }
    ]},
    { id: 'rr_val', label: 'Frequencia respiratoria — pior valor 24h', options: [
      { label: '12-24', value: 0 }, { label: '25-34 ou 10-11', value: 1 },
      { label: '35-49 ou 6-9', value: 3 }, { label: '>= 50 ou <= 5', value: 4 }
    ]},
    { id: 'ph', label: 'pH arterial — pior valor 24h', options: [
      { label: '7,33-7,49', value: 0 }, { label: '7,50-7,59 ou 7,25-7,32', value: 1 },
      { label: '7,60-7,69 ou 7,15-7,24', value: 3 }, { label: '>= 7,70 ou < 7,15', value: 4 }
    ]},
    { id: 'na_val', label: 'Sodio sérico (mEq/L) — pior valor 24h', options: [
      { label: '130-149', value: 0 }, { label: '150-154 ou 120-129', value: 2 },
      { label: '155-159 ou 111-119', value: 3 }, { label: '>= 160 ou <= 110', value: 4 }
    ]},
    { id: 'k_val', label: 'Potassio sérico (mEq/L) — pior valor 24h', options: [
      { label: '3,5-5,4', value: 0 }, { label: '5,5-5,9 ou 3,0-3,4', value: 1 },
      { label: '6,0-6,9 ou 2,5-2,9', value: 3 }, { label: '>= 7,0 ou < 2,5', value: 4 }
    ]},
    { id: 'cr_val', label: 'Creatinina (mg/dL) — pior valor 24h (pontos dobrados se IRA)', options: [
      { label: '0,6-1,4', value: 0 }, { label: '1,5-1,9 ou < 0,6', value: 2 },
      { label: '2,0-3,4', value: 3 }, { label: '>= 3,5', value: 4 }
    ]},
    { id: 'ht_val', label: 'Hematocrito (%) — pior valor 24h', options: [
      { label: '30-45,9', value: 0 }, { label: '46-49,9 ou 20-29,9', value: 2 },
      { label: '>= 50 ou < 20', value: 4 }
    ]},
    { id: 'wbc_val', label: 'Leucocitos (x1000/mm3) — pior valor 24h', options: [
      { label: '3-14,9', value: 0 }, { label: '15-19,9 ou 1-2,9', value: 2 },
      { label: '20-39,9', value: 3 }, { label: '>= 40 ou < 1', value: 4 }
    ]},
    { id: 'gcs_val', label: 'Glasgow (GCS) — pior valor 24h', options: [
      { label: '15 (0 pts)', value: 0 }, { label: '13-14 (1-2 pts)', value: 1 },
      { label: '10-12 (3-5 pts)', value: 3 }, { label: '7-9 (6-8 pts)', value: 6 },
      { label: '3-6 (9-12 pts)', value: 10 }
    ]},
    { id: 'age_pts', label: 'Idade', options: [
      { label: '< 45 anos', value: 0 }, { label: '45-54 anos', value: 2 },
      { label: '55-64 anos', value: 3 }, { label: '65-74 anos', value: 5 },
      { label: '>= 75 anos', value: 6 }
    ]},
    { id: 'chronic', label: 'Doenca cronica (imunossupressao, cirrose, ICC NYHA IV, DPOC grave, dialise)', options: [
      { label: 'Nenhuma', value: 0 },
      { label: 'Pos-operatorio eletivo', value: 2 },
      { label: 'Pos-operatorio de emergência ou nao cirurgico', value: 5 }
    ]}
  ],
  interpret: (score: number) => {
    if (score <= 4) return interp('APACHE II 0-4', '#4CAF50', 'Mortalidade estimada ~4%. Bom prognostico.')
    if (score <= 9) return interp('APACHE II 5-9', '#4CAF50', 'Mortalidade estimada ~8%.')
    if (score <= 14) return interp('APACHE II 10-14', '#FFC107', 'Mortalidade estimada ~15%.')
    if (score <= 19) return interp('APACHE II 15-19', '#FFC107', 'Mortalidade estimada ~25%.')
    if (score <= 24) return interp('APACHE II 20-24', '#F44336', 'Mortalidade estimada ~40%.')
    if (score <= 29) return interp('APACHE II 25-29', '#F44336', 'Mortalidade estimada ~55%.')
    if (score <= 34) return interp('APACHE II 30-34', '#F44336', 'Mortalidade estimada ~73%.')
    return interp(`APACHE II >= 35`, '#F44336', 'Mortalidade estimada ~85-88%. Prognostico muito reservado. Considere discussao de cuidados paliativos.')
  }
}

// ==========================================
// POCUS / HEMODINAMICA — EXTRAS
// ==========================================

const vtiClassificação: Calculator = {
  id: 'vti-classificação',
  name: 'Classificação hemodinâmica por VTI (Mercadal 2022)',
  aliases: ['vti', 'classificação hemodinâmica', 'pocus', 'eco', 'débito cardíaco', 'ecocardiografia'],
  category: 'POCUS / Hemodinamica',
  type: 'classification',
  description: 'Classificação hemodinâmica rápida baseada na VTI do LVOT medida por ecocardiografia point-of-care.',
  why: 'VTI permite avaliacao rápida e nao invasiva do débito cardíaco a beira-leito sem necessidade de cálculo complexo.',
  whenToUse: 'Avaliacao hemodinâmica rápida de pacientes em choque ou instabilidade hemodinâmica com eco point-of-care.',
  availableIn: { tool: 'Shock Path', route: '/shock' },
  pearlsPitfalls: [
    'VTI < 16 cm: baixo débito cardíaco provavel. Considere causas cardiogenicas ou obstrutivas.',
    'VTI 16-20 cm: débito cardíaco borderline. Correlacionar com contexto clínico.',
    'VTI > 20 cm: débito cardíaco provavelmente adequado ou elevado.',
    'Medir no LVOT com Doppler pulsado em janela apical 5 camaras.',
    'VTI e independente do diametro do LVOT — nao precisa medir diametro para triagem rápida.',
    'Delta VTI > 12-15% apos prova de volume sugere responsividade a fluidos.'
  ],
  reference: 'Mercadal J et al. Echocardiographic assessment of the hemodynamic profile in critically ill patients. Ann Intensive Care. 2022;12:97.',
  items: [
    {
      id: 'vti_range',
      label: 'VTI do LVOT (cm)',
      options: [
        { label: 'VTI < 16 cm — baixo débito', value: 1 },
        { label: 'VTI 16-20 cm — borderline', value: 2 },
        { label: 'VTI > 20 cm — débito adequado/elevado', value: 3 }
      ]
    }
  ],
  interpret: (score: number) => {
    if (score === 1) return interp('VTI < 16 cm — baixo débito', '#F44336', 'Débito cardíaco provavelmente reduzido. Considere causas: choque cardiogenico, tamponamento, TEP macico. Avaliar responsividade a volume. Considere inotropico se nao responsivo.')
    if (score === 2) return interp('VTI 16-20 cm — borderline', '#FFC107', 'Débito cardíaco limítrofe. Correlacionar com clinica. Considere prova de volume (delta VTI > 12-15% = responsivo). Avaliar causa de choque se presente.')
    return interp('VTI > 20 cm — débito adequado/elevado', '#4CAF50', 'Débito cardíaco provavelmente adequado ou elevado. Se choque presente: considere distributivo (sepse) ou obstrutivo. Avaliar resistencia vascular.')
  }
}

// ==========================================
// EXPORTACAO — CATEGORIAS
// ==========================================

export const CALCULATOR_CATEGORIES: CalculatorCategory[] = [
  {
    id: 'cardio',
    name: 'Cardiologia / SCA',
    color: '#FF5252',
    calculators: [heartScore, timiNstemi, graceScore, chadsVasc, hasBled, egsys, sfSyncope]
  },
  {
    id: 'neuro',
    name: 'Neurologia',
    color: '#60A5FA',
    calculators: [huntHess, fisherModificado, fourScore, ottawaHsa, hintsPlus, camIcu, nihss, gcs, abcd2, ichScore, abc2]
  },
  {
    id: 'gastro',
    name: 'Gastro / Hepato',
    color: '#10B981',
    calculators: [rockall, glasgowBlatchford, forrest, childPugh, meldNa, bonacini, alvaradoScore]
  },
  {
    id: 'trauma',
    name: 'Trauma',
    color: '#F59E0B',
    calculators: [tash, pecarn, mBig, canadianCSpine, parkland]
  },
  {
    id: 'hemo',
    name: 'Hemodinamica',
    color: '#8B5CF6',
    calculators: [dcVti, gradienteAa, deltaGap, shockIndex, pam, formulaWinters]
  },
  {
    id: 'resp-sepse',
    name: 'Respiratorio / Sepse',
    color: '#06B6D4',
    calculators: [curb65, qsofa, sofa, tempoO2, news2, criteriosLight, apacheII]
  },
  {
    id: 'tox',
    name: 'Toxicologia',
    color: '#EF4444',
    calculators: [ciwaAr, pss, nomogramaRumack, qtcCorrigido, intervaloOsmolar]
  },
  {
    id: 'farmaco',
    name: 'Farmacologia',
    color: '#EC4899',
    calculators: [corticoidEquiv]
  },
  {
    id: 'renal',
    name: 'Renal / Metabolico',
    color: '#14B8A6',
    calculators: [akinKdigo, correçãoNa, deficitAgua, osmolaridade, correçãoNaAdrogueMadias, cockcroftGault, ckdEpi, correçãoCalcio, correçãoPotassio, anionGap]
  },
  {
    id: 'vascular',
    name: 'Vascular',
    color: '#F97316',
    calculators: [addRs, caprini, percRule]
  },
  {
    id: 'procedimentos',
    name: 'Procedimentos',
    color: '#6366F1',
    calculators: [posicaoCvc]
  },
  {
    id: 'obstetricia',
    name: 'Obstetricia',
    color: '#D946EF',
    calculators: [dppDum, bishopScore, idadeGestacional, hellpCriteria, mgso4Dose]
  },
  {
    id: 'via-aerea',
    name: 'Via Aerea',
    color: '#0EA5E9',
    calculators: [cormackLehane, mallampati]
  },
  {
    id: 'infeccao',
    name: 'Infeccao',
    color: '#F472B6',
    calculators: [centorMcisaac]
  },
  {
    id: 'sedacao-dor',
    name: 'Sedacao / Dor',
    color: '#A78BFA',
    calculators: [rass, bps, evaNrs]
  },
  {
    id: 'pocus-hemo',
    name: 'POCUS / Hemodinamica',
    color: '#34D399',
    calculators: [vtiClassificação]
  }
]

/** Lista plana para busca */
export const ALL_CALCULATORS: Calculator[] = CALCULATOR_CATEGORIES.flatMap(c => c.calculators)
