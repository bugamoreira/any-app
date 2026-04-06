// ==========================================
// DADOS CLINICOS — Palia Path
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
  'Internacoes nao planejadas',
  'Performance status ruim ou em declinio (restrito ao leito >50% do dia)',
  'Dependencia crescente para AVDs',
  'Perda de peso significativa nos ultimos 3-6 meses',
  'Sintomas persistentes apesar de tratamento otimizado',
  'Paciente ou familia perguntam sobre cuidados paliativos ou prognostico',
  'Paciente escolhe reduzir ou suspender tratamento',
]

export const spictCategorias: SpictCategory[] = [
  {
    id: 'cardiaca',
    title: 'Doenca cardiaca / vascular',
    iconBg: 'rgba(239,68,68,0.15)',
    iconColor: '#EF4444',
    items: [
      'ICC NYHA III/IV com sintomas persistentes',
      'Doenca coronariana extensa nao passivel de intervencao',
      'Doenca vascular periferica inoperavel',
    ],
  },
  {
    id: 'respiratoria',
    title: 'Doenca respiratoria',
    iconBg: 'rgba(59,130,246,0.15)',
    iconColor: '#3B82F6',
    items: [
      'Doenca intersticial grave ou fibrose com declinio de funcao',
      'DPOC com dispneia em repouso ou aos minimos esforcos',
      'Oxigenoterapia domiciliar de longa duracao',
      'Ventilacao assistida',
    ],
  },
  {
    id: 'neurologica',
    title: 'Doenca neurologica',
    iconBg: 'rgba(249,115,22,0.15)',
    iconColor: '#F97316',
    items: [
      'Deterioracao progressiva da funcao fisica/cognitiva',
      'Disfagia com aspiracao recorrente',
      'Dificuldade de fala progressiva',
      'Pneumonias de repeticao',
    ],
  },
  {
    id: 'renal',
    title: 'Doenca renal',
    iconBg: 'rgba(167,139,250,0.15)',
    iconColor: '#A78BFA',
    items: [
      'DRC estagio 4-5 (TFG <30) com deterioracao',
      'Falha ou suspensao de dialise',
      'Opcao por tratamento conservador',
    ],
  },
  {
    id: 'hepatica',
    title: 'Doenca hepatica',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#FBBF24',
    items: [
      'Cirrose avancada com complicacoes (ascite, encefalopatia, SHR)',
      'Transplante contraindicado',
    ],
  },
  {
    id: 'cancer',
    title: 'Cancer',
    iconBg: 'rgba(239,68,68,0.15)',
    iconColor: '#EF4444',
    items: [
      'Doenca metastatica ou localmente avancada',
      'Progressao durante tratamento oncologico',
      'Tratamento oncologico especifico descontinuado',
    ],
  },
  {
    id: 'demencia',
    title: 'Demencia / Fragilidade',
    iconBg: 'rgba(156,163,175,0.15)',
    iconColor: '#9CA3AF',
    items: [
      'Incapaz de vestir-se, tomar banho, alimentar-se sem ajuda',
      'Ingestao oral reduzida',
      'Incontinencia urinaria e fecal',
      'Incapaz de comunicacao significativa',
      'Multiplas comorbidades com declinio funcional',
      'Fragilidade com complicacoes ou declinio',
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
      infoTitle: 'Pergunta: "Voce ficaria surpreso se este paciente morresse nos proximos 12 meses (ou nesta internacao)?"',
      note: 'Se NAO ficaria surpreso, o paciente pode se beneficiar de abordagem paliativa precoce.',
    },
  },
  {
    letter: 'A',
    title: 'Auxilio ao Paciente',
    subtitle: 'O que o paciente realmente quer?',
    content: {
      infoTitle: 'Perguntas-chave:',
      items: [
        '"O que e mais importante para voce agora?"',
        '"Se voce nao pudesse falar por si mesmo, quem falaria?"',
        '"Ja conversou com sua familia sobre suas preferencias?"',
        'Ha diretivas antecipadas documentadas?',
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
        'O que da sentido a vida do paciente?',
        'O que seria inaceitavel como qualidade de vida?',
        'Ate onde ir com tratamentos intensivos?',
        'Preferencias sobre local de cuidado e morte',
      ],
    },
  },
  {
    letter: 'E',
    title: 'Educar',
    subtitle: 'Informar sobre prognostico e opcoes',
    content: {
      infoTitle: 'Comunicar:',
      items: [
        'Prognostico realista (sem falsa esperanca)',
        'Opcoes de tratamento disponiveis',
        'Consequencias de cada opcao',
        'O que os cuidados paliativos podem oferecer',
      ],
      note: 'Use linguagem clara: "A doenca esta avancando" em vez de "Nao ha mais o que fazer".',
    },
  },
  {
    letter: 'D',
    title: 'Decisao (Capacidade)',
    subtitle: 'Avaliar capacidade decisoria',
    content: {
      infoTitle: '4 Criterios da Capacidade (CCEC):',
      capacityGrid: [
        { letter: 'C', title: 'Compreender', desc: 'Repete informacoes com suas palavras' },
        { letter: 'C', title: 'Contextualizar', desc: 'Aplica a sua realidade' },
        { letter: 'E', title: 'Embasar', desc: 'Justifica logicamente' },
        { letter: 'C', title: 'Comunicar', desc: 'Expressa a escolha' },
      ],
      importantNote: 'Decisao contraria a orientacao medica NAO significa incapacidade. Demencia ou doenca psiquiatrica NAO = automaticamente incapaz.',
      incapazNote: 'Se incapaz: Identificar representante legal (conjuge -> filhos -> pais -> irmaos). O representante decide baseado nos VALORES DO PACIENTE, nao nos proprios.',
    },
  },
]

