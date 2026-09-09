// Ativa/desativa o acesso de um usuário. Desativar bane no Auth (bloqueia login)
// e marca profiles.active=false; ativar remove o ban e marca active=true.
// Só admin/presidencia pode chamar. Não permite desativar a si mesmo.
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

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: uerr } = await caller.auth.getUser()
    if (uerr || !user) return json({ error: 'Não autenticado.' }, 401)

    const { data: prof } = await caller.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'presidencia'].includes(prof?.role)) {
      return json({ error: 'Sem permissão.' }, 403)
    }

    const { user_id, active } = await req.json()
    if (!user_id || typeof active !== 'boolean') {
      return json({ error: 'user_id e active são obrigatórios.' }, 400)
    }
    if (user_id === user.id) {
      return json({ error: 'Você não pode desativar o seu próprio acesso.' }, 400)
    }

    const admin = createClient(url, service, { auth: { persistSession: false } })

    const { error: berr } = await admin.auth.admin.updateUserById(user_id, {
      ban_duration: active ? 'none' : '876000h'
    })
    if (berr) return json({ error: berr.message }, 400)

    const { error: perr } = await admin.from('profiles').update({ active }).eq('id', user_id)
    if (perr) return json({ error: perr.message }, 400)

    return json({ ok: true, active })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
