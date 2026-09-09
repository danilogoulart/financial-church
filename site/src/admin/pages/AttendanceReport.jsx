import { useContext, useEffect, useState } from 'react'
import { attendanceReport, deleteAttendanceSession, listAttendanceSessions } from '../api'
import { exportXls } from '../exportXls'
import { RoleContext } from '../role'

const fmtDate = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')
const fmtTimeCell = (t) => (t ? new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')

export default function AttendanceReport() {
  const { canWriteMembers: canWrite } = useContext(RoleContext)
  const [sessions, setSessions] = useState([])
  const [banner, setBanner] = useState(null)
  const [selected, setSelected] = useState(null)
  const [report, setReport] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selCult, setSelCult] = useState('')
  const [selDate, setSelDate] = useState('')

  async function load() {
    try {
      setSessions(await listAttendanceSessions())
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => { load() }, [])

  const filterList = (list) =>
    filter === 'all' ? list : list.filter((m) => (filter === 'obreiros' ? m.worker : !m.worker))

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

  async function remove() {
    if (!selected) return
    if (!window.confirm(`Excluir a presença do culto "${selected.cult}" de ${fmtDate(selected.session_date)}? Os registros serão perdidos.`)) return
    try {
      await deleteAttendanceSession(selected.id)
      setSelected(null); setReport(null); setSelDate('')
      await load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
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

  return (
    <div className="card">
      <h2>Presença por culto</h2>
      <small>Escolha o culto e a data para ver <b>presentes × faltantes</b> (obreiros e membros).</small>
      {banner && <div className={`banner ${banner.type}`} style={{ marginTop: 10 }}>{banner.msg}</div>}

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
              <button className="link-btn" style={{ color: 'var(--expense)' }} onClick={remove}>
                excluir este registro
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function PeopleTable({ list, showTime }) {
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
              {showTime && <td>{fmtTimeCell(m.checked_at)}</td>}
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
