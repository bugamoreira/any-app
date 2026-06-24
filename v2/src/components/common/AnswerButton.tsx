import type { ReactNode } from 'react'

interface AnswerButtonProps {
  children: ReactNode
  /** Cor clinica do botao (hex). Ex: success para "sim seguro", danger para "nao", warning para "talvez". */
  color: string
  onClick?: () => void
  /** Icone opcional a esquerda (renderizado em chip 32x32 tingido). */
  icon?: ReactNode
  /** Botao ocupa toda a largura disponivel (default true em coluna; passe false para ficar em linha flex). */
  fill?: boolean
}

// Converte #RRGGBB em rgba para o fundo tingido
function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Botao de decisao clinica — restaura o padrao do monolito (Tox Path, .answer-btn).
 * Fundo rgba(cor, 0.1) + borda 2px cor + texto cor. Estado ativo preenche em cor solida.
 * Cor guia a escolha visualmente: o medico responde pela cor, nao pela leitura.
 */
export function AnswerButton({ children, color, onClick, icon, fill = true }: AnswerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${fill ? 'w-full' : 'flex-1'} flex items-center gap-3 text-left min-h-[56px] px-4 py-3.5 rounded-xl text-[15px] font-semibold cursor-pointer transition-colors`}
      style={{
        background: rgba(color, 0.1),
        border: `2px solid ${color}`,
        color,
      }}
    >
      {icon && (
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: rgba(color, 0.15) }}
        >
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
    </button>
  )
}
