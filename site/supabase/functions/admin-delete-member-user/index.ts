// Exclui um membro e, se houver, o login (auth user) vinculado.
// Só admin/presidencia/secretaria. Usa a service_role.
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
    if (!['admin', 'presidencia', 'secretaria'].includes(prof?.role)) {
      return json({ error: 'Sem permissão para excluir membros.' }, 403)
    }

    const { member_id } = await req.json()
    if (!member_id) return json({ error: 'member_id é obrigatório.' }, 400)

    const admin = createClient(url, service, { auth: { persistSession: false } })

    // Busca o login vinculado e o remove (cascata: apaga o profile também).
    const { data: member } = await admin.from('members').select('user_id').eq('id', member_id).single()
    if (member?.user_id) {
      await admin.auth.admin.deleteUser(member.user_id)
    }

    const { error: derr } = await admin.from('members').delete().eq('id', member_id)
    if (derr) return json({ error: derr.message }, 400)

    return json({ ok: true })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
