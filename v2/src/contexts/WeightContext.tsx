import { createContext, useContext, useState, type ReactNode } from 'react'

interface WeightContextType {
  weight: number | null
  setWeight: (w: number | null) => void
}

const WeightContext = createContext<WeightContextType | null>(null)

export function WeightProvider({ children }: { children: ReactNode }) {
  const [weight, setWeightState] = useState<number | null>(() => {
    const saved = localStorage.getItem('anyapp-peso')
    return saved ? parseFloat(saved) : null
  })

  function setWeight(w: number | null) {
    setWeightState(w)
    if (w) {
      localStorage.setItem('anyapp-peso', String(w))
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
