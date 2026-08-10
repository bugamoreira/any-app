// ==========================================
// DADOS CLÍNICOS — Palia Path
// ==========================================

// --- SPICT-BR Indicadores ---

export interface SpictCategory {
  id: string
  title: string
  iconBg: string
  iconColor: string
  items: string[]
}

export const spictIndicadoresGerais: string[] = [
  'Internações não planejadas',
  'Performance status ruim ou em declínio (restrito ao leito >50% do dia)',
  'Dependência crescente para AVDs',
  'Perda de peso significativa nos últimos 3-6 meses',
  'Sintomas persistentes apesar de tratamento otimizado',
  'Paciente ou família perguntam sobre cuidados paliativos ou prognóstico',
  'Paciente escolhe reduzir ou suspender tratamento',
]

export const spictCategorias: SpictCategory[] = [
  {
    id: 'cardiaca',
    title: 'Doença cardíaca / vascular',
    iconBg: 'rgba(239,68,68,0.15)',
    iconColor: '#EF4444',
    items: [
      'ICC NYHA III/IV com sintomas persistentes',
      'Doença coronariana extensa não passível de intervenção',
      'Doença vascular periférica inoperável',
    ],
  },
  {
    id: 'respiratoria',
    title: 'Doença respiratória',
    iconBg: 'rgba(59,130,246,0.15)',
    iconColor: '#3B82F6',
    items: [
      'Doença intersticial grave ou fibrose com declínio de função',
      'DPOC com dispneia em repouso ou aos mínimos esforços',
      'Oxigenoterapia domiciliar de longa duração',
      'Ventilação assistida',
    ],
  },
  {
    id: 'neurologica',
    title: 'Doença neurológica',
    iconBg: 'rgba(249,115,22,0.15)',
    iconColor: '#F97316',
    items: [
      'Deterioração progressiva da função física/cognitiva',
      'Disfagia com aspiração recorrente',
      'Dificuldade de fala progressiva',
      'Pneumonias de repetição',
    ],
  },
  {
    id: 'renal',
    title: 'Doença renal',
    iconBg: 'rgba(167,139,250,0.15)',
    iconColor: '#A78BFA',
    items: [
      'DRC estagio 4-5 (TFG <30) com deterioração',
      'Falha ou suspensão de diálise',
      'Opção por tratamento conservador',
    ],
  },
  {
    id: 'hepática',
    title: 'Doença hepática',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#FBBF24',
    items: [
      'Cirrose avancada com complicações (ascite, encefalopatia, SHR)',
      'Transplante contraindicado',
    ],
  },
  {
    id: 'cancer',
    title: 'Câncer',
    iconBg: 'rgba(239,68,68,0.15)',
    iconColor: '#EF4444',
    items: [
      'Doença metastática ou localmente avançada',
      'Progressão durante tratamento oncológico',
      'Tratamento oncológico específico descontinuado',
    ],
  },
  {
    id: 'demencia',
    title: 'Demência / Fragilidade',
    iconBg: 'rgba(156,163,175,0.15)',
    iconColor: '#9CA3AF',
    items: [
      'Incapaz de vestir-se, tomar banho, alimentar-se sem ajuda',
      'Ingestão oral reduzida',
      'Incontinência urinária e fecal',
      'Incapaz de comunicação significativa',
      'Multiplas comorbidades com declinio funcional',
      'Fragilidade com complicações ou declinio',
    ],
  },
]

// --- SAVED Framework ---

export interface SavedCard {
  letter: string
  title: string
  subtitle: string
  content: {
    infoTitle: string
    items?: string[]
    note?: string
    capacityGrid?: { letter: string; title: string; desc: string }[]
    importantNote?: string
    incapazNote?: string
  }
}

export const savedCards: SavedCard[] = [
  {
    letter: 'S',
    title: 'Surpresa',
    subtitle: 'Pergunta surpresa: expectativa de vida',
    content: {
      infoTitle: 'Pergunta: "Você ficaria surpreso se este paciente morresse nos próximos 12 meses (ou nesta internação)?"',
      note: 'Se NÃO ficaria surpreso, o paciente pode se beneficiar de abordagem paliativa precoce.',
    },
  },
  {
    letter: 'A',
    title: 'Auxilio ao Paciente',
    subtitle: 'O que o paciente realmente quer?',
    content: {
      infoTitle: 'Perguntas-chave:',
      items: [
        '"O que é mais importante para você agora?"',
        '"Se você não pudesse falar por si mesmo, quem falaria?"',
        '"Já conversou com sua família sobre suas preferências?"',
        'Há diretivas antecipadas documentadas?',
      ],
    },
  },
  {
    letter: 'V',
    title: 'Valores e Vida',
    subtitle: 'Qualidade vs quantidade de vida',
    content: {
      infoTitle: 'Explorar:',
      items: [
        'O que dá sentido à vida do paciente?',
        'O que seria inaceitável como qualidade de vida?',
        'Até onde ir com tratamentos intensivos?',
        'Preferências sobre local de cuidado e morte',
      ],
    },
  },
  {
    letter: 'E',
    title: 'Educar',
    subtitle: 'Informar sobre prognóstico e opções',
    content: {
      infoTitle: 'Comunicar:',
      items: [
        'Prognóstico realista (sem falsa esperança)',
        'Opções de tratamento disponíveis',
        'Consequências de cada opção',
        'O que os cuidados paliativos podem oferecer',
      ],
      note: 'Use linguagem clara: "A doença está avançando" em vez de "Não há mais o que fazer".',
    },
  },
  {
    letter: 'D',
    title: 'Decisão (Capacidade)',
    subtitle: 'Avaliar capacidade decisória',
    content: {
      infoTitle: '4 Critérios da Capacidade (CCEC):',
      capacityGrid: [
        { letter: 'C', title: 'Compreender', desc: 'Repete informações com suas palavras' },
        { letter: 'C', title: 'Contextualizar', desc: 'Aplica à sua realidade' },
        { letter: 'E', title: 'Embasar', desc: 'Justifica logicamente' },
        { letter: 'C', title: 'Comunicar', desc: 'Expressa a escolha' },
      ],
      importantNote: 'Decisão contrária à orientação médica NÃO significa incapacidade. Demência ou doença psiquiátrica NÃO = automaticamente incapaz.',
      incapazNote: 'Se incapaz: Identificar representante legal (cônjuge -> filhos -> pais -> irmãos). O representante decide baseado nos VALORES DO PACIENTE, não nos próprios.',
    },
  },
]

