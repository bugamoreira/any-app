// ==========================================
// TOX PATH — Dados clínicos
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
    consciência: VitalSign
    fc: VitalSign
    pa: VitalSign
    fr: VitalSign
    temp: VitalSign
    pupilas: VitalSign
    pele: VitalSign
  }
  agentes: string
  antídoto: string
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
// HOME — Módulos
// ==========================================

export interface HomeModule {
  id: string
  title: string
  subtitle: string
  borderColor: string
}

export const homeModules: HomeModule[] = [
  { id: 'toxindromes', title: 'Identificar toxíndrome', subtitle: 'Fluxo interativo baseado em sinais clínicos', borderColor: '#10B981' },
  { id: 'descontaminação', title: 'Descontaminação GI', subtitle: 'Carvão ativado e lavagem gástrica', borderColor: '#60A5FA' },
  { id: 'disposição', title: 'Critérios de disposição', subtitle: 'Alta vs. Enfermaria vs. UTI', borderColor: '#EF4444' },
  { id: 'antídotos', title: 'Guia de antídotos', subtitle: 'Doses e indicações', borderColor: '#A78BFA' },
  { id: 'checklist', title: 'Checklist de avaliação', subtitle: 'Exame físico direcionado para intóxicações', borderColor: '#F59E0B' },
  { id: 'tabelas', title: 'Tabelas de consulta', subtitle: 'Toxíndromes, odores, ECG, achados', borderColor: '#10B981' },
]

// ==========================================
// TOXINDROMES — Perguntas do fluxo
// ==========================================

export const toxQuestions: ToxQuestion[] = [
  {
    id: 1,
    text: 'O paciente está agitado ou com alteração do nível de consciência?',
    hint: 'Avalie se há excitação psicomotora, confusão, letargia ou coma',
    options: [
      { text: 'Agitado', value: 'agitado', next: 2 },
      { text: 'Rebaixado', value: 'rebaixado', next: 10 },
      { text: 'Normal', value: 'normal', next: 20 },
    ],
  },
  {
    id: 2,
    text: 'Como estão as pupilas?',
    hint: 'Observe tamanho e reatividade pupilar',
    options: [
      { text: 'Midríase (dilatadas)', value: 'midríase', next: 3 },
      { text: 'Miose (contraídas)', value: 'miose', next: 8 },
      { text: 'Normais', value: 'normais', next: 6 },
    ],
  },
  {
    id: 3,
    text: 'A pele está úmida (diaforética) ou seca?',
    hint: 'Palpe axilas, testa, tórax',
    options: [
      { text: 'Úmida/Diaforética', value: 'umida', next: 4 },
      { text: 'Seca e quente', value: 'seca', next: 5 },
      { text: 'Normal', value: 'normal', next: 4 },
    ],
  },
  {
    id: 4,
    text: 'Há hiperreflexia, tremores ou clonus?',
    hint: 'Especialmente em membros inferiores',
    options: [
      { text: 'Sim', value: 'sim', result: 'serotoninergico' },
      { text: 'Não', value: 'não', result: 'simpaticomimetico' },
    ],
  },
  {
    id: 5,
    text: 'Há diminuição de ruídos hidroaéreos, retenção urinária ou mucosas secas?',
    hint: 'Ausculte abdome, pergunte sobre diurese',
    options: [
      { text: 'Sim', value: 'sim', result: 'anticolinergico' },
      { text: 'Não', value: 'não', result: 'simpaticomimetico' },
    ],
  },
  {
    id: 6,
    text: 'Há sinais de excitação simpática? (taquicardia, hipertensão, sudorese)',
    hint: 'Verifique FC > 100, PA elevada',
    options: [
      { text: 'Sim', value: 'sim', next: 4 },
      { text: 'Não', value: 'não', result: 'misto' },
    ],
  },
  {
    id: 8,
    text: 'Há bradicardia e hipersecreção? (sialorreia, broncorreia, lacrimejamento)',
    hint: 'Sinais colinérgicos clássicos',
    options: [
      { text: 'Sim', value: 'sim', result: 'colinergico' },
      { text: 'Não', value: 'não', result: 'misto' },
    ],
  },
  {
    id: 10,
    text: 'Como estão as pupilas?',
    hint: 'Observe tamanho e reatividade pupilar',
    options: [
      { text: 'Miose puntiforme', value: 'miose', next: 11 },
      { text: 'Midríase ou normais', value: 'midríase', next: 12 },
    ],
  },
  {
    id: 11,
    text: 'Há depressão respiratória (FR < 12 ou apneia)?',
    hint: 'Conte frequência respiratória por 1 minuto',
    options: [
      { text: 'Sim', value: 'sim', result: 'opioide' },
      { text: 'Não', value: 'não', next: 12 },
    ],
  },
  {
    id: 12,
    text: 'Há hipersecreção brônquica, sialorreia, fasciculações musculares?',
    hint: 'Sinais colinérgicos típicos de organofosforados',
    options: [
      { text: 'Sim', value: 'sim', result: 'colinergico' },
      { text: 'Não', value: 'não', result: 'sedativo' },
    ],
  },
  {
    id: 20,
    text: 'Há algum sinal ou sintoma sugestivo de intoxicação?',
    hint: 'Náuseas, vômitos, alterações de ECG, distúrbios metabólicos',
    options: [
      { text: 'Sim, investigar', value: 'sim', result: 'misto' },
      { text: 'Não, paciente estável', value: 'não', result: 'normal' },
    ],
  },
]

