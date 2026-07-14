import { useEffect, useState } from 'react'
import { currentCompetency, dashboardTotals, formatMoney, monthlySeries } from '../api'
import MonthlyChart from '../components/MonthlyChart.jsx'

const firstOfMonth = () => currentCompetency() + '-01'
const today = () => new Date().toISOString().slice(0, 10)

export default function Dashboard() {
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())
  const [totals, setTotals] = useState(null)
  const [series, setSeries] = useState(null)
  const [error, setError] = useState('')

  function loadTotals() {
    dashboardTotals(from, to).then(setTotals).catch((e) => setError(e.message))
  }

  useEffect(() => {
    loadTotals()
    monthlySeries(6).then(setSeries).catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) return <div className="card"><div className="banner err">{error}</div></div>
  if (!totals) return <div className="card">Carregando...</div>

  return (
    <>
      <div className="card">
        <h2>Balancete do período</h2>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>De</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label>Até</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <button className="primary" onClick={loadTotals}>Aplicar</button>
          </div>
        </div>

        <div className="kpis" style={{ marginTop: 8 }}>
          <div className="kpi income">
            Receitas
            <div className="value">{formatMoney(totals.totalIncome)}</div>
          </div>
          <div className="kpi expense">
            Despesas
            <div className="value">{formatMoney(totals.totalExpense)}</div>
          </div>
          <div className="kpi balance">
            Resultado
            <div className="value">{formatMoney(totals.balance)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Receitas x Despesas (últimos 6 meses)</h2>
        {series ? <MonthlyChart data={series} /> : <span style={{ color: '#999' }}>Carregando...</span>}
      </div>

      <div className="card">
        <h2>Contas a Pagar</h2>
        <p className="kpi-line">
          Em aberto agora ({totals.payableOpenCount}): <b>{formatMoney(totals.payableOpen)}</b>
          {'  •  '}Pagas no período: <b>{formatMoney(totals.payablePaid)}</b>
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
