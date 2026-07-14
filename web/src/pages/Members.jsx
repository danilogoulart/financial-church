import { useEffect, useState } from 'react'
import { createMember, listMembersPage, setMemberActive, updateMember } from '../api'
import { MINISTRIES } from '../constants'
import Pagination from '../components/Pagination.jsx'

const EMPTY = { name: '', phone: '', family: '', ministry: 'Membros', tither: true, active: true }
const SIZE = 20

export default function Members() {
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [reload, setReload] = useState(0)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function load() {
    try {
      const { rows, total } = await listMembersPage(page, SIZE)
      setRows(rows)
      setTotal(total)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reload])

  const refresh = () => setReload((r) => r + 1)

  function startEdit(m) {
    setEditingId(m.id)
    setForm({
      name: m.name,
      phone: m.phone || '',
      family: m.family || '',
      ministry: m.ministry || 'Membros',
      tither: m.tither,
      active: m.active
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
    setBanner(null)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone,
        family: form.family,
        ministry: form.ministry,
        tither: form.tither
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
      <form className="card" onSubmit={save}>
        <h2>{editingId ? 'Editar Membro' : 'Novo Membro'}</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}

        <label>Nome</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} required />

        <label>Telefone</label>
        <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />

        <div className="row">
          <div>
            <label>Família</label>
            <input value={form.family} onChange={(e) => set('family', e.target.value)} />
          </div>
          <div>
            <label>Ministério</label>
            <select value={form.ministry} onChange={(e) => set('ministry', e.target.value)}>
              {MINISTRIES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

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

      <div className="card">
        <h2>Membros</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Ministério</th>
                <th>Dizimista</th>
                <th>Ativo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} style={{ opacity: m.active ? 1 : 0.5 }}>
                  <td>{m.name}</td>
                  <td>{m.ministry || '—'}</td>
                  <td>{m.tither ? 'Sim' : 'Não'}</td>
                  <td>{m.active ? 'Sim' : 'Não'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="link-btn" onClick={() => startEdit(m)}>editar</button>
                    {' · '}
                    <button className="link-btn" onClick={() => toggleActive(m)}>
                      {m.active ? 'desativar' : 'ativar'}
                    </button>
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
