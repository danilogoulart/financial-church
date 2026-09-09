import { useEffect, useState } from 'react'
import { memberReport } from '../api'
import AttendanceReport from './AttendanceReport.jsx'

export default function MemberReports() {
  const [rep, setRep] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    memberReport().then(setRep).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="card"><div className="banner err">{error}</div></div>
  if (!rep) return <div className="card"><span style={{ color: '#999' }}>Carregando...</span></div>

  const { summary, byCargo, byYear, activeTotal } = rep

  return (
    <>
      <div className="card">
        <h2>Resumo de membros</h2>
        <small>Somente membros ativos.</small>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Obreiros <small>(cargos ministeriais)</small></td>
                <td style={{ textAlign: 'right' }}>{summary.obreiro}</td>
              </tr>
              <tr>
                <td>Membros</td>
                <td style={{ textAlign: 'right' }}>{summary.membro}</td>
              </tr>
              <tr>
                <td>Congregados</td>
                <td style={{ textAlign: 'right' }}>{summary.congregado}</td>
              </tr>
              <tr className="tot">
                <td style={{ fontWeight: 'bold' }}>Total ativos</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{activeTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Por cargo</h2>
        <small>Contagem de membros ativos por cargo. “Ministerial” marca os cargos de obreiro.</small>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Ministerial</th>
                <th style={{ textAlign: 'right' }}>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {byCargo.map((r) => (
                <tr key={r.cargo}>
                  <td>{r.cargo}</td>
                  <td>{r.worker ? 'Sim' : '—'}</td>
                  <td style={{ textAlign: 'right' }}>{r.count}</td>
                </tr>
              ))}
              {byCargo.length === 0 && (
                <tr><td colSpan="3" style={{ color: '#999' }}>Nenhum membro ativo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Novos membros por ano</h2>
        <small>Pela data de entrada na igreja (todos os cadastros).</small>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Ano</th>
                <th style={{ textAlign: 'right' }}>Novos membros</th>
              </tr>
            </thead>
            <tbody>
              {byYear.map((r) => (
                <tr key={r.year}>
                  <td>{r.year}</td>
                  <td style={{ textAlign: 'right' }}>{r.count}</td>
                </tr>
              ))}
              {byYear.length === 0 && (
                <tr><td colSpan="2" style={{ color: '#999' }}>Sem dados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AttendanceReport />
    </>
  )
}
