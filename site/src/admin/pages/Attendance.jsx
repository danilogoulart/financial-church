import { useContext, useEffect, useState } from 'react'
import {
  attendanceReport,
  createAttendanceSession,
  deleteAttendanceSession,
  getCheckinToken,
  listAttendanceSessions,
  listCultNames,
  regenerateCheckinToken,
  setAttendanceSessionActive
} from '../api'
import { attendanceQr, checkinUrl } from '../qr'
import { downloadDataUrl } from '../../lib/pixImage'
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
  const [report, setReport] = useState(null)
  const [filter, setFilter] = useState('all') // all | obreiros | membros
  const [token, setToken] = useState(null)
  const [fixedQr, setFixedQr] = useState(null)

  async function loadQr() {
    try {
      const t = await getCheckinToken()
      setToken(t)
      setFixedQr(await attendanceQr(t))
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    listCultNames().then((c) => {
      setCults(c)
      setForm((f) => ({ ...f, cult: f.cult || c[0] || '' }))
    }).catch(() => {})
    loadQr()
    load()
  }, [])

  async function regenerate() {
    if (!window.confirm('Regenerar o QR? Os QRs já impressos/compartilhados deixarão de funcionar.')) return
    setBanner(null)
    try {
      const t = await regenerateCheckinToken()
      setToken(t)
      setFixedQr(await attendanceQr(t))
      setBanner({ type: 'ok', msg: 'QR regenerado. Compartilhe/imprima o novo.' })
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function load() {
    try {
      setSessions(await listAttendanceSessions())
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function createAvulso(e) {
    e.preventDefault()
    if (!form.cult) return
    setSaving(true)
    setBanner(null)
    try {
      await createAttendanceSession(form.cult, form.date)
      setBanner({ type: 'ok', msg: 'Culto avulso aberto para presença.' })
      await load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function openReport(s) {
    setSelected(s)
    setReport(null)
    setFilter('all')
    try {
      setReport(await attendanceReport(s.id))
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
      if (selected?.id === s.id) { setSelected(null); setReport(null) }
      await load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  const filterList = (list) =>
    filter === 'all' ? list : list.filter((m) => (filter === 'obreiros' ? m.worker : !m.worker))

  return (
    <>
      <div className="card">
        <h2>QR fixo de presença</h2>
        <small>
          Imprima ou projete este QR — ele é <b>sempre o mesmo</b>. O membro escaneia,
          faz login e o sistema registra a presença no <b>culto que estiver acontecendo</b>
          {' '}naquele horário (conforme a agenda em Configurações → Cultos).
        </small>
        {banner && <div className={`banner ${banner.type}`} style={{ marginTop: 10 }}>{banner.msg}</div>}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          {fixedQr ? (
            <>
              <img src={fixedQr} alt="QR de presença" style={{ width: 260, maxWidth: '100%' }} />
              <div style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all', marginTop: 6 }}>
                {token ? checkinUrl(token) : ''}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="link-btn" onClick={() => downloadDataUrl(fixedQr, 'presenca-alpha-qrcode.png')}>
                  ⬇️ Baixar QR (alta definição)
                </button>
                {canWrite && (
                  <button className="link-btn" onClick={regenerate}>🔄 Regenerar QR</button>
                )}
              </div>
            </>
          ) : (
            <span style={{ color: '#999' }}>Gerando QR...</span>
          )}
        </div>
      </div>

      {canWrite && (
        <form className="card" onSubmit={createAvulso}>
          <h2>Abrir culto avulso</h2>
          <small>
            Só para cultos <b>fora da agenda</b> (ex.: congresso, vigília). Cultos regulares
            são detectados automaticamente pelo horário — não precisa abrir nada.
          </small>
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
            {saving ? 'Abrindo...' : 'Abrir culto avulso'}
          </button>
        </form>
      )}

      {selected && report && (
        <div className="card">
          <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0 }}>{selected.cult}</h2>
              <small>{fmtDate(selected.session_date)}</small>
            </div>
            <button className="link-btn" onClick={() => { setSelected(null); setReport(null) }}>fechar</button>
          </div>

          <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
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
          <button className="link-btn" style={{ marginTop: 10 }} onClick={() => openReport(selected)}>atualizar lista</button>
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
                    <button className="link-btn" onClick={() => openReport(s)}>relatório</button>
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
                <tr><td colSpan="4" style={{ color: '#999' }}>Nenhuma presença registrada ainda.</td></tr>
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
