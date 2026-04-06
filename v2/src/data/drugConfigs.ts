import type { DrugConfig, DrugCategory } from '../types/clinical'

// ==========================================
// CONFIGURACAO DE TODAS AS DROGAS
// Fonte: Infusion Guide ANY App v2.3.2
// Validado clinicamente (auditoria Opus 04/2026)
// ==========================================

export const drugConfigs: DrugConfig[] = [
  // === VASOPRESSORES ===
  {
    id: 'noradrenalina', name: 'Noradrenalina', aliases: ['norepinefrina', 'nora', 'ne', 'levophed'],
    category: 'vasopressors',
    presentation: '16 mg (4 amp 4mL — 4mg/mL) + SF 0,9% 234 mL = 250 mL',
    concentration: 64, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 0.01, doseMax: 3.0, doseStep: 0.01, doseDefault: 0.1,
    cautionThreshold: 1, criticalThreshold: 2,
    factor: 60, usesWeight: true,
    dilutions: [
      { label: 'Padrao (64 mcg/mL)', concentration: 64, isDefault: true },
      { label: 'Dobrada (128 mcg/mL)', concentration: 128 },
    ]
  },
  {
    id: 'adrenalina', name: 'Adrenalina', aliases: ['epinefrina', 'epi'],
    category: 'vasopressors',
    presentation: '16 mg (16 amp 1mL — 1mg/mL) + SF 0,9% 234 mL = 250 mL',
    concentration: 64, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 0.05, doseMax: 2.0, doseStep: 0.01, doseDefault: 0.1,
    cautionThreshold: 0.5, criticalThreshold: 1,
    factor: 60, usesWeight: true,
  },
  {
    id: 'dobutamina', name: 'Dobutamina', aliases: ['dobuta', 'dobutrex'],
    category: 'vasopressors',
    presentation: '250 mg (1 amp 20mL — 12,5mg/mL) + SF 0,9% 230 mL = 250 mL',
    concentration: 1000, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 2, doseMax: 40, doseStep: 1, doseDefault: 5,
    cautionThreshold: 20, criticalThreshold: 30,
    factor: 60, usesWeight: true,
    dilutions: [
      { label: 'Padrao (1000 mcg/mL)', concentration: 1000, isDefault: true },
      { label: 'Dobrada (2000 mcg/mL)', concentration: 2000 },
      { label: 'Quadrupla (4000 mcg/mL)', concentration: 4000 },
    ]
  },
  {
    id: 'dopamina', name: 'Dopamina', aliases: ['dopa'],
    category: 'vasopressors',
    presentation: '250 mg (1 amp 50mL — 5mg/mL) + SF 0,9% 200 mL = 250 mL',
    concentration: 1000, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 2, doseMax: 50, doseStep: 1, doseDefault: 5,
    cautionThreshold: 20, criticalThreshold: 40,
    factor: 60, usesWeight: true,
  },
  {
    id: 'vasopressina', name: 'Vasopressina', aliases: ['vaso', 'avp', 'pitressin'],
    category: 'vasopressors',
    presentation: '40 UI (2 amp 1mL — 20UI/mL) + SF 0,9% 98 mL = 100 mL',
    concentration: 0.4, concentrationUnit: 'UI/mL',
    doseUnit: 'UI/min', resultUnit: 'mL/h',
    doseMin: 0.01, doseMax: 0.04, doseStep: 0.005, doseDefault: 0.03,
    factor: 60, usesWeight: false,
  },
  {
    id: 'milrinona', name: 'Milrinona', aliases: ['milri', 'primacor'],
    category: 'vasopressors',
    presentation: '20 mg (1 amp 20mL — 1mg/mL) + SF 0,9% 80 mL = 100 mL',
    concentration: 200, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 0.375, doseMax: 0.75, doseStep: 0.025, doseDefault: 0.5,
    factor: 60, usesWeight: true,
  },

  // === SEDACAO / ANALGESIA ===
  {
    id: 'midazolam', name: 'Midazolam', aliases: ['mida', 'dormonid', 'dormicum'],
    category: 'sedation',
    presentation: '250 mg (50 amp 5mL — 5mg/mL) + SF 0,9% 200 mL = 250 mL',
    concentration: 1000, concentrationUnit: 'mcg/mL',
    doseUnit: 'mg/kg/h', resultUnit: 'mL/h',
    doseMin: 0.04, doseMax: 0.2, doseStep: 0.01, doseDefault: 0.1,
    factor: 1, usesWeight: true,
  },
  {
    id: 'fentanil', name: 'Fentanil', aliases: ['fenta', 'fentanyl'],
    category: 'sedation',
    presentation: 'Puro — 50 mcg/mL (ampola 10 mL)',
    concentration: 50, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/h', resultUnit: 'mL/h',
    doseMin: 0.3, doseMax: 2.0, doseStep: 0.1, doseDefault: 1.0,
    factor: 1, usesWeight: true,
  },
  {
    id: 'propofol', name: 'Propofol', aliases: ['diprivan'],
    category: 'sedation',
    presentation: 'Puro — 10 mg/mL (NAO diluir)',
    concentration: 10, concentrationUnit: 'mg/mL',
    doseUnit: 'mg/kg/h', resultUnit: 'mL/h',
    doseMin: 1, doseMax: 4, doseStep: 0.1, doseDefault: 2,
    factor: 1, usesWeight: true,
  },
  {
    id: 'dexmedetomidina', name: 'Dexmedetomidina', aliases: ['dex', 'precedex'],
    category: 'sedation',
    presentation: '400 mcg (2 amp 2mL — 100mcg/mL) + SF 0,9% 96 mL = 100 mL',
    concentration: 4, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/h', resultUnit: 'mL/h',
    doseMin: 0.2, doseMax: 1.4, doseStep: 0.1, doseDefault: 0.7,
    cautionThreshold: 0.7, criticalThreshold: 1.4,
    factor: 1, usesWeight: true,
  },
  {
    id: 'cetamina', name: 'Cetamina', aliases: ['ceta', 'ketamina', 'ketalar'],
    category: 'sedation',
    presentation: '500 mg (1 amp 10mL — 50mg/mL) + SF 0,9% 90 mL = 100 mL',
    concentration: 5, concentrationUnit: 'mg/mL',
    doseUnit: 'mg/kg/h', resultUnit: 'mL/h',
    doseMin: 0.5, doseMax: 2.0, doseStep: 0.1, doseDefault: 1.0,
    factor: 1, usesWeight: true,
  },

  // === BNM ===
  {
    id: 'cisatracurio', name: 'Cisatracurio', aliases: ['cisa', 'nimbex'],
    category: 'neuromuscular',
    presentation: '50 mg (5 amp 10mL — 2mg/mL) + SF 0,9% 200 mL = 250 mL',
    concentration: 200, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 1, doseMax: 3, doseStep: 0.5, doseDefault: 2,
    factor: 60, usesWeight: true,
  },
  {
    id: 'rocuronio', name: 'Rocuronio', aliases: ['rocu', 'esmeron'],
    category: 'neuromuscular',
    presentation: '500 mg (5 amp 10mL — 10mg/mL) + SF 0,9% qsp 100 mL',
    concentration: 5000, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 5, doseMax: 12, doseStep: 1, doseDefault: 10,
    factor: 60, usesWeight: true,
  },

  // === VASODILATADORES ===
  {
    id: 'nitroglicerina', name: 'Nitroglicerina', aliases: ['nitro', 'tridil'],
    category: 'vasodilators',
    presentation: '50 mg (1 amp 10mL — 5mg/mL) + SF 0,9% 240 mL = 250 mL',
    concentration: 200, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 0.25, doseMax: 10, doseStep: 0.25, doseDefault: 1,
    cautionThreshold: 2, criticalThreshold: 5,
    factor: 60, usesWeight: true,
  },
  {
    id: 'nitroprussiato', name: 'Nitroprussiato', aliases: ['nipride', 'nps'],
    category: 'vasodilators',
    presentation: '50 mg (1 amp) + SG 5% 250 mL',
    concentration: 200, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 0.25, doseMax: 8, doseStep: 0.25, doseDefault: 1,
    cautionThreshold: 5, criticalThreshold: 8,
    factor: 60, usesWeight: true,
  },
]

/** Agrupar drogas por categoria */
export function getDrugsByCategory(): Record<DrugCategory, DrugConfig[]> {
  const groups: Record<DrugCategory, DrugConfig[]> = {
    vasopressors: [],
    sedation: [],
    neuromuscular: [],
    vasodilators: [],
    protocols: [],
  }
  drugConfigs.forEach(d => groups[d.category].push(d))
  return groups
}

/** Buscar droga por nome ou alias */
export function searchDrug(query: string): DrugConfig[] {
  const q = query.toLowerCase().trim()
  if (!q) return drugConfigs
  return drugConfigs.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.id.includes(q) ||
    d.aliases.some(a => a.includes(q))
  )
}

/** Labels por categoria */
export const categoryLabels: Record<DrugCategory, string> = {
  vasopressors: 'Vasopressores e inotopicos',
  sedation: 'Sedacao e analgesia',
  neuromuscular: 'Bloqueadores neuromusculares',
  vasodilators: 'Vasodilatadores',
  protocols: 'Protocolos',
}
