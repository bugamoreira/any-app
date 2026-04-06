// ==========================================
// TOX PATH — Dados clinicos
// Fonte: Tox Path v1 (HTML original)
// ==========================================

// ==========================================
// TIPOS
// ==========================================

export type VitalClass = 'up' | 'down' | 'normal'

export interface VitalSign {
  valor: string
  classe: VitalClass
}

export interface Toxindrome {
  id: string
  nome: string
  gradientFrom: string
  gradientTo: string
  sinais: string[]
  vitais: {
    consciencia: VitalSign
    fc: VitalSign
    pa: VitalSign
    fr: VitalSign
    temp: VitalSign
    pupilas: VitalSign
    pele: VitalSign
  }
  agentes: string
  antidoto: string
}

export interface ToxQuestion {
  id: number
  text: string
  hint: string
  options: ToxOption[]
}

export interface ToxOption {
  text: string
  value: string
  next?: number
  result?: string
}

export interface Antidote {
  id: string
  name: string
  indication: string
  available: boolean
  searchTerms: string
  sections: AntidoteSection[]
  warnings?: string[]
  infos?: string[]
  hasCalculator?: 'atropina' | 'nac' | 'nomograma'
}

export interface AntidoteSection {
  title: string
  lines: string[]
}

export interface DispositionCriterion {
  text: string
  detail: string
  example: string
  level: 'uti' | 'enfermaria'
}

export interface ChecklistSection {
  id: string
  letter: string
  title: string
  color: string
  items: ChecklistItem[]
}

export interface ChecklistItem {
  label: string
  hint: string
}

export interface TableRow {
  col1: string
  col2: string
  highlight?: 'danger' | 'warning' | 'success' | 'accent'
}

export interface ComparisonCard {
  title: string
  rows: { label: string; value: string }[]
}

export interface ToxicDrug {
  nome: string
  alias?: string[]
  dose: number
  unidade: string
  meiaVida: string
  retardada?: boolean
}

// ==========================================
// HOME — Modulos
// ==========================================

export interface HomeModule {
  id: string
  title: string
  subtitle: string
  borderColor: string
}

export const homeModules: HomeModule[] = [
  { id: 'toxindromes', title: 'Identificar toxindrome', subtitle: 'Fluxo interativo baseado em sinais clinicos', borderColor: '#10B981' },
  { id: 'descontaminacao', title: 'Descontaminacao GI', subtitle: 'Carvao ativado e lavagem gastrica', borderColor: '#60A5FA' },
  { id: 'disposicao', title: 'Criterios de disposicao', subtitle: 'Alta vs. Enfermaria vs. UTI', borderColor: '#EF4444' },
  { id: 'antidotos', title: 'Guia de antidotos', subtitle: 'Doses e indicacoes', borderColor: '#A78BFA' },
  { id: 'checklist', title: 'Checklist de avaliacao', subtitle: 'Exame fisico direcionado para intoxicacoes', borderColor: '#F59E0B' },
  { id: 'tabelas', title: 'Tabelas de consulta', subtitle: 'Toxindromes, odores, ECG, achados', borderColor: '#10B981' },
]

// ==========================================
// TOXINDROMES — Perguntas do fluxo
// ==========================================

export const toxQuestions: ToxQuestion[] = [
  {
    id: 1,
    text: 'O paciente esta agitado ou com alteracao do nivel de consciencia?',
    hint: 'Avalie se ha excitacao psicomotora, confusao, letargia ou coma',
    options: [
      { text: 'Agitado', value: 'agitado', next: 2 },
      { text: 'Rebaixado', value: 'rebaixado', next: 10 },
      { text: 'Normal', value: 'normal', next: 20 },
    ],
  },
  {
    id: 2,
    text: 'Como estao as pupilas?',
    hint: 'Observe tamanho e reatividade pupilar',
    options: [
      { text: 'Midriase (dilatadas)', value: 'midriase', next: 3 },
      { text: 'Miose (contraidas)', value: 'miose', next: 8 },
      { text: 'Normais', value: 'normais', next: 6 },
    ],
  },
  {
    id: 3,
    text: 'A pele esta umida (diaforetica) ou seca?',
    hint: 'Palpe axilas, testa, torax',
    options: [
      { text: 'Umida/Diaforetica', value: 'umida', next: 4 },
      { text: 'Seca e quente', value: 'seca', next: 5 },
      { text: 'Normal', value: 'normal', next: 4 },
    ],
  },
  {
    id: 4,
    text: 'Ha hiperreflexia, tremores ou clonus?',
    hint: 'Especialmente em membros inferiores',
    options: [
      { text: 'Sim', value: 'sim', result: 'serotoninergico' },
      { text: 'Nao', value: 'nao', result: 'simpaticomimetico' },
    ],
  },
  {
    id: 5,
    text: 'Ha diminuicao de ruidos hidroaereos, retencao urinaria ou mucosas secas?',
    hint: 'Ausculte abdome, pergunte sobre diurese',
    options: [
      { text: 'Sim', value: 'sim', result: 'anticolinergico' },
      { text: 'Nao', value: 'nao', result: 'simpaticomimetico' },
    ],
  },
  {
    id: 6,
    text: 'Ha sinais de excitacao simpatica? (taquicardia, hipertensao, sudorese)',
    hint: 'Verifique FC > 100, PA elevada',
    options: [
      { text: 'Sim', value: 'sim', next: 4 },
      { text: 'Nao', value: 'nao', result: 'misto' },
    ],
  },
  {
    id: 8,
    text: 'Ha bradicardia e hipersecrecao? (sialorreia, broncorreia, lacrimejamento)',
    hint: 'Sinais colinergicos classicos',
    options: [
      { text: 'Sim', value: 'sim', result: 'colinergico' },
      { text: 'Nao', value: 'nao', result: 'misto' },
    ],
  },
  {
    id: 10,
    text: 'Como estao as pupilas?',
    hint: 'Observe tamanho e reatividade pupilar',
    options: [
      { text: 'Miose puntiforme', value: 'miose', next: 11 },
      { text: 'Midriase ou normais', value: 'midriase', next: 12 },
    ],
  },
  {
    id: 11,
    text: 'Ha depressao respiratoria (FR < 12 ou apneia)?',
    hint: 'Conte frequencia respiratoria por 1 minuto',
    options: [
      { text: 'Sim', value: 'sim', result: 'opioide' },
      { text: 'Nao', value: 'nao', next: 12 },
    ],
  },
  {
    id: 12,
    text: 'Ha hipersecrecao bronquica, sialorreia, fasciculacoes musculares?',
    hint: 'Sinais colinergicos tipicos de organofosforados',
    options: [
      { text: 'Sim', value: 'sim', result: 'colinergico' },
      { text: 'Nao', value: 'nao', result: 'sedativo' },
    ],
  },
  {
    id: 20,
    text: 'Ha algum sinal ou sintoma sugestivo de intoxicacao?',
    hint: 'Nauseas, vomitos, alteracoes de ECG, disturbios metabolicos',
    options: [
      { text: 'Sim, investigar', value: 'sim', result: 'misto' },
      { text: 'Nao, paciente estavel', value: 'nao', result: 'normal' },
    ],
  },
]