// ==========================================
// TOXINDROMES — Dados
// ==========================================

export const toxindromes: Record<string, Toxindrome> = {
  simpaticomimetico: {
    id: 'simpaticomimetico',
    nome: 'Simpaticomiméticos',
    gradientFrom: '#EF4444', gradientTo: '#DC2626',
    sinais: ['Midríase', 'Taquicardia', 'Hipertensão', 'Hipertermia', 'Diaforese', 'Agitação'],
    vitais: {
      consciência: { valor: 'Agitação/Delirium', classe: 'up' },
      fc: { valor: 'Aumentada', classe: 'up' },
      pa: { valor: 'Aumentada', classe: 'up' },
      fr: { valor: 'Aumentada', classe: 'up' },
      temp: { valor: 'Hipertermia', classe: 'up' },
      pupilas: { valor: 'Midríase', classe: 'up' },
      pele: { valor: 'Úmida', classe: 'normal' },
    },
    agentes: 'Cocaína, anfetaminas, metanfetamina, efedrina, pseudoefedrina, cafeína, teofilina, MDMA (ecstasy), catinonas sintéticas',
    antídoto: 'Considere suporte + benzodiazepínicos para agitação',
  },
  anticolinergico: {
    id: 'anticolinergico',
    nome: 'Anticolinérgico',
    gradientFrom: '#F59E0B', gradientTo: '#D97706',
    sinais: ['Midríase', 'Taquicardia', 'Pele seca e quente', 'Retenção urinária', 'Diminuição de RHA', 'Mucosas secas'],
    vitais: {
      consciência: { valor: 'Agitação/Delirium', classe: 'up' },
      fc: { valor: 'Taquicardia', classe: 'up' },
      pa: { valor: 'Normal ou aumentada', classe: 'normal' },
      fr: { valor: 'Aumentada', classe: 'up' },
      temp: { valor: 'Hipertermia', classe: 'up' },
      pupilas: { valor: 'Midríase', classe: 'up' },
      pele: { valor: 'Seca, quente, ruborizada', classe: 'up' },
    },
    agentes: 'Anti-histamínicos (difenidramina), antidepressivos tricíclicos, atropina, escopolâmina, antipsicóticos, ciclobenzaprina, plantas (Datura/trombeteira)',
    antídoto: 'Fisostigmina (não disponível) — considere benzodiazepínicos',
  },
  opioide: {
    id: 'opioide',
    nome: 'Opioide',
    gradientFrom: '#6366F1', gradientTo: '#4F46E5',
    sinais: ['Miose puntiforme', 'Depressão respiratória', 'Rebaixamento de consciência', 'Hipotensão', 'Bradicardia'],
    vitais: {
      consciência: { valor: 'Sedação/Coma', classe: 'down' },
      fc: { valor: 'Diminuída ou normal', classe: 'down' },
      pa: { valor: 'Hipotensão', classe: 'down' },
      fr: { valor: 'Bradipneia/Apneia', classe: 'down' },
      temp: { valor: 'Diminuída ou normal', classe: 'down' },
      pupilas: { valor: 'Miose puntiforme', classe: 'down' },
      pele: { valor: 'Variável', classe: 'normal' },
    },
    agentes: 'Morfina, fentanil, heroína, metadona, oxicodona, codeína, tramadol, loperamida (doses altas)',
    antídoto: 'Considere NALOXONA — Disponível',
  },
  sedativo: {
    id: 'sedativo',
    nome: 'Sedativo-Hipnótico',
    gradientFrom: '#8B5CF6', gradientTo: '#7C3AED',
    sinais: ['Rebaixamento de consciência', 'Hipotensão', 'Hipotermia', 'Hiporreflexia', 'Ataxia'],
    vitais: {
      consciência: { valor: 'Sedação/Coma', classe: 'down' },
      fc: { valor: 'Diminuída ou normal', classe: 'down' },
      pa: { valor: 'Diminuída ou normal', classe: 'down' },
      fr: { valor: 'Diminuída ou normal', classe: 'down' },
      temp: { valor: 'Hipotermia', classe: 'down' },
      pupilas: { valor: 'Variável', classe: 'normal' },
      pele: { valor: 'Variável', classe: 'normal' },
    },
    agentes: 'Benzodiazepínicos, barbitúricos, etanol, zolpidem, GHB, baclofeno, gabapentina, pregabalina',
    antídoto: 'Flumazenil (BZD) — uso restrito, risco de convulsão. Considere apenas em casos selecionados',
  },
  colinergico: {
    id: 'colinergico',
    nome: 'Colinérgico',
    gradientFrom: '#10B981', gradientTo: '#059669',
    sinais: ['Miose', 'Bradicardia', 'Sialorreia', 'Broncorreia', 'Lacrimejamento', 'Diarreia', 'Incontinência', 'Fasciculações'],
    vitais: {
      consciência: { valor: 'Confusão/Coma', classe: 'down' },
      fc: { valor: 'Bradicardia', classe: 'down' },
      pa: { valor: 'Diminuída ou normal', classe: 'down' },
      fr: { valor: 'Variável', classe: 'normal' },
      temp: { valor: 'Normal', classe: 'normal' },
      pupilas: { valor: 'Miose', classe: 'down' },
      pele: { valor: 'Úmida/Diaforética', classe: 'normal' },
    },
    agentes: 'Organofosforados, carbamatos, fisostigmina, pilocarpina, nicotina, agentes nervosos',
    antídoto: 'Considere ATROPINA — Disponível (Pralidoxima NÃO disponível)',
  },
  serotoninergico: {
    id: 'serotoninergico',
    nome: 'Serotoninérgico',
    gradientFrom: '#EC4899', gradientTo: '#DB2777',
    sinais: ['Agitação', 'Hipertermia', 'Diaforese', 'Midríase', 'Tremor', 'Hiperreflexia', 'Clonus', 'Rigidez'],
    vitais: {
      consciência: { valor: 'Agitação/Confusão', classe: 'up' },
      fc: { valor: 'Taquicardia', classe: 'up' },
      pa: { valor: 'Hipertensão', classe: 'up' },
      fr: { valor: 'Taquipneia', classe: 'up' },
      temp: { valor: 'Hipertermia grave', classe: 'up' },
      pupilas: { valor: 'Midríase', classe: 'up' },
      pele: { valor: 'Úmida/Ruborizada', classe: 'up' },
    },
    agentes: 'ISRS + IMAO, ISRS + tramadol, ISRS + triptanos, linezolida + ISRS, meperidina + IMAO, dextrometorfano + ISRS',
    antídoto: 'Considere suporte + benzodiazepínicos + ciproeptadina (se disponível) + resfriamento',
  },
  misto: {
    id: 'misto',
    nome: 'Apresentação Mista/Atípica',
    gradientFrom: '#64748B', gradientTo: '#333333',
    sinais: ['Achados não característicos', 'Possível poliintóxicação', 'Evolução atípica'],
    vitais: {
      consciência: { valor: 'Variável', classe: 'normal' },
      fc: { valor: 'Variável', classe: 'normal' },
      pa: { valor: 'Variável', classe: 'normal' },
      fr: { valor: 'Variável', classe: 'normal' },
      temp: { valor: 'Variável', classe: 'normal' },
      pupilas: { valor: 'Variável', classe: 'normal' },
      pele: { valor: 'Variável', classe: 'normal' },
    },
    agentes: 'Considerar: poliintóxicação, intoxicação em evolução, agentes atípicos, metais pesados, álcoois tóxicos, salicilatos, paracetamol',
    antídoto: 'Recomenda-se investigação com exames complementares — considere contatar CIATox',
  },
  normal: {
    id: 'normal',
    nome: 'Sem Toxindrome Evidente',
    gradientFrom: '#64748B', gradientTo: '#333333',
    sinais: ['Paciente estável', 'Sem achados sugestivos'],
    vitais: {
      consciência: { valor: 'Normal', classe: 'normal' },
      fc: { valor: 'Normal', classe: 'normal' },
      pa: { valor: 'Normal', classe: 'normal' },
      fr: { valor: 'Normal', classe: 'normal' },
      temp: { valor: 'Normal', classe: 'normal' },
      pupilas: { valor: 'Normais', classe: 'normal' },
      pele: { valor: 'Normal', classe: 'normal' },
    },
    agentes: 'Se história positiva para ingestão, considerar observação de 4-6h. Dosar paracetamol e salicilatos se ingestão intencional.',
    antídoto: 'Considere observação clínica — avaliar necessidade de descontaminação',
  },
}

