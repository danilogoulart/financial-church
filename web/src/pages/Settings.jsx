import { useContext, useEffect, useRef, useState } from 'react'
import {
  createCargo,
  createCategory,
  createCult,
  createMinistry,
  deleteCargo,
  deleteCategory,
  deleteCult,
  deleteMinistry,
  fullBackup,
  getSettings,
  listAllCategories,
  listCargos,
  listCults,
  listMinistries,
  listProfiles,
  setCargoWorker,
  setProfileRole,
  setSetting,
  uploadAsset
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

      <Cargos canWrite={canWrite} />
      <Ministries canWrite={canWrite} />
      <Cults canWrite={canWrite} />

      {canWrite && <Credential />}

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

function Cargos({ canWrite }) {
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')
  const [isWorker, setIsWorker] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    try {
      setRows(await listCargos())
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
      await createCargo(name, isWorker)
      setName('')
      setIsWorker(false)
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  async function toggle(c) {
    try {
      await setCargoWorker(c.id, !c.is_worker)
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  async function remove(c) {
    if (!window.confirm(`Remover o cargo "${c.name}"?`)) return
    try {
      await deleteCargo(c.id)
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  return (
    <div className="card">
      <h2>Cargos</h2>
      <small>Classificação do membro (1 por pessoa). "Obreiro" define quem entra no relatório de obreiros não dizimistas.</small>
      {msg && <div className={`banner ${msg.type}`} style={{ marginTop: 10 }}>{msg.text}</div>}

      {canWrite && (
        <form onSubmit={add} style={{ marginTop: 12 }}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label>Novo cargo</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Diácono" />
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
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.is_worker ? <span className="pill ok">obreiro</span> : ''}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {canWrite && (
                    <>
                      <button className="link-btn" onClick={() => toggle(c)}>
                        {c.is_worker ? 'não obreiro' : 'marcar obreiro'}
                      </button>
                      {' · '}
                      <button className="link-btn" onClick={() => remove(c)}>remover</button>
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

function Ministries({ canWrite }) {
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')
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
      await createMinistry(name)
      setName('')
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
      <small>Grupos/ministérios (Jovens, Louvor…). Um membro pode participar de vários.</small>
      {msg && <div className={`banner ${msg.type}`} style={{ marginTop: 10 }}>{msg.text}</div>}

      {canWrite && (
        <form onSubmit={add} style={{ marginTop: 12 }}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label>Novo ministério</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Jovens" />
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
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td style={{ textAlign: 'right' }}>
                  {canWrite && <button className="link-btn" onClick={() => remove(m)}>remover</button>}
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

function Credential() {
  const [names, setNames] = useState({ president_name: '', secretary_name: '' })
  const [current, setCurrent] = useState({ president_sig: null, secretary_sig: null })
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const presRef = useRef(null)
  const secRef = useRef(null)

  async function load() {
    try {
      const s = await getSettings()
      setNames({ president_name: s.president_name || '', secretary_name: s.secretary_name || '' })
      setCurrent({ president_sig: s.president_sig || null, secretary_sig: s.secretary_sig || null })
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await setSetting('president_name', names.president_name)
      await setSetting('secretary_name', names.secretary_name)
      const pf = presRef.current?.files?.[0]
      if (pf) await setSetting('president_sig', await uploadAsset(pf, 'signatures/'))
      const sf = secRef.current?.files?.[0]
      if (sf) await setSetting('secretary_sig', await uploadAsset(sf, 'signatures/'))
      setMsg({ type: 'ok', text: 'Configuração da credencial salva.' })
      if (presRef.current) presRef.current.value = ''
      if (secRef.current) secRef.current.value = ''
      load()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card" onSubmit={save}>
      <h2>Credencial — assinaturas</h2>
      <small>Nomes e imagens de assinatura do presidente e secretário(a), usados nas credenciais.</small>
      {msg && <div className={`banner ${msg.type}`} style={{ marginTop: 10 }}>{msg.text}</div>}

      <div className="row" style={{ marginTop: 12 }}>
        <div>
          <label>Nome do presidente</label>
          <input
            value={names.president_name}
            onChange={(e) => setNames((n) => ({ ...n, president_name: e.target.value }))}
          />
          <label>
            Assinatura do presidente{' '}
            <small>{current.president_sig ? '(há uma; envie outra para trocar)' : '(imagem)'}</small>
          </label>
          <input ref={presRef} type="file" accept="image/*" />
        </div>
        <div>
          <label>Nome do secretário(a)</label>
          <input
            value={names.secretary_name}
            onChange={(e) => setNames((n) => ({ ...n, secretary_name: e.target.value }))}
          />
          <label>
            Assinatura do secretário(a){' '}
            <small>{current.secretary_sig ? '(há uma; envie outra para trocar)' : '(imagem)'}</small>
          </label>
          <input ref={secRef} type="file" accept="image/*" />
        </div>
      </div>

      <button className="primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
    </form>
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