// --- REDMAP ---

export interface TechniqueStep {
  title: string
  description: string
}

export const redmapSteps: TechniqueStep[] = [
  { title: 'R — Reframe (Reenquadrar)', description: '"Parece que a situação mudou. Podemos conversar sobre isso?"' },
  { title: 'E — Expect (Expectativas)', description: '"O que você espera que aconteça daqui para frente?"' },
  { title: 'D — Demonstrate (Demonstrar empatia)', description: '"Eu gostaria que as coisas fossem diferentes também."' },
  { title: 'M — Map (Mapear valores)', description: '"O que é mais importante para você agora?"' },
  { title: 'A — Align (Alinhar)', description: '"Dado o que você me disse, eu recomendo..."' },
  { title: 'P — Plan (Planejar)', description: '"Vamos fazer um plano juntos para garantir que você receba o melhor cuidado."' },
]

export const nurseSteps: TechniqueStep[] = [
  { title: 'N — Name (Nomear)', description: '"Parece que você está com medo/triste/preocupado."' },
  { title: 'U — Understand (Compreender)', description: '"Eu consigo entender por que você se sente assim."' },
  { title: 'R — Respect (Respeitar)', description: '"Você tem sido muito forte lidando com tudo isso."' },
  { title: 'S — Support (Apoiar)', description: '"Estarei aqui com você durante todo esse processo."' },
  { title: 'E — Explore (Explorar)', description: '"Conte-me mais sobre o que está pensando."' },
]

export const frasesUteis: string[] = [
  '"A doença está avançando apesar dos tratamentos."',
  '"O corpo dele/dela está mostrando sinais de que está se aproximando do fim."',
  '"Vamos focar no conforto e na qualidade de vida."',
  '"Não vamos abandoná-lo. Estaremos cuidando dele até o final."',
]

export const frasesEvitar: string[] = [
  '&quot;Não há mais nada a fazer.&quot;',
  '"Vamos suspender os cuidados."',
  '"É só esperar."',
]

export const situacoesAlerta: string[] = [
  'Família solicita "fazer tudo" — explore o significado',
  'Conflito familiar sobre decisões — reunião multiprofissional',
  'Paciente e família com expectativas irreais — reeducar gentilmente',
  'Recusa de informação — respeitar, mas documentar',
]

// --- Manejar Sintomas ---

export interface MedRow {
  med: string
  dose: string
  obs?: string
  via?: string
}

export const dorLeve: MedRow[] = [
  { med: 'Dipirona', dose: '1g EV 6/6h' },
  { med: 'Paracetamol', dose: '750mg VO 6/6h' },
]

export const dorModerada: MedRow[] = [
  { med: 'Tramadol', dose: '50-100mg EV/VO 6/6h' },
  { med: 'Codeina', dose: '30-60mg VO 4/4h' },
]

export const dorIntensa: MedRow[] = [
  { med: 'Morfina', dose: '2-5mg EV/SC (virgem) | 10-15% dose/24h (usuario)' },
  { med: 'Fentanil', dose: '25-50mcg EV lento' },
  { med: 'Metadona', dose: '2,5-5mg VO 8/8h' },
]

export const dispneiaFarma: MedRow[] = [
  { med: 'Morfina', dose: '2-5mg SC/EV', obs: '1a linha' },
  { med: 'Midazolam', dose: '2,5-5mg SC/EV', obs: 'Se ansiedade' },
  { med: 'Dexametasona', dose: '4-8mg EV', obs: 'Se obstrução/edema' },
]

export const dispneiaNaoFarma: string[] = [
  'Ventilador/fluxo de ar no rosto',
  'Posicionamento (cabeceira elevada)',
  'Ambiente calmo e ventilado',
  'Presenca de familiar',
]

