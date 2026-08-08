import { createContext, useContext, useState, type ReactNode } from 'react'

interface WeightContextType {
  weight: number | null
  setWeight: (w: number | null) => void
}

const WeightContext = createContext<WeightContextType | null>(null)

export function WeightProvider({ children }: { children: ReactNode }) {
  // Inicia SEMPRE vazio, por seguranca clinica: auto-restaurar arriscaria usar o
  // peso do paciente anterior. Recuperacao e manual (botao), padrao do v1.
  const [weight, setWeightState] = useState<number | null>(null)

  function setWeight(w: number | null) {
    setWeightState(w)
    try {
      if (w) localStorage.setItem('anyapp-peso', String(w))
    } catch (_) {
      // localStorage indisponivel (ex.: Safari privado) — segue so em memoria
    }
  }

  return (
    <WeightContext.Provider value={{ weight, setWeight }}>
      {children}
    </WeightContext.Provider>
  )
}

export function useWeight() {
  const context = useContext(WeightContext)
  if (!context) throw new Error('useWeight deve ser usado dentro de WeightProvider')
  return context
}