// --- REDMAP ---

export interface TechniqueStep {
  title: string
  description: string
}

export const redmapSteps: TechniqueStep[] = [
  { title: 'R -- Reframe (Reenquadrar)', description: '"Parece que a situacao mudou. Podemos conversar sobre isso?"' },
  { title: 'E -- Expect (Expectativas)', description: '"O que voce espera que aconteca daqui para frente?"' },
  { title: 'D -- Demonstrate (Demonstrar empatia)', description: '"Eu gostaria que as coisas fossem diferentes tambem."' },
  { title: 'M -- Map (Mapear valores)', description: '"O que e mais importante para voce agora?"' },
  { title: 'A -- Align (Alinhar)', description: '"Dado o que voce me disse, eu recomendo..."' },
  { title: 'P -- Plan (Planejar)', description: '"Vamos fazer um plano juntos para garantir que voce receba o melhor cuidado."' },
]

export const nurseSteps: TechniqueStep[] = [
  { title: 'N -- Name (Nomear)', description: '"Parece que voce esta com medo/triste/preocupado."' },
  { title: 'U -- Understand (Compreender)', description: '"Eu consigo entender por que voce se sente assim."' },
  { title: 'R -- Respect (Respeitar)', description: '"Voce tem sido muito forte lidando com tudo isso."' },
  { title: 'S -- Support (Apoiar)', description: '"Estarei aqui com voce durante todo esse processo."' },
  { title: 'E -- Explore (Explorar)', description: '"Conte-me mais sobre o que esta pensando."' },
]

export const frasesUteis: string[] = [
  '"A doenca esta avancando apesar dos tratamentos."',
  '"O corpo dele/dela esta mostrando sinais de que esta se aproximando do fim."',
  '"Vamos focar no conforto e na qualidade de vida."',
  '"Nao vamos abandona-lo. Estaremos cuidando dele ate o final."',
]

export const frasesEvitar: string[] = [
  '"Nao ha mais nada a fazer."',
  '"Vamos suspender os cuidados."',
  '"E so esperar."',
]

export const situacoesAlerta: string[] = [
  'Familia solicita "fazer tudo" -- explore o significado',
  'Conflito familiar sobre decisoes -- reuniao multiprofissional',
  'Paciente e familia com expectativas irreais -- reeducar gentilmente',
  'Recusa de informacao -- respeitar, mas documentar',
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
  { med: 'Dexametasona', dose: '4-8mg EV', obs: 'Se obstrucao/edema' },
]

export const dispneiaNaoFarma: string[] = [
  'Ventilador/fluxo de ar no rosto',
  'Posicionamento (cabeceira elevada)',
  'Ambiente calmo e ventilado',
  'Presenca de familiar',
]

export const nauseaFarma: MedRow[] = [
  { med: 'Ondansetrona', dose: '4-8mg EV 8/8h', obs: 'Geral / QT' },
  { med: 'Metoclopramida', dose: '10mg EV 8/8h', obs: 'Gastroparesia' },
  { med: 'Haloperidol', dose: '0,5-2mg EV/SC 8/8h', obs: 'Obstrucao' },
  { med: 'Dexametasona', dose: '4-8mg EV 12/12h', obs: 'HIC' },
  { med: 'Dimenidrinato', dose: '50mg EV 6/6h', obs: 'Vestibular' },
]