export const náuseaFarma: MedRow[] = [
  { med: 'Ondansetrona', dose: '4-8mg EV 8/8h', obs: 'Geral / QT' },
  { med: 'Metoclopramida', dose: '10mg EV 8/8h', obs: 'Gastroparesia' },
  { med: 'Haloperidol', dose: '0,5-2mg EV/SC 8/8h', obs: 'Obstrução' },
  { med: 'Dexametasona', dose: '4-8mg EV 12/12h', obs: 'HIC' },
  { med: 'Dimenidrinato', dose: '50mg EV 6/6h', obs: 'Vestibular' },
]

export const deliriumFarma: MedRow[] = [
  { med: 'Haloperidol', dose: '0,5-2mg', via: 'EV/SC/VO' },
  { med: 'Quetiapina', dose: '12,5-50mg', via: 'VO' },
  { med: 'Risperidona', dose: '0,5-1mg', via: 'VO' },
]

export const deliriumNaoFarma: string[] = [
  'Reorientação frequente',
  'Ambiente calmo, iluminado',
  'Presenca de familiar',
  'Evitar contenção física',
  'Ciclo sono-vigília preservado',
]

export const sedaçãoPreReq: string[] = [
  'Doença terminal documentada',
  'Sintoma(s) refratario(s) a tratamentos convencionais',
  'Consentimento do paciente ou representante',
  'Discussão em equipe multiprofissional',
  'Documentação completa em prontuário',
]

export const sedaçãoProtocolo: MedRow[] = [
  { med: 'Bolus inicial', dose: '2,5-5mg EV/SC' },
  { med: 'Manutenção', dose: '0,5-1mg/h BIC' },
  { med: 'Titulação', dose: 'Aumentar 0,5mg/h a cada 30min' },
]

export const sedaçãoAlternativas: MedRow[] = [
  { med: 'Propofol', dose: '0,5-1mg/kg/h (UTI)' },
  { med: 'Fenobarbital', dose: '100-200mg SC 12/12h' },
]

export interface DeathSign {
  sign: string
  time: string
}

export const sinaisMorteIminente: DeathSign[] = [
  { sign: 'Secreção respiratória (sororoca)', time: '~23h' },
  { sign: 'Respiração mandibular', time: '~2,5h' },
  { sign: 'Cianose de extremidades', time: '~1h' },
  { sign: 'Ausência de pulso radial', time: '~1h' },
]

export const cuidadosFaseFinNaoFarma: string[] = [
  'Reduzir frequência de aferição de sinais vitais',
  'Mudanca de decúbito suave (usar coxins)',
  'Suspender dieta quando RNC (comunicar família antes)',
  'Secreção oral: posicionar cabeça, NÃO aspirar',
  'Hidratação labial com gaze umidificada',
  'Permitir presença de familiar',
]

// --- Ferramentas ---

export interface EcogLevel {
  level: number
  label: string
  description: string
}

export const ecogLevels: EcogLevel[] = [
  { level: 0, label: 'Assintomático', description: 'Totalmente ativo, sem restrições' },
  { level: 1, label: 'Sintomático ambulatorial', description: 'Restrição a atividades físicas extenuantes, capaz de trabalho leve' },
  { level: 2, label: '<50% acamado', description: 'Ambulatorial, capaz de autocuidado, incapaz de trabalho; <50% do tempo acordado no leito' },
  { level: 3, label: '>50% acamado', description: 'Capacidade limitada de autocuidado; >50% do tempo acordado no leito ou cadeira' },
  { level: 4, label: 'Acamado total', description: 'Completamente incapacitado; totalmente restrito ao leito ou cadeira' },
  { level: 5, label: 'Óbito', description: '' },
]

export interface PpsLevel {
  pps: string
  deambulacao: string
  atividade: string
  autocuidado: string
  ingesta: string
  consciência: string
}

export const ppsLevels: PpsLevel[] = [
  { pps: '100%', deambulacao: 'Completa', atividade: 'Normal', autocuidado: 'Completo', ingesta: 'Normal', consciência: 'Completa' },
  { pps: '90%', deambulacao: 'Completa', atividade: 'Normal', autocuidado: 'Completo', ingesta: 'Normal', consciência: 'Completa' },
  { pps: '80%', deambulacao: 'Completa', atividade: 'Com esforço', autocuidado: 'Completo', ingesta: 'Normal ou reduzida', consciência: 'Completa' },
  { pps: '70%', deambulacao: 'Reduzida', atividade: 'Incapaz trabalho', autocuidado: 'Completo', ingesta: 'Normal ou reduzida', consciência: 'Completa' },
  { pps: '60%', deambulacao: 'Reduzida', atividade: 'Incapaz hobbies', autocuidado: 'Assistência ocasional', ingesta: 'Normal ou reduzida', consciência: 'Confusão ocasional' },
  { pps: '50%', deambulacao: 'Sentado/deitado', atividade: 'Incapaz qualquer', autocuidado: 'Assistência considerável', ingesta: 'Normal ou reduzida', consciência: 'Confusão ocasional' },
  { pps: '40%', deambulacao: 'Acamado', atividade: 'Incapaz', autocuidado: 'Assistência principal', ingesta: 'Normal ou reduzida', consciência: 'Confusão ou sonolência' },
  { pps: '30%', deambulacao: 'Acamado', atividade: 'Incapaz', autocuidado: 'Dependente total', ingesta: 'Reduzida', consciência: 'Confusão ou sonolência' },
  { pps: '20%', deambulacao: 'Acamado', atividade: 'Incapaz', autocuidado: 'Dependente total', ingesta: 'Goles', consciência: 'Confusão ou sonolência' },
  { pps: '10%', deambulacao: 'Acamado', atividade: 'Incapaz', autocuidado: 'Dependente total', ingesta: 'Cuidados boca', consciência: 'Sonolento ou coma' },
  { pps: '0%', deambulacao: 'Óbito', atividade: '', autocuidado: '', ingesta: '', consciência: '' },
]

