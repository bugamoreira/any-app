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
