import { useState, useEffect, useCallback } from 'react'

export interface CustomDilution {
  /** Quantas ampolas o servico usa. */
  ampoules: number
  /** Volume final da bolsa, em mL. */
  volume: number
  /** Concentracao resultante, na unidade da droga. */
  concentration: number
}

/**
 * Diluicao do servico do usuario, por droga, guardada no proprio aparelho.
 *
 * O v1 ja fazia isso (carregarDiluicaoCustomizada / salvarDiluicao /
 * restaurarDiluicao), mas escrito na mao e so para midazolam e fentanil. Aqui
 * vale para qualquer droga que tenha `ampoule` no config.
 *
 * Chave no padrao do v4 (`anyapp:units` do UnitContext), nao no do v1
 * (`anyapp-diluicao-<droga>`).
 */
export function useCustomDilution(drugId: string) {
  const [custom, setCustom] = useState<CustomDilution | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`anyapp:diluicao:${drugId}`)
      const parsed = raw ? JSON.parse(raw) : null
      // Nunca confiar no que esta no storage: valor invalido vira "sem custom",
      // e a droga volta ao padrao do app em vez de calcular com lixo.
      setCustom(
        parsed && typeof parsed.concentration === 'number' && parsed.concentration > 0
          ? parsed
          : null
      )
    } catch {
      setCustom(null)
    }
  }, [drugId])

  const save = useCallback((d: CustomDilution) => {
    try { localStorage.setItem(`anyapp:diluicao:${drugId}`, JSON.stringify(d)) } catch { /* storage cheio ou bloqueado */ }
    setCustom(d)
  }, [drugId])

  const clear = useCallback(() => {
    try { localStorage.removeItem(`anyapp:diluicao:${drugId}`) } catch { /* noop */ }
    setCustom(null)
  }, [drugId])

  return { custom, save, clear }
}