// ==========================================
// ANTIDOTOS
// ==========================================

export const antidotes: Antidote[] = [
  // — Disponíveis --
  {
    id: 'naloxona', name: 'Naloxona', indication: 'Intóxicação por opioides', available: true,
    searchTerms: 'naloxona narcan opioide opiáceo heroina fentanil morfina codeina tramadol metadona oxicodona',
    sections: [
      { title: 'Indicação', lines: ['Depressão respiratória + miose + suspeita de opioide'] },
      { title: 'Dose inicial', lines: ['0,04 a 0,4 mg IV (iniciar com dose baixa se dependente)', 'Se sem resposta: até 2 mg IV', 'Repetir a cada 2-3 minutos se necessário'] },
      { title: 'Infusão contínua', lines: ['Se recorrência: 2/3 da dose efetiva/hora em BIC'] },
    ],
    warnings: ['Meia-vida curta (30-90 min) — risco de recorrência. Observar por pelo menos 4-6h após última dose.'],
    infos: ['Em dependentes, titular para FR > 12, não para consciência plena (evitar abstinência).'],
  },
  {
    id: 'nac', name: 'N-acetilcisteína (NAC)', indication: 'Intóxicação por paracetamol', available: true,
    searchTerms: 'n-acetilcisteina nac acetilcisteina paracetamol acetaminofeno hepatotoxicidade',
    sections: [
      { title: 'Indicação', lines: ['Nível sérico de paracetamol acima da linha de tratamento no nomograma de Rumack-Matthew ou ingestão > 150 mg/kg'] },
      { title: 'Protocolo IV (21 horas) — Prescott', lines: ['1a etapa: 150 mg/kg em 200 mL SF em 1 hora', '2a etapa: 50 mg/kg em 500 mL SF em 4 horas', '3a etapa: 100 mg/kg em 1000 mL SF em 16 horas'] },
      { title: 'Dose total', lines: ['300 mg/kg em 21 horas'] },
    ],
    warnings: ['Reações anafilactoides são comuns na 1a hora. Reduzir velocidade de infusão se ocorrerem.'],
    infos: ['Maior eficácia se iniciado em até 8h da ingestão. Ainda útil até 24h ou mais se hepatotoxicidade.'],
    hasCalculator: 'nac',
  },
  {
    id: 'atropina', name: 'Atropina', indication: 'Síndrome colinérgica / Organofosforados', available: true,
    searchTerms: 'atropina organofosforado carbamato colinergico inseticida pesticida sialorreia broncorreia',
    sections: [
      { title: 'Indicação', lines: ['Síndrome colinérgica: broncorreia, sialorreia, bradicardia, miose, diarreia, vômitos'] },
      { title: 'Apresentação disponível', lines: ['Atropina 0,25 mg/mL — ampola 1 mL'] },
      { title: 'Dose inicial', lines: ['1-2 mg IV (adultos) = 4-8 ampolas', '0,02-0,05 mg/kg IV (criancas)'] },
      { title: 'Titulação', lines: ['Dobrar dose a cada 5 minutos até controle das secreções', 'Endpoint: secreções secas (não FC ou pupilas)'] },
      { title: 'Manutenção', lines: ['Infusão contínua: 20% da dose de ataque/hora'] },
    ],
    warnings: ['Doses muito altas podem ser necessárias (centenas de mg). Não há dose máxima absoluta.'],
    infos: ['Pralidoxima NÃO disponível. Atropina é o pilar do tratamento.'],
    hasCalculator: 'atropina',
  },
  {
    id: 'bicarbonato', name: 'Bicarbonato de Sódio', indication: 'Bloqueadores de canal de sódio / ADT', available: true,
    searchTerms: 'bicarbonato de sódio antidepressivo triciclico adt bloqueador canal sódio cocaina qrs arritmia',
    sections: [
      { title: 'Indicação', lines: ['QRS > 100 ms ou arritmia ventricular por: ADT, cocaína, antiarrítmicos classe I, carbamazepina'] },
      { title: 'Dose', lines: ['1-2 mEq/kg IV em bolus', 'Repetir até QRS < 100 ms'] },
      { title: 'Meta', lines: ['pH arterial: 7,50-7,55', 'Sódio sérico: 150-155 mEq/L'] },
    ],
    warnings: ['Monitorar pH, K+ e Na+. Hipocalemia pode ocorrer com alcalose.'],
  },
  {
    id: 'gluconato', name: 'Gluconato de Cálcio', indication: 'Bloqueadores de canal de cálcio / Ac. fluorídrico', available: true,
    searchTerms: 'gluconato de cálcio cálcio bloqueador canal cálcio bcc verapamil diltiazem amlodipino fluoridrico hipercalemia',
    sections: [
      { title: 'Indicação', lines: ['Intóxicação por BCC (verapamil, diltiazem), ácido fluorídrico, hipercalemia grave'] },
      { title: 'Dose para BCC', lines: ['Gluconato de cálcio 10%: 20-30 mL IV (2-3 g)', 'ou Cloreto de cálcio 10%: 10 mL IV (1 g) — preferir via central'] },
      { title: 'Manutenção', lines: ['Infusão: 0,5-2 mL/kg/h de gluconato 10%', 'Meta: cálcio ionizado 1,5-2x o normal'] },
    ],
    warnings: ['Cloreto de cálcio é vesicante — preferir via central. Gluconato pode ir em acesso periférico.'],
  },
  {
    id: 'flumazenil', name: 'Flumazenil', indication: 'Intóxicação por benzodiazepínicos', available: true,
    searchTerms: 'flumazenil lanexat benzodiazep��nico bzd diazepam midazolam alprazolam clonazepam',
    sections: [
      { title: 'USO RESTRITO', lines: ['NÃO usar rotineiramente. Alto risco de convulsões.'] },
      { title: 'Contraindicações', lines: ['Uso crônico de BZD (risco de abstinência)', 'Coingestão de pró-convulsivantes (ADT, cocaína)', 'História de convulsões', 'ECG com QRS alargado'] },
      { title: 'Dose (se indicado)', lines: ['0,2 mg IV em 30 segundos', 'Repetir 0,3 mg após 30s se sem resposta', 'Máximo: 3-5 mg'] },
    ],
    warnings: ['Na dúvida, NÃO usar. Suporte ventilatório é mais seguro.'],
  },
  {
    id: 'azulmetileno', name: 'Azul de Metileno', indication: 'Metemoglobinemia', available: true,
    searchTerms: 'azul de metileno metemoglobinemia metemoglobina dapsona benzocaina nitritos cianose',
    sections: [
      { title: 'Indicação', lines: ['MetHb > 20-30% ou sintomático (cianose refratária a O2, dispneia, alteração de consciência)'] },
      { title: 'Dose', lines: ['1-2 mg/kg IV em 5 minutos', 'Diluir em SF 50-100 mL', 'Repetir em 1h se necessário (max 7 mg/kg)'] },
    ],
    warnings: ['Contraindicado em deficiência de G6PD (pode causar hemólise).'],
    infos: ['Causas: dapsona, benzocaina, nitritos, anilinas. SpO₂ falsamente baixa na oximetria.'],
  },
  {
    id: 'piridoxina', name: 'Piridoxina (Vitamina B6)', indication: 'Intóxicação por isoniazida', available: true,
    searchTerms: 'piridoxina vitamina b6 isoniazida inh convulsão hidrazina',
    sections: [
      { title: 'Indicação', lines: ['Convulsões refratárias a BZD + suspeita de isoniazida'] },
      { title: 'Dose', lines: ['Grama por grama da dose ingerida de INH', 'Se dose desconhecida: 5 g IV (adultos)', 'Taxa: 0,5-1 g/min'] },
    ],
  },
  {
    id: 'hidroxocobalâmina', name: 'Hidroxocobalâmina', indication: 'Intóxicação por cianeto', available: true,
    searchTerms: 'hidroxocobalâmina cianokit cianeto fumaca incendio acido cianidrico',
    sections: [
      { title: 'Indicação', lines: ['Suspeita de intoxicação por cianeto (vítima de incêndio + acidose lática + rebaixamento)'] },
      { title: 'Dose', lines: ['5 g IV em 15 minutos (adultos)', 'Pediátrico: 70 mg/kg', 'Repetir 5 g se necessário'] },
    ],
    warnings: ['Colore fluidos corporais em vermelho (interfere com exames laboratoriais).'],
  },
  {
    id: 'fomepizol', name: 'Fomepizol / Etanol', indication: 'Álcoois tóxicos (metanol, etilenoglicol)', available: true,
    searchTerms: 'fomepizol etanol metanol etilenoglicol alcool toxico antifreeze',
    sections: [
      { title: 'Indicação', lines: ['Suspeita de intoxicação por metanol ou etilenoglicol', 'Gap osmótico > 10 ou acidose com ânion gap'] },
      { title: 'Fomepizol (se disponível)', lines: ['Ataque: 15 mg/kg IV', 'Manutenção: 10 mg/kg a cada 12h', 'Após 48h: 15 mg/kg a cada 12h'] },
      { title: 'Etanol IV (alternativa)', lines: ['Ataque: 0,6-0,8 g/kg IV', 'Manutenção: 66-154 mg/kg/h', 'Meta: alcoolemia 100-150 mg/dL'] },
    ],
    warnings: ['Hemodiálise indicada se: acidose grave, IRA, déficit visual, nível elevado.'],
  },
  {
    id: 'lipídica', name: 'Emulsão Lipídica 20%', indication: 'Toxicidade por anestésicos locais (LAST)', available: true,
    searchTerms: 'emulsao lipídica intralipid anestésico local bupivacaina lidocaina last lipid rescue',
    sections: [
      { title: 'Indicação', lines: ['Toxicidade sistêmica por anestésicos locais (LAST)', 'Considerar em intoxicações graves por lipofílicos'] },
      { title: 'Dose', lines: ['Bolus: 1,5 mL/kg IV em 1 minuto', 'Infusão: 0,25 mL/kg/min por 30-60 min', 'Repetir bolus 1-2x se instabilidade persistir'] },
    ],
    warnings: ['Dose máxima total: 12 mL/kg. Não usar propofol como substituto.'],
  },
  // — Não disponíveis --
  {
    id: 'pralidoxima', name: 'Pralidoxima', indication: 'Organofosforados (reativador de colinesterase)', available: false,
    searchTerms: 'pralidoxima 2-pam organofosforado reativador colinesterase',
    sections: [
      { title: 'Informação', lines: ['Não disponível no Brasil. Usar ATROPINA como pilar do tratamento.'] },
    ],
  },
  {
    id: 'glucagon', name: 'Glucagon', indication: 'Betabloqueadores / BCC', available: false,
    searchTerms: 'glucagon betabloqueador propranolol atenolol metoprolol bradicardia',
    sections: [
      { title: 'Informação', lines: ['Disponibilidade limitada. Alternativa: insulina em alta dose + glicose (HIE).'] },
    ],
  },
  {
    id: 'fab-antidigoxina', name: 'Fab Antidigoxina', indication: 'Intóxicação digitálica', available: false,
    searchTerms: 'fab antidigoxina digibind digoxina digitalico digitalis',
    sections: [
      { title: 'Informação', lines: ['Não disponível no Brasil. Suporte com atropina, marcapasso temporário e correção de K+.'] },
    ],
  },
  {
    id: 'fisostigmina', name: 'Fisostigmina', indication: 'Síndrome anticolinérgica grave', available: false,
    searchTerms: 'fisostigmina anticolinergico delirium agitação',
    sections: [
      { title: 'Informação', lines: ['Não disponível. Usar BENZODIAZEPÍNICOS para agitação. Suporte e resfriamento para hipertermia.'] },
    ],
  },
]

