import { useEffect, useState } from 'react'
import {
  currentCompetency,
  dashboardTotals,
  forecast,
  formatMoney,
  memberCounts,
  monthLabel,
  monthlySeries
} from '../api'
import MonthlyChart from '../components/MonthlyChart.jsx'
import AlertsCard from '../components/AlertsCard.jsx'

const firstOfMonth = () => currentCompetency() + '-01'
const today = () => new Date().toISOString().slice(0, 10)

export default function Home() {
  const [month, setMonth] = useState(null)
  const [fc, setFc] = useState(null)
  const [chart, setChart] = useState(null)
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardTotals(firstOfMonth(), today()).then(setMonth).catch((e) => setError(e.message))
    memberCounts().then(setCounts).catch((e) => setError(e.message))
    Promise.all([monthlySeries(6), forecast(3)])
      .then(([s, f]) => {
        setFc(f)
        setChart([
          ...s.map((x) => ({ ...x, projected: false })),
          ...f.rows.map((r) => ({ month: r.month, income: r.income, expense: r.expense, projected: true }))
        ])
      })
      .catch((e) => setError(e.message))
  }, [])

  const lastProj = fc && fc.rows.length ? fc.rows[fc.rows.length - 1] : null

  console.log('Teste Daniel');

  return (
    <>
      {error && <div className="card"><div className="banner err">{error}</div></div>}

      <div className="card">
        <h2>Visão geral</h2>
        <div className="kpis">
          <div className="kpi balance">
            Saldo em caixa
            <div className="value">{fc ? formatMoney(fc.currentBalance) : '—'}</div>
          </div>
          <div className="kpi income">
            Receitas do mês
            <div className="value">{month ? formatMoney(month.totalIncome) : '—'}</div>
          </div>
          <div className="kpi expense">
            Despesas do mês
            <div className="value">{month ? formatMoney(month.totalExpense) : '—'}</div>
          </div>
          <div className="kpi balance">
            Resultado do mês
            <div className="value">{month ? formatMoney(month.balance) : '—'}</div>
          </div>
        </div>
      </div>

      <AlertsCard />

      <div className="card">
        <h2>Membros</h2>
        <div className="kpis">
          <div className="kpi">Total<div className="value">{counts?.total ?? '—'}</div></div>
          <div className="kpi">Ativos<div className="value">{counts?.active ?? '—'}</div></div>
          <div className="kpi">Dizimistas<div className="value">{counts?.tithers ?? '—'}</div></div>
        </div>
      </div>

      <div className="card">
        <h2>Receitas x Despesas — 6 meses + projeção</h2>
        {chart ? <MonthlyChart data={chart} /> : <span style={{ color: '#999' }}>Carregando...</span>}
      </div>

      {lastProj && (
        <div className="card">
          <h2>Projeção de caixa</h2>
          <small>
            Saldo projetado para <b>{monthLabel(lastProj.month)}</b>:{' '}
            <b>{formatMoney(lastProj.balance)}</b> — receita estimada {formatMoney(fc.avgIncome)}/mês.
          </small>
        </div>
      )}
    </>
  )
}
