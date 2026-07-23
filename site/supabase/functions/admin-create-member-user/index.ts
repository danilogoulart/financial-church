// Cria um usuário de login para um membro, com papel 'membro'.
// Só admin pode chamar. Usa a service_role (disponível como env na Edge Function).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') ?? ''

    // Verifica que quem chamou é admin (usando o token do chamador).
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: uerr } = await caller.auth.getUser()
    if (uerr || !user) return json({ error: 'Não autenticado.' }, 401)

    const { data: prof } = await caller.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') return json({ error: 'Apenas admin pode criar acessos.' }, 403)

    const { member_id, email, password } = await req.json()
    if (!member_id || !email) return json({ error: 'member_id e email são obrigatórios.' }, 400)

    const pass = password && String(password).length >= 6
      ? String(password)
      : Math.random().toString(36).slice(2, 10) + 'A1!'

    const admin = createClient(url, service, { auth: { persistSession: false } })

    const { data: created, error: cerr } = await admin.auth.admin.createUser({
      email,
      password: pass,
      email_confirm: true
    })
    if (cerr) return json({ error: cerr.message }, 400)
    const newId = created.user!.id

    await admin.from('profiles').upsert({ id: newId, email, role: 'membro' }, { onConflict: 'id' })

    const { error: merr } = await admin.from('members').update({ user_id: newId, email }).eq('id', member_id)
    if (merr) return json({ error: merr.message }, 400)

    return json({ ok: true, email, password: pass })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
