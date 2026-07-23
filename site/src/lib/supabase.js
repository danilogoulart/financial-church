import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.PUBLIC_SUPABASE_URL
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Site: defina PUBLIC_SUPABASE_URL e PUBLIC_SUPABASE_ANON_KEY (.env).')
}

// Cliente anônimo (somente leitura, restrito ao conteúdo publicado pela RLS).
export const supabase = createClient(url, anonKey)

// URL pública de uma imagem no bucket público 'site'.
export function imageUrl(path) {
  if (!path) return null
  return `${url}/storage/v1/object/public/site/${path}`
}
