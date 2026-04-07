export function Splash() {
  return (
    <div className="fixed inset-0 z-[10000] bg-bg-primary flex flex-col items-center justify-center gap-6">
      <img
        src="/splash-logo.jpeg"
        alt="ANY App"
        className="w-[200px] rounded-2xl shadow-2xl animate-pulse"
        onError={(e) => {
          const el = e.target as HTMLImageElement
          el.style.display = 'none'
        }}
      />
      <div className="text-sm text-text-muted animate-fade-in">
        Carregando...
      </div>
    </div>
  )
}