export const deliriumFarma: MedRow[] = [
  { med: 'Haloperidol', dose: '0,5-2mg', via: 'EV/SC/VO' },
  { med: 'Quetiapina', dose: '12,5-50mg', via: 'VO' },
  { med: 'Risperidona', dose: '0,5-1mg', via: 'VO' },
]

export const deliriumNaoFarma: string[] = [
  'Reorientacao frequente',
  'Ambiente calmo, iluminado',
  'Presenca de familiar',
  'Evitar contencao fisica',
  'Ciclo sono-vigilia preservado',
]

export const sedacaoPreReq: string[] = [
  'Doenca terminal documentada',
  'Sintoma(s) refratario(s) a tratamentos convencionais',
  'Consentimento do paciente ou representante',
  'Discussao em equipe multiprofissional',
  'Documentacao completa em prontuario',
]

export const sedacaoProtocolo: MedRow[] = [
  { med: 'Bolus inicial', dose: '2,5-5mg EV/SC' },
  { med: 'Manutencao', dose: '0,5-1mg/h BIC' },
  { med: 'Titulacao', dose: 'Aumentar 0,5mg/h a cada 30min' },
]

export const sedacaoAlternativas: MedRow[] = [
  { med: 'Propofol', dose: '0,5-1mg/kg/h (UTI)' },
  { med: 'Fenobarbital', dose: '100-200mg SC 12/12h' },
]

export interface DeathSign {
  sign: string
  time: string
}

export const sinaisMorteIminente: DeathSign[] = [
  { sign: 'Secrecao respiratoria (sororoca)', time: '~23h' },
  { sign: 'Respiracao mandibular', time: '~2,5h' },
  { sign: 'Cianose de extremidades', time: '~1h' },
  { sign: 'Ausencia de pulso radial', time: '~1h' },
]

export const cuidadosFaseFinNaoFarma: string[] = [
  'Reduzir frequencia de afericao de sinais vitais',
  'Mudanca de decubito suave (usar coxins)',
  'Suspender dieta quando RNC (comunicar familia antes)',
  'Secrecao oral: posicionar cabeca, NAO aspirar',
  'Hidratacao labial com gaze umidificada',
  'Permitir presenca de familiar',
]

// --- Ferramentas ---

export interface EcogLevel {
  level: number
  label: string
  description: string
}

export const ecogLevels: EcogLevel[] = [
  { level: 0, label: 'Assintomatico', description: 'Totalmente ativo, sem restricoes' },
  { level: 1, label: 'Sintomatico ambulatorial', description: 'Restricao a atividades fisicas extenuantes, capaz de trabalho leve' },
  { level: 2, label: '<50% acamado', description: 'Ambulatorial, capaz de autocuidado, incapaz de trabalho; <50% do tempo acordado no leito' },
  { level: 3, label: '>50% acamado', description: 'Capacidade limitada de autocuidado; >50% do tempo acordado no leito ou cadeira' },
  { level: 4, label: 'Acamado total', description: 'Completamente incapacitado; totalmente restrito ao leito ou cadeira' },
  { level: 5, label: 'Obito', description: '' },
]

export interface PpsLevel {
  pps: string
  deambulacao: string
  atividade: string
  autocuidado: string
  ingesta: string
  consciencia: string
}

