import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail-fast: sem fallback hardcoded (CLAUDE.md §13.3 — nada de chaves no codigo).
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ausentes. Crie v2/.env a partir de v2/.env.example.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Provedores de login realmente habilitados no projeto do Supabase.
 *
 * Sem isso, um botao de provedor ainda nao configurado leva o usuario para uma
 * pagina de ERRO JSON CRU do Supabase: o `signInWithOAuth` navega o browser
 * antes de qualquer tratamento em JS, entao nao adianta tentar capturar o erro
 * no app. Perguntando aqui, o botao so aparece quando o provedor existe — e
 * aparece sozinho no momento em que for configurado, sem precisar de deploy.
 */
export async function fetchEnabledProviders(): Promise<Record<string, boolean>> {
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    })
    if (!r.ok) return {}
    const data = await r.json()
    return (data?.external ?? {}) as Record<string, boolean>
  } catch {
    return {}
  }
}
