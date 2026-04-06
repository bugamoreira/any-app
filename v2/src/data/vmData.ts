// ==========================================
// VM Guide — Dados clinicos e definicoes
// Fonte: VM Guide ANY App v1.1.1
// ==========================================

// ----- Tipos -----

export interface VmCalculator {
  id: string
  name: string
  sectionId: string
  sectionName: string
}

export interface HacorVariable {
  key: string
  label: string
  options: { label: string; value: number }[]
}

export interface SdraRow {
  severity: string
  pf: string
  sf: string
  colorClass: 'text-success' | 'text-warning' | 'text-danger'
}

export interface HacorEntry {
  time: string
  score: number
  label: string
}

// ----- Indice de calculadoras (para busca) -----

export const VM_CALCULATORS: VmCalculator[] = [
  { id: 'pesoideal', name: 'Peso ideal', sectionId: 'peso', sectionName: 'Peso ideal e volume corrente' },
  { id: 'rva', name: 'Resistencia de vias aereas (Rva)', sectionId: 'mecanica', sectionName: 'Mecanica respiratoria' },
  { id: 'cst', name: 'Complacencia estatica (Cst)', sectionId: 'mecanica', sectionName: 'Mecanica respiratoria' },
  { id: 'dp', name: 'Driving pressure (deltaP)', sectionId: 'mecanica', sectionName: 'Mecanica respiratoria' },
  { id: 'pf', name: 'Relacao P/F (PaO2/FiO2)', sectionId: 'troca', sectionName: 'Troca gasosa' },
  { id: 'sf', name: 'Relacao S/F (SpO2/FiO2)', sectionId: 'troca', sectionName: 'Troca gasosa' },
  { id: 'ajustefio2', name: 'Ajuste de FiO2', sectionId: 'troca', sectionName: 'Troca gasosa' },
  { id: 'ajustefreq', name: 'Ajuste de frequencia respiratoria', sectionId: 'troca', sectionName: 'Troca gasosa' },
  { id: 'tobin', name: 'Indice de Tobin (IRRS)', sectionId: 'desmame', sectionName: 'Desmame' },
  { id: 'rox', name: 'Indice ROX', sectionId: 'desmame', sectionName: 'Desmame' },
  { id: 'tau', name: 'Constante de tempo (tau)', sectionId: 'outros', sectionName: 'Outros parametros' },
  { id: 'pmus', name: 'Pressao muscular (Pmus)', sectionId: 'outros', sectionName: 'Outros parametros' },
  { id: 'mp', name: 'Mechanical power', sectionId: 'outros', sectionName: 'Outros parametros' },
  { id: 'ia', name: 'Indice de assincronia', sectionId: 'outros', sectionName: 'Outros parametros' },
  { id: 'hacor', name: 'HACOR score (falha de VNI)', sectionId: 'hacor', sectionName: 'HACOR score' },
]

// ----- Descricoes clinicas -----