// ==========================================
// DISPOSIÇÃO — Critérios
// ==========================================

export const utiCriteria: DispositionCriterion[] = [
  { text: 'Rebaixamento de consciência / Coma', detail: 'Paciente não responsivo a estímulos verbais ou com Glasgow <= 8', example: 'Letargia significativa, estupor, coma profundo', level: 'uti' },
  { text: 'Necessidade de IOT / Via aérea avançada', detail: 'Intubação orotraqueal de emergência realizada ou indicada', example: 'Falha em proteger via aérea, apneia, Glasgow <= 8', level: 'uti' },
  { text: 'Depressão respiratória (PaCO2 > 45 mmHg)', detail: 'Hipoventilação com retenção de CO2 ou FR < 10 irpm', example: 'Bradipneia por opioides, insuficiência respiratória', level: 'uti' },
  { text: 'Hipotensão (PAS <= 80 mmHg)', detail: 'Pressão arterial sistólica <= 80 mmHg ou choque', example: 'Choque distributivo, vasoplegia por intoxicação', level: 'uti' },
  { text: 'Convulsões prolongadas ou recorrentes', detail: 'Crise convulsiva pós-ingestão ou status epilepticus', example: 'Convulsões por ADT, isoniazida, cocaína', level: 'uti' },
  { text: 'Arritmia não sinusal', detail: 'Ritmo diferente de sinusal ao monitor ou ECG', example: 'TV, FV, FA, flutter, ritmos idioventriculares', level: 'uti' },
  { text: 'BAV 2o ou 3o grau', detail: 'Bloqueio atrioventricular de segundo ou terceiro grau', example: 'Intóxicação por betabloqueadores, BCC, digoxina', level: 'uti' },
  { text: 'QRS > 120 ms ou QTc > 500 ms', detail: 'Alargamento de QRS ou prolongamento de QT significativos', example: 'ADT, antiarrítmicos, antipsicóticos', level: 'uti' },
  { text: 'Acidose grave (pH <= 7,2)', detail: 'Acidose metabólica ou mista com pH arterial <= 7,2', example: 'Metanol, etilenoglicol, salicilatos, metformina', level: 'uti' },
  { text: 'Hipertermia grave (T > 40C)', detail: 'Temperatura central > 40C (104F)', example: 'Síndrome serotoninérgica, SNM, simpaticomiméticos', level: 'uti' },
  { text: 'Necessidade de hemodiálise', detail: 'Indicação de terapia extracorpórea para remoção do tóxico', example: 'Metanol, etilenoglicol, lítio, salicilatos graves', level: 'uti' },
  { text: 'Agitação requerendo contenção química/física', detail: 'Agitação psicomotora grave não controlada com medidas simples', example: 'Delirium por anticolinérgicos, simpaticomiméticos', level: 'uti' },
  { text: 'Ingestão de "bomba-relógio tóxica"', detail: 'Substâncias com toxicidade tardia potencialmente grave', example: 'Paracetamol, paraquat, colchicina, metanol, etilenoglicol, cogumelos Amanita, IMAO', level: 'uti' },
]

