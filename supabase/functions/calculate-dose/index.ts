import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ==========================================
// DRUG CONFIGS — espelho do v2/src/data/drugConfigs.ts (v4, 08/08/2026)
// Corrigidos: midazolam em mg/mL (era 1000x), cisatracurio receita v1,
// bandas caution/critical em mida e cisa. Manter SEMPRE em sincronia com o client.
// ==========================================

interface DrugConfig {
  id: string
  concentration: number
  factor: number
  usesWeight: boolean
  doseMin: number
  doseMax: number
  cautionThreshold?: number
  criticalThreshold?: number
}

const DRUGS: Record<string, DrugConfig> = {
  noradrenalina:  { id: 'noradrenalina',  concentration: 64,   factor: 60, usesWeight: true,  doseMin: 0.01,  doseMax: 3.0,   cautionThreshold: 1,     criticalThreshold: 2 },
  adrenalina:     { id: 'adrenalina',     concentration: 64,   factor: 60, usesWeight: true,  doseMin: 0.05,  doseMax: 2.0,   cautionThreshold: 0.5,   criticalThreshold: 1 },
  dobutamina:     { id: 'dobutamina',     concentration: 1000, factor: 60, usesWeight: true,  doseMin: 2,     doseMax: 40,    cautionThreshold: 20,    criticalThreshold: 30 },
  dopamina:       { id: 'dopamina',       concentration: 1000, factor: 60, usesWeight: true,  doseMin: 2,     doseMax: 50,    cautionThreshold: 20,    criticalThreshold: 40 },
  vasopressina:   { id: 'vasopressina',   concentration: 0.4,  factor: 60, usesWeight: false, doseMin: 0.01,  doseMax: 0.04 },
  milrinona:      { id: 'milrinona',      concentration: 200,  factor: 60, usesWeight: true,  doseMin: 0.375, doseMax: 0.75 },
  midazolam:      { id: 'midazolam',      concentration: 1,    factor: 1,  usesWeight: true,  doseMin: 0.04,  doseMax: 0.2,   cautionThreshold: 0.15,  criticalThreshold: 0.2 },
  fentanil:       { id: 'fentanil',       concentration: 50,   factor: 1,  usesWeight: true,  doseMin: 0.3,   doseMax: 2.0 },
  propofol:       { id: 'propofol',       concentration: 10,   factor: 1,  usesWeight: true,  doseMin: 1,     doseMax: 4 },
  dexmedetomidina:{ id: 'dexmedetomidina',concentration: 4,    factor: 1,  usesWeight: true,  doseMin: 0.2,   doseMax: 1.4,   cautionThreshold: 0.7,   criticalThreshold: 1.4 },
  cetamina:       { id: 'cetamina',       concentration: 5,    factor: 1,  usesWeight: true,  doseMin: 0.5,   doseMax: 2.0 },
  cisatracurio:   { id: 'cisatracurio',   concentration: 1000, factor: 60, usesWeight: true,  doseMin: 1,     doseMax: 3,     cautionThreshold: 2.5,   criticalThreshold: 3 },
  rocuronio:      { id: 'rocuronio',      concentration: 5000, factor: 60, usesWeight: true,  doseMin: 5,     doseMax: 12 },
  nitroglicerina: { id: 'nitroglicerina', concentration: 200,  factor: 60, usesWeight: true,  doseMin: 0.25,  doseMax: 10,    cautionThreshold: 2,     criticalThreshold: 5 },
  nitroprussiato: { id: 'nitroprussiato', concentration: 200,  factor: 60, usesWeight: true,  doseMin: 0.25,  doseMax: 8,     cautionThreshold: 5,     criticalThreshold: 8 },
}

function doseToMlh(dose: number, weight: number, conc: number, factor: number, usesWeight: boolean): number {
  return usesWeight ? (dose * weight * factor) / conc : (dose * factor) / conc
}

function mlhToDose(mlh: number, weight: number, conc: number, factor: number, usesWeight: boolean): number {
  return usesWeight ? (mlh * conc) / (weight * factor) : (mlh * conc) / factor
}

// Semantica v1 (igual ao client): acima de caution = amarelo, acima de critical = vermelho.
// Sem bandas, o teto do range assume os dois papeis.
function getStatus(dose: number, min: number, max: number, caution?: number, critical?: number): string {
  if (dose < min) return 'critical'
  const c = caution ?? max
  const k = critical ?? max
  if (dose > k) return 'critical'
  if (dose > c) return 'caution'
  return 'therapeutic'
}

// VNERi — Goury et al. Ann Intensive Care 2025
function calcVNERi(pad: number, doseNE: number, fc: number): number | null {
  if (!pad || !doseNE || !fc || doseNE === 0 || fc === 0) return null
  return pad / (doseNE * fc)
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
      }
    })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'dose') {
      const { drugId, dose, weight, concentration } = body
      const drug = DRUGS[drugId]
      if (!drug) return Response.json({ error: 'Droga desconhecida' }, { status: 400 })

      const conc = concentration || drug.concentration
      const mlh = doseToMlh(dose, weight, conc, drug.factor, drug.usesWeight)
      const status = getStatus(dose, drug.doseMin, drug.doseMax, drug.cautionThreshold, drug.criticalThreshold)

      return Response.json({ mlh, dose, status, drugId })
    }

    if (action === 'reverse') {
      const { drugId, mlh, weight, concentration } = body
      const drug = DRUGS[drugId]
      if (!drug) return Response.json({ error: 'Droga desconhecida' }, { status: 400 })

      const conc = concentration || drug.concentration
      const dose = mlhToDose(mlh, weight, conc, drug.factor, drug.usesWeight)
      const status = getStatus(dose, drug.doseMin, drug.doseMax, drug.cautionThreshold, drug.criticalThreshold)

      return Response.json({ dose, mlh, status, drugId })
    }

    if (action === 'vneri') {
      const { pad, doseNE, fc } = body
      const vneri = calcVNERi(pad, doseNE, fc)
      if (vneri === null) return Response.json({ error: 'Dados insuficientes' }, { status: 400 })

      let zone = 'unknown'
      let mortality = ''
      if (vneri < 2.6) { zone = 'hiporresponsividade_grave'; mortality = '~56%' }
      else if (vneri < 6.7) { zone = 'resposta_parcial'; mortality = '28-40%' }
      else if (vneri < 10.8) { zone = 'resposta_adequada'; mortality = '~28%' }
      else { zone = 'tonus_preservado'; mortality = '~39%' }

      return Response.json({ vneri, zone, mortality })
    }

    if (action === 'list') {
      const list = Object.values(DRUGS).map(d => ({
        id: d.id,
        doseMin: d.doseMin,
        doseMax: d.doseMax,
        usesWeight: d.usesWeight,
      }))
      return Response.json({ drugs: list })
    }

    return Response.json({ error: 'Action desconhecida' }, { status: 400 })

  } catch (e) {
    return Response.json({ error: 'Erro interno', details: String(e) }, { status: 500 })
  }
})