export const VM_DESCRIPTIONS = {
  pesoIdeal: 'O peso ideal (PBW) e baseado na altura e sexo do paciente, nao no peso real. E usado para calcular o volume corrente em ventilacao protetora, evitando volutrauma por volumes excessivos em relacao ao tamanho pulmonar.',
  rva: 'A resistencia de vias aereas reflete a oposicao ao fluxo de ar no sistema respiratorio. Valores elevados indicam obstrucao (broncoespasmo, secrecoes, tubo pequeno ou obstruido).',
  cst: 'A complacencia estatica mede a distensibilidade do sistema respiratorio (pulmao + caixa toracica). Valores baixos indicam pulmao "duro" (SDRA, fibrose, edema). Valores altos podem indicar enfisema.',
  dp: 'A driving pressure (pressao de distensao) e a pressao necessaria para insuflar o pulmao acima da PEEP. Valores <=15 cmH2O estao associados a menor mortalidade em SDRA. E considerado o melhor preditor de desfecho em ventilacao mecanica.',
  pf: 'A relacao P/F e o principal indice de oxigenacao, calculado pela PaO2 (gasometria) dividida pela FiO2 (fracao de oxigenio). Valores normais sao >400. Valores <300 indicam comprometimento da troca gasosa e classificam a gravidade da SDRA.',
  sf: 'A relacao S/F e um substituto nao invasivo da P/F, usando a saturacao periferica (SpO2) em vez da PaO2. So e valida com SpO2 <=97% (regiao ingreme da curva de dissociacao). Util quando nao ha gasometria disponivel.',
  ajusteFio2: 'Estima a nova FiO2 necessaria para atingir uma PaO2 alvo, assumindo que a relacao P/F permanece constante. Util para ajustar oxigenio com base na gasometria.',
  ajusteFreq: 'Estima a nova frequencia respiratoria necessaria para atingir uma PaCO2 alvo, assumindo volume corrente constante. A ventilacao alveolar e proporcional a frequencia x volume corrente.',
  tobin: 'O indice de Tobin (f/VT) avalia a tolerancia ao desmame. Valores <105 sugerem boa reserva ventilatoria e probabilidade de extubacao bem-sucedida. Valores >105 indicam respiracao rapida e superficial, sugerindo maior risco de falha.',
  rox: 'O indice ROX prediz falha de cateter nasal de alto fluxo (CNAF). Combina a relacao S/F com a frequencia respiratoria. Valores >=4.88 em 2-12h indicam menor risco de intubacao. Valores <3.85 sugerem alto risco de falha.',
  tau: 'A constante de tempo (tau) representa o tempo necessario para esvaziar 63% do volume pulmonar. E o produto da resistencia pela complacencia. O tempo expiratorio deve ser 4-5 tau para evitar auto-PEEP (air trapping).',
  pmus: 'A Pmus estimada reflete o esforco muscular do paciente durante ventilacao assistida. E derivada da manobra de oclusao (deltaPocc). Valores entre 5-10 cmH2O indicam esforco adequado. Valores baixos sugerem hipoventilacao; altos indicam excesso de esforco.',
  mp: 'O mechanical power e a energia total transferida ao sistema respiratorio por minuto, integrando VC, driving pressure e frequencia. Valores >17 J/min estao associados a maior mortalidade. E um marcador de intensidade da ventilacao e potencial lesao pulmonar.',
  ia: 'O indice de assincronia quantifica a proporcao de ciclos com assincronia paciente-ventilador (duplo disparo, auto-trigger, etc). Valores >10% estao associados a maior tempo de VM e pior prognostico.',
  hacor: 'O HACOR score prediz falha de ventilacao nao invasiva (VNI). Combina frequencia cardiaca, acidose, consciencia, oxigenacao e frequencia respiratoria. Score >= 5 em 1-2h de VNI indica alto risco de falha.',
  sdra: 'A definicao Global 2024 expandiu os criterios de Berlim, incluindo S/F para locais sem gasometria, CNAF como suporte valido, e ultrassonografia para imagem.',
} as const

// ----- SDRA (Global 2024) -----

export const SDRA_TABLE: SdraRow[] = [
  { severity: 'Leve', pf: '200-300', sf: '235-315', colorClass: 'text-success' },
  { severity: 'Moderada', pf: '100-199', sf: '148-234', colorClass: 'text-warning' },
  { severity: 'Grave', pf: '<100', sf: '<148', colorClass: 'text-danger' },
]

export const SDRA_NOVIDADES = [
  'Suporte: VM invasiva, VNI ou CNAF >=30 L/min',
  'Imagem: Rx, TC ou ultrassonografia',
  'S/F validado como alternativa a P/F',
  'Opacidades bilaterais nao explicadas por outras causas',
]

// ----- HACOR Score (Duan et al. 2017) -----

export const HACOR_VARIABLES: HacorVariable[] = [
  {
    key: 'fc',
    label: 'FC >= 120 bpm',
    options: [
      { label: 'Nao: 0', value: 0 },
      { label: 'Sim: 1', value: 1 },
    ],
  },
  {
    key: 'ph',
    label: 'pH',
    options: [
      { label: '>= 7,35: 0', value: 0 },
      { label: '7,30-7,34: 2', value: 2 },
      { label: '7,25-7,29: 3', value: 3 },
      { label: '< 7,25: 4', value: 4 },
    ],
  },
  {
    key: 'gcs',
    label: 'Glasgow (GCS)',
    options: [
      { label: '15: 0', value: 0 },
      { label: '13-14: 2', value: 2 },
      { label: '11-12: 5', value: 5 },
      { label: '<= 10: 15', value: 15 },
    ],
  },
  {
    key: 'pf',
    label: 'PaO2/FiO2',
    options: [
      { label: '> 200: 0', value: 0 },
      { label: '175-200: 2', value: 2 },
      { label: '150-174: 3', value: 3 },
      { label: '125-149: 4', value: 4 },
      { label: '< 125: 5', value: 5 },
    ],
  },
  {
    key: 'fr',
    label: 'FR >= 30 irpm',
    options: [
      { label: 'Nao: 0', value: 0 },
      { label: 'Sim: 1', value: 1 },
    ],
  },
]

export const HACOR_REF = 'Duan J, et al. An updated HACOR score for predicting the failure of noninvasive ventilation. Crit Care. 2017;21(1):300.'