export const enfermariaCriteria: DispositionCriterion[] = [
  { text: 'Toxicidade leve a moderada persistente', detail: 'Sintomas que não resolvem no período de observação', example: 'Sonolência persistente, náuseas/vômitos, taquicardia leve', level: 'enfermaria' },
  { text: 'Necessidade de antídoto em infusão contínua', detail: 'Tratamento com antídoto por tempo prolongado sem instabilidade', example: 'N-acetilcisteína para paracetamol (21h de infusão)', level: 'enfermaria' },
  { text: 'Ingestão intencional com necessidade de avaliação psiquiátrica', detail: 'Tentativa de autoextermínio necessitando avaliação especializada', example: 'Todos os pacientes com ingestão intencional devem ter avaliação psiquiátrica antes da alta', level: 'enfermaria' },
  { text: 'Alterações laboratoriais que requerem monitorização', detail: 'Distúrbios hidroeletrolíticos, elevação de transaminases, etc.', example: 'Hipocalemia por teofilina, hepatotoxicidade por paracetamol', level: 'enfermaria' },
]

// ==========================================
// CHECKLIST
// ==========================================

export const checklistSections: ChecklistSection[] = [
  {
    id: 'estabilização', letter: 'A', title: 'Estabilização inicial (ABCDE)', color: '#EF4444',
    items: [
      { label: 'Via aérea pérvia', hint: 'Verificar patência, secreções, estridor' },
      { label: 'Respiração adequada', hint: 'FR, SpO₂, padrão respiratório, ausculta' },
      { label: 'Circulação estável', hint: 'FC, PA, TEC, pulsos periféricos' },
      { label: 'Nível de consciência (Glasgow)', hint: 'Avaliar resposta ocular, verbal e motora' },
      { label: 'Glicemia capilar', hint: 'Recomendado se alteração de consciência' },
      { label: 'Exposição completa', hint: 'Buscar patches, marcas de agulha, lesões' },
    ],
  },
  {
    id: 'sinais-vitais', letter: 'B', title: 'Sinais vitais detalhados', color: '#FF5252',
    items: [
      { label: 'Frequência cardíaca', hint: 'Taqui (>100) ou bradicardia (<60)' },
      { label: 'Pressão arterial', hint: 'Hiper ou hipotensão' },
      { label: 'Frequência respiratória', hint: 'Contar por 1 minuto (normal: 12-20)' },
      { label: 'Temperatura axilar/central', hint: 'Hiper (>38) ou hipotermia (<35)' },
      { label: 'Saturação de O2', hint: 'Atenção: SpO₂ pode ser falsa em MetHb e CO' },
    ],
  },
  {
    id: 'neuro', letter: 'C', title: 'Exame neurológico', color: '#FF5252',
    items: [
      { label: 'Pupilas (tamanho e reatividade)', hint: 'Midríase, miose, anisocoria' },
      { label: 'Nistagmo', hint: 'Horizontal, vertical, rotatório' },
      { label: 'Tônus muscular', hint: 'Rigidez, flacidez, espasticidade' },
      { label: 'Reflexos tendinosos', hint: 'Hiper ou hiporreflexia' },
      { label: 'Clonus', hint: 'Testar em tornozelos (≥3 batidas = positivo)' },
      { label: 'Tremores / Fasciculações', hint: 'Tipo, localização, frequência' },
      { label: 'Convulsões', hint: 'Tipo, duração, pós-ictal' },
    ],
  },
  {
    id: 'pele', letter: 'D', title: 'Pele e mucosas', color: '#F59E0B',
    items: [
      { label: 'Umidade da pele', hint: 'Seca vs. diaforética (axilas, tórax)' },
      { label: 'Coloração', hint: 'Rubor, palidez, cianose, icterícia' },
      { label: 'Temperatura cutânea', hint: 'Quente vs. fria' },
      { label: 'Mucosas orais', hint: 'Secas, úmidas, lesões, sialorreia' },
      { label: 'Marcas de punção / Patches', hint: 'Buscar em braços, virilha, pescoço' },
    ],
  },
  {
    id: 'abdome', letter: 'E', title: 'Abdome e secreções', color: '#6366F1',
    items: [
      { label: 'Ruídos hidroaéreos', hint: 'Aumentados, diminuídos, ausentes' },
      { label: 'Distensão abdominal', hint: 'Bexiga palpável (retenção urinária)' },
      { label: 'Sialorreia', hint: 'Salivação excessiva' },
      { label: 'Lacrimejamento', hint: 'Excessivo (colinérgico)' },
      { label: 'Broncorreia / Rinorreia', hint: 'Secreções em VA' },
    ],
  },
  {
    id: 'odores', letter: 'F', title: 'Odores característicos', color: '#EC4899',
    items: [
      { label: 'Hálito etílico', hint: 'Álcool etílico' },
      { label: 'Odor de alho', hint: 'Organofosforados, arsênico' },
      { label: 'Odor de amendoas amargas', hint: 'Cianeto (nem todos sentem)' },
      { label: 'Odor de acetona / frutas', hint: 'Cetoacidose, isopropanol' },
    ],
  },
]