export const ppsLevels: PpsLevel[] = [
  { pps: '100%', deambulacao: 'Completa', atividade: 'Normal', autocuidado: 'Completo', ingesta: 'Normal', consciencia: 'Completa' },
  { pps: '90%', deambulacao: 'Completa', atividade: 'Normal', autocuidado: 'Completo', ingesta: 'Normal', consciencia: 'Completa' },
  { pps: '80%', deambulacao: 'Completa', atividade: 'Com esforco', autocuidado: 'Completo', ingesta: 'Normal ou reduzida', consciencia: 'Completa' },
  { pps: '70%', deambulacao: 'Reduzida', atividade: 'Incapaz trabalho', autocuidado: 'Completo', ingesta: 'Normal ou reduzida', consciencia: 'Completa' },
  { pps: '60%', deambulacao: 'Reduzida', atividade: 'Incapaz hobbies', autocuidado: 'Assistencia ocasional', ingesta: 'Normal ou reduzida', consciencia: 'Confusao ocasional' },
  { pps: '50%', deambulacao: 'Sentado/deitado', atividade: 'Incapaz qualquer', autocuidado: 'Assistencia consideravel', ingesta: 'Normal ou reduzida', consciencia: 'Confusao ocasional' },
  { pps: '40%', deambulacao: 'Acamado', atividade: 'Incapaz', autocuidado: 'Assistencia principal', ingesta: 'Normal ou reduzida', consciencia: 'Confusao ou sonolencia' },
  { pps: '30%', deambulacao: 'Acamado', atividade: 'Incapaz', autocuidado: 'Dependente total', ingesta: 'Reduzida', consciencia: 'Confusao ou sonolencia' },
  { pps: '20%', deambulacao: 'Acamado', atividade: 'Incapaz', autocuidado: 'Dependente total', ingesta: 'Goles', consciencia: 'Confusao ou sonolencia' },
  { pps: '10%', deambulacao: 'Acamado', atividade: 'Incapaz', autocuidado: 'Dependente total', ingesta: 'Cuidados boca', consciencia: 'Sonolento ou coma' },
  { pps: '0%', deambulacao: 'Obito', atividade: '', autocuidado: '', ingesta: '', consciencia: '' },
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
  if (score <= 2) return { className: 'bg-emerald-500/15 text-emerald-400', text: 'Sobrevida mediana: ~155 dias -- Prognostico melhor' }
  if (score <= 4) return { className: 'bg-yellow-500/15 text-yellow-400', text: 'Sobrevida mediana: ~89 dias -- Prognostico intermediario' }
  if (score <= 6) return { className: 'bg-orange-500/15 text-orange-400', text: 'Sobrevida mediana: ~18-21 dias -- Prognostico reservado (sobrevida <6 semanas: sens 80%, esp 77%)' }
  return { className: 'bg-red-500/15 text-red-400', text: 'Sobrevida mediana: ~5 dias -- Prognostico muito reservado (sobrevida <3 semanas: sens 80%, esp 85%)' }
}

// --- Opioid Conversion ---

export const opioidOptions = [
  { value: 'morfina-vo', label: 'Morfina VO' },
  { value: 'morfina-ev', label: 'Morfina EV/SC' },
  { value: 'tramadol', label: 'Tramadol VO' },
  { value: 'codeina', label: 'Codeina VO' },
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
  { drug: 'Codeina VO', dose: '200mg', factor: '0,15' },
  { drug: 'Fentanil EV', dose: '100mcg/h', factor: '~300' },
  { drug: 'Metadona VO', dose: 'Variavel*', factor: '-' },
]

// --- Hipodermoclise ---

export const hipoIndicacoes: string[] = [
  'Demencia avancada com disfagia',
  'Nauseas e/ou vomitos por periodos prolongados',
  'Intolerancia gastrica',
  'Obstrucao intestinal',
  'Diarreia',
  'Confusao mental',
  'Dispneia intensa',
  'Fase final de vida',
  'Desidratacao que nao exija reposicao rapida de volume',
  'Antibioticoterapia em idosos (desde que o farmaco seja tolerado por via SC)',
  'Perfil de absorcao mais lento desejado (opioides para analgesia continua, furosemida para ICC)',
]

export const hipoContraindicacoes: string[] = [
  'Emergencias que necessitam de reposicao rapida de volume',
  'Desidratacao severa',
  'Disturbio de coagulacao',
  'Anasarca',
  'Solucoes hipertonicas (concentracoes max: SG 5%, NaCl 20% ate 20mL e KCl 19,1% ate 15mL por litro)',
]

export interface VolumeLocal {
  region: string
  volume: string
  fullWidth?: boolean
}

export const volumesPorLocal: VolumeLocal[] = [
  { region: 'Subclavicular', volume: 'ate 250 mL' },
  { region: 'Deltoidea', volume: 'ate 250 mL' },
  { region: 'Abdominal', volume: 'ate 1.000 mL' },
  { region: 'Interescapular', volume: 'ate 1.000 mL' },
  { region: 'Anterolateral da Coxa', volume: 'ate 1.500 mL (preferencial para volumes maiores)', fullWidth: true },
]

export interface DeviceInfo {
  device: string
  calibre: string
  permanence: string
}

export const dispositivos: DeviceInfo[] = [
  { device: 'Escalpe (butterfly)', calibre: '21G a 25G', permanence: '3-5 dias' },
  { device: 'Cateter nao agulhado (Vialon)', calibre: '20G a 24G', permanence: '7-11 dias' },
  { device: 'Cateter nao agulhado (poliuretano)', calibre: '20G a 24G', permanence: '7-11 dias' },
]