export interface PpiOption {
  name: string
  label: string
  options: { text: string; value: number; score: string }[]
}

export const ppiOptions: PpiOption[] = [
  {
    name: 'pps',
    label: 'PPS (Palliative Performance Scale)',
    options: [
      { text: '>=60%', value: 0, score: '+0' },
      { text: '30-50%', value: 2.5, score: '+2,5' },
      { text: '10-20%', value: 4, score: '+4' },
    ],
  },
  {
    name: 'oral',
    label: 'Ingesta Oral',
    options: [
      { text: 'Normal', value: 0, score: '+0' },
      { text: 'Moderadamente reduzida', value: 1, score: '+1' },
      { text: 'Muito reduzida (apenas goles)', value: 2.5, score: '+2,5' },
    ],
  },
  {
    name: 'edema',
    label: 'Edema',
    options: [
      { text: 'Ausente', value: 0, score: '+0' },
      { text: 'Presente', value: 1, score: '+1' },
    ],
  },
  {
    name: 'dispneia',
    label: 'Dispneia em Repouso',
    options: [
      { text: 'Ausente', value: 0, score: '+0' },
      { text: 'Presente', value: 3.5, score: '+3,5' },
    ],
  },
  {
    name: 'delirium',
    label: 'Delirium',
    options: [
      { text: 'Ausente', value: 0, score: '+0' },
      { text: 'Presente', value: 4, score: '+4' },
    ],
  },
]

export function interpretPPI(score: number): { className: string; text: string } {
  if (score <= 2) return { className: 'bg-emerald-500/15 text-emerald-400', text: 'Sobrevida mediana: ~155 dias — Prognóstico melhor' }
  if (score <= 4) return { className: 'bg-yellow-500/15 text-yellow-400', text: 'Sobrevida mediana: ~89 dias — Prognóstico intermediário' }
  if (score <= 6) return { className: 'bg-orange-500/15 text-orange-400', text: 'Sobrevida mediana: ~18-21 dias — Prognóstico reservado (sobrevida <6 semanas: sens 80%, esp 77%)' }
  return { className: 'bg-red-500/15 text-red-400', text: 'Sobrevida mediana: ~5 dias — Prognóstico muito reservado (sobrevida <3 semanas: sens 80%, esp 85%)' }
}

// --- Opioid Conversion ---

export const opioidOptions = [
  { value: 'morfina-vo', label: 'Morfina VO' },
  { value: 'morfina-ev', label: 'Morfina EV/SC' },
  { value: 'tramadol', label: 'Tramadol VO' },
  { value: 'codeina', label: 'Codeína VO' },
  { value: 'fentanil-ev', label: 'Fentanil EV (mcg/h)' },
  { value: 'metadona', label: 'Metadona VO' },
]

export const opioidFactors: Record<string, number> = {
  'morfina-vo': 1,
  'morfina-ev': 3,
  'tramadol': 0.1,
  'codeina': 0.15,
  'fentanil-ev': 300,
  'metadona': 4,
}

export interface OpioidEquivalence {
  drug: string
  dose: string
  factor: string
}

export const opioidEquivalenceTable: OpioidEquivalence[] = [
  { drug: 'Morfina VO', dose: '30mg', factor: '1' },
  { drug: 'Morfina EV/SC', dose: '10mg', factor: '3' },
  { drug: 'Tramadol VO', dose: '300mg', factor: '0,1' },
  { drug: 'Codeína VO', dose: '200mg', factor: '0,15' },
  { drug: 'Fentanil EV', dose: '100mcg/h', factor: '~300' },
  { drug: 'Metadona VO', dose: 'Variável*', factor: '-' },
]

// --- Hipodermoclise ---

export const hipoIndicações: string[] = [
  'Demência avançada com disfagia',
  'Náuseas e/ou vômitos por periodos prolongados',
  'Intolerância gástrica',
  'Obstrução intestinal',
  'Diarreia',
  'Confusão mental',
  'Dispneia intensa',
  'Fase final de vida',
  'Desidratação que não exija reposição rápida de volume',
  'Antibioticoterapia em idosos (desde que o fármaco seja tolerado por via SC)',
  'Perfil de absorção mais lento desejado (opioides para analgesia contínua, furosemida para ICC)',
]

export const hipoContraindicações: string[] = [
  'Emergências que necessitam de reposição rápida de volume',
  'Desidratação severa',
  'Distúrbio de coagulação',
  'Anasarca',
  'Soluções hipertônicas (concentrações máx: SG 5%, NaCl 20% até 20mL e KCl 19,1% até 15mL por litro)',
]

