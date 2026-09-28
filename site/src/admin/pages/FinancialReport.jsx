import { useEffect, useState } from 'react'
import { financialReport, formatMoney } from '../api'
import { APP_NAME } from '../brand'
import { exportXlsSections } from '../exportXls'
import { printHtml } from '../printDoc'

const thisMonth = () => new Date().toISOString().slice(0, 7)
const monthRange = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, '0')}` }
}
const fmtDate = (d) => (d ? d.split('-').reverse().join('/') : '—')
const money = (v) => formatMoney(v)

export default function FinancialReport() {
  const [month, setMonth] = useState(thisMonth())
  const [useRange, setUseRange] = useState(false)
  const [range, setRange] = useState(() => monthRange(thisMonth()))
  const [rep, setRep] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const period = useRange ? range : monthRange(month)

  async function load() {
    if (!period.from || !period.to) return
    setLoading(true)
    setError('')
    try {
      setRep(await financialReport(period.from, period.to))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const periodLabel = `${fmtDate(period.from)} a ${fmtDate(period.to)}`

  // ----- Exportações -----
  function buildSections() {
    if (!rep) return []
    const catRows = (list) => list.map((r) => [r.name, r.total.toFixed(2)])
    return [
      { title: `Relatório financeiro — ${periodLabel}`, headers: [], rows: [] },
      {
        title: 'Resumo',
        headers: ['Indicador', 'Valor'],
        rows: [
          ['Receitas', rep.income.total.toFixed(2)],
          ['Despesas', rep.expense.total.toFixed(2)],
          ['Resultado', rep.result.toFixed(2)],
          ['Extra-caixa (não entra no caixa)', rep.offCash.total.toFixed(2)]
        ]
      },
      {
        title: 'Saldos atuais',
        headers: ['Conta', 'Saldo'],
        rows: [
          ['Dinheiro (espécie)', rep.balances.cash.toFixed(2)],
          ['Conta bancária', rep.balances.bank.toFixed(2)],
          ['Total', rep.balances.total.toFixed(2)]
        ]
      },
      { title: 'Receitas por categoria', headers: ['Categoria', 'Total'], rows: catRows(rep.income.byCategory) },
      { title: 'Receitas por forma de pagamento', headers: ['Forma', 'Total'], rows: catRows(rep.income.byMethod) },
      { title: 'Receitas por culto', headers: ['Culto', 'Total'], rows: catRows(rep.income.byCult) },
      { title: 'Despesas por categoria', headers: ['Categoria', 'Total'], rows: catRows(rep.expense.byCategory) },
      { title: 'Despesas por forma de pagamento', headers: ['Forma', 'Total'], rows: catRows(rep.expense.byMethod) },
      {
        title: 'Receitas (detalhado)',
        headers: ['Data', 'Categoria', 'Forma', 'Culto', 'Membro', 'Valor', 'Observação'],
        rows: rep.income.rows.map((t) => [fmtDate(t.date), t.category || '', t.payment_method || '', t.cult || '', t.member?.name || '', Number(t.amount).toFixed(2), t.observation || ''])
      },
      {
        title: 'Despesas (detalhado)',
        headers: ['Data', 'Categoria', 'Forma', 'Descrição/Obs', 'Origem', 'Valor'],
        rows: rep.expense.rows.map((t) => [fmtDate(t.date), t.category || '', t.payment_method || '', t.description || t.observation || '', t.source || '', Number(t.amount).toFixed(2)])
      },
      {
        title: 'Contas a pagar no período',
        headers: ['Vencimento', 'Descrição', 'Categoria', 'Situação', 'Valor'],
        rows: rep.payablesDue.map((p) => [fmtDate(p.due_date), p.description, p.category || '', p.status, Number(p.amount).toFixed(2)])
      }
    ]
  }

  function exportExcel() {
    exportXlsSections(`relatorio-financeiro-${period.from}_a_${period.to}`, 'Relatório', buildSections())
  }

  function exportPdf() {
    if (!rep) return
    const tbl = (title, headers, rows, totalRow) => {
      if (!rows.length) return ''
      const th = headers.map((h, i) => `<th class="${i === headers.length - 1 ? 'r' : ''}">${h}</th>`).join('')
      const body = rows.map((r) => '<tr>' + r.map((c, i) => `<td class="${i === r.length - 1 ? 'r' : ''}">${c}</td>`).join('') + '</tr>').join('')
      const tot = totalRow ? `<tr class="tot"><td colspan="${headers.length - 1}">${totalRow[0]}</td><td class="r">${totalRow[1]}</td></tr>` : ''
      return `<h2>${title}</h2><table>${th ? `<tr>${th}</tr>` : ''}${body}${tot}</table>`
    }
    const catT = (list) => list.map((r) => [r.name, money(r.total)])
    const body = `
      <h1>${APP_NAME} — Relatório financeiro</h1>
      <div class="muted">Período: ${periodLabel}</div>
      <div class="kpis">
        <div class="kpi">Receitas<b>${money(rep.income.total)}</b></div>
        <div class="kpi">Despesas<b>${money(rep.expense.total)}</b></div>
        <div class="kpi">Resultado<b>${money(rep.result)}</b></div>
        <div class="kpi">Saldo em dinheiro<b>${money(rep.balances.cash)}</b></div>
        <div class="kpi">Saldo em conta<b>${money(rep.balances.bank)}</b></div>
        <div class="kpi">Saldo total<b>${money(rep.balances.total)}</b></div>
      </div>
      ${tbl('Receitas por categoria', ['Categoria', 'Total'], catT(rep.income.byCategory), ['Total', money(rep.income.total)])}
      ${tbl('Receitas por forma de pagamento', ['Forma', 'Total'], catT(rep.income.byMethod))}
      ${tbl('Receitas por culto', ['Culto', 'Total'], catT(rep.income.byCult))}
      ${tbl('Despesas por categoria', ['Categoria', 'Total'], catT(rep.expense.byCategory), ['Total', money(rep.expense.total)])}
      ${tbl('Despesas por forma de pagamento', ['Forma', 'Total'], catT(rep.expense.byMethod))}
      ${tbl('Receitas (detalhado)', ['Data', 'Categoria', 'Forma', 'Membro', 'Valor'],
        rep.income.rows.map((t) => [fmtDate(t.date), t.category || '—', t.payment_method || '—', t.member?.name || '—', money(t.amount)]))}
      ${tbl('Despesas (detalhado)', ['Data', 'Categoria', 'Forma', 'Descrição', 'Valor'],
        rep.expense.rows.map((t) => [fmtDate(t.date), t.category || '—', t.payment_method || '—', t.description || t.observation || '—', money(t.amount)]))}
      ${tbl('Contas a pagar no período', ['Vencimento', 'Descrição', 'Situação', 'Valor'],
        rep.payablesDue.map((p) => [fmtDate(p.due_date), p.description, p.status, money(p.amount)]))}
    `
    printHtml('Relatório financeiro', body)
  }

  const Cat = ({ title, list, total }) => (
    <div style={{ flex: 1, minWidth: 240 }}>
      <h3 style={{ margin: '0 0 6px' }}>{title}</h3>
      <div className="table-wrap">
        <table>
          <tbody>
            {list.map((r) => (
              <tr key={r.name}><td>{r.name}</td><td style={{ textAlign: 'right' }}>{money(r.total)}</td></tr>
            ))}
            {list.length === 0 && <tr><td colSpan="2" style={{ color: '#999' }}>—</td></tr>}
            {total != null && <tr className="tot"><td style={{ fontWeight: 'bold' }}>Total</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{money(total)}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <>
      <div className="card">
        <h2>Relatório financeiro</h2>
        <small>Escolha o período e exporte em PDF ou Excel com o máximo de dados.</small>

        <div className="row" style={{ marginTop: 10, alignItems: 'flex-end' }}>
          {!useRange ? (
            <div>
              <label>Mês</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          ) : (
            <>
              <div>
                <label>De</label>
                <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
              </div>
              <div>
                <label>Até</label>
                <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
              </div>
            </>
          )}
          <div>
            <button className="primary" onClick={load} disabled={loading}>{loading ? 'Carregando...' : 'Gerar'}</button>
          </div>
        </div>
        <div className="check" style={{ marginTop: 8 }}>
          <input id="useRange" type="checkbox" checked={useRange} onChange={(e) => setUseRange(e.target.checked)} />
          <label htmlFor="useRange" style={{ margin: 0 }}>Usar intervalo de datas personalizado</label>
        </div>

        {error && <div className="banner err" style={{ marginTop: 10 }}>{error}</div>}

        {rep && (
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={exportPdf}>📄 Exportar PDF</button>
            <button className="btn ghost" onClick={exportExcel}>⬇️ Exportar Excel</button>
          </div>
        )}
      </div>

      {rep && (
        <>
          <div className="card">
            <h2>Resumo — {periodLabel}</h2>
            <div className="kpis">
              <div className="kpi income">Receitas<div className="value">{money(rep.income.total)}</div></div>
              <div className="kpi expense">Despesas<div className="value">{money(rep.expense.total)}</div></div>
              <div className="kpi balance">Resultado<div className="value">{money(rep.result)}</div></div>
            </div>
            <h3 style={{ margin: '10px 0 0' }}>Saldos atuais</h3>
            <div className="kpis">
              <div className="kpi">Dinheiro<div className="value">{money(rep.balances.cash)}</div></div>
              <div className="kpi">Conta bancária<div className="value">{money(rep.balances.bank)}</div></div>
              <div className="kpi balance">Total<div className="value">{money(rep.balances.total)}</div></div>
            </div>
            {rep.offCash.total > 0 && (
              <small className="muted">Extra-caixa no período (não entra no saldo): {money(rep.offCash.total)}</small>
            )}
          </div>

          <div className="card">
            <h2>Receitas</h2>
            <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
              <Cat title="Por categoria" list={rep.income.byCategory} total={rep.income.total} />
              <Cat title="Por forma de pagamento" list={rep.income.byMethod} />
              <Cat title="Por culto" list={rep.income.byCult} />
            </div>
          </div>

          <div className="card">
            <h2>Despesas</h2>
            <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
              <Cat title="Por categoria" list={rep.expense.byCategory} total={rep.expense.total} />
              <Cat title="Por forma de pagamento" list={rep.expense.byMethod} />
            </div>
          </div>
        </>
      )}
    </>
  )
}