export const hipoProcedimento: TechniqueStep[] = [
  { title: 'Checar prescricao', description: 'Nome do paciente, medicamento/soro, dosagem, via SC, horario' },
  { title: 'Verificar compatibilidade', description: 'Conferir se a medicacao esta na lista de HDC e aprazamento compativel' },
  { title: 'Escolher local', description: 'Coxa, abdome, regiao escapular ou infraclavicular -- conforme volume necessario' },
  { title: 'Posicionar e antissepsia', description: 'Expor apenas a area de aplicacao. Swab de alcool ate o local estar limpo' },
  { title: 'Puncionar', description: 'Fazer prega cutanea, inserir cateter 22-24G em angulo de 30-45 graus abaixo da pele levantada' },
  { title: 'Confirmar posicionamento', description: 'Aspirar com seringa -- sem retorno de sangue. Se houver retorno venoso, retirar e reiniciar' },
  { title: 'Fixar', description: 'Pelicula transparente, identificar com data e nome de quem puncionou' },
  { title: 'Flush', description: 'SF 0,9% 2 a 5 mL' },
  { title: 'Conectar medicacao', description: 'Se infusao continua: BIC ate 62,5 mL/h (noturno em coxa: 70-100 mL/h)' },
  { title: 'Orientar paciente', description: 'Comunicar se sentir dor, queimacao ou ardencia durante a infusao' },
]

export interface HipoMed {
  name: string
  dose: string
  dilution: string
  obs?: string
}

export const hipoMedicacoes: HipoMed[] = [
  { name: 'Ampicilina', dose: '1 g/dia', dilution: 'SF 0,9% 50 mL', obs: 'Tempo de infusao: 20 minutos' },
  { name: 'Cefepime', dose: '1 g 12/12h ou 8/8h', dilution: 'Reconstituir 1g em 10 mL AD + SF 0,9% 100 mL', obs: 'Tempo de infusao: 40 min. Sem estudos para doses maiores' },
  { name: 'Ceftriaxona', dose: '1 g 12/12h', dilution: 'Reconstituir 1g em 10 mL AD + SF 0,9% 100 mL', obs: 'Tempo de infusao: 40 minutos' },
  { name: 'Dexametasona', dose: '2-16 mg a cada 24h', dilution: '1 amp (1 mL) em SF 0,9% 1 mL ou 1 amp (2,5 mL) em SF 0,9% 2,5 mL', obs: 'Aplicacao lenta, 1-2x/dia pela manha. Sitio exclusivo -- incompativel com outros medicamentos, risco de irritacao local' },
  { name: 'Dimenidrinato', dose: '50-100 mg em 24h', dilution: 'SF 0,9% 1 mL' },
  { name: 'Dipirona', dose: '1-2 g ate 6/6h', dilution: 'SF 0,9% 2 mL', obs: 'Aplicacao lenta em bolus' },
  { name: 'Ertapenem', dose: '1 g 24/24h', dilution: 'Reconstituir em 10 mL AD + 50 mL SF 0,9%', obs: 'Tempo de infusao: 30 min. Alternativa: bolus com 1g em 3,2 mL lidocaina 1% (sem epinefrina)' },
  { name: 'Escopolamina', dose: '20 mg 8/8h ate 60 mg 6/6h', dilution: 'SF 0,9% 1 mL (bolus)', obs: 'Infusao em bolus ou continua. Nao confundir com a apresentacao combinada com dipirona' },
  { name: 'Fentanil', dose: 'A criterio medico', dilution: '4 amp (50 mcg/mL) em SF 0,9% 210 mL', obs: 'Infusao continua a criterio medico' },
  { name: 'Furosemida', dose: '20-140 mg/24h', dilution: 'SF 0,9% 2 mL (bolus) ou volumes maiores (infusao continua)' },
  { name: 'Haloperidol', dose: '0,5-30 mg/24h', dilution: 'SF 0,9% 5 mL', obs: 'Idosos frageis: menor dose possivel. Se concentracao >= 1 mg/mL, usar AD como diluente (risco de precipitacao com SF)' },
  { name: 'Metadona', dose: '50% da dose oral habitual', dilution: 'SF 0,9% 10 mL', obs: 'Velocidade: 60 mL/h. Mudar local de puncao a cada 24h (alto potencial de irritacao cutanea)' },
  { name: 'Metoclopramida', dose: '30-120 mg/dia', dilution: 'SF 0,9% 2 mL (bolus)', obs: 'Pode causar irritacao local' },
  { name: 'Midazolam', dose: '1-5 mg (bolus) / 10-120 mg/dia (BIC)', dilution: 'SF 0,9% 5 mL (bolus); SF 0,9% 100 mL (BIC)', obs: 'Pode causar irritacao local' },
  { name: 'Morfina', dose: '2-3 mg 4/4h (bolus) ou 10-20 mg/24h (BIC)', dilution: 'Nao requer diluicao (bolus); SF 0,9% 100 mL (BIC)', obs: 'Sem dose maxima. Menor dose possivel em idosos frageis, DRC ou hepatopatas. Intervalo pode ser aumentado em insuficiencia renal/hepatica' },
  { name: 'Octreotide', dose: '300-900 mcg/24h', dilution: 'SF 0,9% 5 mL (bolus); SF 0,9% 100 mL (BIC)', obs: 'Armazenar refrigerado -- atingir temperatura ambiente antes da administracao. Sitio exclusivo' },
  { name: 'Omeprazol', dose: '40 mg 24/24h', dilution: 'SF 0,9% 100 mL', obs: 'Tempo de infusao: 4 horas. Dose unica diaria. Nao mesclar com outros medicamentos' },
  { name: 'Ondansetrona', dose: '8-32 mg/24h', dilution: 'SF 0,9% 30 mL', obs: 'Tempo de infusao: 30 min (risco de prolongamento do intervalo QT)' },
  { name: 'Tramadol', dose: '100-600 mg/24h', dilution: 'SF 0,9% 20 mL (bolus); SF 0,9% 100 mL (BIC)' },
]