export interface VolumeLocal {
  region: string
  volume: string
  fullWidth?: boolean
}

export const volumesPorLocal: VolumeLocal[] = [
  { region: 'Subclavicular', volume: 'até 250 mL' },
  { region: 'Deltoidea', volume: 'até 250 mL' },
  { region: 'Abdominal', volume: 'até 1.000 mL' },
  { region: 'Interescapular', volume: 'até 1.000 mL' },
  { region: 'Anterolateral da Coxa', volume: 'até 1.500 mL (preferencial para volumes maiores)', fullWidth: true },
]

export interface DeviceInfo {
  device: string
  calibre: string
  permanence: string
}

export const dispositivos: DeviceInfo[] = [
  { device: 'Escalpe (butterfly)', calibre: '21G a 25G', permanence: '3-5 dias' },
  { device: 'Cateter não agulhado (Vialon)', calibre: '20G a 24G', permanence: '7-11 dias' },
  { device: 'Cateter não agulhado (poliuretano)', calibre: '20G a 24G', permanence: '7-11 dias' },
]

export const hipoProcedimento: TechniqueStep[] = [
  { title: 'Checar prescrição', description: 'Nome do paciente, medicamento/soro, dosagem, via SC, horario' },
  { title: 'Verificar compatibilidade', description: 'Conferir se a medicação está na lista de HDC e aprazamento compatível' },
  { title: 'Escolher local', description: 'Coxa, abdome, regiao escapular ou infraclavícular — conforme volume necessário' },
  { title: 'Posicionar e antissepsia', description: 'Expor apenas a área de aplicação. Swab de alcool até o local estar limpo' },
  { title: 'Puncionar', description: 'Fazer prega cutanea, inserir cateter 22-24G em ângulo de 30-45 graus abaixo da pele levantada' },
  { title: 'Confirmar posicionamento', description: 'Aspirar com seringa — sem retorno de sangue. Se houver retorno venoso, retirar e reiniciar' },
  { title: 'Fixar', description: 'Película transparente, identificar com data e nome de quem puncionou' },
  { title: 'Flush', description: 'SF 0,9% 2 a 5 mL' },
  { title: 'Conectar medicação', description: 'Se infusão contínua: BIC até 62,5 mL/h (noturno em coxa: 70-100 mL/h)' },
  { title: 'Orientar paciente', description: 'Comunicar se sentir dor, queimação ou ardência durante a infusão' },
]

export interface HipoMed {
  name: string
  dose: string
  dilution: string
  obs?: string
}

export const hipoMedicações: HipoMed[] = [
  { name: 'Ampicilina', dose: '1 g/dia', dilution: 'SF 0,9% 50 mL', obs: 'Tempo de infusão: 20 minutos' },
  { name: 'Cefepime', dose: '1 g 12/12h ou 8/8h', dilution: 'Reconstituir 1g em 10 mL AD + SF 0,9% 100 mL', obs: 'Tempo de infusão: 40 min. Sem estudos para doses maiores' },
  { name: 'Ceftriaxona', dose: '1 g 12/12h', dilution: 'Reconstituir 1g em 10 mL AD + SF 0,9% 100 mL', obs: 'Tempo de infusão: 40 minutos' },
  { name: 'Dexametasona', dose: '2-16 mg a cada 24h', dilution: '1 amp (1 mL) em SF 0,9% 1 mL ou 1 amp (2,5 mL) em SF 0,9% 2,5 mL', obs: 'Aplicação lenta, 1-2x/dia pela manhã. Sítio exclusivo — incompatível com outros medicamentos, risco de irritação local' },
  { name: 'Dimenidrinato', dose: '50-100 mg em 24h', dilution: 'SF 0,9% 1 mL' },
  { name: 'Dipirona', dose: '1-2 g até 6/6h', dilution: 'SF 0,9% 2 mL', obs: 'Aplicação lenta em bolus' },
  { name: 'Ertapenem', dose: '1 g 24/24h', dilution: 'Reconstituir em 10 mL AD + 50 mL SF 0,9%', obs: 'Tempo de infusão: 30 min. Alternativa: bolus com 1g em 3,2 mL lidocaína 1% (sem epinefrina)' },
  { name: 'Escopolâmina', dose: '20 mg 8/8h até 60 mg 6/6h', dilution: 'SF 0,9% 1 mL (bolus)', obs: 'Infusão em bolus ou contínua. Não confundir com a apresentação combinada com dipirona' },
  { name: 'Fentanil', dose: 'A critério médico', dilution: '4 amp (50 mcg/mL) em SF 0,9% 210 mL', obs: 'Infusão contínua a critério médico' },
  { name: 'Furosemida', dose: '20-140 mg/24h', dilution: 'SF 0,9% 2 mL (bolus) ou volumes maiores (infusão contínua)' },
  { name: 'Haloperidol', dose: '0,5-30 mg/24h', dilution: 'SF 0,9% 5 mL', obs: 'Idosos frágeis: menor dose possível. Se concentração >= 1 mg/mL, usar AD como diluente (risco de precipitação com SF)' },
  { name: 'Metadona', dose: '50% da dose oral habitual', dilution: 'SF 0,9% 10 mL', obs: 'Velocidade: 60 mL/h. Mudar local de punção a cada 24h (alto potencial de irritação cutânea)' },
  { name: 'Metoclopramida', dose: '30-120 mg/dia', dilution: 'SF 0,9% 2 mL (bolus)', obs: 'Pode causar irritação local' },
  { name: 'Midazolam', dose: '1-5 mg (bolus) / 10-120 mg/dia (BIC)', dilution: 'SF 0,9% 5 mL (bolus); SF 0,9% 100 mL (BIC)', obs: 'Pode causar irritação local' },
  { name: 'Morfina', dose: '2-3 mg 4/4h (bolus) ou 10-20 mg/24h (BIC)', dilution: 'Não requer diluição (bolus); SF 0,9% 100 mL (BIC)', obs: 'Sem dose máxima. Menor dose possível em idosos frágeis, DRC ou hepatopatas. Intervalo pode ser aumentado em insuficiência renal/hepática' },
  { name: 'Octreotide', dose: '300-900 mcg/24h', dilution: 'SF 0,9% 5 mL (bolus); SF 0,9% 100 mL (BIC)', obs: 'Armazenar refrigerado — atingir temperatura ambiente antes da administração. Sítio exclusivo' },
  { name: 'Omeprazol', dose: '40 mg 24/24h', dilution: 'SF 0,9% 100 mL', obs: 'Tempo de infusão: 4 horas. Dose única diária. Não mesclar com outros medicamentos' },
  { name: 'Ondansetrona', dose: '8-32 mg/24h', dilution: 'SF 0,9% 30 mL', obs: 'Tempo de infusão: 30 min (risco de prolongamento do intervalo QT)' },
  { name: 'Tramadol', dose: '100-600 mg/24h', dilution: 'SF 0,9% 20 mL (bolus); SF 0,9% 100 mL (BIC)' },
]

