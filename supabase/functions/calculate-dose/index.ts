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

// ==========================================
// ACESSO
// ==========================================

// So os enderecos que servem o app. Era '*', e so no OPTIONS: as respostas do
// POST nao traziam cabecalho CORS nenhum, entao o navegador nunca conseguiu ler
// a resposta e a checagem servidor x navegador do DoseCalculator nunca rodou.
const ORIGENS = new Set([
  'https://any.app.br',
  'https://anyapp.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
])

function cabecalhosCors(req: Request): Record<string, string> {
  const origem = req.headers.get('Origin') ?? ''
  const h: Record<string, string> = { 'Vary': 'Origin' }
  if (ORIGENS.has(origem)) {
    h['Access-Control-Allow-Origin'] = origem
    h['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    h['Access-Control-Allow-Headers'] = 'authorization, content-type, apikey, x-client-info'
  }
  return h
}

// verify_jwt = true so garante que o token e um JWT valido DESTE projeto — e a
// chave anon, publica no bundle, e um JWT valido com role 'anon'. A assinatura
// ja chega conferida pelo gateway; aqui basta ler o papel para exigir um
// usuario logado de verdade.
function papelDoToken(req: Request): string | null {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const partes = token.split('.')
  if (partes.length !== 3) return null
  try {
    const b64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)))
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  const cors = cabecalhosCors(req)
  const json = (corpo: unknown, status = 200) => Response.json(corpo, { status, headers: cors })

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (papelDoToken(req) !== 'authenticated') return json({ error: 'Login necessario' }, 401)

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'dose') {
      const { drugId, dose, weight, concentration } = body
      const drug = DRUGS[drugId]
      if (!drug) return json({ error: 'Droga desconhecida' }, 400)

      const conc = concentration || drug.concentration
      const mlh = doseToMlh(dose, weight, conc, drug.factor, drug.usesWeight)
      const status = getStatus(dose, drug.doseMin, drug.doseMax, drug.cautionThreshold, drug.criticalThreshold)

      return json({ mlh, dose, status, drugId })
    }

    if (action === 'reverse') {
      const { drugId, mlh, weight, concentration } = body
      const drug = DRUGS[drugId]
      if (!drug) return json({ error: 'Droga desconhecida' }, 400)

      const conc = concentration || drug.concentration
      const dose = mlhToDose(mlh, weight, conc, drug.factor, drug.usesWeight)
      const status = getStatus(dose, drug.doseMin, drug.doseMax, drug.cautionThreshold, drug.criticalThreshold)

      return json({ dose, mlh, status, drugId })
    }

    if (action === 'vneri') {
      const { pad, doseNE, fc } = body
      const vneri = calcVNERi(pad, doseNE, fc)
      if (vneri === null) return json({ error: 'Dados insuficientes' }, 400)

      let zone = 'unknown'
      let mortality = ''
      if (vneri < 2.6) { zone = 'hiporresponsividade_grave'; mortality = '~56%' }
      else if (vneri < 6.7) { zone = 'resposta_parcial'; mortality = '28-40%' }
      else if (vneri < 10.8) { zone = 'resposta_adequada'; mortality = '~28%' }
      else { zone = 'tonus_preservado'; mortality = '~39%' }

      return json({ vneri, zone, mortality })
    }

    if (action === 'list') {
      const list = Object.values(DRUGS).map(d => ({
        id: d.id,
        doseMin: d.doseMin,
        doseMax: d.doseMax,
        usesWeight: d.usesWeight,
      }))
      return json({ drugs: list })
    }

    return json({ error: 'Action desconhecida' }, 400)

  } catch {
    // Sem detalhe na resposta: a mensagem interna nao serve a quem chama.
    return json({ error: 'Erro interno' }, 500)
  }
})
