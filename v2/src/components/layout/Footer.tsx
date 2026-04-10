interface FooterProps {
  toolName: string
  version: string
  updatedAt?: string
}

export function Footer({ toolName, version, updatedAt }: FooterProps) {
  // v1: fixed bottom, bg #000, border-top 1px #444, padding 12px 16px, z-index 50
  return (
    <footer className="fixed bottom-0 left-0 right-0 text-center py-3 px-4 bg-black border-t border-border-card z-50">
      <div className="max-w-[500px] mx-auto">
        <div className="text-[12px] text-text-muted mb-0.5">
          Gustavo Moreira &#8226; Gabriela Feltrin &#8226; João Pedro Moreira
        </div>
        <div className="text-[10px] text-[#555]">
          {toolName} {version} — ANY App{updatedAt ? ` — ${updatedAt}` : ''}
        </div>
      </div>
    </footer>
  )
}