// ----- Referencias -----

export const VM_REFERENCES = [
  'Matthay MA, et al. A New Global Definition of ARDS. Am J Respir Crit Care Med. 2024;209(1):37-47.',
  'Amato MB, et al. Driving pressure and survival in ARDS. N Engl J Med. 2015;372(8):747-55.',
  'Yang KL, Tobin MJ. A prospective study of indexes predicting the outcome of trials of weaning from mechanical ventilation. N Engl J Med. 1991;324(21):1445-50.',
  'Roca O, et al. An index combining respiratory rate and oxygenation to predict outcome of nasal high-flow therapy. Am J Respir Crit Care Med. 2019;199(11):1368-76.',
  'Gattinoni L, et al. Ventilator-related causes of lung injury: the mechanical power. Intensive Care Med. 2016;42(10):1567-75.',
  'Bertoni M, et al. A novel non-invasive method to detect excessively high respiratory effort and dynamic transpulmonary driving pressure during mechanical ventilation. Crit Care. 2019;23(1):346.',
  'Thille AW, et al. Patient-ventilator asynchrony during assisted mechanical ventilation. Intensive Care Med. 2006;32(10):1515-22.',
  'Duan J, et al. An updated HACOR score for predicting the failure of noninvasive ventilation: a multicenter prospective observational study. Crit Care. 2017;21(1):300.',
]

// ----- FAB items (secoes para navegacao) -----

export const VM_FAB_SECTIONS = [
  { id: 'peso', label: 'Peso/Ajuste' },
  { id: 'mecanica', label: 'Mecanica' },
  { id: 'troca', label: 'Troca gasosa' },
  { id: 'desmame', label: 'Desmame' },
  { id: 'hacor', label: 'HACOR' },
] as const

// ----- Helpers de calculo do VM Guide -----

/** Peso ideal (PBW) — ARDSNet formula
 * Masculino: 50 + 0.91 * (altura_cm - 152.4)
 * Feminino: 45.5 + 0.91 * (altura_cm - 152.4)
 */
export function calcPesoIdeal(sexo: 'M' | 'F', alturaCm: number): number {
  const base = sexo === 'M' ? 50 : 45.5
  return Math.max(0, base + 0.91 * (alturaCm - 152.4))
}

/** Resistencia de vias aereas (Rva)
 * Rva = (Ppico - Ppausa) / (Fluxo em L/s)
 * Normal: <10 cmH2O/L/s
 */
export function calcRva(ppico: number, ppausa: number, fluxoLmin: number): number {
  const fluxoLs = fluxoLmin / 60
  return (ppico - ppausa) / fluxoLs
}

export function interpretRva(rva: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (rva < 10) return { status: 'success', text: 'Normal' }
  if (rva <= 20) return { status: 'warning', text: 'Elevada -- considere broncoespasmo, secrecoes ou tubo' }
  return { status: 'danger', text: 'Muito elevada -- investigar obstrucao' }
}

/** Complacencia estatica (Cst)
 * Cst = VC / (Pplat - PEEP)
 * Normal: 50-80 mL/cmH2O
 */
export function calcCst(vcMl: number, pplat: number, peep: number): number {
  return vcMl / (pplat - peep)
}

export function interpretCst(cst: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (cst >= 50) return { status: 'success', text: 'Normal (50-80 mL/cmH2O)' }
  if (cst >= 30) return { status: 'warning', text: 'Reduzida -- possivel SDRA, edema, atelectasia' }
  return { status: 'danger', text: 'Muito reduzida -- pulmao restritivo grave' }
}

/** Driving pressure (deltaP)
 * deltaP = Pplat - PEEP
 * Meta <=15 em SDRA
 */
export function calcDP(pplat: number, peep: number): number {
  return pplat - peep
}

export function interpretDP(dp: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (dp < 10) return { status: 'success', text: 'Excelente -- baixo risco de VILI' }
  if (dp <= 15) return { status: 'warning', text: 'Aceitavel -- meta <=15 cmH2O em SDRA' }
  return { status: 'danger', text: 'Elevada -- considere reduzir VC ou otimizar PEEP' }
}

/** Relacao P/F */
export function calcPF(pao2: number, fio2: number): number {
  return pao2 / fio2
}

export function interpretPF(pf: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (pf > 300) return { status: 'success', text: 'Normal -- sem criterio para SDRA' }
  if (pf > 200) return { status: 'warning', text: 'SDRA leve (P/F 200-300)' }
  if (pf > 100) return { status: 'warning', text: 'SDRA moderada (P/F 100-199)' }
  return { status: 'danger', text: 'SDRA grave (P/F <100)' }
}