// ==========================================
// TABELAS
// ==========================================

export const tabelaTabs = [
  { id: 'toxindromes', label: 'Toxíndromes' },
  { id: 'doses', label: 'Doses tóxicas' },
  { id: 'ecg', label: 'ECG' },
  { id: 'odores', label: 'Odores' },
  { id: 'pupilas', label: 'Pupilas' },
  { id: 'bombas', label: 'Bombas-relógio' },
]

export const tabelaComparacoes: ComparisonCard[] = [
  {
    title: 'Simpaticomiméticos',
    rows: [
      { label: 'Consciência', value: 'Agitação, delirium' },
      { label: 'Pupilas', value: 'Midríase' },
      { label: 'FC / PA', value: 'Taquicardia, Hipertensão' },
      { label: 'Temperatura', value: 'Hipertermia' },
      { label: 'Pele', value: 'Úmida, diaforética' },
      { label: 'Agentes', value: 'Cocaína, anfetaminas, MDMA, catinonas' },
    ],
  },
  {
    title: 'Anticolinérgicos',
    rows: [
      { label: 'Consciência', value: 'Agitação, delirium, alucinações' },
      { label: 'Pupilas', value: 'Midríase' },
      { label: 'FC / PA', value: 'Taquicardia, PA normal ou aumentada' },
      { label: 'Temperatura', value: 'Hipertermia' },
      { label: 'Pele', value: 'SECA, quente, ruborizada' },
      { label: 'Outros', value: 'Diminuição de RHA, retenção urinária, mucosas secas' },
      { label: 'Agentes', value: 'Difenidramina, ADT, atropina, escopolâmina, Datura' },
    ],
  },
  {
    title: 'Opioide',
    rows: [
      { label: 'Consciência', value: 'Sedação, coma' },
      { label: 'Pupilas', value: 'Miose puntiforme' },
      { label: 'FC / PA', value: 'Diminuída ou normal' },
      { label: 'FR', value: 'Depressão respiratória' },
      { label: 'Temperatura', value: 'Diminuída ou normal' },
      { label: 'Agentes', value: 'Fentanil, heroina, morfina, metadona, oxicodona' },
    ],
  },
  {
    title: 'Colinérgico',
    rows: [
      { label: 'Consciência', value: 'Confusão, coma' },
      { label: 'Pupilas', value: 'Miose' },
      { label: 'FC / PA', value: 'Bradicardia' },
      { label: 'Secreções', value: 'SLUDGE: Sialorreia, Lacrimejamento, Urinar, Defecar, GI (cólicas), Emese' },
      { label: 'Outros', value: 'Broncorreia, fasciculações musculares' },
      { label: 'Agentes', value: 'Organofosforados, carbamatos, fisostigmina' },
    ],
  },
  {
    title: 'Serotoninérgico',
    rows: [
      { label: 'Consciência', value: 'Agitação, confusão' },
      { label: 'Pupilas', value: 'Midríase' },
      { label: 'FC / PA', value: 'Taquicardia, Hipertensão' },
      { label: 'Temperatura', value: 'Hipertermia grave' },
      { label: 'Neuro', value: 'Clonus, hiperreflexia, tremor, rigidez (MMII > MMSS)' },
      { label: 'Agentes', value: 'ISRS + IMAO, ISRS + tramadol, linezolida + ISRS' },
    ],
  },
]

