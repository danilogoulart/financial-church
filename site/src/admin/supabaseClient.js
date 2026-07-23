import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.PUBLIC_SUPABASE_URL
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Ajuda a diagnosticar deploy sem variáveis de ambiente.
  console.error(
    'Configuração ausente: defina PUBLIC_SUPABASE_URL e PUBLIC_SUPABASE_ANON_KEY (.env).'
  )
}

export const supabase = createClient(url, anonKey)
