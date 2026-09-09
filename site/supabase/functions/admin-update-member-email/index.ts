// Atualiza o e-mail de login de um membro: muda o e-mail no Auth (service_role,
// sem exigir reconfirmação) e sincroniza members.email e profiles.email.
// - O próprio membro pode alterar o seu e-mail (portal).
// - admin/presidencia/secretaria podem alterar o de qualquer membro (passando member_id).
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

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

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

    const { email, member_id } = await req.json()
    if (!email || !EMAIL_RE.test(String(email))) return json({ error: 'E-mail inválido.' }, 400)

    const { data: prof } = await caller.from('profiles').select('role').eq('id', user.id).single()
    const staff = ['admin', 'presidencia', 'secretaria'].includes(prof?.role)

    const admin = createClient(url, service, { auth: { persistSession: false } })

    // Descobre qual membro será alterado.
    let targetMemberId: string
    if (member_id && staff) {
      targetMemberId = member_id
    } else {
      const { data: mine } = await admin.from('members').select('id').eq('user_id', user.id).maybeSingle()
      if (!mine) return json({ error: 'Membro não encontrado para este usuário.' }, 403)
      targetMemberId = mine.id
    }

    const { data: target, error: terr } = await admin
      .from('members').select('user_id').eq('id', targetMemberId).single()
    if (terr) return json({ error: terr.message }, 400)
    if (!target?.user_id) return json({ error: 'Este membro não possui login.' }, 400)

    const { error: aerr } = await admin.auth.admin.updateUserById(target.user_id, {
      email: String(email),
      email_confirm: true
    })
    if (aerr) return json({ error: aerr.message }, 400)

    await admin.from('members').update({ email }).eq('id', targetMemberId)
    await admin.from('profiles').update({ email }).eq('id', target.user_id)

    return json({ ok: true, email })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