// ==========================================
// TOXINDROMES — Dados
// ==========================================

export const toxindromes: Record<string, Toxindrome> = {
  simpaticomimetico: {
    id: 'simpaticomimetico',
    nome: 'Simpaticomimetico',
    gradientFrom: '#EF4444', gradientTo: '#DC2626',
    sinais: ['Midriase', 'Taquicardia', 'Hipertensao', 'Hipertermia', 'Diaforese', 'Agitacao'],
    vitais: {
      consciencia: { valor: 'Agitacao/Delirium', classe: 'up' },
      fc: { valor: 'Aumentada', classe: 'up' },
      pa: { valor: 'Aumentada', classe: 'up' },
      fr: { valor: 'Aumentada', classe: 'up' },
      temp: { valor: 'Hipertermia', classe: 'up' },
      pupilas: { valor: 'Midriase', classe: 'up' },
      pele: { valor: 'Umida', classe: 'normal' },
    },
    agentes: 'Cocaina, anfetaminas, metanfetamina, efedrina, pseudoefedrina, cafeina, teofilina, MDMA (ecstasy), catinonas sinteticas',
    antidoto: 'Considere suporte + benzodiazepinicos para agitacao',
  },
  anticolinergico: {
    id: 'anticolinergico',
    nome: 'Anticolinergico',
    gradientFrom: '#F59E0B', gradientTo: '#D97706',
    sinais: ['Midriase', 'Taquicardia', 'Pele seca e quente', 'Retencao urinaria', 'Diminuicao de RHA', 'Mucosas secas'],
    vitais: {
      consciencia: { valor: 'Agitacao/Delirium', classe: 'up' },
      fc: { valor: 'Taquicardia', classe: 'up' },
      pa: { valor: 'Normal ou aumentada', classe: 'normal' },
      fr: { valor: 'Aumentada', classe: 'up' },
      temp: { valor: 'Hipertermia', classe: 'up' },
      pupilas: { valor: 'Midriase', classe: 'up' },
      pele: { valor: 'Seca, quente, ruborizada', classe: 'up' },
    },
    agentes: 'Anti-histaminicos (difenidramina), antidepressivos triciclicos, atropina, escopolamina, antipsicoticos, ciclobenzaprina, plantas (Datura/trombeteira)',
    antidoto: 'Fisostigmina (nao disponivel) — considere benzodiazepinicos',
  },
  opioide: {
    id: 'opioide',
    nome: 'Opioide',
    gradientFrom: '#6366F1', gradientTo: '#4F46E5',
    sinais: ['Miose puntiforme', 'Depressao respiratoria', 'Rebaixamento de consciencia', 'Hipotensao', 'Bradicardia'],
    vitais: {
      consciencia: { valor: 'Sedacao/Coma', classe: 'down' },
      fc: { valor: 'Diminuida ou normal', classe: 'down' },
      pa: { valor: 'Hipotensao', classe: 'down' },
      fr: { valor: 'Bradipneia/Apneia', classe: 'down' },
      temp: { valor: 'Diminuida ou normal', classe: 'down' },
      pupilas: { valor: 'Miose puntiforme', classe: 'down' },
      pele: { valor: 'Variavel', classe: 'normal' },
    },
    agentes: 'Morfina, fentanil, heroina, metadona, oxicodona, codeina, tramadol, loperamida (doses altas)',
    antidoto: 'Considere NALOXONA — Disponivel',
  },
  sedativo: {
    id: 'sedativo',
    nome: 'Sedativo-Hipnotico',
    gradientFrom: '#8B5CF6', gradientTo: '#7C3AED',
    sinais: ['Rebaixamento de consciencia', 'Hipotensao', 'Hipotermia', 'Hiporreflexia', 'Ataxia'],
    vitais: {
      consciencia: { valor: 'Sedacao/Coma', classe: 'down' },
      fc: { valor: 'Diminuida ou normal', classe: 'down' },
      pa: { valor: 'Diminuida ou normal', classe: 'down' },
      fr: { valor: 'Diminuida ou normal', classe: 'down' },
      temp: { valor: 'Hipotermia', classe: 'down' },
      pupilas: { valor: 'Variavel', classe: 'normal' },
      pele: { valor: 'Variavel', classe: 'normal' },
    },
    agentes: 'Benzodiazepinicos, barbituricos, etanol, zolpidem, GHB, baclofeno, gabapentina, pregabalina',
    antidoto: 'Flumazenil (BZD) — uso restrito, risco de convulsao. Considere apenas em casos selecionados',
  },
  colinergico: {
    id: 'colinergico',
    nome: 'Colinergico',
    gradientFrom: '#10B981', gradientTo: '#059669',
    sinais: ['Miose', 'Bradicardia', 'Sialorreia', 'Broncorreia', 'Lacrimejamento', 'Diarreia', 'Incontinencia', 'Fasciculacoes'],
    vitais: {
      consciencia: { valor: 'Confusao/Coma', classe: 'down' },
      fc: { valor: 'Bradicardia', classe: 'down' },
      pa: { valor: 'Diminuida ou normal', classe: 'down' },
      fr: { valor: 'Variavel', classe: 'normal' },
      temp: { valor: 'Normal', classe: 'normal' },
      pupilas: { valor: 'Miose', classe: 'down' },
      pele: { valor: 'Umida/Diaforetica', classe: 'normal' },
    },
    agentes: 'Organofosforados, carbamatos, fisostigmina, pilocarpina, nicotina, agentes nervosos',
    antidoto: 'Considere ATROPINA — Disponivel (Pralidoxima NAO disponivel)',
  },
  serotoninergico: {
    id: 'serotoninergico',
    nome: 'Serotoninergico',
    gradientFrom: '#EC4899', gradientTo: '#DB2777',
    sinais: ['Agitacao', 'Hipertermia', 'Diaforese', 'Midriase', 'Tremor', 'Hiperreflexia', 'Clonus', 'Rigidez'],
    vitais: {
      consciencia: { valor: 'Agitacao/Confusao', classe: 'up' },
      fc: { valor: 'Taquicardia', classe: 'up' },
      pa: { valor: 'Hipertensao', classe: 'up' },
      fr: { valor: 'Taquipneia', classe: 'up' },
      temp: { valor: 'Hipertermia grave', classe: 'up' },
      pupilas: { valor: 'Midriase', classe: 'up' },
      pele: { valor: 'Umida/Ruborizada', classe: 'up' },
    },
    agentes: 'ISRS + IMAO, ISRS + tramadol, ISRS + triptanos, linezolida + ISRS, meperidina + IMAO, dextrometorfano + ISRS',
    antidoto: 'Considere suporte + benzodiazepinicos + ciproeptadina (se disponivel) + resfriamento',
  },
  misto: {
    id: 'misto',
    nome: 'Apresentacao Mista/Atipica',
    gradientFrom: '#64748B', gradientTo: '#333333',
    sinais: ['Achados nao caracteristicos', 'Possivel poliintoxicacao', 'Evolucao atipica'],
    vitais: {
      consciencia: { valor: 'Variavel', classe: 'normal' },
      fc: { valor: 'Variavel', classe: 'normal' },
      pa: { valor: 'Variavel', classe: 'normal' },
      fr: { valor: 'Variavel', classe: 'normal' },
      temp: { valor: 'Variavel', classe: 'normal' },
      pupilas: { valor: 'Variavel', classe: 'normal' },
      pele: { valor: 'Variavel', classe: 'normal' },
    },
    agentes: 'Considerar: poliintoxicacao, intoxicacao em evolucao, agentes atipicos, metais pesados, alcoois toxicos, salicilatos, paracetamol',
    antidoto: 'Recomenda-se investigacao com exames complementares — considere contatar CIATox',
  },
  normal: {
    id: 'normal',
    nome: 'Sem Toxindrome Evidente',
    gradientFrom: '#64748B', gradientTo: '#333333',
    sinais: ['Paciente estavel', 'Sem achados sugestivos'],
    vitais: {
      consciencia: { valor: 'Normal', classe: 'normal' },
      fc: { valor: 'Normal', classe: 'normal' },
      pa: { valor: 'Normal', classe: 'normal' },
      fr: { valor: 'Normal', classe: 'normal' },
      temp: { valor: 'Normal', classe: 'normal' },
      pupilas: { valor: 'Normais', classe: 'normal' },
      pele: { valor: 'Normal', classe: 'normal' },
    },
    agentes: 'Se historia positiva para ingestao, considerar observacao de 4-6h. Dosar paracetamol e salicilatos se ingestao intencional.',
    antidoto: 'Considere observacao clinica — avaliar necessidade de descontaminacao',
  },
}

