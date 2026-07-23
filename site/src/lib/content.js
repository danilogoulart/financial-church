import { supabase } from './supabase'
import { nextOccurrence } from './events'

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

// Eventos futuros: busca todos publicados e calcula a próxima ocorrência
// (necessário porque eventos recorrentes têm starts_at no passado). Retorna
// cada evento com `next` (Date) já ordenado; filtra os que não têm ocorrência futura.
export async function getUpcomingEvents(limit) {
  const { data, error } = await supabase.from('site_events').select('*').eq('published', true)
  if (error) {
    console.error(error)
    return []
  }
  const upcoming = data
    .map((e) => ({ ...e, next: nextOccurrence(e) }))
    .filter((e) => e.next)
    .sort((a, b) => a.next - b.next)
  return limit ? upcoming.slice(0, limit) : upcoming
}

export async function getEventBySlug(slug) {
  const { data, error } = await supabase
    .from('site_events')
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

export async function getBanners() {
  const { data, error } = await supabase
    .from('site_banners')
    .select('*')
    .eq('published', true)
    .order('sort', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) {
    console.error(error)
    return []
  }
  return data
}

// Páginas institucionais marcadas para aparecer no menu.
export async function getMenuPages() {
  const { data, error } = await supabase
    .from('site_pages')
    .select('title, slug')
    .eq('published', true)
    .eq('show_in_menu', true)
    .order('sort', { ascending: true })
  if (error) {
    console.error(error)
    return []
  }
  return data
}

export async function getPage(slug) {
  const { data, error } = await supabase
    .from('site_pages')
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
