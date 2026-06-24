interface RangeIndicatorProps {
  /** Posicao do indicador, 0–100 (%). */
  percent: number
  /** Gradiente CSS da barra. Default: zonas VNERi do monolito (Shock Path). */
  gradient?: string
  /** Rotulos das zonas, distribuidos da esquerda para a direita. */
  zoneLabels?: string[]
}

// Gradiente padrao VNERi (Mercadal 2022) — match exato do monolito Shock Path
const VNERI_GRADIENT =
  'linear-gradient(to right, #F44336 0%, #F44336 17%, #FFC107 17%, #FFC107 45%, #4CAF50 45%, #4CAF50 72%, #FFC107 72%, #FFC107 100%)'

/**
 * Barra de range com indicador deslizante — restaura o .vneri-bar do monolito (Shock Path).
 * Indicador branco 16px desliza sobre a barra colorida; feedback tatil imediato do valor calculado.
 */
export function RangeIndicator({ percent, gradient = VNERI_GRADIENT, zoneLabels }: RangeIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="my-2 mb-7">
      {zoneLabels && zoneLabels.length > 0 && (
        <div className="flex justify-between text-[11px] text-text-muted mb-1 px-0.5">
          {zoneLabels.map((z, i) => (
            <span key={i} className="text-center">{z}</span>
          ))}
        </div>
      )}
      <div className="relative">
        <div className="h-6 rounded-xl" style={{ background: gradient }} />
        <div
          className="absolute -top-1 w-4 h-8 rounded-lg bg-white transition-[left] duration-300"
          style={{ left: `${clamped}%`, transform: 'translateX(-50%)', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
          aria-hidden
        />
      </div>
    </div>
  )
}
