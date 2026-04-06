interface FooterProps {
  toolName: string
  version: string
}

export function Footer({ toolName, version }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 text-center py-3 px-4 bg-bg-primary border-t border-border z-40">
      <div className="text-xs text-text-secondary mb-0.5">
        Gustavo Moreira &#8226; Gabriela Feltrin &#8226; Joao Pedro Moreira
      </div>
      <div className="text-[10px] text-text-muted">
        {toolName} {version} — ANY App
      </div>
    </footer>
  )
}
