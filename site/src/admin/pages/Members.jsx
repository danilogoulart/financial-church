import { useContext, useEffect, useRef, useState } from 'react'
import {
  createMember,
  createMemberUser,
  deleteMemberFull,
  getProfileRole,
  listCargoNames,
  listMembersPage,
  listMinistryNames,
  setMemberActive,
  setMemberRole,
  setProfileRole,
  updateMember,
  uploadAsset
} from '../api'
import Pagination from '../components/Pagination.jsx'
import { RoleContext } from '../role'

const EMPTY = {
  name: '', phone: '', email: '', family: '', cargo: '', ministries: [], active: true,
  matricula: '', rg: '', cpf: '', birth_date: '', joined_date: '',
  note: '', entry_type: '', previous_pastor: '', previous_church: '',
  role: '', _userId: null, _role0: ''
}
const SIZE = 20

// Formas de entrada na igreja.
const ENTRY_TYPES = [
  { value: 'batismo', label: 'Por batismo (admissão)' },
  { value: 'carta', label: 'Por carta' },
  { value: 'aclamacao', label: 'Por aclamação' }
]

// Papéis que a secretaria pode atribuir (sem os protegidos: admin/presidencia/tesoureiro).
const ACCESS_ROLES = [
  { value: 'membro', label: 'Membro (portal)' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'editor', label: 'Editor (site/mídia)' }
]
// Admin/presidencia pode atribuir qualquer papel.
const ALL_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'presidencia', label: 'Presidência' },
  { value: 'tesoureiro', label: 'Tesoureiro' },
  ...ACCESS_ROLES
]
// Papéis protegidos: só admin/presidencia mexe. Para a secretaria aparecem como leitura.
const PROTECTED_LABELS = { admin: 'Administrador', presidencia: 'Presidência', tesoureiro: 'Tesoureiro' }

