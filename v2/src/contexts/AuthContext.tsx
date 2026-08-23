import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/** Provedores habilitados. 'azure' e como o Supabase chama a Microsoft. */
export type AuthProvider = 'google' | 'azure'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  /** Devolve a mensagem de erro, ou null em caso de sucesso. */
  signInWith: (provider: AuthProvider) => Promise<string | null>
  /** Atalho historico — o app inteiro chamava isso antes de existir a Microsoft. */
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWith(provider: AuthProvider) {
    // Redireciona para a origem ATUAL, seja anyapp.netlify.app ou any.app.br.
    // Quem autoriza e a lista de Redirect URLs do Supabase; o console do Google
    // e o do Azure apontam sempre para o callback do proprio Supabase e nao
    // mudam quando o dominio muda.
    const redirectUrl = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      // 'azure' precisa pedir os escopos explicitamente para vir com e-mail e nome
      options: provider === 'azure'
        ? { redirectTo: redirectUrl, scopes: 'email openid profile' }
        : { redirectTo: redirectUrl },
    })
    if (!error) return null
    // Sem tratamento, um provedor ainda nao configurado no Supabase vira botao
    // morto: o usuario toca e nada acontece. Melhor dizer o que houve.
    return /not enabled|unsupported|disabled/i.test(error.message)
      ? 'Este login ainda não está disponível. Use o Google por enquanto.'
      : 'Não foi possível entrar. Tente novamente.'
  }

  async function signInWithGoogle() {
    return signInWith('google')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signInWith,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