// ==========================================
// ANTIDOTOS
// ==========================================

export const antidotes: Antidote[] = [
  // -- Disponiveis --
  {
    id: 'naloxona', name: 'Naloxona', indication: 'Intoxicacao por opioides', available: true,
    searchTerms: 'naloxona narcan opioide opiáceo heroina fentanil morfina codeina tramadol metadona oxicodona',
    sections: [
      { title: 'Indicacao', lines: ['Depressao respiratoria + miose + suspeita de opioide'] },
      { title: 'Dose inicial', lines: ['0,04 a 0,4 mg IV (iniciar com dose baixa se dependente)', 'Se sem resposta: ate 2 mg IV', 'Repetir a cada 2-3 minutos se necessario'] },
      { title: 'Infusao continua', lines: ['Se recorrencia: 2/3 da dose efetiva/hora em BIC'] },
    ],
    warnings: ['Meia-vida curta (30-90 min) — risco de recorrencia. Observar por pelo menos 4-6h apos ultima dose.'],
    infos: ['Em dependentes, titular para FR > 12, nao para consciencia plena (evitar abstinencia).'],
  },
  {
    id: 'nac', name: 'N-acetilcisteina (NAC)', indication: 'Intoxicacao por paracetamol', available: true,
    searchTerms: 'n-acetilcisteina nac acetilcisteina paracetamol acetaminofeno hepatotoxicidade',
    sections: [
      { title: 'Indicacao', lines: ['Nivel serico de paracetamol acima da linha de tratamento no nomograma de Rumack-Matthew ou ingestao > 150 mg/kg'] },
      { title: 'Protocolo IV (21 horas) — Prescott', lines: ['1a etapa: 150 mg/kg em 200 mL SF em 1 hora', '2a etapa: 50 mg/kg em 500 mL SF em 4 horas', '3a etapa: 100 mg/kg em 1000 mL SF em 16 horas'] },
      { title: 'Dose total', lines: ['300 mg/kg em 21 horas'] },
    ],
    warnings: ['Reacoes anafilactoides sao comuns na 1a hora. Reduzir velocidade de infusao se ocorrerem.'],
    infos: ['Maior eficacia se iniciado em ate 8h da ingestao. Ainda util ate 24h ou mais se hepatotoxicidade.'],
    hasCalculator: 'nac',
  },
  {
    id: 'atropina', name: 'Atropina', indication: 'Sindrome colinergica / Organofosforados', available: true,
    searchTerms: 'atropina organofosforado carbamato colinergico inseticida pesticida sialorreia broncorreia',
    sections: [
      { title: 'Indicacao', lines: ['Sindrome colinergica: broncorreia, sialorreia, bradicardia, miose, diarreia, vomitos'] },
      { title: 'Apresentacao disponivel', lines: ['Atropina 0,25 mg/mL — ampola 1 mL'] },
      { title: 'Dose inicial', lines: ['1-2 mg IV (adultos) = 4-8 ampolas', '0,02-0,05 mg/kg IV (criancas)'] },
      { title: 'Titulacao', lines: ['Dobrar dose a cada 5 minutos ate controle das secrecoes', 'Endpoint: secrecoes secas (nao FC ou pupilas)'] },
      { title: 'Manutencao', lines: ['Infusao continua: 20% da dose de ataque/hora'] },
    ],
    warnings: ['Doses muito altas podem ser necessarias (centenas de mg). Nao ha dose maxima absoluta.'],
    infos: ['Pralidoxima NAO disponivel. Atropina e o pilar do tratamento.'],
    hasCalculator: 'atropina',
  },
  {
    id: 'bicarbonato', name: 'Bicarbonato de Sodio', indication: 'Bloqueadores de canal de sodio / ADT', available: true,
    searchTerms: 'bicarbonato de sodio antidepressivo triciclico adt bloqueador canal sodio cocaina qrs arritmia',
    sections: [
      { title: 'Indicacao', lines: ['QRS > 100 ms ou arritmia ventricular por: ADT, cocaina, antiarritmicos classe I, carbamazepina'] },
      { title: 'Dose', lines: ['1-2 mEq/kg IV em bolus', 'Repetir ate QRS < 100 ms'] },
      { title: 'Meta', lines: ['pH arterial: 7,50-7,55', 'Sodio serico: 150-155 mEq/L'] },
    ],
    warnings: ['Monitorar pH, K+ e Na+. Hipocalemia pode ocorrer com alcalose.'],
  },
  {
    id: 'gluconato', name: 'Gluconato de Calcio', indication: 'Bloqueadores de canal de calcio / Ac. fluoridrico', available: true,
    searchTerms: 'gluconato de calcio calcio bloqueador canal calcio bcc verapamil diltiazem amlodipino fluoridrico hipercalemia',
    sections: [
      { title: 'Indicacao', lines: ['Intoxicacao por BCC (verapamil, diltiazem), acido fluoridrico, hipercalemia grave'] },
      { title: 'Dose para BCC', lines: ['Gluconato de calcio 10%: 20-30 mL IV (2-3 g)', 'ou Cloreto de calcio 10%: 10 mL IV (1 g) — preferir via central'] },
      { title: 'Manutencao', lines: ['Infusao: 0,5-2 mL/kg/h de gluconato 10%', 'Meta: calcio ionizado 1,5-2x o normal'] },
    ],
    warnings: ['Cloreto de calcio e vesicante — preferir via central. Gluconato pode ir em acesso periferico.'],
  },
  {
    id: 'flumazenil', name: 'Flumazenil', indication: 'Intoxicacao por benzodiazepinicos', available: true,
    searchTerms: 'flumazenil lanexat benzodiazep��nico bzd diazepam midazolam alprazolam clonazepam',
    sections: [
      { title: 'USO RESTRITO', lines: ['NAO usar rotineiramente. Alto risco de convulsoes.'] },
      { title: 'Contraindicacoes', lines: ['Uso cronico de BZD (risco de abstinencia)', 'Coingestao de pro-convulsivantes (ADT, cocaina)', 'Historia de convulsoes', 'ECG com QRS alargado'] },
      { title: 'Dose (se indicado)', lines: ['0,2 mg IV em 30 segundos', 'Repetir 0,3 mg apos 30s se sem resposta', 'Maximo: 3-5 mg'] },
    ],
    warnings: ['Na duvida, NAO usar. Suporte ventilatorio e mais seguro.'],
  },
  {
    id: 'azulmetileno', name: 'Azul de Metileno', indication: 'Metemoglobinemia', available: true,
    searchTerms: 'azul de metileno metemoglobinemia metemoglobina dapsona benzocaina nitritos cianose',
    sections: [
      { title: 'Indicacao', lines: ['MetHb > 20-30% ou sintomatico (cianose refrataria a O2, dispneia, alteracao de consciencia)'] },
      { title: 'Dose', lines: ['1-2 mg/kg IV em 5 minutos', 'Diluir em SF 50-100 mL', 'Repetir em 1h se necessario (max 7 mg/kg)'] },
    ],
    warnings: ['Contraindicado em deficiencia de G6PD (pode causar hemolise).'],
    infos: ['Causas: dapsona, benzocaina, nitritos, anilinas. SpO2 falsamente baixa na oximetria.'],
  },
  {
    id: 'piridoxina', name: 'Piridoxina (Vitamina B6)', indication: 'Intoxicacao por isoniazida', available: true,
    searchTerms: 'piridoxina vitamina b6 isoniazida inh convulsao hidrazina',
    sections: [
      { title: 'Indicacao', lines: ['Convulsoes refratarias a BZD + suspeita de isoniazida'] },
      { title: 'Dose', lines: ['Grama por grama da dose ingerida de INH', 'Se dose desconhecida: 5 g IV (adultos)', 'Taxa: 0,5-1 g/min'] },
    ],
  },
  {
    id: 'hidroxocobalamina', name: 'Hidroxocobalamina', indication: 'Intoxicacao por cianeto', available: true,
    searchTerms: 'hidroxocobalamina cianokit cianeto fumaca incendio acido cianidrico',
    sections: [
      { title: 'Indicacao', lines: ['Suspeita de intoxicacao por cianeto (vitima de incendio + acidose latica + rebaixamento)'] },
      { title: 'Dose', lines: ['5 g IV em 15 minutos (adultos)', 'Pediatrico: 70 mg/kg', 'Repetir 5 g se necessario'] },
    ],
    warnings: ['Colore fluidos corporais em vermelho (interfere com exames laboratoriais).'],
  },
  {
    id: 'fomepizol', name: 'Fomepizol / Etanol', indication: 'Alcoois toxicos (metanol, etilenoglicol)', available: true,
    searchTerms: 'fomepizol etanol metanol etilenoglicol alcool toxico antifreeze',
    sections: [
      { title: 'Indicacao', lines: ['Suspeita de intoxicacao por metanol ou etilenoglicol', 'Gap osmotico > 10 ou acidose com anion gap'] },
      { title: 'Fomepizol (se disponivel)', lines: ['Ataque: 15 mg/kg IV', 'Manutencao: 10 mg/kg a cada 12h', 'Apos 48h: 15 mg/kg a cada 12h'] },
      { title: 'Etanol IV (alternativa)', lines: ['Ataque: 0,6-0,8 g/kg IV', 'Manutencao: 66-154 mg/kg/h', 'Meta: alcoolemia 100-150 mg/dL'] },
    ],
    warnings: ['Hemodialise indicada se: acidose grave, IRA, deficit visual, nivel elevado.'],
  },
  {
    id: 'lipidica', name: 'Emulsao Lipidica 20%', indication: 'Toxicidade por anestesicos locais (LAST)', available: true,
    searchTerms: 'emulsao lipidica intralipid anestesico local bupivacaina lidocaina last lipid rescue',
    sections: [
      { title: 'Indicacao', lines: ['Toxicidade sistemica por anestesicos locais (LAST)', 'Considerar em intoxicacoes graves por lipofilicos'] },
      { title: 'Dose', lines: ['Bolus: 1,5 mL/kg IV em 1 minuto', 'Infusao: 0,25 mL/kg/min por 30-60 min', 'Repetir bolus 1-2x se instabilidade persistir'] },
    ],
    warnings: ['Dose maxima total: 12 mL/kg. Nao usar propofol como substituto.'],
  },
  // -- Nao disponiveis --
  {
    id: 'pralidoxima', name: 'Pralidoxima', indication: 'Organofosforados (reativador de colinesterase)', available: false,
    searchTerms: 'pralidoxima 2-pam organofosforado reativador colinesterase',
    sections: [
      { title: 'Informacao', lines: ['Nao disponivel no Brasil. Usar ATROPINA como pilar do tratamento.'] },
    ],
  },
  {
    id: 'glucagon', name: 'Glucagon', indication: 'Betabloqueadores / BCC', available: false,
    searchTerms: 'glucagon betabloqueador propranolol atenolol metoprolol bradicardia',
    sections: [
      { title: 'Informacao', lines: ['Disponibilidade limitada. Alternativa: insulina em alta dose + glicose (HIE).'] },
    ],
  },
  {
    id: 'fab-antidigoxina', name: 'Fab Antidigoxina', indication: 'Intoxicacao digitalica', available: false,
    searchTerms: 'fab antidigoxina digibind digoxina digitalico digitalis',
    sections: [
      { title: 'Informacao', lines: ['Nao disponivel no Brasil. Suporte com atropina, marcapasso temporario e correcao de K+.'] },
    ],
  },
  {
    id: 'fisostigmina', name: 'Fisostigmina', indication: 'Sindrome anticolinergica grave', available: false,
    searchTerms: 'fisostigmina anticolinergico delirium agitacao',
    sections: [
      { title: 'Informacao', lines: ['Nao disponivel. Usar BENZODIAZEPINICOS para agitacao. Suporte e resfriamento para hipertermia.'] },
    ],
  },
]

