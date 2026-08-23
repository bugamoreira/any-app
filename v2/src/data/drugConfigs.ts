import type { DrugConfig, DrugCategory } from '../types/clinical'

// ==========================================
// CONFIGURAÇÃO DE TODAS AS DROGAS
// Fonte: Infusion Guide ANY App v2.3.2
// Validado clínicamente (auditoria Opus 04/2026)
// ==========================================

export const drugConfigs: DrugConfig[] = [
  // === VASOPRESSORES ===
  {
    id: 'noradrenalina', name: 'Noradrenalina', aliases: ['norepinefrina', 'nora', 'ne', 'levophed'],
    category: 'vasopressors',
    presentation: '16 mg (4 amp 4mL — 4mg/4mL) + SF 0,9% 234 mL = 250 mL',
    concentration: 64, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 0.01, doseMax: 3.0, doseStep: 0.01, doseDefault: 0.1,
    cautionThreshold: 1, criticalThreshold: 2,
    factor: 60, usesWeight: true,
    ampoule: { mass: 4000, volume: 4, label: '4 mg / 4 mL' },
    dilutions: [
      { label: 'Padrão (64 mcg/mL)', concentration: 64, isDefault: true },
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
    ampoule: { mass: 1000, volume: 1, label: '1 mg / 1 mL' },
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
    ampoule: { mass: 250000, volume: 20, label: '250 mg / 20 mL' },
    dilutions: [
      { label: 'Padrão (1000 mcg/mL)', concentration: 1000, isDefault: true },
      { label: 'Dobrada (2000 mcg/mL)', concentration: 2000 },
      { label: 'Quádrupla (4000 mcg/mL)', concentration: 4000 },
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
    ampoule: { mass: 250000, volume: 50, label: '250 mg / 50 mL' },
  },
  {
    id: 'vasopressina', name: 'Vasopressina', aliases: ['vaso', 'avp', 'pitressin'],
    category: 'vasopressors',
    presentation: '40 UI (2 amp 1mL — 20UI/mL) + SF 0,9% 98 mL = 100 mL',
    concentration: 0.4, concentrationUnit: 'UI/mL',
    doseUnit: 'UI/min', resultUnit: 'mL/h',
    doseMin: 0.01, doseMax: 0.04, doseStep: 0.005, doseDefault: 0.03,
    factor: 60, usesWeight: false,
    ampoule: { mass: 20, volume: 1, label: '20 UI / 1 mL' },
  },
  {
    id: 'milrinona', name: 'Milrinona', aliases: ['milri', 'primacor'],
    category: 'vasopressors',
    presentation: '20 mg (1 amp 20mL — 1mg/mL) + SF 0,9% 80 mL = 100 mL',
    concentration: 200, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 0.375, doseMax: 0.75, doseStep: 0.025, doseDefault: 0.5,
    factor: 60, usesWeight: true,
    ampoule: { mass: 20000, volume: 20, label: '20 mg / 20 mL' },
  },

  // === SEDAÇÃO / ANALGESIA ===
  {
    id: 'midazolam', name: 'Midazolam', aliases: ['mida', 'dormonid', 'dormicum'],
    category: 'sedation',
    presentation: '250 mg (5 amp 10mL — 5mg/mL) + SF 0,9% 200 mL = 250 mL',
    concentration: 1, concentrationUnit: 'mg/mL',
    doseUnit: 'mg/kg/h', resultUnit: 'mL/h',
    doseMin: 0.04, doseMax: 0.2, doseStep: 0.01, doseDefault: 0.1,
    cautionThreshold: 0.15, criticalThreshold: 0.2,
    factor: 1, usesWeight: true,
    ampoule: { mass: 50, volume: 10, label: '50 mg / 10 mL' },
    modes: [
      {
        id: 'sedacao', label: 'Sedação',
        doseMin: 0.04, doseMax: 0.2, doseStep: 0.01, doseDefault: 0.1,
        cautionThreshold: 0.15, criticalThreshold: 0.2,
        rangeLabel: '0,04 - 0,2 mg/kg/h',
      },
      {
        id: 'status', label: 'Status epilepticus',
        doseMin: 0.05, doseMax: 2, doseStep: 0.05, doseDefault: 0.5,
        cautionThreshold: 1.5, criticalThreshold: 2,
        rangeLabel: '0,05 - 2,0 mg/kg/h',
        bolus: {
          title: 'Bolus (Status epilepticus)',
          rows: [
            { label: 'Dose', value: '0,2 mg/kg IV' },
            { label: 'Repetir', value: '5/5 min até máx 20 mg' },
          ],
          perKg: 0.2, capPerBolus: 20,
        },
      },
    ],
  },
  {
    id: 'fentanil', name: 'Fentanil', aliases: ['fenta', 'fentanyl'],
    category: 'sedation',
    presentation: 'Puro — 50 mcg/mL (ampola 10 mL)',
    concentration: 50, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/h', resultUnit: 'mL/h',
    doseMin: 0.3, doseMax: 2.0, doseStep: 0.1, doseDefault: 1.0,
    factor: 1, usesWeight: true,
    ampoule: { mass: 500, volume: 10, label: '500 mcg / 10 mL' },
  },
  {
    id: 'propofol', name: 'Propofol', aliases: ['diprivan'],
    category: 'sedation',
    presentation: 'Puro — 10 mg/mL (NÃO diluir)',
    concentration: 10, concentrationUnit: 'mg/mL',
    doseUnit: 'mg/kg/h', resultUnit: 'mL/h',
    doseMin: 1, doseMax: 4, doseStep: 0.1, doseDefault: 2,
    cautionThreshold: 3, criticalThreshold: 4,
    factor: 1, usesWeight: true,
    modes: [
      {
        id: 'sedacao', label: 'Sedação',
        doseMin: 1, doseMax: 4, doseStep: 0.1, doseDefault: 2,
        cautionThreshold: 3, criticalThreshold: 4,
        rangeLabel: '1,0 - 4,0 mg/kg/h',
      },
      {
        id: 'status', label: 'Status epilepticus',
        doseMin: 0.3, doseMax: 4.8, doseStep: 0.1, doseDefault: 2,
        cautionThreshold: 3, criticalThreshold: 4.8,
        rangeLabel: '0,3 - 4,8 mg/kg/h',
        bolus: {
          title: 'Bolus (Status epilepticus)',
          rows: [
            { label: 'Dose', value: '0,5 - 2,5 mg/kg IV' },
            { label: 'Repetir', value: '5/5 min até máx 10 mg/kg' },
          ],
          perKgRange: [0.5, 2.5],
        },
      },
    ],
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
    ampoule: { mass: 200, volume: 2, label: '200 mcg / 2 mL' },
  },
  {
    id: 'cetamina', name: 'Cetamina', aliases: ['ceta', 'ketamina', 'ketalar'],
    category: 'sedation',
    presentation: '500 mg (1 amp 10mL — 50mg/mL) + SF 0,9% 90 mL = 100 mL',
    concentration: 5, concentrationUnit: 'mg/mL',
    doseUnit: 'mg/kg/h', resultUnit: 'mL/h',
    doseMin: 0.5, doseMax: 2.0, doseStep: 0.1, doseDefault: 1.0,
    cautionThreshold: 1.5, criticalThreshold: 2,
    factor: 1, usesWeight: true,
    ampoule: { mass: 500, volume: 10, label: '500 mg / 10 mL' },
    modes: [
      {
        id: 'sedacao', label: 'Sedação',
        doseMin: 0.5, doseMax: 2, doseStep: 0.1, doseDefault: 1,
        cautionThreshold: 1.5, criticalThreshold: 2,
        rangeLabel: '0,5 - 2,0 mg/kg/h',
      },
      {
        id: 'status', label: 'Status epilepticus',
        doseMin: 1.2, doseMax: 7.5, doseStep: 0.1, doseDefault: 3,
        cautionThreshold: 5, criticalThreshold: 7.5,
        rangeLabel: '1,2 - 7,5 mg/kg/h',
        bolus: {
          title: 'Bolus (Status epilepticus)',
          rows: [
            { label: 'Dose', value: '1,5 mg/kg IV' },
            { label: 'Repetir', value: '5/5 min até máx 4,5 mg/kg' },
          ],
          perKg: 1.5,
        },
      },
    ],
  },
  {
    // v1: 100 mg (10 amp 1mL) em 100 mL = 1 mg/mL; slider 1-10 step 0,5 default 2;
    // setStatus(..., 1, 5, 8). Nao usa peso — a dose ja e em mg/h.
    id: 'morfina', name: 'Morfina', aliases: ['morphine', 'dimorf'],
    category: 'sedation',
    presentation: '100 mg (10 amp 1mL — 10mg/mL) + SF 0,9% 90 mL = 100 mL',
    concentration: 1, concentrationUnit: 'mg/mL',
    doseUnit: 'mg/h', resultUnit: 'mL/h',
    doseMin: 1, doseMax: 10, doseStep: 0.5, doseDefault: 2,
    cautionThreshold: 5, criticalThreshold: 8,
    factor: 1, usesWeight: false,
    ampoule: { mass: 10, volume: 1, label: '10 mg / 1 mL' },
  },

  // === BNM ===
  {
    id: 'cisatracurio', name: 'Cisatracúrio', aliases: ['cisa', 'nimbex'],
    category: 'neuromuscular',
    presentation: '100 mg (5 amp 10mL — 2mg/mL) + SF 0,9% qsp 100 mL',
    concentration: 1000, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 1, doseMax: 3, doseStep: 0.5, doseDefault: 2,
    cautionThreshold: 2.5, criticalThreshold: 3,
    factor: 60, usesWeight: true,
    ampoule: { mass: 20000, volume: 10, label: '20 mg / 10 mL' },
  },
  {
    id: 'rocuronio', name: 'Rocurônio', aliases: ['rocu', 'esmeron'],
    category: 'neuromuscular',
    presentation: '500 mg (5 amp 10mL — 10mg/mL) + SF 0,9% qsp 100 mL',
    concentration: 5000, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 5, doseMax: 12, doseStep: 1, doseDefault: 10,
    factor: 60, usesWeight: true,
    ampoule: { mass: 100000, volume: 10, label: '100 mg / 10 mL' },
  },

  // === VASODILATADORES ===
  {
    id: 'nitroglicerina', name: 'Nitroglicerina', aliases: ['nitro', 'tridil'],
    category: 'vasodilators',
    presentation: '50 mg (1 amp 10mL — 5mg/mL) + SF 0,9% 240 mL = 250 mL',
    concentration: 200, concentrationUnit: 'mcg/mL',
    doseUnit: 'mcg/kg/min', resultUnit: 'mL/h',
    doseMin: 0.25, doseMax: 2, doseStep: 0.05, doseDefault: 0.5,
    cautionThreshold: 2, criticalThreshold: 5,
    factor: 60, usesWeight: true,
    ampoule: { mass: 50000, volume: 10, label: '50 mg / 10 mL' },
    modes: [
      {
        id: 'padrao', label: 'Padrão',
        doseMin: 0.25, doseMax: 2, doseStep: 0.05, doseDefault: 0.5,
        cautionThreshold: 2, criticalThreshold: 5,
        rangeLabel: '0,25 - 2,0 mcg/kg/min',
      },
      {
        id: 'scape', label: 'SCAPE',
        doseMin: 1, doseMax: 10, doseStep: 0.5, doseDefault: 3,
        cautionThreshold: 2, criticalThreshold: 5,
        rangeLabel: '1 - 10 mcg/kg/min (alta dose)',
        bolus: {
          title: 'SCAPE (EAP hipertensivo)',
          rows: [
            { label: 'Bolus', value: '400-800 mcg IV (2-4 mL)' },
            { label: 'Repetir bolus', value: '3-5 min até resposta' },
            { label: 'Alvo', value: 'Reduzir PAS 20-30%' },
          ],
        },
      },
    ],
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
    ampoule: { mass: 50000, label: '50 mg / ampola' },
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
  vasopressors: 'Vasopressores e inotrópicos',
  sedation: 'Sedação e analgesia',
  neuromuscular: 'Bloqueadores neuromusculares',
  vasodilators: 'Vasodilatadores',
  protocols: 'Protocolos',
}
