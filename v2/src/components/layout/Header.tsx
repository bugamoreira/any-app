import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'

interface HeaderProps {
  title?: string
  subtitle?: string
  showLogo?: boolean
}

/**
 * Header centralizado. Remove o hack translate-x-[6px] — logo fica alinhado
 * pelo flex do container. Padding reduzido (py-4) para dar mais espaço ao
 * conteúdo. Título/subtítulo opcionais aparecem abaixo do logo com hierarquia
 * tipográfica clara.
 */
export function Header({ title, subtitle, showLogo = true }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="flex flex-col items-center text-center px-4 py-4">
      {showLogo && (
        <button
          type="button"
          onClick={() => navigate('/')}
          className="block mx-auto cursor-pointer bg-transparent border-0 p-0"
          aria-label="Ir para o Hub"
        >
          <img
            src={logo}
            alt="ANY App"
            className="max-w-[240px] w-full h-auto block"
          />
        </button>
      )}
      {title && (
        <h1 className="text-[22px] font-bold text-text-primary mt-3 leading-tight text-balance">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-[13px] text-text-muted mt-1 leading-snug">
          {subtitle}
        </p>
      )}
    </header>
  )
}