// ==========================================
// DISPOSICAO — Criterios
// ==========================================

export const utiCriteria: DispositionCriterion[] = [
  { text: 'Rebaixamento de consciencia / Coma', detail: 'Paciente nao responsivo a estimulos verbais ou com Glasgow <= 8', example: 'Letargia significativa, estupor, coma profundo', level: 'uti' },
  { text: 'Necessidade de IOT / Via aerea avancada', detail: 'Intubacao orotraqueal de emergencia realizada ou indicada', example: 'Falha em proteger via aerea, apneia, Glasgow <= 8', level: 'uti' },
  { text: 'Depressao respiratoria (PaCO2 > 45 mmHg)', detail: 'Hipoventilacao com retencao de CO2 ou FR < 10 irpm', example: 'Bradipneia por opioides, insuficiencia respiratoria', level: 'uti' },
  { text: 'Hipotensao (PAS <= 80 mmHg)', detail: 'Pressao arterial sistolica <= 80 mmHg ou choque', example: 'Choque distributivo, vasoplegia por intoxicacao', level: 'uti' },
  { text: 'Convulsoes prolongadas ou recorrentes', detail: 'Crise convulsiva pos-ingestao ou status epilepticus', example: 'Convulsoes por ADT, isoniazida, cocaina', level: 'uti' },
  { text: 'Arritmia nao sinusal', detail: 'Ritmo diferente de sinusal ao monitor ou ECG', example: 'TV, FV, FA, flutter, ritmos idioventriculares', level: 'uti' },
  { text: 'BAV 2o ou 3o grau', detail: 'Bloqueio atrioventricular de segundo ou terceiro grau', example: 'Intoxicacao por betabloqueadores, BCC, digoxina', level: 'uti' },
  { text: 'QRS > 120 ms ou QTc > 500 ms', detail: 'Alargamento de QRS ou prolongamento de QT significativos', example: 'ADT, antiarritmicos, antipsicoticos', level: 'uti' },
  { text: 'Acidose grave (pH <= 7,2)', detail: 'Acidose metabolica ou mista com pH arterial <= 7,2', example: 'Metanol, etilenoglicol, salicilatos, metformina', level: 'uti' },
  { text: 'Hipertermia grave (T > 40C)', detail: 'Temperatura central > 40C (104F)', example: 'Sindrome serotoninergica, SNM, simpaticomiméticos', level: 'uti' },
  { text: 'Necessidade de hemodialise', detail: 'Indicacao de terapia extracorporea para remocao do toxico', example: 'Metanol, etilenoglicol, litio, salicilatos graves', level: 'uti' },
  { text: 'Agitacao requerendo contencao quimica/fisica', detail: 'Agitacao psicomotora grave nao controlada com medidas simples', example: 'Delirium por anticolinergicos, simpaticomiméticos', level: 'uti' },
  { text: 'Ingestao de "bomba-relogio toxica"', detail: 'Substancias com toxicidade tardia potencialmente grave', example: 'Paracetamol, paraquat, colchicina, metanol, etilenoglicol, cogumelos Amanita, IMAO', level: 'uti' },
]

