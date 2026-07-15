import { useContext, useEffect, useRef, useState } from 'react'
import {
  createMember,
  listCargoNames,
  listMembersPage,
  listMinistryNames,
  setMemberActive,
  updateMember,
  uploadAsset
} from '../api'
import Pagination from '../components/Pagination.jsx'
import { RoleContext } from '../role'

const EMPTY = { name: '', phone: '', family: '', cargo: '', ministries: [], tither: true, active: true }
const SIZE = 20

export default function Members() {
  const { canWrite } = useContext(RoleContext)
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
      family: m.family || '',
      cargo: m.cargo || '',
      ministries: m.ministries || [],
      tither: m.tither,
      active: m.active
    })
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
        family: form.family,
        cargo: form.cargo || null,
        ministries: form.ministries,
        tither: form.tither,
        photo_path
      }
      if (editingId) {
        await updateMember(editingId, { ...payload, active: form.active })
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
            <label>Família</label>
            <input value={form.family} onChange={(e) => set('family', e.target.value)} />
          </div>
        </div>

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

        <label style={{ marginTop: 14 }}>
          Foto <small>{existingPhoto ? '(há uma; envie outra para substituir)' : '(opcional)'}</small>
        </label>
        <input ref={photoRef} type="file" accept="image/*" />

        <div className="check">
          <input id="tither" type="checkbox" checked={form.tither} onChange={(e) => set('tither', e.target.checked)} />
          <label htmlFor="tither" style={{ margin: 0 }}>É dizimista</label>
        </div>

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
                <th>Dizimista</th>
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
                  <td>{m.tither ? 'Sim' : 'Não'}</td>
                  <td>{m.active ? 'Sim' : 'Não'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {canWrite ? (
                      <>
                        <button className="link-btn" onClick={() => startEdit(m)}>editar</button>
                        {' · '}
                        <button className="link-btn" onClick={() => toggleActive(m)}>
                          {m.active ? 'desativar' : 'ativar'}
                        </button>
                      </>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ color: '#999' }}>Nenhum membro ainda.</td>
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
