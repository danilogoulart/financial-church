import { supabase } from './supabase'
import { nextOccurrence, scheduleLabel } from './events'

// Todas as consultas usam a chave anon; a RLS já garante que só o conteúdo
// com published = true é retornado. Os filtros abaixo são redundância segura.

export async function getPosts(limit) {
  let q = supabase
    .from('site_posts')
    .select('*')
    .eq('published', true)
    .order('featured', { ascending: false })
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

export async function getFeaturedPosts() {
  const { data, error } = await supabase
    .from('site_posts')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) {
    console.error(error)
    return []
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

// Eventos em destaque (com ocorrência futura), para o carrossel.
export async function getFeaturedEvents() {
  const { data, error } = await supabase
    .from('site_events')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
  if (error) {
    console.error(error)
    return []
  }
  return data
    .map((e) => ({ ...e, next: nextOccurrence(e) }))
    .filter((e) => e.next)
    .sort((a, b) => a.next - b.next)
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

// Monta os slides do carrossel a partir de 3 fontes:
//  1. Banners manuais (site_banners)
//  2. Eventos marcados como destaque
//  3. Notícias marcadas como destaque
export async function getCarousel() {
  const [banners, events, news] = await Promise.all([
    getBanners(),
    getFeaturedEvents(),
    getFeaturedPosts()
  ])

  const slides = []

  banners.forEach((b) =>
    slides.push({
      type: 'banner',
      image: b.image_path,
      title: b.title || '',
      subtitle: b.subtitle || '',
      href: b.link_url || ''
    })
  )

  events.forEach((e) =>
    slides.push({
      type: 'event',
      image: e.cover_path,
      title: e.title,
      subtitle: [scheduleLabel(e), e.location].filter(Boolean).join(' · '),
      href: `/eventos/${e.slug}`
    })
  )

  news.forEach((p) =>
    slides.push({
      type: 'news',
      image: p.cover_path,
      title: p.title,
      excerpt: p.excerpt || '',
      href: `/noticias/${p.slug}`
    })
  )

  return slides
}