export const enfermariaCriteria: DispositionCriterion[] = [
  { text: 'Toxicidade leve a moderada persistente', detail: 'Sintomas que nao resolvem no periodo de observacao', example: 'Sonolencia persistente, nauseas/vomitos, taquicardia leve', level: 'enfermaria' },
  { text: 'Necessidade de antidoto em infusao continua', detail: 'Tratamento com antidoto por tempo prolongado sem instabilidade', example: 'N-acetilcisteina para paracetamol (21h de infusao)', level: 'enfermaria' },
  { text: 'Ingestao intencional com necessidade de avaliacao psiquiatrica', detail: 'Tentativa de autoexterminio necessitando avaliacao especializada', example: 'Todos os pacientes com ingestao intencional devem ter avaliacao psiquiatrica antes da alta', level: 'enfermaria' },
  { text: 'Alteracoes laboratoriais que requerem monitorizacao', detail: 'Disturbios hidroeletroliticos, elevacao de transaminases, etc.', example: 'Hipocalemia por teofilina, hepatotoxicidade por paracetamol', level: 'enfermaria' },
]

// ==========================================
// CHECKLIST
// ==========================================

export const checklistSections: ChecklistSection[] = [
  {
    id: 'estabilizacao', letter: 'A', title: 'Estabilizacao inicial (ABCDE)', color: '#EF4444',
    items: [
      { label: 'Via aerea pervia', hint: 'Verificar patencia, secrecoes, estridor' },
      { label: 'Respiracao adequada', hint: 'FR, SpO2, padrao respiratorio, ausculta' },
      { label: 'Circulacao estavel', hint: 'FC, PA, TEC, pulsos perifericos' },
      { label: 'Nivel de consciencia (Glasgow)', hint: 'Avaliar resposta ocular, verbal e motora' },
      { label: 'Glicemia capilar', hint: 'Recomendado se alteracao de consciencia' },
      { label: 'Exposicao completa', hint: 'Buscar patches, marcas de agulha, lesoes' },
    ],
  },
  {
    id: 'sinais-vitais', letter: 'B', title: 'Sinais vitais detalhados', color: '#FF5252',
    items: [
      { label: 'Frequencia cardiaca', hint: 'Taqui (>100) ou bradicardia (<60)' },
      { label: 'Pressao arterial', hint: 'Hiper ou hipotensao' },
      { label: 'Frequencia respiratoria', hint: 'Contar por 1 minuto (normal: 12-20)' },
      { label: 'Temperatura axilar/central', hint: 'Hiper (>38) ou hipotermia (<35)' },
      { label: 'Saturacao de O2', hint: 'Atencao: SpO2 pode ser falsa em MetHb e CO' },
    ],
  },
  {
    id: 'neuro', letter: 'C', title: 'Exame neurologico', color: '#FF5252',
    items: [
      { label: 'Pupilas (tamanho e reatividade)', hint: 'Midriase, miose, anisocoria' },
      { label: 'Nistagmo', hint: 'Horizontal, vertical, rotatorio' },
      { label: 'Tonus muscular', hint: 'Rigidez, flacidez, espasticidade' },
      { label: 'Reflexos tendinosos', hint: 'Hiper ou hiporreflexia' },
      { label: 'Clonus', hint: 'Testar em tornozelos (>=3 batidas = positivo)' },
      { label: 'Tremores / Fasciculacoes', hint: 'Tipo, localizacao, frequencia' },
      { label: 'Convulsoes', hint: 'Tipo, duracao, pos-ictal' },
    ],
  },
  {
    id: 'pele', letter: 'D', title: 'Pele e mucosas', color: '#F59E0B',
    items: [
      { label: 'Umidade da pele', hint: 'Seca vs. diaforetica (axilas, torax)' },
      { label: 'Coloracao', hint: 'Rubor, palidez, cianose, ictericia' },
      { label: 'Temperatura cutanea', hint: 'Quente vs. fria' },
      { label: 'Mucosas orais', hint: 'Secas, umidas, lesoes, sialorreia' },
      { label: 'Marcas de puncao / Patches', hint: 'Buscar em bracos, virilha, pescoco' },
    ],
  },
  {
    id: 'abdome', letter: 'E', title: 'Abdome e secrecoes', color: '#6366F1',
    items: [
      { label: 'Ruidos hidroaereos', hint: 'Aumentados, diminuidos, ausentes' },
      { label: 'Distensao abdominal', hint: 'Bexiga palpavel (retencao urinaria)' },
      { label: 'Sialorreia', hint: 'Salivacao excessiva' },
      { label: 'Lacrimejamento', hint: 'Excessivo (colinergico)' },
      { label: 'Broncorreia / Rinorreia', hint: 'Secrecao em VA' },
    ],
  },
  {
    id: 'odores', letter: 'F', title: 'Odores caracteristicos', color: '#EC4899',
    items: [
      { label: 'Halito etilico', hint: 'Alcool etilico' },
      { label: 'Odor de alho', hint: 'Organofosforados, arsenico' },
      { label: 'Odor de amendoas amargas', hint: 'Cianeto (nem todos sentem)' },
      { label: 'Odor de acetona / frutas', hint: 'Cetoacidose, isopropanol' },
    ],
  },
]

