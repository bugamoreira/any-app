import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  subtitle?: string
  showLogo?: boolean
}

export function Header({ title, subtitle, showLogo = true }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="text-center py-5 px-4">
      {showLogo && (
        <img
          src="/logo.png"
          alt="ANY App"
          className="max-w-[280px] w-full h-auto mx-auto cursor-pointer"
          onClick={() => navigate('/')}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      {title && <h1 className="text-xl font-bold text-text-primary mt-2">{title}</h1>}
      {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
    </div>
  )
}
