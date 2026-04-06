import { describe, it, expect } from 'vitest'
import { drugConfigs } from './drugConfigs'

describe('drugConfigs', () => {
  it('tem pelo menos 10 drogas configuradas', () => {
    expect(drugConfigs.length).toBeGreaterThanOrEqual(10)
  })

  it('todas as drogas tem campos obrigatorios', () => {
    for (const drug of drugConfigs) {
      expect(drug.id, `${drug.name}: id`).toBeTruthy()
      expect(drug.name, `${drug.id}: name`).toBeTruthy()
      expect(drug.concentration, `${drug.id}: concentration`).toBeGreaterThan(0)
      expect(drug.doseMin, `${drug.id}: doseMin`).toBeGreaterThanOrEqual(0)
      expect(drug.doseMax, `${drug.id}: doseMax`).toBeGreaterThan(drug.doseMin)
      expect(drug.doseStep, `${drug.id}: doseStep`).toBeGreaterThan(0)
      expect(drug.factor, `${drug.id}: factor`).toBeGreaterThan(0)
    }
  })

  it('ids sao unicos', () => {
    const ids = drugConfigs.map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('doseDefault esta dentro do range', () => {
    for (const drug of drugConfigs) {
      expect(drug.doseDefault, `${drug.id}: doseDefault >= doseMin`).toBeGreaterThanOrEqual(drug.doseMin)
      expect(drug.doseDefault, `${drug.id}: doseDefault <= doseMax`).toBeLessThanOrEqual(drug.doseMax)
    }
  })

  it('noradrenalina tem configuracao correta', () => {
    const nora = drugConfigs.find(d => d.id === 'noradrenalina')
    expect(nora).toBeDefined()
    expect(nora!.concentration).toBe(64)
    expect(nora!.doseUnit).toBe('mcg/kg/min')
    expect(nora!.usesWeight).toBe(true)
    expect(nora!.factor).toBe(60)
  })

  it('aliases incluem nomes comerciais comuns', () => {
    const nora = drugConfigs.find(d => d.id === 'noradrenalina')
    expect(nora!.aliases).toContain('nora')
    expect(nora!.aliases).toContain('norepinefrina')
  })

  it('categorias sao validas', () => {
    const validCategories = ['vasopressors', 'sedation', 'neuromuscular', 'vasodilators', 'protocols']
    for (const drug of drugConfigs) {
      expect(validCategories, `${drug.id}: categoria invalida ${drug.category}`).toContain(drug.category)
    }
  })

  it('diluicoes tem concentracoes positivas', () => {
    for (const drug of drugConfigs) {
      if (drug.dilutions) {
        for (const dil of drug.dilutions) {
          expect(dil.concentration, `${drug.id} diluicao ${dil.label}`).toBeGreaterThan(0)
          expect(dil.label).toBeTruthy()
        }
      }
    }
  })

  it('cautionThreshold < criticalThreshold quando ambos existem', () => {
    for (const drug of drugConfigs) {
      if (drug.cautionThreshold && drug.criticalThreshold) {
        expect(
          drug.cautionThreshold,
          `${drug.id}: cautionThreshold deve ser < criticalThreshold`
        ).toBeLessThan(drug.criticalThreshold)
      }
    }
  })
})