// ==========================================
// TABELAS
// ==========================================

export const tabelaTabs = [
  { id: 'toxindromes', label: 'Toxindromes' },
  { id: 'doses', label: 'Doses Toxicas' },
  { id: 'ecg', label: 'ECG' },
  { id: 'odores', label: 'Odores' },
  { id: 'pupilas', label: 'Pupilas' },
  { id: 'bombas', label: 'Bombas-Relogio' },
]

export const tabelaComparacoes: ComparisonCard[] = [
  {
    title: 'Simpaticomimetico',
    rows: [
      { label: 'Consciencia', value: 'Agitacao, delirium' },
      { label: 'Pupilas', value: 'Midriase' },
      { label: 'FC / PA', value: 'Taquicardia, Hipertensao' },
      { label: 'Temperatura', value: 'Hipertermia' },
      { label: 'Pele', value: 'Umida, diaforetica' },
      { label: 'Agentes', value: 'Cocaina, anfetaminas, MDMA, catinonas' },
    ],
  },
  {
    title: 'Anticolinergico',
    rows: [
      { label: 'Consciencia', value: 'Agitacao, delirium, alucinacoes' },
      { label: 'Pupilas', value: 'Midriase' },
      { label: 'FC / PA', value: 'Taquicardia, PA normal ou aumentada' },
      { label: 'Temperatura', value: 'Hipertermia' },
      { label: 'Pele', value: 'SECA, quente, ruborizada' },
      { label: 'Outros', value: 'Diminuicao RHA, retencao urinaria, mucosas secas' },
      { label: 'Agentes', value: 'Difenidramina, ADT, atropina, escopolamina, Datura' },
    ],
  },
  {
    title: 'Opioide',
    rows: [
      { label: 'Consciencia', value: 'Sedacao, coma' },
      { label: 'Pupilas', value: 'Miose puntiforme' },
      { label: 'FC / PA', value: 'Diminuida ou normal' },
      { label: 'FR', value: 'Depressao respiratoria' },
      { label: 'Temperatura', value: 'Diminuida ou normal' },
      { label: 'Agentes', value: 'Fentanil, heroina, morfina, metadona, oxicodona' },
    ],
  },
  {
    title: 'Colinergico',
    rows: [
      { label: 'Consciencia', value: 'Confusao, coma' },
      { label: 'Pupilas', value: 'Miose' },
      { label: 'FC / PA', value: 'Bradicardia' },
      { label: 'Secrecoes', value: 'SLUDGE: Sialorreia, Lacrimejamento, Urinar, Defecar, GI (colicas), Emese' },
      { label: 'Outros', value: 'Broncorreia, fasciculacoes musculares' },
      { label: 'Agentes', value: 'Organofosforados, carbamatos, fisostigmina' },
    ],
  },
  {
    title: 'Serotoninergico',
    rows: [
      { label: 'Consciencia', value: 'Agitacao, confusao' },
      { label: 'Pupilas', value: 'Midriase' },
      { label: 'FC / PA', value: 'Taquicardia, Hipertensao' },
      { label: 'Temperatura', value: 'Hipertermia grave' },
      { label: 'Neuro', value: 'Clonus, hiperreflexia, tremor, rigidez (MMII > MMSS)' },
      { label: 'Agentes', value: 'ISRS + IMAO, ISRS + tramadol, linezolida + ISRS' },
    ],
  },
]

export const ecgTable: TableRow[] = [
  { col1: 'QRS > 100 ms', col2: 'ADT, antiarritmicos classe I, cocaina, difenidramina, carbamazepina', highlight: 'accent' },
  { col1: 'QTc > 500 ms', col2: 'Antipsicoticos, metadona, anti-histaminicos, antiarritmicos classe III, ISRS', highlight: 'accent' },
  { col1: 'Bradicardia', col2: 'Betabloqueadores, BCC, digoxina, clonidina, organofosforados, opioides', highlight: 'danger' },
  { col1: 'Taquicardia sinusal', col2: 'Simpaticomimeticos, anticolinergicos, teofilina, cafeina', highlight: 'danger' },
  { col1: 'TV / FV', col2: 'ADT, antiarritmicos, cocaina, digitalicos, teofilina', highlight: 'danger' },
  { col1: 'BAV', col2: 'Betabloqueadores, BCC (verapamil/diltiazem), digoxina, clonidina', highlight: 'warning' },
  { col1: 'Onda R em aVR', col2: 'ADT (sinal de gravidade)' },
  { col1: 'Onda U proeminente', col2: 'Hipocalemia (diureticos, teofilina)' },
]

export const ecgTreatmentTable: TableRow[] = [
  { col1: 'QRS alargado', col2: 'Bicarbonato de sodio 1-2 mEq/kg IV', highlight: 'success' },
  { col1: 'QT prolongado', col2: 'Corrigir K+/Mg++, evitar drogas que prolongam QT' },
  { col1: 'Bradicardia por BCC', col2: 'Calcio + vasopressores + insulina alta dose', highlight: 'success' },
  { col1: 'Bradicardia por BB', col2: 'Glucagon (se disponivel) + insulina alta dose', highlight: 'success' },
  { col1: 'Bradicardia por digoxina', col2: 'Atropina, evitar cardioversao, Fab se disponivel' },
  { col1: 'TV por ADT', col2: 'Bicarbonato de sodio (NAO antiarritmicos!)', highlight: 'success' },
]

