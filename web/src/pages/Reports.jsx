import { useEffect, useState } from 'react'
import { monthLabel, nonTitherWorkers, tithersLast3Months } from '../api'

export default function Reports() {
  const [tithers, setTithers] = useState(null)
  const [workers, setWorkers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    tithersLast3Months().then(setTithers).catch((e) => setError(e.message))
    nonTitherWorkers().then(setWorkers).catch((e) => setError(e.message))
  }, [])

  return (
    <>
      {error && <div className="card"><div className="banner err">{error}</div></div>}

      <div className="card">
        <h2>Dizimistas — últimos 3 meses</h2>
        {!tithers ? (
          <span style={{ color: '#999' }}>Carregando...</span>
        ) : (
          <>
            <small>
              Meses considerados: {tithers.months.map(monthLabel).join(', ')}.
              Destaque para quem dizimou em menos de 3 meses.
            </small>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Membro</th>
                    <th>Ministério</th>
                    {tithers.months.map((m) => (
                      <th key={m}>{monthLabel(m)}</th>
                    ))}
                    <th>Meses</th>
                  </tr>
                </thead>
                <tbody>
                  {tithers.rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.ministry || '—'}</td>
                      {r.perMonth.map((did, i) => (
                        <td key={i}>{did ? '✅' : '—'}</td>
                      ))}
                      <td>
                        <span className={`pill ${r.monthsTithed < 3 ? 'warn' : 'ok'}`}>
                          {r.monthsTithed}/3
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tithers.rows.length === 0 && (
                    <tr>
                      <td colSpan={3 + tithers.months.length} style={{ color: '#999' }}>
                        Nenhum dizimista cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>Obreiros não dizimistas</h2>
        {!workers ? (
          <span style={{ color: '#999' }}>Carregando...</span>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Ministério</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id}>
                    <td>{w.name}</td>
                    <td>{w.ministry}</td>
                    <td>{w.phone || '—'}</td>
                  </tr>
                ))}
                {workers.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ color: '#999' }}>
                      Nenhum obreiro não dizimista. 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