export interface HipoSolucao {
  solução: string
  doseMax: string
  orientações: string
}

export const hipoSolucoes: HipoSolucao[] = [
  { solução: 'SF 0,9%', doseMax: '1.500 mL/24h por sítio', orientações: 'SF 0,45% segue as mesmas recomendações. Max 62,5 mL/h. Coxa preferencial para volumes maiores' },
  { solução: 'Soro glicofisiológico (2/3 SG 5% + 1/3 SF 0,9%)', doseMax: '1.500 mL/24h por sítio', orientações: 'Max 62,5 mL/h. Coxa preferencial para volumes maiores' },
  { solução: 'SG 5%', doseMax: '1.000 mL/24h por sítio', orientações: 'Max 62,5 mL/h. Coxa preferencial para volumes maiores' },
]

// --- Mitos e Verdades ---

export interface MythData {
  id: number
  title: string
  isMito: boolean
  statement: string
  explanation: string
  category: 'conceito' | 'medicações' | 'comunicação' | 'prognóstico'
}

export const mythsData: MythData[] = [
  { id: 1, category: 'conceito', title: '"Não há o que fazer"', isMito: true, statement: '"Cuidados paliativos significa que não há mais nada a fazer."', explanation: 'Cuidados paliativos são uma abordagem ATIVA que visa melhorar a qualidade de vida. Há MUITO a fazer: controle impecável de sintomas, suporte emocional, planejamento de cuidados, apoio à família, dignidade no processo de morrer.' },
  { id: 2, category: 'conceito', title: '"Tudo ou nada"', isMito: true, statement: '"Ou fazemos tudo para curar, ou não fazemos nada."', explanation: 'Existe um amplo espectro entre "investir em tudo" e "não fazer nada". Cuidados paliativos podem ser integrados com tratamentos curativos desde o diagnóstico. O objetivo é proporcionalidade e adequação ao momento do paciente.' },
  { id: 3, category: 'conceito', title: '"Só para câncer"', isMito: true, statement: '"Cuidados paliativos são apenas para pacientes oncológicos."', explanation: 'Cuidados paliativos beneficiam qualquer doença grave e ameaçadora à vida: ICC, DPOC, DRC, demência, doenças neurológicas, fragilidade do idoso. Todas essas condições cursam com sintomas que precisam de manejo adequado.' },
  { id: 4, category: 'conceito', title: '"Só no fim"', isMito: true, statement: '"Cuidados paliativos devem ser iniciados apenas nos últimos dias de vida."', explanation: 'Quanto mais precoce a integração dos cuidados paliativos, melhores os desfechos. Estudos mostram que pacientes com câncer de pulmao que receberam CP precoces viveram MAIS e com melhor qualidade de vida.' },
  { id: 5, category: 'conceito', title: '"Não no DE"', isMito: true, statement: '"Cuidados paliativos não são papel do emergencista."', explanation: 'O DE é frequentemente o primeiro ponto de contato com pacientes em crise de doença avançada. Emergencistas estão em posição privilegiada para identificar, iniciar conversas e aliviar sofrimento agudo.' },
  { id: 6, category: 'conceito', title: '"É desistir"', isMito: true, statement: '"Oferecer cuidados paliativos é o mesmo que desistir do paciente."', explanation: 'Cuidados paliativos são uma mudança de FOCO, não de intensidade. O objetivo passa a ser qualidade de vida e conforto. É uma das formas mais intensas de cuidado que podemos oferecer.' },
  { id: 7, category: 'medicações', title: '"Morfina vicia"', isMito: true, statement: '"Morfina causa dependencia em pacientes com dor."', explanation: 'Dependência física (tolerância) e diferente de adicção (transtorno de uso). Pacientes com dor que recebem opioides raramente desenvolvem adicção. O subtratamento da dor e muito mais comum e prejudicial.' },
  { id: 8, category: 'medicações', title: '"Morfina mata"', isMito: true, statement: '"Morfina acelera a morte do paciente."', explanation: 'Quando titulada adequadamente para controle de sintomas, morfina NÃO encurta a vida. Estudos mostram que pacientes com bom controle de dor e dispneia frequentemente vivem mais. O duplo efeito e eticamente aceito.' },
  { id: 9, category: 'medicações', title: '"Sedação é eutanásia"', isMito: true, statement: '"Sedação paliativa é uma forma disfarçada de eutanásia."', explanation: 'Sedação paliativa visa controlar sintomas refratários, não antecipar a morte. A intenção (alívio de sofrimento) e o método (titulação para conforto) são completamente diferentes da eutanásia.' },
  { id: 10, category: 'medicações', title: '"Dose máxima"', isMito: true, statement: '"Opioides têm dose máxima que não pode ser ultrapassada."', explanation: 'Opioides NÃO têm dose teto para analgesia. A dose correta é aquela que alivia a dor com efeitos adversos toleráveis. Pacientes em uso crônico desenvolvem tolerância e podem precisar de doses muito altas.' },
  { id: 11, category: 'medicações', title: '"Guardar para depois"', isMito: true, statement: '"Melhor guardar os opioides fortes para quando a dor piorar."', explanation: 'Dor não controlada causa sofrimento desnecessário e pode levar a sensibilização central, tornando o controle futuro mais difícil. Usar a medicação adequada ao nível de dor AGORA e o correto.' },
  { id: 12, category: 'medicações', title: '"Só se pedir"', isMito: true, statement: '"Só devo dar analgesico se o paciente pedir."', explanation: 'Muitos pacientes, especialmente idosos e com déficit cognitivo, não pedem analgesia mesmo com dor intensa. A avaliação proativa e sistemática da dor e responsabilidade da equipe.' },
  { id: 13, category: 'comunicação', title: '"Tira esperança"', isMito: true, statement: '"Falar sobre cuidados paliativos tira a esperança do paciente."', explanation: 'Honestidade compassiva não elimina esperança — redireciona. Pacientes podem manter esperança de conforto, tempo de qualidade, resolução de pendências. Falsas esperanças causam mais dano.' },
  { id: 14, category: 'comunicação', title: '"Familia decide"', isMito: true, statement: '"A família é quem deve decidir sobre os cuidados do paciente."', explanation: 'O paciente capaz é o protagonista de suas decisões. A família representa os desejos do paciente quando ele não pode se expressar, mas deve basear-se nos valores DELE, não nos próprios.' },
  { id: 15, category: 'comunicação', title: '"Não falar em morte"', isMito: true, statement: '"Não devemos mencionar a possibilidade de morte para o paciente."', explanation: 'Maioria dos pacientes quer informação honesta sobre seu prognóstico. Evitar o tema impede planejamento, despedidas e fechamento de ciclos. A comunicação deve ser gradual, respeitosa e individualizada.' },
  { id: 16, category: 'comunicação', title: '"Paciente não quer saber"', isMito: true, statement: '"A maioria dos pacientes não quer saber sobre seu prognóstico."', explanation: 'Estudos mostram que 70-90% dos pacientes desejam informação sobre seu prognóstico. A percepção de que "não querem saber" frequentemente é projeção da nossa própria dificuldade em comunicar.' },
  { id: 17, category: 'comunicação', title: '"Conversa leva tempo"', isMito: true, statement: '"Não tenho tempo no DE para ter conversas sobre fim de vida."', explanation: 'Conversas efetivas sobre metas de cuidado podem ser breves (5-10 minutos). Perguntas-chave bem colocadas economizam tempo e evitam procedimentos desnecessários. É questão de técnica, não de tempo.' },
  { id: 18, category: 'comunicação', title: '"Depois da UTI"', isMito: true, statement: '"Cuidados paliativos devem comecar apos alta da UTI."', explanation: 'A UTI e um dos locais onde mais se precisa de cuidados paliativos. Pacientes gravemente enfermos beneficiam-se de controle de sintomas, comunicação estruturada e planejamento de cuidados durante a internação.' },
  { id: 19, category: 'prognóstico', title: '"Paciente jovem"', isMito: true, statement: '"Paciente jovem sempre deve receber medidas invasivas."', explanation: 'Idade não é critério para proporcionalidade de tratamento. Pacientes jovens com doenças terminais também têm direito a cuidados paliativos e a recusar medidas invasivas que não mudam prognóstico.' },
  { id: 20, category: 'prognóstico', title: '"Ainda tem opção"', isMito: true, statement: '"Se ainda existe alguma opção de tratamento, não é hora de paliativos."', explanation: 'Cuidados paliativos e tratamento curativo não são mutuamente exclusivos. A integração precoce melhora qualidade de vida e, em alguns estudos, até sobrevida. Não precisa esperar "não ter mais nada".' },
  { id: 21, category: 'prognóstico', title: '"Prognóstico exato"', isMito: true, statement: '"Médicos conseguem prever com precisão quanto tempo o paciente tem."', explanation: 'Prognóstico é probabilístico, não determinístico. Médicos tendem a superestimar sobrevida. Ferramentas como PPI ajudam, mas devem ser comunicadas como estimativas, não certezas.' },
  { id: 22, category: 'prognóstico', title: '"Milagre acontece"', isMito: false, statement: '"Casos excepcionais de recuperação inesperada existem."', explanation: 'Verdade! Casos excepcionais ocorrem, mas são estatisticamente raros. Basear decisões em exceções extremas pode prolongar sofrimento desnecessariamente para a grande maioria. Equilíbrio é fundamental.' },
  { id: 23, category: 'prognóstico', title: '"Só oncologia decide"', isMito: true, statement: '"Apenas o oncologista pode indicar cuidados paliativos."', explanation: 'Qualquer médico pode identificar necessidade de cuidados paliativos e iniciar abordagem. O emergencista frequentemente e o primeiro a reconhecer e pode coordenar com equipe especializada posteriormente.' },
  { id: 24, category: 'prognóstico', title: '"Se entrar no DE, intubo"', isMito: true, statement: '"Se o paciente veio ao DE, e porque quer ser intubado e reanimado."', explanation: 'Pacientes vêm ao DE por diversos motivos: dor, dispneia, medo, orientação inadequada. Vir ao DE não significa automaticamente querer medidas invasivas. Sempre verificar desejos e contexto.' },
]