export default function Members() {
  const { canWriteMembers: canWrite, isAdmin } = useContext(RoleContext)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [reload, setReload] = useState(0)
  const [filters, setFilters] = useState({ search: '', cargo: '', activeOnly: false })
  const [cargos, setCargos] = useState([])
  const [ministries, setMinistries] = useState([])
  const [existingPhoto, setExistingPhoto] = useState(null)
  const photoRef = useRef(null)

  useEffect(() => {
    listCargoNames().then(setCargos).catch(() => {})
    listMinistryNames().then(setMinistries).catch(() => {})
  }, [])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleMinistry(m) {
    setForm((f) => ({
      ...f,
      ministries: f.ministries.includes(m)
        ? f.ministries.filter((x) => x !== m)
        : [...f.ministries, m]
    }))
  }

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(0)
  }

  async function load() {
    try {
      const { rows, total } = await listMembersPage(page, SIZE, filters)
      setRows(rows)
      setTotal(total)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reload, filters])

  const refresh = () => setReload((r) => r + 1)

  function startEdit(m) {
    setEditingId(m.id)
    setExistingPhoto(m.photo_path || null)
    setForm({
      name: m.name,
      phone: m.phone || '',
      email: m.email || '',
      family: m.family || '',
      cargo: m.cargo || '',
      ministries: m.ministries || [],
      active: m.active,
      matricula: m.matricula || '',
      rg: m.rg || '',
      cpf: m.cpf || '',
      birth_date: m.birth_date || '',
      joined_date: m.joined_date || '',
      note: m.note || '',
      entry_type: m.entry_type || '',
      previous_pastor: m.previous_pastor || '',
      previous_church: m.previous_church || '',
      role: '',
      _userId: m.user_id || null,
      _role0: ''
    })
    // Carrega o papel de acesso atual (se o membro tiver login).
    if (m.user_id) {
      getProfileRole(m.user_id)
        .then((r) => setForm((f) => (f._userId === m.user_id ? { ...f, role: r || '', _role0: r || '' } : f)))
        .catch(() => {})
    }
    if (photoRef.current) photoRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setExistingPhoto(null)
    setForm(EMPTY)
    setBanner(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      const photoFile = photoRef.current?.files?.[0]
      const photo_path = photoFile ? await uploadAsset(photoFile, 'members/') : (editingId ? existingPhoto : null)

      const payload = {
        name: form.name.trim(),
        phone: form.phone,
        email: form.email || null,
        family: form.family,
        cargo: form.cargo || null,
        ministries: form.ministries,
        matricula: form.matricula || null,
        rg: form.rg || null,
        cpf: form.cpf || null,
        birth_date: form.birth_date || null,
        joined_date: form.joined_date || null,
        note: form.note || null,
        entry_type: form.entry_type || null,
        previous_pastor: form.previous_pastor || null,
        previous_church: form.previous_church || null,
        photo_path
      }
      if (editingId) {
        await updateMember(editingId, { ...payload, active: form.active })
        // Papel de acesso (só se o membro tem login e o papel mudou).
        // Admin/presidencia edita direto (RLS); secretaria via RPC restrito.
        if (form._userId && form.role && form.role !== form._role0) {
          if (isAdmin) await setProfileRole(form._userId, form.role)
          else await setMemberRole(editingId, form.role)
        }
        setBanner({ type: 'ok', msg: 'Membro atualizado.' })
        setEditingId(null)
      } else {
        const m = await createMember({ ...payload, active: true })
        setBanner({ type: 'ok', msg: `Membro "${m.name}" cadastrado.` })
        setPage(0)
      }
      setForm(EMPTY)
      setExistingPhoto(null)
      if (photoRef.current) photoRef.current.value = ''
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(m) {
    try {
      await setMemberActive(m.id, !m.active)
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function removeMember(m) {
    const msg = m.user_id
      ? `Excluir "${m.name}"? O login/acesso dele também será removido. Não dá para desfazer.`
      : `Excluir "${m.name}"? Não dá para desfazer.`
    if (!window.confirm(msg)) return
    try {
      await deleteMemberFull(m.id)
      setBanner({ type: 'ok', msg: 'Membro excluído.' })
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function createAccess(m) {
    if (!m.email) {
      setBanner({ type: 'err', msg: 'Cadastre o e-mail do membro primeiro.' })
      return
    }
    const pass = window.prompt(`Senha inicial para ${m.email} (em branco = gerar automática):`, '')
    if (pass === null) return
    try {
      const res = await createMemberUser(m.id, m.email, pass)
      setBanner({ type: 'ok', msg: `Acesso criado — e-mail: ${res.email} · senha: ${res.password}` })
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  return (
    <>
      {canWrite && (
      <form className="card" onSubmit={save}>
        <h2>{editingId ? 'Editar Membro' : 'Novo Membro'}</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}

        <label>Nome</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} required />

        <div className="row">
          <div>
            <label>Telefone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label>E-mail <small>(p/ acesso do membro)</small></label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>

        <label>Família</label>
        <input value={form.family} onChange={(e) => set('family', e.target.value)} />

        <label>Cargo</label>
        <select value={form.cargo} onChange={(e) => set('cargo', e.target.value)}>
          <option value="">—</option>
          {cargos.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label>Ministérios</label>
        {ministries.length === 0 ? (
          <small>Nenhum ministério cadastrado (adicione em Configurações).</small>
        ) : (
          <div className="check-list">
            {ministries.map((m) => (
              <label key={m} className="check-item">
                <input
                  type="checkbox"
                  checked={form.ministries.includes(m)}
                  onChange={() => toggleMinistry(m)}
                />
                {m}
              </label>
            ))}
          </div>
        )}

        <div className="row">
          <div>
            <label>Matrícula</label>
            <input value={form.matricula} onChange={(e) => set('matricula', e.target.value)} placeholder="Ex.: 0224" />
          </div>
          <div>
            <label>Data de entrada na igreja</label>
            <input type="date" value={form.joined_date} onChange={(e) => set('joined_date', e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>RG</label>
            <input value={form.rg} onChange={(e) => set('rg', e.target.value)} />
          </div>
          <div>
            <label>CPF</label>
            <input value={form.cpf} onChange={(e) => set('cpf', e.target.value)} />
          </div>
        </div>
        <label>Data de nascimento</label>
        <input type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />

        <label>Forma de entrada na igreja</label>
        <select value={form.entry_type} onChange={(e) => set('entry_type', e.target.value)}>
          <option value="">—</option>
          {ENTRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <div className="row">
          <div>
            <label>Último pastor <small>(igreja anterior)</small></label>
            <input value={form.previous_pastor} onChange={(e) => set('previous_pastor', e.target.value)} />
          </div>
          <div>
            <label>Última igreja</label>
            <input value={form.previous_church} onChange={(e) => set('previous_church', e.target.value)} />
          </div>
        </div>

        <label>Observações <small>(histórico do membro)</small></label>
        <textarea rows={3} value={form.note} onChange={(e) => set('note', e.target.value)} />

        {editingId && form._userId && (
          !isAdmin && PROTECTED_LABELS[form._role0] ? (
            <>
              <label>Tipo de acesso</label>
              <small>{PROTECTED_LABELS[form._role0]} — somente admin/presidência altera este papel.</small>
            </>
          ) : (
            <>
              <label>Tipo de acesso <small>(papel de login do membro)</small></label>
              <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                {(isAdmin ? ALL_ROLES : ACCESS_ROLES).map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </>
          )
        )}
        {editingId && !form._userId && (
          <>
            <label>Tipo de acesso</label>
            <small>
              Este membro ainda não tem acesso (login). Clique em <b>criar acesso</b> na lista
              de membros para definir o papel.
            </small>
          </>
        )}

        <label style={{ marginTop: 14 }}>
          Foto <small>{existingPhoto ? '(há uma; envie outra para substituir)' : '(opcional)'}</small>
        </label>
        <input ref={photoRef} type="file" accept="image/*" />

        {editingId && (
          <div className="check">
            <input id="active" type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            <label htmlFor="active" style={{ margin: 0 }}>Ativo</label>
          </div>
        )}

        <button className="primary" disabled={saving}>
          {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
        </button>
        {editingId && (
          <button type="button" className="link-btn" style={{ marginTop: 10 }} onClick={cancelEdit}>
            Cancelar edição
          </button>
        )}
      </form>
      )}

      <div className="card">
        <h2>Membros</h2>

        <div className="row">
          <div style={{ flex: 2 }}>
            <label>Buscar por nome</label>
            <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Digite um nome..." />
          </div>
          <div>
            <label>Cargo</label>
            <select value={filters.cargo} onChange={(e) => setFilter('cargo', e.target.value)}>
              <option value="">Todos</option>
              {cargos.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="check">
          <input
            id="activeOnly"
            type="checkbox"
            checked={filters.activeOnly}
            onChange={(e) => setFilter('activeOnly', e.target.checked)}
          />
          <label htmlFor="activeOnly" style={{ margin: 0 }}>Somente ativos</label>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Ministérios</th>
                <th>Ativo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} style={{ opacity: m.active ? 1 : 0.5 }}>
                  <td>{m.name}</td>
                  <td>{m.cargo || '—'}</td>
                  <td>{(m.ministries || []).join(', ') || '—'}</td>
                  <td>{m.active ? 'Sim' : 'Não'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {canWrite ? (
                      <>
                        <button className="link-btn" onClick={() => startEdit(m)}>editar</button>
                        {' · '}
                        <button className="link-btn" onClick={() => toggleActive(m)}>
                          {m.active ? 'desativar' : 'ativar'}
                        </button>
                        {isAdmin && (m.user_id ? (
                          <span style={{ color: '#888' }}>{' · '}com acesso</span>
                        ) : (
                          <>
                            {' · '}
                            <button className="link-btn" onClick={() => createAccess(m)}>criar acesso</button>
                          </>
                        ))}
                        {' · '}
                        <button className="link-btn" style={{ color: 'var(--expense)' }} onClick={() => removeMember(m)}>
                          excluir
                        </button>
                      </>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ color: '#999' }}>Nenhum membro ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} size={SIZE} total={total} onPage={setPage} />
      </div>
    </>
  )
}
