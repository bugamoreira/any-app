import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://meatbfomblpicftrzcsy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lYXRiZm9tYmxwaWNmdHJ6Y3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODE3MDAsImV4cCI6MjA5MDQ1NzcwMH0.QU5AuqMOp-V5QZWdLzfPME1ppBFLJRaB2qgjcivaEoI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