// --- Referências ---

export interface ReferenceCategory {
  title: string
  color: string
  items: string[]
}

export const referências: ReferenceCategory[] = [
  {
    title: 'Ferramentas e Escalas',
    color: '#10B981',
    items: [
      'SPICT-BR. NHS Lothian / University of Edinburgh, 2019.',
      'Morita T, et al. The Palliative Prognostic Index. Support Care Câncer. 1999;7:128-133.',
      'Anderson F, et al. Palliative Performance Scale (PPS). J Palliat Care. 1996.',
      'Oken MM, et al. ECOG Performance Status. Am J Clin Oncol. 1982.',
    ],
  },
  {
    title: 'Manejo de Sintomas',
    color: '#3B82F6',
    items: [
      'UpToDate: Palliative care in the emergency department, 2024.',
      'UpToDate: Overview of managing common symptoms in palliative care, 2024.',
      'Protocolo de Sedação Paliativa — ANCP, 2023.',
      'Cuidados Paliativos na Emergência — USP, 2021.',
    ],
  },
  {
    title: 'Comunicação',
    color: '#A78BFA',
    items: [
      'VitalTalk. Communication Skills Training for Clinicians.',
      'Ribeiro VZ, et al. SAVED Framework. J Bras Med Emerg. 2024.',
      'Back AL, et al. Approaching difficult communication tasks in oncology. CA Câncer J Clin. 2005.',
    ],
  },
  {
    title: 'Ética e Legislação',
    color: '#F97316',
    items: [
      'Resolução CFM n. 1.805/2006 — Ortotanasia.',
      'Resolução CFM n. 1.995/2012 — Diretivas Antecipadas de Vontade.',
      'Resolução CFM n. 2.217/2018 — Código de Ética Médica.',
    ],
  },
]

