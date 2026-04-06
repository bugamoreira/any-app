import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'

/**
 * Wrapper que inclui providers necessarios para renderizar componentes
 * MemoryRouter para componentes que usam useNavigate/Link
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  )
}

/**
 * Render customizado que injeta providers automaticamente
 * Uso: renderApp(<MeuComponente />) em vez de render(...)
 */
export function renderApp(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export { render }
