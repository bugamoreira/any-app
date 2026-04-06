import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Hook que registra pageview automaticamente ao montar
 * Uso: usePageview('shock') no topo de cada page component
 */
export function usePageview(tool: string) {
  const location = useLocation()

  useEffect(() => {
    async function log() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('pageviews').insert({
          user_id: user.id,
          tool,
          action: 'open',
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
        })

        // Update last_seen
        await supabase.from('profiles').update({
          last_seen_at: new Date().toISOString()
        }).eq('id', user.id)
      } catch {
        // Silent fail — analytics should never break the app
      }
    }

    log()
  }, [tool, location.pathname])
}
