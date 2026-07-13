import { useEffect, useState } from 'react'
import { dashboardTotals, formatMoney } from '../api'

export default function Dashboard() {
  const [totals, setTotals] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardTotals().then(setTotals).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="card"><div className="banner err">{error}</div></div>
  if (!totals) return <div className="card">Carregando...</div>

  return (
    <>
      <div className="card">
        <h2>Resumo</h2>
        <div className="kpis">
          <div className="kpi income">
            Receitas
            <div className="value">{formatMoney(totals.totalIncome)}</div>
          </div>
          <div className="kpi expense">
            Despesas
            <div className="value">{formatMoney(totals.totalExpense)}</div>
          </div>
          <div className="kpi balance">
            Saldo
            <div className="value">{formatMoney(totals.balance)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Contas a Pagar</h2>
        <p className="kpi-line">
          Em aberto ({totals.payableOpenCount}): <b>{formatMoney(totals.payableOpen)}</b>
          {'  •  '}Pagas: <b>{formatMoney(totals.payablePaid)}</b>
        </p>
      </div>

      <CategoryCard title="Receitas por categoria" map={totals.incomeByCategory} />
      <CategoryCard title="Despesas por categoria" map={totals.expenseByCategory} />
    </>
  )
}

function CategoryCard({ title, map }) {
  const entries = Object.keys(map).map((k) => [k, map[k]]).sort((a, b) => b[1] - a[1])

  return (
    <div className="card">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <span style={{ color: '#999' }}>Sem lançamentos</span>
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
