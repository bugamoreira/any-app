export function Splash() {
  return (
    <div className="fixed inset-0 z-[10000] bg-bg-primary flex flex-col items-center justify-center gap-6">
      <div className="w-[180px] h-[180px] rounded-[20px] overflow-hidden animate-pulse" style={{ boxShadow: '0 0 0 6px #000, 0 0 0 7px #000' }}>
        <img
          src="/splash-logo.jpeg"
          alt="ANY App"
          className="w-full h-full object-cover scale-110"
          onError={(e) => {
            const el = e.target as HTMLImageElement
            el.style.display = 'none'
          }}
        />
      </div>
      <div className="text-sm text-text-muted animate-fade-in">
        Carregando...
      </div>
    </div>
  )
}
