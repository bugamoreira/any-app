import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Captura excecoes de render da subarvore e mostra fallback com saida segura.
 * Sem isso, qualquer erro de render desmonta o app inteiro (tela preta) —
 * inaceitavel durante um atendimento.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary capturou:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-5 p-6 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Algo deu errado</h1>
          <p className="text-sm text-text-secondary max-w-[320px] leading-relaxed">
            Esta ferramenta encontrou um erro inesperado. As demais ferramentas seguem
            funcionando normalmente.
          </p>
          <button
            onClick={() => window.location.assign('/')}
            className="bg-accent text-white font-semibold text-base rounded-lg px-6 py-3 min-h-[44px]"
          >
            Voltar ao início
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