// --- Compatibility Table ---

export const compatHeaders = ['CEF', 'CRO', 'DIP', 'ESC', 'FUR', 'HAL', 'LEV', 'MTC', 'MDZ', 'MOR', 'OCT', 'OND', 'RAN', 'TRA', 'DEX']

export const compatRows: { drug: string; compat: ('C' | 'I')[] }[] = [
  { drug: 'Cefepime',        compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Ceftriaxona',     compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Dipirona',        compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Escopolâmina',    compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Furosemida',      compat: ['C','C','C','C','C','C','I','I','I','I','C','I','C','I'] },
  { drug: 'Haloperidol',     compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Levomeprom.',     compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Metoclopramida',  compat: ['C','C','C','C','I','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Midazolam',       compat: ['C','C','C','C','I','C','C','C','C','I','C','C','C','I'] },
  { drug: 'Morfina',         compat: ['C','C','C','C','I','C','C','C','C','I','C','C','C','I'] },
  { drug: 'Octreotide',      compat: ['C','C','C','C','C','C','C','C','C','C','C','I','I','I'] },
  { drug: 'Ondansetrona',    compat: ['C','C','C','C','C','C','C','C','C','C','I','I','C','I'] },
  { drug: 'Ranitidina',      compat: ['I','I','I','I','I','I','I','I','C','C','I','I','C','I'] },
  { drug: 'Tramadol',        compat: ['C','C','C','C','C','C','C','C','C','I','I','C','C','I'] },
  { drug: 'Dexametasona',    compat: ['I','I','I','I','I','I','I','I','I','I','I','I','I','I'] },
]
