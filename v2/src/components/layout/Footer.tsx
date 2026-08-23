import { findGuidelinesFor } from '../../data/guidelines'

interface FooterProps {
  toolName: string
  version: string
  updatedAt?: string
}

export function Footer({ toolName, version, updatedAt }: FooterProps) {
  // v1: fixed bottom, bg #000, border-top 1px #444, padding 12px 16px, z-index 50
  const guidelines = findGuidelinesFor(toolName)
  return (
    // paddingBottom soma o safe-area-inset-bottom: sem isso o rodape fica sob o
    // indicador de home do iPhone.
    <footer
      className="fixed bottom-0 left-0 right-0 text-center py-3 px-4 bg-black border-t border-border-card z-50"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-[500px] mx-auto">
        <div className="text-[14px] font-semibold text-warning mb-0.5">
          Gustavo Moreira
        </div>
        <div className="text-[10px] text-[#555]">
          {toolName} {version} — ANY App{updatedAt ? ` — ${updatedAt}` : ''}
        </div>
        {guidelines.length > 0 && (
          <div className="text-[10px] text-[#555]">
            Baseado em: {guidelines.map(g => `${g.name} (${g.year})`).join(' · ')}
          </div>
        )}
      </div>
    </footer>
  )
}