export const ecgTable: TableRow[] = [
  { col1: 'QRS > 100 ms', col2: 'ADT, antiarrítmicos classe I, cocaína, difenidramina, carbamazepina', highlight: 'accent' },
  { col1: 'QTc > 500 ms', col2: 'Antipsicóticos, metadona, anti-histamínicos, antiarrítmicos classe III, ISRS', highlight: 'accent' },
  { col1: 'Bradicardia', col2: 'Betabloqueadores, BCC, digoxina, clonidina, organofosforados, opioides', highlight: 'danger' },
  { col1: 'Taquicardia sinusal', col2: 'Simpaticomiméticos, anticolinérgicos, teofilina, cafeína', highlight: 'danger' },
  { col1: 'TV / FV', col2: 'ADT, antiarrítmicos, cocaína, digitálicos, teofilina', highlight: 'danger' },
  { col1: 'BAV', col2: 'Betabloqueadores, BCC (verapamil/diltiazem), digoxina, clonidina', highlight: 'warning' },
  { col1: 'Onda R em aVR', col2: 'ADT (sinal de gravidade)' },
  { col1: 'Onda U proeminente', col2: 'Hipocalemia (diuréticos, teofilina)' },
]

export const ecgTreatmentTable: TableRow[] = [
  { col1: 'QRS alargado', col2: 'Bicarbonato de sódio 1-2 mEq/kg IV', highlight: 'success' },
  { col1: 'QT prolongado', col2: 'Corrigir K+/Mg++, evitar drogas que prolongam QT' },
  { col1: 'Bradicardia por BCC', col2: 'Cálcio + vasopressores + insulina alta dose', highlight: 'success' },
  { col1: 'Bradicardia por BB', col2: 'Glucagon (se disponível) + insulina alta dose', highlight: 'success' },
  { col1: 'Bradicardia por digoxina', col2: 'Atropina, evitar cardioversão, Fab se disponível' },
  { col1: 'TV por ADT', col2: 'Bicarbonato de sódio (NÃO antiarrítmicos!)', highlight: 'success' },
]