/** Relacao S/F */
export function calcSF(spo2: number, fio2: number): number {
  return spo2 / fio2
}

export function interpretSF(sf: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (sf > 315) return { status: 'success', text: 'Normal -- sem criterio para SDRA' }
  if (sf >= 235) return { status: 'warning', text: 'SDRA leve (S/F 235-315)' }
  if (sf >= 148) return { status: 'warning', text: 'SDRA moderada (S/F 148-234)' }
  return { status: 'danger', text: 'SDRA grave (S/F <148)' }
}

/** Ajuste de FiO2 */
export function calcNewFiO2(pao2Atual: number, fio2Atual: number, pao2Alvo: number): number {
  return Math.max(0.21, Math.min(1.0, pao2Alvo * (fio2Atual / pao2Atual)))
}

/** Ajuste de frequencia respiratoria */
export function calcNewFreq(freqAtual: number, paco2Atual: number, paco2Alvo: number): number {
  return freqAtual * (paco2Atual / paco2Alvo)
}

/** Indice de Tobin (IRRS = f/VT) */
export function calcTobin(freq: number, veLmin: number): { tobin: number; vcMl: number } {
  const vcL = veLmin / freq
  return { tobin: freq / vcL, vcMl: vcL * 1000 }
}

export function interpretTobin(tobin: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (tobin < 80) return { status: 'success', text: 'Favoravel ao desmame' }
  if (tobin <= 105) return { status: 'warning', text: 'Zona cinzenta -- avaliar outros fatores' }
  return { status: 'danger', text: 'Desfavoravel -- risco de falha de extubacao' }
}

/** Indice ROX */
export function calcROX(spo2: number, fio2: number, freq: number): number {
  const fio2Pct = fio2 <= 1 ? fio2 * 100 : fio2
  return (spo2 / fio2Pct) / freq
}

export function interpretROX(rox: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (rox >= 4.88) return { status: 'success', text: 'Baixo risco de falha de CNAF' }
  if (rox >= 3.85) return { status: 'warning', text: 'Risco intermediario -- reavaliar em 2h' }
  return { status: 'danger', text: 'Alto risco de falha -- considere intubacao' }
}

/** Constante de tempo (tau) */
export function calcTau(rva: number, cstMlCmH2O: number): number {
  const cstL = cstMlCmH2O / 1000
  return rva * cstL
}

/** Pressao muscular estimada (Pmus) */
export function calcPmus(deltaPocc: number): number {
  return -0.75 * deltaPocc
}

export function interpretPmus(pmus: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (pmus >= 5 && pmus <= 10) return { status: 'success', text: 'Esforco adequado (5-10 cmH2O)' }
  if (pmus < 5) return { status: 'warning', text: 'Esforco baixo -- possivel oversupport' }
  if (pmus <= 13) return { status: 'warning', text: 'Esforco moderadamente alto' }
  return { status: 'danger', text: 'Esforco excessivo -- risco de P-SILI' }
}

/** Mechanical power (formula simplificada)
 * MP = 0.098 * VC(L) * deltaP * FR
 */
export function calcMP(vcMl: number, dp: number, freq: number): number {
  return 0.098 * (vcMl / 1000) * dp * freq
}

export function interpretMP(mp: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (mp < 12) return { status: 'success', text: 'Baixa intensidade -- menor risco de VILI' }
  if (mp <= 17) return { status: 'warning', text: 'Moderada -- monitorar' }
  return { status: 'danger', text: 'Elevada -- maior risco de mortalidade' }
}

/** Indice de assincronia */
export function calcIA(eventos: number, freqTotal: number): number {
  return (eventos / freqTotal) * 100
}

export function interpretIA(ia: number): { status: 'success' | 'warning' | 'danger'; text: string } {
  if (ia < 5) return { status: 'success', text: 'Baixo -- boa sincronia' }
  if (ia <= 10) return { status: 'warning', text: 'Moderado -- otimizar ajustes' }
  return { status: 'danger', text: 'Elevado (>10%) -- associado a pior prognostico' }
}

/** HACOR score total */
export function hacorTotal(scores: Record<string, number | null>): number | null {
  let total = 0
  for (const k of Object.keys(scores)) {
    if (scores[k] === null) return null
    total += scores[k]!
  }
  return total
}

export function interpretHACOR(score: number): { risk: 'low' | 'high'; text: string } {
  if (score < 5) return { risk: 'low', text: 'Baixo risco de falha -- VNI com reavaliacao padrao' }
  return { risk: 'high', text: 'Alto risco de falha -- considere intubacao orotraqueal' }
}
