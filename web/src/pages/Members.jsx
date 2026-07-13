import { useEffect, useState } from 'react'
import { createMember, listRecentMembers } from '../api'

const EMPTY = { name: '', phone: '', family: '', ministry: '', tither: true }

export default function Members() {
  const [form, setForm] = useState(EMPTY)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function load() {
    try {
      setRows(await listRecentMembers())
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      const member = await createMember({
        name: form.name.trim(),
        phone: form.phone,
        family: form.family,
        ministry: form.ministry,
        tither: form.tither,
        active: true
      })
      setBanner({ type: 'ok', msg: `Membro "${member.name}" cadastrado.` })
      setForm(EMPTY)
      load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <form className="card" onSubmit={save}>
        <h2>Novo Membro</h2>
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
            <input value={form.ministry} onChange={(e) => set('ministry', e.target.value)} />
          </div>
        </div>

        <div className="check">
          <input
            id="tither"
            type="checkbox"
            checked={form.tither}
            onChange={(e) => set('tither', e.target.checked)}
          />
          <label htmlFor="tither" style={{ margin: 0 }}>É dizimista</label>
        </div>

        <button className="primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>

      <div className="card">
        <h2>Membros recentes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Ministério</th>
                <th>Dizimista</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.phone || '—'}</td>
                  <td>{m.ministry || '—'}</td>
                  <td>{m.tither ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ color: '#999' }}>Nenhum membro ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