export interface HipoSolucao {
  solucao: string
  doseMax: string
  orientacoes: string
}

export const hipoSolucoes: HipoSolucao[] = [
  { solucao: 'SF 0,9%', doseMax: '1.500 mL/24h por sitio', orientacoes: 'SF 0,45% segue as mesmas recomendacoes. Max 62,5 mL/h. Coxa preferencial para volumes maiores' },
  { solucao: 'Soro glicofisiologico (2/3 SG 5% + 1/3 SF 0,9%)', doseMax: '1.500 mL/24h por sitio', orientacoes: 'Max 62,5 mL/h. Coxa preferencial para volumes maiores' },
  { solucao: 'SG 5%', doseMax: '1.000 mL/24h por sitio', orientacoes: 'Max 62,5 mL/h. Coxa preferencial para volumes maiores' },
]

// --- Mitos e Verdades ---

export interface MythData {
  id: number
  title: string
  isMito: boolean
  statement: string
  explanation: string
  category: 'conceito' | 'medicacoes' | 'comunicacao' | 'prognostico'
}

export const mythsData: MythData[] = [
  { id: 1, category: 'conceito', title: '"Nao ha o que fazer"', isMito: true, statement: '"Cuidados paliativos significa que nao ha mais nada a fazer."', explanation: 'Cuidados paliativos sao uma abordagem ATIVA que visa melhorar a qualidade de vida. Ha MUITO a fazer: controle impecavel de sintomas, suporte emocional, planejamento de cuidados, apoio a familia, dignidade no processo de morrer.' },
  { id: 2, category: 'conceito', title: '"Tudo ou nada"', isMito: true, statement: '"Ou fazemos tudo para curar, ou nao fazemos nada."', explanation: 'Existe um amplo espectro entre "investir em tudo" e "nao fazer nada". Cuidados paliativos podem ser integrados com tratamentos curativos desde o diagnostico. O objetivo e proporcionalidade e adequacao ao momento do paciente.' },
  { id: 3, category: 'conceito', title: '"So para cancer"', isMito: true, statement: '"Cuidados paliativos sao apenas para pacientes oncologicos."', explanation: 'Cuidados paliativos beneficiam qualquer doenca grave e ameacadora a vida: ICC, DPOC, DRC, demencia, doencas neurologicas, fragilidade do idoso. Todas essas condicoes cursam com sintomas que precisam de manejo adequado.' },
  { id: 4, category: 'conceito', title: '"So no fim"', isMito: true, statement: '"Cuidados paliativos devem ser iniciados apenas nos ultimos dias de vida."', explanation: 'Quanto mais precoce a integracao dos cuidados paliativos, melhores os desfechos. Estudos mostram que pacientes com cancer de pulmao que receberam CP precoces viveram MAIS e com melhor qualidade de vida.' },
  { id: 5, category: 'conceito', title: '"Nao no DE"', isMito: true, statement: '"Cuidados paliativos nao sao papel do emergencista."', explanation: 'O DE e frequentemente o primeiro ponto de contato com pacientes em crise de doenca avancada. Emergencistas estao em posicao privilegiada para identificar, iniciar conversas e aliviar sofrimento agudo.' },
  { id: 6, category: 'conceito', title: '"E desistir"', isMito: true, statement: '"Oferecer cuidados paliativos e o mesmo que desistir do paciente."', explanation: 'Cuidados paliativos sao uma mudanca de FOCO, nao de intensidade. O objetivo passa a ser qualidade de vida e conforto. E uma das formas mais intensas de cuidado que podemos oferecer.' },
  { id: 7, category: 'medicacoes', title: '"Morfina vicia"', isMito: true, statement: '"Morfina causa dependencia em pacientes com dor."', explanation: 'Dependencia fisica (tolerancia) e diferente de adiccao (transtorno de uso). Pacientes com dor que recebem opioides raramente desenvolvem adiccao. O subtratamento da dor e muito mais comum e prejudicial.' },
  { id: 8, category: 'medicacoes', title: '"Morfina mata"', isMito: true, statement: '"Morfina acelera a morte do paciente."', explanation: 'Quando titulada adequadamente para controle de sintomas, morfina NAO encurta a vida. Estudos mostram que pacientes com bom controle de dor e dispneia frequentemente vivem mais. O duplo efeito e eticamente aceito.' },
  { id: 9, category: 'medicacoes', title: '"Sedacao e eutanasia"', isMito: true, statement: '"Sedacao paliativa e uma forma disfarcada de eutanasia."', explanation: 'Sedacao paliativa visa controlar sintomas refratarios, nao antecipar a morte. A intencao (alivio de sofrimento) e o metodo (titulacao para conforto) sao completamente diferentes da eutanasia.' },
  { id: 10, category: 'medicacoes', title: '"Dose maxima"', isMito: true, statement: '"Opioides tem dose maxima que nao pode ser ultrapassada."', explanation: 'Opioides NAO tem dose teto para analgesia. A dose correta e aquela que alivia a dor com efeitos adversos toleraveis. Pacientes em uso cronico desenvolvem tolerancia e podem precisar de doses muito altas.' },
  { id: 11, category: 'medicacoes', title: '"Guardar para depois"', isMito: true, statement: '"Melhor guardar os opioides fortes para quando a dor piorar."', explanation: 'Dor nao controlada causa sofrimento desnecessario e pode levar a sensibilizacao central, tornando o controle futuro mais dificil. Usar a medicacao adequada ao nivel de dor AGORA e o correto.' },
  { id: 12, category: 'medicacoes', title: '"So se pedir"', isMito: true, statement: '"So devo dar analgesico se o paciente pedir."', explanation: 'Muitos pacientes, especialmente idosos e com deficit cognitivo, nao pedem analgesia mesmo com dor intensa. A avaliacao proativa e sistematica da dor e responsabilidade da equipe.' },
  { id: 13, category: 'comunicacao', title: '"Tira esperanca"', isMito: true, statement: '"Falar sobre cuidados paliativos tira a esperanca do paciente."', explanation: 'Honestidade compassiva nao elimina esperanca -- redireciona. Pacientes podem manter esperanca de conforto, tempo de qualidade, resolucao de pendencias. Falsas esperancas causam mais dano.' },
  { id: 14, category: 'comunicacao', title: '"Familia decide"', isMito: true, statement: '"A familia e quem deve decidir sobre os cuidados do paciente."', explanation: 'O paciente capaz e o protagonista de suas decisoes. A familia representa os desejos do paciente quando ele nao pode se expressar, mas deve basear-se nos valores DELE, nao nos proprios.' },
  { id: 15, category: 'comunicacao', title: '"Nao falar em morte"', isMito: true, statement: '"Nao devemos mencionar a possibilidade de morte para o paciente."', explanation: 'Maioria dos pacientes quer informacao honesta sobre seu prognostico. Evitar o tema impede planejamento, despedidas e fechamento de ciclos. A comunicacao deve ser gradual, respeitosa e individualizada.' },
  { id: 16, category: 'comunicacao', title: '"Paciente nao quer saber"', isMito: true, statement: '"A maioria dos pacientes nao quer saber sobre seu prognostico."', explanation: 'Estudos mostram que 70-90% dos pacientes desejam informacao sobre seu prognostico. A percepcao de que "nao querem saber" frequentemente e projecao da nossa propria dificuldade em comunicar.' },
  { id: 17, category: 'comunicacao', title: '"Conversa leva tempo"', isMito: true, statement: '"Nao tenho tempo no DE para ter conversas sobre fim de vida."', explanation: 'Conversas efetivas sobre metas de cuidado podem ser breves (5-10 minutos). Perguntas-chave bem colocadas economizam tempo e evitam procedimentos desnecessarios. E questao de tecnica, nao de tempo.' },
  { id: 18, category: 'comunicacao', title: '"Depois da UTI"', isMito: true, statement: '"Cuidados paliativos devem comecar apos alta da UTI."', explanation: 'A UTI e um dos locais onde mais se precisa de cuidados paliativos. Pacientes gravemente enfermos beneficiam-se de controle de sintomas, comunicacao estruturada e planejamento de cuidados durante a internacao.' },
  { id: 19, category: 'prognostico', title: '"Paciente jovem"', isMito: true, statement: '"Paciente jovem sempre deve receber medidas invasivas."', explanation: 'Idade nao e criterio para proporcionalidade de tratamento. Pacientes jovens com doencas terminais tambem tem direito a cuidados paliativos e a recusar medidas invasivas que nao mudam prognostico.' },
  { id: 20, category: 'prognostico', title: '"Ainda tem opcao"', isMito: true, statement: '"Se ainda existe alguma opcao de tratamento, nao e hora de paliativos."', explanation: 'Cuidados paliativos e tratamento curativo nao sao mutuamente exclusivos. A integracao precoce melhora qualidade de vida e, em alguns estudos, ate sobrevida. Nao precisa esperar "nao ter mais nada".' },
  { id: 21, category: 'prognostico', title: '"Prognostico exato"', isMito: true, statement: '"Medicos conseguem prever com precisao quanto tempo o paciente tem."', explanation: 'Prognostico e probabilistico, nao deterministico. Medicos tendem a superestimar sobrevida. Ferramentas como PPI ajudam, mas devem ser comunicadas como estimativas, nao certezas.' },
  { id: 22, category: 'prognostico', title: '"Milagre acontece"', isMito: false, statement: '"Casos excepcionais de recuperacao inesperada existem."', explanation: 'Verdade! Casos excepcionais ocorrem, mas sao estatisticamente raros. Basear decisoes em excecoes extremas pode prolongar sofrimento desnecessariamente para a grande maioria. Equilibrio e fundamental.' },
  { id: 23, category: 'prognostico', title: '"So oncologia decide"', isMito: true, statement: '"Apenas o oncologista pode indicar cuidados paliativos."', explanation: 'Qualquer medico pode identificar necessidade de cuidados paliativos e iniciar abordagem. O emergencista frequentemente e o primeiro a reconhecer e pode coordenar com equipe especializada posteriormente.' },
  { id: 24, category: 'prognostico', title: '"Se entrar no DE, intubo"', isMito: true, statement: '"Se o paciente veio ao DE, e porque quer ser intubado e reanimado."', explanation: 'Pacientes vem ao DE por diversos motivos: dor, dispneia, medo, orientacao inadequada. Vir ao DE nao significa automaticamente querer medidas invasivas. Sempre verificar desejos e contexto.' },
]

