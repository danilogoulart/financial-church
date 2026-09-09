import { useContext, useEffect, useState } from 'react'
import {
  attendanceReport,
  createAttendanceSession,
  deleteAttendanceSession,
  listAttendanceSessions,
  listCultNames,
  setAttendanceSessionActive
} from '../api'
import { attendanceQr, checkinUrl } from '../qr'
import { RoleContext } from '../role'

const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

export default function Attendance() {
  const { canWriteMembers: canWrite } = useContext(RoleContext)
  const [cults, setCults] = useState([])
  const [sessions, setSessions] = useState([])
  const [form, setForm] = useState({ cult: '', date: today() })
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null) // session
  const [qr, setQr] = useState(null)
  const [report, setReport] = useState(null)
  const [filter, setFilter] = useState('all') // all | obreiros | membros

  useEffect(() => {
    listCultNames().then((c) => {
      setCults(c)
      setForm((f) => ({ ...f, cult: f.cult || c[0] || '' }))
    }).catch(() => {})
    load()
  }, [])

  async function load() {
    try {
      setSessions(await listAttendanceSessions())
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function create(e) {
    e.preventDefault()
    if (!form.cult) return
    setSaving(true)
    setBanner(null)
    try {
      const s = await createAttendanceSession(form.cult, form.date)
      setBanner({ type: 'ok', msg: 'Culto aberto para presença.' })
      await load()
      open(s)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function open(s) {
    setSelected(s)
    setReport(null)
    setQr(null)
    setFilter('all')
    try {
      const [q, r] = await Promise.all([attendanceQr(s.id), attendanceReport(s.id)])
      setQr(q)
      setReport(r)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function toggle(s) {
    try {
      await setAttendanceSessionActive(s.id, !s.active)
      await load()
      if (selected?.id === s.id) setSelected({ ...s, active: !s.active })
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function remove(s) {
    if (!window.confirm(`Excluir a presença do culto "${s.cult}" de ${fmtDate(s.session_date)}? Os registros serão perdidos.`)) return
    try {
      await deleteAttendanceSession(s.id)
      if (selected?.id === s.id) { setSelected(null); setReport(null); setQr(null) }
      await load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  const filterList = (list) =>
    filter === 'all' ? list : list.filter((m) => (filter === 'obreiros' ? m.worker : !m.worker))

  return (
    <>
      {canWrite && (
        <form className="card" onSubmit={create}>
          <h2>Abrir culto para presença</h2>
          <small>Gera o QR que os membros escaneiam para registrar presença.</small>
          {banner && <div className={`banner ${banner.type}`} style={{ marginTop: 10 }}>{banner.msg}</div>}
          <div className="row" style={{ marginTop: 10 }}>
            <div style={{ flex: 2 }}>
              <label>Culto</label>
              <select value={form.cult} onChange={(e) => setForm((f) => ({ ...f, cult: e.target.value }))}>
                {cults.length === 0 && <option value="">(cadastre cultos em Configurações)</option>}
                {cults.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Data</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <button className="primary" disabled={saving || !form.cult}>
            {saving ? 'Abrindo...' : 'Abrir e gerar QR'}
          </button>
        </form>
      )}

      {selected && (
        <div className="card">
          <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0 }}>{selected.cult}</h2>
              <small>{fmtDate(selected.session_date)} · {selected.active ? 'Aberto' : 'Fechado'}</small>
            </div>
            <button className="link-btn" onClick={() => { setSelected(null); setReport(null); setQr(null) }}>fechar</button>
          </div>

          {selected.active ? (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              {qr ? <img src={qr} alt="QR de presença" style={{ width: 260, maxWidth: '100%' }} /> : <span style={{ color: '#999' }}>Gerando QR...</span>}
              <div style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all', marginTop: 6 }}>
                {checkinUrl(selected.id)}
              </div>
            </div>
          ) : (
            <div className="banner" style={{ marginTop: 12 }}>Culto fechado — não aceita novos registros de presença.</div>
          )}

          {report && (
            <>
              <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18 }}>
                <div style={{ fontSize: 14 }}>
                  <b>Presentes:</b> {report.counts.present.total}
                  <small> (obreiros {report.counts.present.obreiros} · membros {report.counts.present.membros})</small>
                  <br />
                  <b>Faltantes:</b> {report.counts.absent.total}
                  <small> (obreiros {report.counts.absent.obreiros} · membros {report.counts.absent.membros})</small>
                </div>
                <div>
                  <label>Filtrar</label>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="obreiros">Obreiros</option>
                    <option value="membros">Membros</option>
                  </select>
                </div>
              </div>

              <div className="row" style={{ gap: 16, alignItems: 'flex-start', marginTop: 12 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h3 style={{ margin: '0 0 6px' }}>Presentes</h3>
                  <PeopleTable list={filterList(report.present)} showTime />
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h3 style={{ margin: '0 0 6px' }}>Faltantes</h3>
                  <PeopleTable list={filterList(report.absent)} />
                </div>
              </div>
              <button className="link-btn" style={{ marginTop: 10 }} onClick={() => open(selected)}>atualizar lista</button>
            </>
          )}
        </div>
      )}

      <div className="card">
        <h2>Cultos com presença</h2>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Culto</th>
                <th>Data</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ opacity: s.active ? 1 : 0.6 }}>
                  <td>{s.cult}</td>
                  <td>{fmtDate(s.session_date)}</td>
                  <td><span className={`pill ${s.active ? 'ok' : 'warn'}`}>{s.active ? 'Aberto' : 'Fechado'}</span></td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button className="link-btn" onClick={() => open(s)}>abrir</button>
                    {canWrite && (
                      <>
                        {' · '}
                        <button className="link-btn" onClick={() => toggle(s)}>{s.active ? 'fechar' : 'reabrir'}</button>
                        {' · '}
                        <button className="link-btn" style={{ color: 'var(--expense)' }} onClick={() => remove(s)}>excluir</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan="4" style={{ color: '#999' }}>Nenhum culto aberto ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function PeopleTable({ list, showTime }) {
  const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cargo</th>
            {showTime && <th>Hora</th>}
          </tr>
        </thead>
        <tbody>
          {list.map((m) => (
            <tr key={m.id}>
              <td>{m.name}{m.worker ? ' ★' : ''}</td>
              <td>{m.cargo || '—'}</td>
              {showTime && <td>{fmtTime(m.checked_at)}</td>}
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={showTime ? 3 : 2} style={{ color: '#999' }}>—</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
