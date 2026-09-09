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
import { exportXls } from '../exportXls'
import { RoleContext } from '../role'

const fmtDate = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')
const fmtTimeCell = (t) => (t ? new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')

export default function Attendance() {
  const { canWriteMembers: canWrite } = useContext(RoleContext)
  const [sessions, setSessions] = useState([])
  const [banner, setBanner] = useState(null)
  const [selected, setSelected] = useState(null) // session
  const [report, setReport] = useState(null)
  const [filter, setFilter] = useState('all') // all | obreiros | membros
  const [selCult, setSelCult] = useState('')
  const [selDate, setSelDate] = useState('')
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
    setSelCult(s.cult)
    setSelDate(s.session_date)
    setReport(null)
    setFilter('all')
    try {
      setReport(await attendanceReport(s.id))
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  // Seleção por culto + data (dropdowns).
  const cultNames = [...new Set(sessions.map((s) => s.cult))]
  const datesForCult = (cult) => sessions.filter((s) => s.cult === cult).map((s) => s.session_date)

  function onPickCult(cult) {
    setSelCult(cult)
    setSelDate('')
    setSelected(null)
    setReport(null)
  }
  function onPickDate(date) {
    setSelDate(date)
    const s = sessions.find((x) => x.cult === selCult && x.session_date === date)
    if (s) openReport(s)
  }

  function exportReport() {
    if (!report) return
    const present = filterList(report.present)
    const absent = filterList(report.absent)
    const headers = ['Nome', 'Cargo', 'Categoria', 'Situação', 'Hora']
    const line = (m, sit) => [m.name, m.cargo || '', m.worker ? 'Obreiro' : 'Membro', sit, sit === 'Presente' ? fmtTimeCell(m.checked_at) : '']
    const rows = [...present.map((m) => line(m, 'Presente')), ...absent.map((m) => line(m, 'Faltante'))]
    const safe = `${selCult}-${selDate}`.replace(/[^\w-]+/g, '_')
    exportXls(`presenca-${safe}`, `${selCult} ${fmtDate(selDate)}`, headers, rows)
  }

  async function remove(s) {
    if (!window.confirm(`Excluir a presença do culto "${s.cult}" de ${fmtDate(s.session_date)}? Os registros serão perdidos.`)) return
    try {
      await deleteAttendanceSession(s.id)
      if (selected?.id === s.id) { setSelected(null); setReport(null); setSelDate('') }
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

      <div className="card">
        <h2>Relatório de presença</h2>
        <small>Escolha o culto e a data para ver <b>presentes × faltantes</b> (obreiros e membros).</small>

        <div className="row" style={{ marginTop: 10 }}>
          <div style={{ flex: 2 }}>
            <label>Culto</label>
            <select value={selCult} onChange={(e) => onPickCult(e.target.value)}>
              <option value="">Selecione…</option>
              {cultNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Data</label>
            <select value={selDate} onChange={(e) => onPickDate(e.target.value)} disabled={!selCult}>
              <option value="">Selecione…</option>
              {datesForCult(selCult).map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
            </select>
          </div>
        </div>

        {sessions.length === 0 && (
          <div style={{ color: '#999', marginTop: 12 }}>
            Nenhuma presença registrada ainda. Os cultos aparecem aqui automaticamente quando os
            membros registram presença pelo QR, dentro do horário do culto.
          </div>
        )}

        {report && (
          <>
            <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
              <div style={{ fontSize: 14 }}>
                <b>Presentes:</b> {report.counts.present.total}
                <small> (obreiros {report.counts.present.obreiros} · membros {report.counts.present.membros})</small>
                <br />
                <b>Faltantes:</b> {report.counts.absent.total}
                <small> (obreiros {report.counts.absent.obreiros} · membros {report.counts.absent.membros})</small>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div>
                  <label>Filtrar</label>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="obreiros">Obreiros</option>
                    <option value="membros">Membros</option>
                  </select>
                </div>
                <button type="button" className="btn ghost" onClick={exportReport}>⬇️ Exportar (Excel)</button>
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

            <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="link-btn" onClick={() => selected && openReport(selected)}>atualizar lista</button>
              {canWrite && selected && (
                <button className="link-btn" style={{ color: 'var(--expense)' }} onClick={() => remove(selected)}>
                  excluir este registro
                </button>
              )}
            </div>
          </>
        )}
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
