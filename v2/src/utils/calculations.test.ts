import { describe, it, expect } from 'vitest'
import {
  doseToMlh,
  mlhToDose,
  getDoseStatus,
  calculateDose,
  fmt,
  calcVNERi,
  getVNERiZone,
  getQuadrant,
  lactatoConvert,
  calcHeparina,
  classifyWells,
  calcHACOR,
  calcDengueHydration,
} from './calculations'

// ==========================================
// FORMULAS DE DOSE
// ==========================================

describe('doseToMlh', () => {
  it('calcula mL/h com peso (mcg/kg/min)', () => {
    // Noradrenalina: 0.1 mcg/kg/min, 70kg, 64 mcg/mL, fator 60
    const result = doseToMlh(0.1, 70, 64, 60, true)
    expect(result).toBeCloseTo(6.5625, 2)
  })

  it('calcula mL/h sem peso (dose fixa)', () => {
    // Droga sem peso: dose 10, concentracao 5, fator 1
    const result = doseToMlh(10, 70, 5, 1, false)
    expect(result).toBe(2)
  })

  it('retorna 0 quando dose e 0', () => {
    expect(doseToMlh(0, 70, 64, 60, true)).toBe(0)
  })
})

describe('mlhToDose', () => {
  it('calcula dose a partir de mL/h (inverso de doseToMlh)', () => {
    // Noradrenalina: 6.5625 mL/h, 70kg, 64 mcg/mL, fator 60
    const result = mlhToDose(6.5625, 70, 64, 60, true)
    expect(result).toBeCloseTo(0.1, 4)
  })

  it('calcula dose sem peso', () => {
    const result = mlhToDose(2, 70, 5, 1, false)
    expect(result).toBe(10)
  })

  it('e inversao exata de doseToMlh', () => {
    const dose = 0.25
    const weight = 80
    const conc = 64
    const factor = 60
    const mlh = doseToMlh(dose, weight, conc, factor, true)
    const doseBack = mlhToDose(mlh, weight, conc, factor, true)
    expect(doseBack).toBeCloseTo(dose, 6)
  })
})

describe('getDoseStatus', () => {
  it('retorna therapeutic dentro do range', () => {
    expect(getDoseStatus(0.1, 0.01, 3.0)).toBe('therapeutic')
  })

  it('retorna critical abaixo do minimo', () => {
    expect(getDoseStatus(0.005, 0.01, 3.0)).toBe('critical')
  })

  it('retorna critical acima do maximo sem threshold', () => {
    expect(getDoseStatus(3.5, 0.01, 3.0)).toBe('critical')
  })

  it('retorna caution entre max e criticalThreshold', () => {
    // max=1, criticalThreshold=2, dose=1.5 -> caution
    expect(getDoseStatus(1.5, 0.01, 1, 2)).toBe('caution')
  })

  it('retorna critical acima do criticalThreshold', () => {
    expect(getDoseStatus(2.5, 0.01, 1, 2)).toBe('critical')
  })

  it('retorna therapeutic no limite minimo exato', () => {
    expect(getDoseStatus(0.01, 0.01, 3.0)).toBe('therapeutic')
  })

  it('retorna therapeutic no limite maximo exato', () => {
    expect(getDoseStatus(3.0, 0.01, 3.0)).toBe('therapeutic')
  })
})

describe('calculateDose', () => {
  it('retorna dose, mlh e status corretos', () => {
    const result = calculateDose(0.1, 70, 64, 60, true, 0.01, 3.0)
    expect(result.dose).toBe(0.1)
    expect(result.mlh).toBeCloseTo(6.5625, 2)
    expect(result.status).toBe('therapeutic')
  })

  it('marca critical para dose acima do range', () => {
    const result = calculateDose(5, 70, 64, 60, true, 0.01, 3.0)
    expect(result.status).toBe('critical')
  })
})

// ==========================================
// FORMATACAO
// ==========================================

describe('fmt', () => {
  it('formata numero com virgula (padrao BR)', () => {
    expect(fmt(10.5)).toBe('10,5')
  })

  it('formata com decimais customizadas', () => {
    expect(fmt(10.567, 2)).toBe('10,57')
  })

  it('retorna -- para null', () => {
    expect(fmt(null)).toBe('--')
  })

  it('retorna -- para undefined', () => {
    expect(fmt(undefined)).toBe('--')
  })

  it('retorna -- para NaN', () => {
    expect(fmt(NaN)).toBe('--')
  })

  it('formata zero corretamente', () => {
    expect(fmt(0)).toBe('0,0')
  })
})

// ==========================================
// VNERi — Vascular Norepinephrine Responsiveness Index
// ==========================================

describe('calcVNERi', () => {
  it('calcula VNERi corretamente', () => {
    // PAD=60, doseNE=0.3, FC=100 -> 60/(0.3*100) = 2.0
    expect(calcVNERi(60, 0.3, 100)).toBe(2)
  })

  it('retorna null para dose zero', () => {
    expect(calcVNERi(60, 0, 100)).toBeNull()
  })

  it('retorna null para FC zero', () => {
    expect(calcVNERi(60, 0.3, 0)).toBeNull()
  })

  it('retorna null para PAD zero', () => {
    expect(calcVNERi(0, 0.3, 100)).toBeNull()
  })
})

