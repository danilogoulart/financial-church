import { useContext, useEffect, useState } from 'react'
import {
  attendanceReport,
  deleteAttendanceSession,
  getCheckinToken,
  listAttendanceSessions,
  regenerateCheckinToken
} from '../api'
import { attendanceQr, checkinUrl } from '../qr'
import { downloadDataUrl } from '../../lib/pixImage'
import { RoleContext } from '../role'

const fmtDate = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

export default function Attendance() {
  const { canWriteMembers: canWrite } = useContext(RoleContext)
  const [sessions, setSessions] = useState([])
  const [banner, setBanner] = useState(null)
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

  async function load() {
    try {
      setSessions(await listAttendanceSessions())
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
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
        <h2>QR de presença</h2>
        <small>
          Imprima ou projete este QR. O membro escaneia, faz login e o sistema registra a
          presença no <b>culto que estiver acontecendo</b> naquele horário — conforme o
          <b> dia e horário</b> cadastrados em <b>Configurações → Cultos</b>.
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
        <h2>Relatórios de presença</h2>
        <small>Cada culto registrado aparece aqui. Clique em <b>relatório</b> para ver presentes × faltantes.</small>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Culto</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.cult}</td>
                  <td>{fmtDate(s.session_date)}</td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button className="link-btn" onClick={() => openReport(s)}>relatório</button>
                    {canWrite && (
                      <>
                        {' · '}
                        <button className="link-btn" style={{ color: 'var(--expense)' }} onClick={() => remove(s)}>excluir</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ color: '#999' }}>
                    Nenhuma presença registrada ainda. Os cultos aparecem aqui automaticamente
                    quando os membros registram presença pelo QR, dentro do horário do culto.
                  </td>
                </tr>
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
