import { supabase } from './supabase'

// Todas as consultas usam a chave anon; a RLS já garante que só o conteúdo
// com published = true é retornado. Os filtros abaixo são redundância segura.

export async function getPosts(limit) {
  let q = supabase
    .from('site_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  if (error) {
    console.error(error)
    return []
  }
  return data
}

export async function getPost(slug) {
  const { data, error } = await supabase
    .from('site_posts')
    .select('*')
    .eq('published', true)
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error(error)
    return null
  }
  return data
}

export async function getEvents({ limit, upcomingOnly } = {}) {
  let q = supabase.from('site_events').select('*').eq('published', true)
  if (upcomingOnly) q = q.gte('starts_at', new Date().toISOString())
  q = q.order('starts_at', { ascending: !!upcomingOnly })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  if (error) {
    console.error(error)
    return []
  }
  return data
}

export async function getStudies(limit) {
  let q = supabase
    .from('site_studies')
    .select('*')
    .eq('published', true)
    .order('studied_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  if (error) {
    console.error(error)
    return []
  }
  return data
}
