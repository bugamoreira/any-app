interface FooterProps {
  toolName: string
  version: string
  updatedAt?: string
}

/**
 * Footer estático no fim da página — NÃO mais fixed.
 * Motivo: em tela de celular, footer fixo rouba ~56px permanentes do viewport
 * e comprime o conteúdo útil. Ao rolar até o fim, o usuário já esgotou o
 * conteúdo da ferramenta; o footer aparece naturalmente.
 */
export function Footer({ toolName, version, updatedAt }: FooterProps) {
  return (
    <footer className="mt-12 pt-6 pb-8 px-4 border-t border-border text-center">
      <div className="max-w-[500px] mx-auto space-y-1">
        <div className="text-[12px] text-text-muted">
          Gustavo Moreira &#8226; Gabriela Feltrin &#8226; João Pedro Moreira
        </div>
        <div className="text-[10px] text-text-muted/70">
          {toolName} {version} — ANY App{updatedAt ? ` — ${updatedAt}` : ''}
        </div>
      </div>
    </footer>
  )
}