export const odoresTable: TableRow[] = [
  { col1: 'Amêndoas amargas', col2: 'Cianeto (40% não sentem)', highlight: 'accent' },
  { col1: 'Alho', col2: 'Organofosforados, arsênico, fosforo, talio, selenio', highlight: 'accent' },
  { col1: 'Acetona / Frutas', col2: 'Cetoacidose, isopropanol, acetona', highlight: 'accent' },
  { col1: 'Etílico', col2: 'Etanol', highlight: 'accent' },
  { col1: 'Ovo podre', col2: 'Sulfeto de hidrogênio, mercaptanos' },
  { col1: 'Naftalina', col2: 'Naftaleno, canfora' },
  { col1: 'Graxa de sapato', col2: 'Nitrobenzeno' },
  { col1: 'Peras', col2: 'Hidrato de cloral, paraldeído' },
  { col1: 'Peixe / Amônia', col2: 'Uremia, zinco, fósforo' },
  { col1: 'Cenoura', col2: 'Cicuta (water hemlock)' },
]

export const midríaseTable: TableRow[] = [
  { col1: 'Simpaticomiméticos', col2: 'Cocaína, anfetaminas, MDMA, efedrina', highlight: 'accent' },
  { col1: 'Anticolinérgicos', col2: 'Atropina, escopolâmina, ADT, difenidramina, antipsicóticos', highlight: 'accent' },
  { col1: 'Serotoninérgicos', col2: 'ISRS (em síndrome serotoninérgica)', highlight: 'accent' },
  { col1: 'Alucinógenos', col2: 'LSD, psilocibina, mescalina' },
  { col1: 'Abstinência', col2: 'Abstinência de opioides, etanol' },
]

export const mioseTable: TableRow[] = [
  { col1: 'Opioides', col2: 'Heroina, morfina, fentanil, metadona, oxicodona, tramadol', highlight: 'accent' },
  { col1: 'Colinérgicos', col2: 'Organofosforados, carbamatos, fisostigmina, pilocarpina', highlight: 'accent' },
  { col1: 'Sedativos', col2: 'Clonidina, fenotiazinas (miose pode ser variável)' },
  { col1: 'Outros', col2: 'Nicotina, agentes nervosos (sarin, VX)' },
]

export const bombasTable: TableRow[] = [
  { col1: 'Paracetamol', col2: 'Hepatotoxicidade em 24-72h (inicialmente assintomático!)', highlight: 'danger' },
  { col1: 'Metanol', col2: 'Acidose e cegueira em 12-24h', highlight: 'danger' },
  { col1: 'Etilenoglicol', col2: 'IRA, acidose em 12-24h', highlight: 'danger' },
  { col1: 'Paraquat', col2: 'Fibrose pulmonar em dias-semanas', highlight: 'danger' },
  { col1: 'Colchicina', col2: 'Falência multiorgânica em 24-72h', highlight: 'danger' },
  { col1: 'Cogumelos Amanita', col2: 'Hepatotoxicidade em 24-48h', highlight: 'danger' },
  { col1: 'IMAO + tiramina', col2: 'Crise hipertensiva horas após ingestão', highlight: 'warning' },
  { col1: 'Sulfonilureias', col2: 'Hipoglicemia recorrente por 24-72h', highlight: 'warning' },
  { col1: 'Liberação prolongada', col2: 'Pico tardio (BB, BCC, litio, ferro)', highlight: 'warning' },
  { col1: 'Metais pesados', col2: 'Toxicidade em dias (chumbo, arsênico, mercúrio)', highlight: 'warning' },
]

export const examesIngestaoTable: TableRow[] = [
  { col1: 'Nível de Paracetamol', col2: 'Hepatotoxicidade evitável se tratado precocemente', highlight: 'success' },
  { col1: 'Nível de Salicilato', col2: 'Toxicidade grave pode ser sutil inicialmente', highlight: 'success' },
  { col1: 'ECG', col2: 'Detectar cardiotoxicidade oculta' },
  { col1: 'Glicemia', col2: 'Hipoglicemia tratável, causa rebaixamento' },
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
