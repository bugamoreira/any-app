import { describe, it, expect } from 'vitest'
import { fmt, fmtWeight, fmtDose, fmtMlh, statusColors, statusClasses } from './formatters'

describe('fmt', () => {
  it('formata numero com virgula', () => {
    expect(fmt(10.5)).toBe('10,5')
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

  it('respeita casas decimais', () => {
    expect(fmt(3.14159, 3)).toBe('3,142')
  })

  it('formata zero', () => {
    expect(fmt(0, 0)).toBe('0')
  })
})

describe('fmtWeight', () => {
  it('formata peso com unidade', () => {
    expect(fmtWeight(70)).toBe('70,0 kg')
  })

  it('retorna -- kg para null', () => {
    expect(fmtWeight(null)).toBe('-- kg')
  })

  it('retorna -- kg para zero', () => {
    expect(fmtWeight(0)).toBe('-- kg')
  })
})

describe('fmtDose', () => {
  it('formata dose com unidade', () => {
    expect(fmtDose(0.1, 'mcg/kg/min')).toBe('0,1 mcg/kg/min')
  })

  it('formata com decimais customizadas', () => {
    expect(fmtDose(5.678, 'mg/kg/h', 2)).toBe('5,68 mg/kg/h')
  })
})

describe('fmtMlh', () => {
  it('formata mL/h', () => {
    expect(fmtMlh(6.5)).toBe('6,5 mL/h')
  })

  it('formata com decimais customizadas', () => {
    expect(fmtMlh(6.5625, 2)).toBe('6,56 mL/h')
  })
})

describe('statusColors', () => {
  it('tem cores para therapeutic', () => {
    expect(statusColors.therapeutic.text).toBe('#4CAF50')
  })

  it('tem cores para caution', () => {
    expect(statusColors.caution.text).toBe('#FFC107')
  })

  it('tem cores para critical', () => {
    expect(statusColors.critical.text).toBe('#F44336')
  })
})

describe('statusClasses', () => {
  it('tem classes Tailwind para cada status', () => {
    expect(statusClasses.therapeutic).toContain('success')
    expect(statusClasses.caution).toContain('warning')
    expect(statusClasses.critical).toContain('danger')
  })
})
