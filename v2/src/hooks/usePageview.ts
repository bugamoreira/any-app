import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Mapa de rota -> slug de ferramenta gravado em `pageviews.tool`.
 *
 * Estes valores já existem no banco desde março/2026 (gravados pelo v1).
 * Alterar um slug quebra a série histórica daquela ferramenta.
 *
 * Ao adicionar uma ferramenta nova, registrar a rota aqui — rota fora
 * do mapa não é registrada.
 */
const TOOL_BY_PATH: Record<string, string> = {
  '/': 'hub',
  '/login': 'login',
  '/infusion': 'infusion',
  '/airway': 'airway',
  '/ped': 'ped',
  '/acls': 'acls',
  '/vm': 'vm',
  '/shock': 'shock',
  '/seda': 'seda',
  '/palia': 'palia',
  '/tox': 'tox',
  '/dengue': 'dengue',
  '/tep': 'tep',
  '/block': 'block',
  '/calculadoras': 'calculadoras',
}

/**
 * Registra um pageview a cada mudança de rota.
 *
 * Montado uma única vez em <App />, cobre todas as rotas do mapa acima —
 * inclusive as que forem criadas depois, sem precisar tocar nas páginas.
 *
 * Só registra usuário autenticado: a policy de RLS da tabela `pageviews`
 * exige `auth.uid() = user_id`, então insert sem sessão é rejeitado.
 */
export function usePageview() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const lastLogged = useRef<string | null>(null)

  useEffect(() => {
    const tool = TOOL_BY_PATH[pathname]
    if (!tool || !user) return

    // Trava contra registro duplicado: o <StrictMode> do main.tsx invoca o
    // efeito duas vezes em desenvolvimento, o que dobraria cada abertura.
    // Marcada antes do await para que a segunda chamada não passe enquanto
    // a primeira ainda está em voo.
    const key = `${user.id}|${pathname}`
    if (lastLogged.current === key) return
    lastLogged.current = key

    async function log(userId: string) {
      try {
        await supabase.from('pageviews').insert({
          user_id: userId,
          tool,
          action: 'open',
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
          // Marca as linhas geradas por `npm run dev` para que os testes
          // locais possam ser filtrados ou apagados depois. Em produção
          // fica null, como o v1 grava.
          metadata: import.meta.env.DEV ? { env: 'dev' } : null,
        })

        await supabase.from('profiles').update({
          last_seen_at: new Date().toISOString()
        }).eq('id', userId)
      } catch {
        // Silent fail — analytics should never break the app
      }
    }

    log(user.id)
  }, [pathname, user])
}