export const odoresTable: TableRow[] = [
  { col1: 'Amendoas amargas', col2: 'Cianeto (40% nao sentem)', highlight: 'accent' },
  { col1: 'Alho', col2: 'Organofosforados, arsenico, fosforo, talio, selenio', highlight: 'accent' },
  { col1: 'Acetona / Frutas', col2: 'Cetoacidose, isopropanol, acetona', highlight: 'accent' },
  { col1: 'Etilico', col2: 'Etanol', highlight: 'accent' },
  { col1: 'Ovo podre', col2: 'Sulfeto de hidrogenio, mercaptanos' },
  { col1: 'Naftalina', col2: 'Naftaleno, canfora' },
  { col1: 'Graxa de sapato', col2: 'Nitrobenzeno' },
  { col1: 'Peras', col2: 'Hidrato de cloral, paraldeido' },
  { col1: 'Peixe / Amoniaco', col2: 'Uremia, zinco, fosforo' },
  { col1: 'Cenoura', col2: 'Cicuta (water hemlock)' },
]

export const midriaseTable: TableRow[] = [
  { col1: 'Simpaticomimeticos', col2: 'Cocaina, anfetaminas, MDMA, efedrina', highlight: 'accent' },
  { col1: 'Anticolinergicos', col2: 'Atropina, escopolamina, ADT, difenidramina, antipsicoticos', highlight: 'accent' },
  { col1: 'Serotoninergicos', col2: 'ISRS (em sindrome serotoninergica)', highlight: 'accent' },
  { col1: 'Alucinogenos', col2: 'LSD, psilocibina, mescalina' },
  { col1: 'Abstinencia', col2: 'Abstinencia de opioides, etanol' },
]

export const mioseTable: TableRow[] = [
  { col1: 'Opioides', col2: 'Heroina, morfina, fentanil, metadona, oxicodona, tramadol', highlight: 'accent' },
  { col1: 'Colinergicos', col2: 'Organofosforados, carbamatos, fisostigmina, pilocarpina', highlight: 'accent' },
  { col1: 'Sedativos', col2: 'Clonidina, fenotiazinas (miose pode ser variavel)' },
  { col1: 'Outros', col2: 'Nicotina, agentes nervosos (sarin, VX)' },
]

export const bombasTable: TableRow[] = [
  { col1: 'Paracetamol', col2: 'Hepatotoxicidade em 24-72h (inicialmente assintomatico!)', highlight: 'danger' },
  { col1: 'Metanol', col2: 'Acidose e cegueira em 12-24h', highlight: 'danger' },
  { col1: 'Etilenoglicol', col2: 'IRA, acidose em 12-24h', highlight: 'danger' },
  { col1: 'Paraquat', col2: 'Fibrose pulmonar em dias-semanas', highlight: 'danger' },
  { col1: 'Colchicina', col2: 'Falencia multiorganica em 24-72h', highlight: 'danger' },
  { col1: 'Cogumelos Amanita', col2: 'Hepatotoxicidade em 24-48h', highlight: 'danger' },
  { col1: 'IMAO + tiramina', col2: 'Crise hipertensiva horas apos ingestao', highlight: 'warning' },
  { col1: 'Sulfonilureias', col2: 'Hipoglicemia recorrente por 24-72h', highlight: 'warning' },
  { col1: 'Liberacao prolongada', col2: 'Pico tardio (BB, BCC, litio, ferro)', highlight: 'warning' },
  { col1: 'Metais pesados', col2: 'Toxicidade em dias (chumbo, arsenico, mercurio)', highlight: 'warning' },
]

export const examesIngestaoTable: TableRow[] = [
  { col1: 'Nivel de Paracetamol', col2: 'Hepatotoxicidade evitavel se tratado precocemente', highlight: 'success' },
  { col1: 'Nivel de Salicilato', col2: 'Toxicidade grave pode ser sutil inicialmente', highlight: 'success' },
  { col1: 'ECG', col2: 'Detectar cardiotoxicidade oculta' },
  { col1: 'Glicemia', col2: 'Hipoglicemia tratavel, causa rebaixamento' },
]

// ==========================================
// DOSES TOXICAS — Medicamentos (200+)
// ==========================================

