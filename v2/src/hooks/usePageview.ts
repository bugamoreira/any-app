import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Registra pageview ANONIMO (sem user_id) — decisao LGPD 08/08/2026:
 * analytics identificado so apos definicao juridica. A RLS aceita insert
 * anonimo de usuarios autenticados (policy "Anonymous pageviews").
 */
export function usePageview(tool: string) {
  const location = useLocation()

  useEffect(() => {
    async function log() {
      try {
        await supabase.from('pageviews').insert({
          tool,
          action: 'open',
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
        })
      } catch {
        // Analytics nunca pode quebrar o app
      }
    }
    log()
  }, [tool, location.pathname])
}
