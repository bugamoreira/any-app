import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

const FUNCTION_URL = 'https://meatbfomblpicftrzcsy.supabase.co/functions/v1/calculate-dose'

interface DoseResponse {
  mlh: number
  dose: number
  status: 'therapeutic' | 'caution' | 'critical'
  drugId: string
}

interface VNERiResponse {
  vneri: number
  zone: string
  mortality: string
}

/**
 * Hook para calcular doses no servidor (formulas protegidas)
 * Fallback para calculo local se servidor indisponível
 */
export function useServerCalc() {

  const calcDose = useCallback(async (
    drugId: string,
    dose: number,
    weight: number,
    concentration?: number
  ): Promise<DoseResponse | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'dose', drugId, dose, weight, concentration }),
      })

      if (!res.ok) return null
      return await res.json()
    } catch {
      return null // Fallback to local calc
    }
  }, [])

  const calcReverse = useCallback(async (
    drugId: string,
    mlh: number,
    weight: number,
    concentration?: number
  ): Promise<DoseResponse | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'reverse', drugId, mlh, weight, concentration }),
      })

      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [])

  const calcVNERi = useCallback(async (
    pad: number,
    doseNE: number,
    fc: number
  ): Promise<VNERiResponse | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'vneri', pad, doseNE, fc }),
      })

      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [])

  return { calcDose, calcReverse, calcVNERi }
}
