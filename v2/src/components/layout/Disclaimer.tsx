export function Disclaimer() {
  return (
    // O index.html usa viewport-fit=cover + status-bar-style black-translucent:
    // a pagina e desenhada POR BAIXO da barra de status do iPhone. Sem somar o
    // safe-area-inset-top, o relogio e os icones caem em cima deste texto.
    <div
      className="sticky top-0 z-50 bg-warning text-black text-center py-2.5 px-4 text-xs font-semibold"
      style={{ paddingTop: 'calc(0.625rem + env(safe-area-inset-top))' }}
    >
      <strong>Ferramenta de apoio em teste</strong> — não substitui o julgamento clínico. Confirme antes de usar.
    </div>
  )
}
