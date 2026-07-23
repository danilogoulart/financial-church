import { useEffect, useState } from 'react'
import {
  forecast,
  formatMoney,
  incomeBreakdowns,
  monthLabel,
  nonTitherWorkers,
  offCashReport,
  tithersLast3Months
} from '../api'

export default function Reports() {
  const [tithers, setTithers] = useState(null)
  const [workers, setWorkers] = useState(null)
  const [fc, setFc] = useState(null)
  const [income, setIncome] = useState(null)
  const [offcash, setOffcash] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    tithersLast3Months().then(setTithers).catch((e) => setError(e.message))
    nonTitherWorkers().then(setWorkers).catch((e) => setError(e.message))
    forecast(3).then(setFc).catch((e) => setError(e.message))
    incomeBreakdowns().then(setIncome).catch((e) => setError(e.message))
    offCashReport().then(setOffcash).catch((e) => setError(e.message))
  }, [])

  return (
    <>
      {error && <div className="card"><div className="banner err">{error}</div></div>}

      <div className="card">
        <h2>Projeção de caixa — próximos 3 meses</h2>
        {!fc ? (
          <span style={{ color: '#999' }}>Carregando...</span>
        ) : (
          <>
            <small>
              Saldo atual: <b>{formatMoney(fc.currentBalance)}</b>. Receita estimada pela
              média dos últimos 3 meses ({formatMoney(fc.avgIncome)}/mês). Despesas = recorrentes,
              parcelas e contas avulsas em aberto.
            </small>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th style={{ textAlign: 'right' }}>Receita prevista</th>
                    <th style={{ textAlign: 'right' }}>Despesa prevista</th>
                    <th style={{ textAlign: 'right' }}>Saldo projetado</th>
                  </tr>
                </thead>
                <tbody>
                  {fc.rows.map((r) => (
                    <tr key={r.month}>
                      <td>{monthLabel(r.month)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--income)' }}>{formatMoney(r.income)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--expense)' }}>{formatMoney(r.expense)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

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
                    {tithers.months.map((m) => (
                      <th key={m} style={{ textAlign: 'right' }}>{monthLabel(m)}</th>
                    ))}
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Meses</th>
                  </tr>
                </thead>
                <tbody>
                  {tithers.rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      {r.perMonth.map((v, i) => (
                        <td key={i} style={{ textAlign: 'right' }}>{v > 0 ? formatMoney(v) : '—'}</td>
                      ))}
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(r.total)}</td>
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
                  <th>Cargo</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id}>
                    <td>{w.name}</td>
                    <td>{w.cargo}</td>
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

      <div className="card">
        <h2>Iniciativas / eventos (extra-caixa)</h2>
        <small>Receitas de eventos por ministério que não entram no caixa.</small>
        {!offcash ? (
          <div style={{ color: '#999', marginTop: 8 }}>Carregando...</div>
        ) : offcash.rows.length === 0 ? (
          <div style={{ color: '#999', marginTop: 8 }}>Nenhuma receita extra-caixa.</div>
        ) : (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Ministério</th>
                  <th style={{ textAlign: 'right' }}>Arrecadado</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(offcash.byMinistry)
                  .sort((a, b) => offcash.byMinistry[b] - offcash.byMinistry[a])
                  .map((m) => (
                    <tr key={m}>
                      <td>{m}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(offcash.byMinistry[m])}</td>
                    </tr>
                  ))}
                <tr className="tot">
                  <td style={{ fontWeight: 'bold' }}>Total</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(offcash.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BreakdownCard title="Receita por culto" map={income?.byCult} />
      <BreakdownCard title="Receita por forma de pagamento" map={income?.byPayment} />
    </>
  )
}

function BreakdownCard({ title, map }) {
  const entries = map ? Object.keys(map).map((k) => [k, map[k]]).sort((a, b) => b[1] - a[1]) : null
  const total = entries ? entries.reduce((s, [, v]) => s + v, 0) : 0

  return (
    <div className="card">
      <h2>{title}</h2>
      {!entries ? (
        <span style={{ color: '#999' }}>Carregando...</span>
      ) : entries.length === 0 ? (
        <span style={{ color: '#999' }}>Sem receitas.</span>
      ) : (
        <div className="table-wrap">
          <table>
            <tbody>
              {entries.map(([name, value]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td style={{ textAlign: 'right' }}>{formatMoney(value)}</td>
                </tr>
              ))}
              <tr className="tot">
                <td style={{ fontWeight: 'bold' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
