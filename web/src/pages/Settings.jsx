import { useContext, useEffect, useState } from 'react'
import {
  createCategory,
  createCult,
  createMinistry,
  deleteCategory,
  deleteCult,
  deleteMinistry,
  fullBackup,
  listAllCategories,
  listCults,
  listMinistries,
  listProfiles,
  setMinistryWorker,
  setProfileRole
} from '../api'
import { RoleContext } from '../role'

export default function Settings() {
  const { canWrite, isAdmin } = useContext(RoleContext)
  const [cats, setCats] = useState([])
  const [kind, setKind] = useState('income')
  const [name, setName] = useState('')
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function load() {
    try {
      setCats(await listAllCategories())
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setBanner(null)
    try {
      await createCategory(kind, name)
      setName('')
      load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function remove(c) {
    if (!window.confirm(`Remover a categoria "${c.name}"? (lançamentos antigos mantêm o texto)`)) return
    try {
      await deleteCategory(c.id)
      load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function backup() {
    setDownloading(true)
    setBanner(null)
    try {
      const data = await fullBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alpha-tesouraria-backup_${data.exported_at.slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setDownloading(false)
    }
  }

  const income = cats.filter((c) => c.kind === 'income')
  const expense = cats.filter((c) => c.kind === 'expense')

  return (
    <>
      {canWrite && (
      <form className="card" onSubmit={add}>
        <h2>Categorias</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>Tipo</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label>Nova categoria</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Missões" />
          </div>
          <div>
            <button className="primary" disabled={saving}>{saving ? '...' : 'Adicionar'}</button>
          </div>
        </div>
      </form>
      )}

      <div className="card">
        <h2>Categorias de Receita</h2>
        <CategoryList items={income} onRemove={remove} canWrite={canWrite} />
      </div>

      <div className="card">
        <h2>Categorias de Despesa</h2>
        <CategoryList items={expense} onRemove={remove} canWrite={canWrite} />
      </div>

      <Ministries canWrite={canWrite} />
      <Cults canWrite={canWrite} />

      {canWrite && (
      <div className="card">
        <h2>Backup</h2>
        <small>Baixa todos os dados (membros, movimentações, contas, recorrentes, categorias) em um arquivo JSON.</small>
        <br /><br />
        <button className="primary" onClick={backup} disabled={downloading}>
          {downloading ? 'Gerando...' : '⬇ Baixar backup (JSON)'}
        </button>
      </div>
      )}

      {isAdmin && <Users />}
    </>
  )
}

function CategoryList({ items, onRemove, canWrite }) {
  if (items.length === 0) return <span style={{ color: '#999' }}>Nenhuma.</span>
  return (
    <div className="table-wrap">
      <table>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td style={{ textAlign: 'right' }}>
                {canWrite && <button className="link-btn" onClick={() => onRemove(c)}>remover</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Ministries({ canWrite }) {
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')
  const [isWorker, setIsWorker] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    try {
      setRows(await listMinistries())
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    setMsg(null)
    try {
      await createMinistry(name, isWorker)
      setName('')
      setIsWorker(false)
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  async function toggle(m) {
    try {
      await setMinistryWorker(m.id, !m.is_worker)
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  async function remove(m) {
    if (!window.confirm(`Remover o ministério "${m.name}"?`)) return
    try {
      await deleteMinistry(m.id)
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  return (
    <div className="card">
      <h2>Ministérios</h2>
      <small>"Obreiro" define quem entra no relatório de obreiros não dizimistas.</small>
      {msg && <div className={`banner ${msg.type}`} style={{ marginTop: 10 }}>{msg.text}</div>}

      {canWrite && (
        <form onSubmit={add} style={{ marginTop: 12 }}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label>Novo ministério</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Louvor" />
            </div>
            <div>
              <button className="primary">Adicionar</button>
            </div>
          </div>
          <div className="check">
            <input id="isWorker" type="checkbox" checked={isWorker} onChange={(e) => setIsWorker(e.target.checked)} />
            <label htmlFor="isWorker" style={{ margin: 0 }}>É obreiro</label>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.is_worker ? <span className="pill ok">obreiro</span> : ''}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {canWrite && (
                    <>
                      <button className="link-btn" onClick={() => toggle(m)}>
                        {m.is_worker ? 'não obreiro' : 'marcar obreiro'}
                      </button>
                      {' · '}
                      <button className="link-btn" onClick={() => remove(m)}>remover</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Cults({ canWrite }) {
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')
  const [msg, setMsg] = useState(null)

  async function load() {
    try {
      setRows(await listCults())
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    setMsg(null)
    try {
      await createCult(name)
      setName('')
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  async function remove(c) {
    if (!window.confirm(`Remover o culto "${c.name}"?`)) return
    try {
      await deleteCult(c.id)
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  return (
    <div className="card">
      <h2>Cultos</h2>
      {msg && <div className={`banner ${msg.type}`}>{msg.text}</div>}

      {canWrite && (
        <form onSubmit={add} style={{ marginTop: 8 }}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label>Novo culto</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Sexta" />
            </div>
            <div>
              <button className="primary">Adicionar</button>
            </div>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td style={{ textAlign: 'right' }}>
                  {canWrite && <button className="link-btn" onClick={() => remove(c)}>remover</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ROLES = ['admin', 'tesoureiro', 'consulta']

function Users() {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState(null)

  async function load() {
    try {
      setRows(await listProfiles())
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function change(id, role) {
    setMsg(null)
    try {
      await setProfileRole(id, role)
      setMsg({ type: 'ok', text: 'Papel atualizado.' })
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  return (
    <div className="card">
      <h2>Usuários</h2>
      <small>
        Papéis: <b>admin</b> (tudo + usuários), <b>tesoureiro</b> (lança/edita), <b>consulta</b> (só leitura).
        Novos usuários entram como consulta.
      </small>
      {msg && <div className={`banner ${msg.type}`} style={{ marginTop: 10 }}>{msg.text}</div>}
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr><th>E-mail</th><th>Papel</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => change(u.id, e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="2" style={{ color: '#999' }}>Nenhum usuário.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
