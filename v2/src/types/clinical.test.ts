import { describe, it, expect } from 'vitest'
import { ADULT_WEIGHT_RANGE, PED_WEIGHT_RANGE } from './clinical'
import type { DrugConfig, DoseResult, DoseStatus, AlertType } from './clinical'

describe('constantes de peso', () => {
  it('range adulto: 40-200 kg', () => {
    expect(ADULT_WEIGHT_RANGE.min).toBe(40)
    expect(ADULT_WEIGHT_RANGE.max).toBe(200)
  })

  it('range pediatrico: 0.5-50 kg', () => {
    expect(PED_WEIGHT_RANGE.min).toBe(0.5)
    expect(PED_WEIGHT_RANGE.max).toBe(50)
  })
})

describe('tipos clinicos (verificacao de contrato)', () => {
  it('DrugConfig aceita configuracao valida', () => {
    const config: DrugConfig = {
      id: 'test',
      name: 'Teste',
      aliases: ['t'],
      category: 'vasopressors',
      presentation: 'Teste 10mg',
      concentration: 100,
      concentrationUnit: 'mcg/mL',
      doseUnit: 'mcg/kg/min',
      resultUnit: 'mL/h',
      doseMin: 0.1,
      doseMax: 10,
      doseStep: 0.1,
      doseDefault: 1,
      factor: 60,
      usesWeight: true,
    }
    expect(config.id).toBe('test')
  })

  it('DoseResult tem campos esperados', () => {
    const result: DoseResult = { dose: 1, mlh: 5, status: 'therapeutic' }
    expect(result.status).toBe('therapeutic')
  })

  it('DoseStatus aceita os tres valores', () => {
    const statuses: DoseStatus[] = ['therapeutic', 'caution', 'critical']
    expect(statuses).toHaveLength(3)
  })

  it('AlertType aceita os quatro valores', () => {
    const types: AlertType[] = ['success', 'warning', 'danger', 'info']
    expect(types).toHaveLength(4)
  })
})