export const toxicDrugs: ToxicDrug[] = [
  { nome: 'AAS', alias: ['aspirina', 'acido acetilsalicilico'], dose: 100, unidade: 'mg/kg', meiaVida: '30 hs' },
  { nome: 'Aceclofenaco', dose: 15, unidade: 'mg/kg', meiaVida: '4 hs' },
  { nome: 'Acebutolol', dose: 25, unidade: 'mg/kg', meiaVida: '10 hs' },
  { nome: 'Acemetacina', dose: 8.5, unidade: 'mg/kg', meiaVida: '11 hs' },
  { nome: 'Aciclovir', dose: 300, unidade: 'mg/kg', meiaVida: '3 hs' },
  { nome: 'Acido Nalidíxico', dose: 150, unidade: 'mg/kg', meiaVida: '7 hs' },
  { nome: 'Acido Tiaprofênico', dose: 40, unidade: 'mg/kg', meiaVida: '2 hs' },
  { nome: 'Acido Valproico', alias: ['valproato', 'depakene'], dose: 200, unidade: 'mg/kg', meiaVida: '20 hs' },
  { nome: 'Alprazolam', alias: ['frontal'], dose: 0.05, unidade: 'mg/kg', meiaVida: '15 hs' },
  { nome: 'Amilorida', dose: 1.5, unidade: 'mg/kg', meiaVida: '9 hs' },
  { nome: 'Amitriptilina', alias: ['tryptanol'], dose: 3, unidade: 'mg/kg', meiaVida: '25 hs' },
  { nome: 'Amlodipina', alias: ['norvasc'], dose: 0.2, unidade: 'mg/kg', meiaVida: '50 hs' },
  { nome: 'Amoxicilina', dose: 250, unidade: 'mg/kg', meiaVida: '1,5 hs' },
  { nome: 'Atenolol', dose: 5, unidade: 'mg/kg', meiaVida: '7 hs' },
  { nome: 'Bromazepam', alias: ['lexotan'], dose: 0.7, unidade: 'mg/kg', meiaVida: '20 hs' },
  { nome: 'Captopril', dose: 3.5, unidade: 'mg/kg', meiaVida: '2 hs' },
  { nome: 'Carbamazepina', alias: ['tegretol'], dose: 20, unidade: 'mg/kg', meiaVida: '20 hs' },
  { nome: 'Carbonato de Litio', alias: ['litio', 'carbolitium'], dose: 50, unidade: 'mg/kg', meiaVida: '24 hs' },
  { nome: 'Carvedilol', dose: 2.5, unidade: 'mg/kg', meiaVida: '6 hs' },
  { nome: 'Citalopram', dose: 2, unidade: 'mg/kg', meiaVida: '36 hs' },
  { nome: 'Clomipramina', alias: ['anafranil'], dose: 4, unidade: 'mg/kg', meiaVida: '36 hs' },
  { nome: 'Clonazepam', alias: ['rivotril'], dose: 0.6, unidade: 'mg/kg', meiaVida: '40 hs' },
  { nome: 'Clonidina', dose: 0.01, unidade: 'mg/kg', meiaVida: '24 hs' },
  { nome: 'Clorpromazina', alias: ['amplictil'], dose: 6, unidade: 'mg/kg', meiaVida: '40 hs' },
  { nome: 'Clozapina', alias: ['leponex'], dose: 10, unidade: 'mg/kg', meiaVida: '12 hs' },
  { nome: 'Codeina', dose: 2.5, unidade: 'mg/kg', meiaVida: '4 hs' },
  { nome: 'Diazepam', alias: ['valium'], dose: 0.7, unidade: 'mg/kg', meiaVida: '48 hs' },
  { nome: 'Diclofenaco', alias: ['voltaren', 'cataflan'], dose: 7, unidade: 'mg/kg', meiaVida: '2 hs' },
  { nome: 'Difenidramina', alias: ['dramin'], dose: 7.5, unidade: 'mg/kg', meiaVida: '9,5 hs' },
  { nome: 'Digoxina', dose: 0.02, unidade: 'mg/kg', meiaVida: '40 hs' },
  { nome: 'Diltiazem', dose: 5, unidade: 'mg/kg', meiaVida: '48 hs' },
  { nome: 'Dipirona', alias: ['metamizol', 'novalgina'], dose: 100, unidade: 'mg/kg', meiaVida: 'indeterminada' },
  { nome: 'Duloxetina', alias: ['cymbalta'], dose: 5, unidade: 'mg/kg', meiaVida: '18 hs' },
  { nome: 'Enalapril', dose: 0.7, unidade: 'mg/kg', meiaVida: '11 hs' },
  { nome: 'Escitalopram', alias: ['lexapro'], dose: 1, unidade: 'mg/kg', meiaVida: '33 hs' },
  { nome: 'Fenitoina', alias: ['hidantal'], dose: 20, unidade: 'mg/kg', meiaVida: '230 hs' },
  { nome: 'Fenobarbital', alias: ['gardenal'], dose: 4, unidade: 'mg/kg', meiaVida: '5 dias' },
  { nome: 'Fentanil', dose: 0.04, unidade: 'mg/kg', meiaVida: '8 hs' },
  { nome: 'Ferro', alias: ['sulfato ferroso'], dose: 20, unidade: 'mg/kg', meiaVida: '6 hs' },
  { nome: 'Fluoxetina', alias: ['prozac'], dose: 3, unidade: 'mg/kg', meiaVida: '16 dias' },
  { nome: 'Furosemida', alias: ['lasix'], dose: 3, unidade: 'mg/kg', meiaVida: 'indeterminada' },
  { nome: 'Haloperidol', alias: ['haldol'], dose: 0.5, unidade: 'mg/kg', meiaVida: '35 hs' },
  { nome: 'Hidroxizina', alias: ['hixizine'], dose: 10, unidade: 'mg/kg', meiaVida: '20 hs' },
  { nome: 'Ibuprofeno', alias: ['advil', 'alivium'], dose: 100, unidade: 'mg/kg', meiaVida: '2,5 hs' },
  { nome: 'Imipramina', alias: ['tofranil'], dose: 4, unidade: 'mg/kg', meiaVida: '19 hs' },
  { nome: 'Levomepromazina', alias: ['neozine'], dose: 6, unidade: 'mg/kg', meiaVida: '78 hs' },
  { nome: 'Levotiroxina', alias: ['puran', 'euthyrox'], dose: 0.02, unidade: 'mg/kg', meiaVida: '7 dias' },
  { nome: 'Lorazepam', alias: ['lorax'], dose: 0.2, unidade: 'mg/kg', meiaVida: '20 hs' },
  { nome: 'Losartana', dose: 3.5, unidade: 'mg/kg', meiaVida: '9 hs' },
  { nome: 'Metadona', dose: 0.4, unidade: 'mg/kg', meiaVida: '60 hs' },
  { nome: 'Metformina', alias: ['glifage'], dose: 80, unidade: 'mg/kg', meiaVida: '6,5 hs' },
  { nome: 'Metilfenidato', alias: ['ritalina'], dose: 1, unidade: 'mg/kg', meiaVida: '2 hs' },
  { nome: 'Metoprolol', dose: 10, unidade: 'mg/kg', meiaVida: '3,5 hs' },
  { nome: 'Midazolam', alias: ['dormonid'], dose: 1, unidade: 'mg/kg', meiaVida: '2,5 hs' },
  { nome: 'Morfina', dose: 0.4, unidade: 'mg/kg', meiaVida: '3 hs' },
  { nome: 'Naproxeno', alias: ['naprosyn', 'flanax'], dose: 35, unidade: 'mg/kg', meiaVida: '17 hs' },
  { nome: 'Nifedipina', dose: 1.2, unidade: 'mg/kg', meiaVida: '3,5/11 hs', retardada: true },
  { nome: 'Nortriptilina', alias: ['pamelor'], dose: 2.5, unidade: 'mg/kg', meiaVida: '26 hs' },
  { nome: 'Oxcarbazepina', alias: ['trileptal'], dose: 40, unidade: 'mg/kg', meiaVida: '9,5 hs' },
  { nome: 'Oxicodona', dose: 0.2, unidade: 'mg/kg', meiaVida: '3 hs' },
  { nome: 'Paracetamol', alias: ['tylenol', 'acetaminofeno'], dose: 75, unidade: 'mg/kg', meiaVida: '3 hs' },
  { nome: 'Paroxetina', alias: ['paxil', 'pondera'], dose: 3, unidade: 'mg/kg', meiaVida: '21 hs' },
  { nome: 'Petidina', alias: ['meperidina', 'dolantina'], dose: 6, unidade: 'mg/kg', meiaVida: '48 hs' },
  { nome: 'Prometazina', alias: ['fenergan'], dose: 3.5, unidade: 'mg/kg', meiaVida: '14 hs' },
  { nome: 'Propranolol', dose: 4.5, unidade: 'mg/kg', meiaVida: '6/20 hs', retardada: true },
  { nome: 'Quetiapina', alias: ['seroquel'], dose: 15, unidade: 'mg/kg', meiaVida: '22 hs' },
  { nome: 'Risperidona', alias: ['risperdal'], dose: 1, unidade: 'mg/kg', meiaVida: '24 hs' },
  { nome: 'Salbutamol', alias: ['aerolin'], dose: 0.5, unidade: 'mg/kg', meiaVida: '6 hs' },
  { nome: 'Sertralina', alias: ['zoloft'], dose: 7, unidade: 'mg/kg', meiaVida: '26 hs' },
  { nome: 'Sildenafil', alias: ['viagra'], dose: 3, unidade: 'mg/kg', meiaVida: '5 hs' },
  { nome: 'Topiramato', alias: ['topamax'], dose: 10, unidade: 'mg/kg', meiaVida: '21 hs' },
  { nome: 'Tramadol', alias: ['tramal'], dose: 4, unidade: 'mg/kg', meiaVida: '9 hs' },
  { nome: 'Venlafaxina', alias: ['efexor', 'venlift'], dose: 7, unidade: 'mg/kg', meiaVida: '15 hs' },
  { nome: 'Verapamil', dose: 5, unidade: 'mg/kg', meiaVida: '8 hs' },
]