describe('getVNERiZone', () => {
  it('classifica hiporresponsividade grave (< 2.6)', () => {
    const zone = getVNERiZone(1.5)
    expect(zone.label).toBe('Hiporresponsividade grave')
    expect(zone.color).toBe('#F44336')
  })

  it('classifica resposta parcial (2.6-6.7)', () => {
    const zone = getVNERiZone(4.0)
    expect(zone.label).toBe('Resposta parcial')
  })

  it('classifica resposta adequada (6.7-10.8)', () => {
    const zone = getVNERiZone(8.0)
    expect(zone.label).toBe('Resposta adequada')
    expect(zone.color).toBe('#4CAF50')
  })

  it('classifica tonus preservado (>= 10.8)', () => {
    const zone = getVNERiZone(12.0)
    expect(zone.label).toBe('Tonus preservado')
  })
})

// ==========================================
// QUADRANTES ScvO2 / Gap CO2
// ==========================================

describe('getQuadrant', () => {
  it('identifica baixo debito (ScvO2<70, GapCO2>6)', () => {
    const q = getQuadrant(8, 60)
    expect(q.id).toBe('lowDC')
  })

  it('identifica disoxia anemica (ScvO2<70, GapCO2<=6)', () => {
    const q = getQuadrant(4, 60)
    expect(q.id).toBe('anemic')
  })

  it('identifica microcirculacao inadequada (ScvO2>=70, GapCO2>6)', () => {
    const q = getQuadrant(8, 75)
    expect(q.id).toBe('micro')
  })

  it('identifica hipoxia citopatica (ScvO2>=70, GapCO2<=6)', () => {
    const q = getQuadrant(4, 75)
    expect(q.id).toBe('cytopathic')
  })
})

// ==========================================
// CONVERSAO LACTATO
// ==========================================

describe('lactatoConvert', () => {
  it('converte mmol/L para mg/dL', () => {
    expect(lactatoConvert(2, 'mmol')).toBe(18)
  })

  it('converte mg/dL para mmol/L', () => {
    expect(lactatoConvert(18, 'mgdl')).toBe(2)
  })
})

// ==========================================
// HEPARINA
// ==========================================

describe('calcHeparina', () => {
  it('calcula bolus SCA com cap 4000 UI', () => {
    const result = calcHeparina(80, 'sca')
    // 80 * 60 = 4800, cap 4000
    expect(result.bolusDose).toBe(4000)
    expect(result.bolusVolume).toBe(40) // 4000/100
  })

  it('calcula infusao SCA com cap 1000 UI/h', () => {
    const result = calcHeparina(100, 'sca')
    // 100 * 12 = 1200, cap 1000
    expect(result.infusionDose).toBe(1000)
    expect(result.infusionMlh).toBe(10) // 1000/100
  })

  it('calcula bolus TEP sem cap', () => {
    const result = calcHeparina(80, 'tep')
    // 80 * 80 = 6400
    expect(result.bolusDose).toBe(6400)
  })

  it('calcula infusao TEP sem cap', () => {
    const result = calcHeparina(70, 'tep')
    // 70 * 18 = 1260
    expect(result.infusionDose).toBe(1260)
    expect(result.infusionMlh).toBe(12.6)
  })
})

// ==========================================
// WELLS SCORE
// ==========================================

describe('classifyWells', () => {
  it('classifica baixa probabilidade (< 2)', () => {
    const result = classifyWells(1)
    expect(result.risk).toBe('low')
  })

  it('classifica probabilidade intermediaria (2-6)', () => {
    const result = classifyWells(4)
    expect(result.risk).toBe('moderate')
  })

  it('classifica alta probabilidade (> 6)', () => {
    const result = classifyWells(7)
    expect(result.risk).toBe('high')
  })

  it('limite 2 e intermediaria', () => {
    expect(classifyWells(2).risk).toBe('moderate')
  })

  it('limite 6 e intermediaria', () => {
    expect(classifyWells(6).risk).toBe('moderate')
  })
})

// ==========================================
// HACOR SCORE
// ==========================================

describe('calcHACOR', () => {
  it('calcula score zero para valores normais', () => {
    // FC<120, pH>=7.35, GCS 15, PF>200, FR<30
    expect(calcHACOR(false, 7.40, 15, 250, false)).toBe(0)
  })

  it('calcula score maximo', () => {
    // FC>=120 (+1), pH<7.25 (+4), GCS<11 (+15), PF<125 (+5), FR>=30 (+1) = 26
    expect(calcHACOR(true, 7.20, 8, 100, true)).toBe(26)
  })

  it('soma componentes intermediarios', () => {
    // FC>=120 (+1), pH 7.30-7.34 (+2), GCS 13-14 (+2), PF 175-200 (+2), FR<30 (+0) = 7
    expect(calcHACOR(true, 7.32, 14, 180, false)).toBe(7)
  })
})

// ==========================================
// HIDRATACAO DENGUE
// ==========================================

describe('calcDengueHydration', () => {
  it('calcula volumes para 70kg', () => {
    const result = calcDengueHydration(70)
    expect(result.voTotal).toBe(4200) // 70*60
    expect(result.ivHora).toBe(700)   // 70*10
    expect(result.bolus).toBe(1400)   // 70*20
  })

  it('calcula albumina corretamente', () => {
    const result = calcDengueHydration(70)
    // 0.5 g/kg: (70*0.5)/0.2 = 175 mL
    expect(result.alb05).toBe(175)
    // 1 g/kg: (70*1)/0.2 = 350 mL
    expect(result.alb1).toBe(350)
  })
})
