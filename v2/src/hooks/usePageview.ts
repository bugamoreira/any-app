import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Registra pageview IDENTIFICADO (com user_id).
 *
 * Historico: de 08/08 a 23/08/2026 o registro foi anonimo por decisao de LGPD.
 * Revertido em 23/08 a pedido do Gustavo — sem o user_id nao da para saber
 * quantas PESSOAS distintas usam cada ferramenta, so quantas aberturas houve.
 * Todas as rotas sao protegidas, entao quem gera evento ja esta autenticado;
 * o id vem do Supabase Auth e independe do provedor (Google, Microsoft, ...).
 *
 * RLS: a policy "Users can insert own pageviews" exige auth.uid() = user_id.
 * A policy "Anonymous pageviews (authenticated)" continua valendo para o caso
 * de a sessao ainda nao ter carregado — dai o insert vai com user_id null.
 */
export function usePageview(tool: string) {
  const location = useLocation()

  useEffect(() => {
    async function log() {
      try {
        // getSession le do storage local, sem ida ao servidor
        const { data: { session } } = await supabase.auth.getSession()
        await supabase.from('pageviews').insert({
          tool,
          user_id: session?.user?.id ?? null,
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
