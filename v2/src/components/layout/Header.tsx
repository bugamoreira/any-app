import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'

interface HeaderProps {
  title: string
  subtitle?: string
  showLogo?: boolean
}

export function Header({ title, subtitle, showLogo = true }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="text-center px-4 py-6">
      <div className="max-w-[500px] mx-auto">
        {showLogo && (
          <img
            src={logo}
            alt="ANY App"
            className="max-w-[280px] w-full h-auto mx-auto cursor-pointer"
            onClick={() => navigate('/')}
          />
        )}
        {title && <h1 className="text-[24px] font-bold text-text-primary mt-3">{title}</h1>}
        {subtitle && <p className="text-[14px] text-text-muted mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
