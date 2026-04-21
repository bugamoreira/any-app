import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { LactateUnit } from '../utils/units'

interface UnitContextValue {
  lactateUnit: LactateUnit
  setLactateUnit: (u: LactateUnit) => void
}

const UnitContext = createContext<UnitContextValue | null>(null)

const STORAGE_KEY = 'anyapp:units'

function loadStored(): LactateUnit {
  if (typeof window === 'undefined') return 'mg/dL'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 'mg/dL'
    const parsed = JSON.parse(raw)
    if (parsed.lactateUnit === 'mmol/L' || parsed.lactateUnit === 'mg/dL') {
      return parsed.lactateUnit
    }
  } catch {
    /* noop */
  }
  return 'mg/dL'
}

/**
 * BLOCKER-06: UnitContext centraliza preferencias de unidades clinicas.
 * Default lactato: mg/dL (predominante no Brasil).
 * Persiste em localStorage sob 'anyapp:units'.
 */
export function UnitProvider({ children }: { children: ReactNode }) {
  const [lactateUnit, setLactateUnitState] = useState<LactateUnit>(loadStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lactateUnit }))
    } catch {
      /* noop */
    }
  }, [lactateUnit])

  return (
    <UnitContext.Provider value={{ lactateUnit, setLactateUnit: setLactateUnitState }}>
      {children}
    </UnitContext.Provider>
  )
}

export function useUnits(): UnitContextValue {
  const ctx = useContext(UnitContext)
  if (!ctx) throw new Error('useUnits deve ser usado dentro de UnitProvider')
  return ctx
}