// --- Referencias ---

export interface ReferenceCategory {
  title: string
  color: string
  items: string[]
}

export const referencias: ReferenceCategory[] = [
  {
    title: 'Ferramentas e Escalas',
    color: '#10B981',
    items: [
      'SPICT-BR. NHS Lothian / University of Edinburgh, 2019.',
      'Morita T, et al. The Palliative Prognostic Index. Support Care Cancer. 1999;7:128-133.',
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
      'Protocolo de Sedacao Paliativa -- ANCP, 2023.',
      'Cuidados Paliativos na Emergencia -- USP, 2021.',
    ],
  },
  {
    title: 'Comunicacao',
    color: '#A78BFA',
    items: [
      'VitalTalk. Communication Skills Training for Clinicians.',
      'Ribeiro VZ, et al. SAVED Framework. J Bras Med Emerg. 2024.',
      'Back AL, et al. Approaching difficult communication tasks in oncology. CA Cancer J Clin. 2005.',
    ],
  },
  {
    title: 'Etica e Legislacao',
    color: '#F97316',
    items: [
      'Resolucao CFM n. 1.805/2006 -- Ortotanasia.',
      'Resolucao CFM n. 1.995/2012 -- Diretivas Antecipadas de Vontade.',
      'Resolucao CFM n. 2.217/2018 -- Codigo de Etica Medica.',
    ],
  },
]

// --- Compatibility Table ---

export const compatHeaders = ['CEF', 'CRO', 'DIP', 'ESC', 'FUR', 'HAL', 'LEV', 'MTC', 'MDZ', 'MOR', 'OCT', 'OND', 'RAN', 'TRA', 'DEX']

export const compatRows: { drug: string; compat: ('C' | 'I')[] }[] = [
  { drug: 'Cefepime',        compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Ceftriaxona',     compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Dipirona',        compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
  { drug: 'Escopolamina',    compat: ['C','C','C','C','C','C','C','C','C','I','C','I','C','I'] },
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
