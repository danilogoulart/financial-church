import { useEffect, useState } from 'react'
import { contributionBuckets, financialPeople, financialReport, formatMoney, monthlySeries, tithesOfferingsMonthly } from '../api'
import { APP_NAME } from '../brand'
import { exportXlsSections } from '../exportXls'
import { printHtml } from '../printDoc'
import { Donut, MonthBars, SeriesBars, BarsH, Gauge, PALETTE } from '../components/Charts.jsx'

// financialReport devolve {name,total}; os gráficos usam {label,value}.
const asLV = (list) => (list || []).map((r) => ({ label: r.name, value: r.total }))

const thisMonth = () => new Date().toISOString().slice(0, 7)
const thisYear = () => new Date().getFullYear()
const monthRange = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return { from: `${ym}-01`, to: `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}` }
}
const yearRange = (y) => ({ from: `${y}-01-01`, to: `${y}-12-31` })
const fmtDate = (d) => (d ? d.split('-').reverse().join('/') : '')
const money = (v) => formatMoney(v)
const pct = (part, whole) => (whole ? (part / whole) * 100 : 0).toFixed(1).replace('.', ',') + '%'

function DeltaBadge({ cur, prev, goodUp = true }) {
  if (prev == null || prev === 0) return <span style={{ color: '#898781' }}>—</span>
  const d = ((cur - prev) / Math.abs(prev)) * 100
  const up = d >= 0
  const good = goodUp ? up : !up
  return (
    <span style={{ color: good ? '#1e7e45' : '#c0392b', fontWeight: 'bold' }}>
      {up ? '▲' : '▼'} {Math.abs(d).toFixed(1).replace('.', ',')}%
    </span>
  )
}

export default function PrestacaoContas() {
  const [scope, setScope] = useState('mes') // mes | ano
  const [month, setMonth] = useState(thisMonth())
  const [year, setYear] = useState(thisYear())
  const [view, setView] = useState('valores') // valores | percentuais
  const [rep, setRep] = useState(null)
  const [prev, setPrev] = useState(null)
  const [people, setPeople] = useState(null)
  const [series, setSeries] = useState(null)
  const [dzof, setDzof] = useState(null)
  const [buckets, setBuckets] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const period = scope === 'ano' ? yearRange(year) : monthRange(month)
  const periodLabel = scope === 'ano' ? `Ano de ${year}` : `${fmtDate(period.from)} a ${fmtDate(period.to)}`
  const isPct = view === 'percentuais'

  function prevPeriod() {
    if (scope === 'ano') return { range: yearRange(year - 1), label: `${year - 1}` }
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    const pym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { range: monthRange(pym), label: pym.split('-').reverse().join('/') }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const pp = prevPeriod()
      const [r, p, s, prevR, dz, bk] = await Promise.all([
        financialReport(period.from, period.to),
        financialPeople(period.from, period.to),
        monthlySeries(3),
        financialReport(pp.range.from, pp.range.to),
        tithesOfferingsMonthly(6),
        contributionBuckets(period.from, period.to)
      ])
      setRep(r); setPeople(p); setSeries(s); setPrev({ ...prevR, label: pp.label }); setDzof(dz); setBuckets(bk)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  // valor conforme a aba (R$ ou % sobre uma base)
  const v = (amount, base) => (isPct ? pct(amount, base) : money(amount))

  function catRows(list, base) {
    return list.map((r) => [r.name, isPct ? pct(r.total, base) : money(r.total)])
  }

  function exportExcel() {
    if (!rep) return
    const secs = [
      { title: `Prestação de contas — ${periodLabel} (${isPct ? 'percentuais' : 'valores'})`, headers: [], rows: [] },
      {
        title: 'Resumo',
        headers: ['Indicador', isPct ? '%' : 'Valor'],
        rows: [
          ['Receitas', isPct ? '100%' : money(rep.income.total)],
          ['Despesas', isPct ? pct(rep.expense.total, rep.income.total) : money(rep.expense.total)],
          ['Resultado', isPct ? pct(rep.result, rep.income.total) : money(rep.result)]
        ]
      },
      { title: 'Receitas por categoria', headers: ['Categoria', isPct ? '%' : 'Valor'], rows: catRows(rep.income.byCategory, rep.income.total) },
      { title: 'Despesas por categoria', headers: ['Categoria', isPct ? '%' : 'Valor'], rows: catRows(rep.expense.byCategory, rep.expense.total) },
      { title: 'Receitas por forma de pagamento', headers: ['Forma', isPct ? '%' : 'Valor'], rows: catRows(rep.income.byMethod, rep.income.total) }
    ]
    if (people) {
      secs.push({
        title: 'Pessoas',
        headers: ['Indicador', 'Valor'],
        rows: [
          ['Membros ativos', people.ativos],
          ['Obreiros', people.obreiros],
          ['Membros', people.membros],
          ['Congregados', people.congregados],
          ['Dizimistas no período', people.dizimistas],
          ['Obreiros dizimistas', people.obreirosDizimistas],
          ['% que dizima', pct(people.dizimistas, people.ativos)],
          ['% dos obreiros que dizimam', pct(people.obreirosDizimistas, people.obreiros)]
        ]
      })
    }
    exportXlsSections(`prestacao-contas-${period.from}_a_${period.to}`, 'Prestação', secs)
  }

  function exportPdf() {
    if (!rep) return
    const tbl = (title, rows, tot) => {
      if (!rows.length) return ''
      const body = rows.map((r) => `<tr><td>${r[0]}</td><td class="r">${r[1]}</td></tr>`).join('')
      const totRow = tot ? `<tr class="tot"><td>${tot[0]}</td><td class="r">${tot[1]}</td></tr>` : ''
      return `<h2>${title}</h2><table>${body}${totRow}</table>`
    }
    const pb = people ? `
      <h2>Pessoas</h2><table>
      <tr><td>Membros ativos</td><td class="r">${people.ativos}</td></tr>
      <tr><td>Obreiros</td><td class="r">${people.obreiros}</td></tr>
      <tr><td>Membros</td><td class="r">${people.membros}</td></tr>
      <tr><td>Congregados</td><td class="r">${people.congregados}</td></tr>
      <tr><td>Dizimistas no período</td><td class="r">${people.dizimistas}</td></tr>
      <tr><td>Obreiros dizimistas</td><td class="r">${people.obreirosDizimistas}</td></tr>
      <tr><td>% que dizima</td><td class="r">${pct(people.dizimistas, people.ativos)}</td></tr>
      <tr><td>% dos obreiros que dizimam</td><td class="r">${pct(people.obreirosDizimistas, people.obreiros)}</td></tr>
      </table>` : ''
    const body = `
      <h1>${APP_NAME} — Prestação de contas</h1>
      <div class="muted">${periodLabel} · ${isPct ? 'percentuais' : 'valores'}</div>
      <div class="kpis">
        <div class="kpi">Receitas<b>${isPct ? '100%' : money(rep.income.total)}</b></div>
        <div class="kpi">Despesas<b>${isPct ? pct(rep.expense.total, rep.income.total) : money(rep.expense.total)}</b></div>
        <div class="kpi">Resultado<b>${isPct ? pct(rep.result, rep.income.total) : money(rep.result)}</b></div>
      </div>
      ${tbl('Receitas por categoria', catRows(rep.income.byCategory, rep.income.total), ['Total', isPct ? '100%' : money(rep.income.total)])}
      ${tbl('Despesas por categoria', catRows(rep.expense.byCategory, rep.expense.total), ['Total', isPct ? '100%' : money(rep.expense.total)])}
      ${tbl('Receitas por forma de pagamento', catRows(rep.income.byMethod, rep.income.total))}
      ${pb}
    `
    printHtml('Prestação de contas', body)
  }

  return (
    <>
      <div className="card">
        <h2>Prestação de Contas</h2>
        <small>Relatório sem nomes, para apresentar à igreja. Escolha o período e a visão.</small>

        <div className="row" style={{ marginTop: 10, alignItems: 'flex-end' }}>
          <div>
            <label>Período</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="mes">Mês</option>
              <option value="ano">Ano</option>
            </select>
          </div>
          {scope === 'mes' ? (
            <div><label>Mês</label><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
          ) : (
            <div><label>Ano</label><input type="number" value={year} min="2020" max="2100" onChange={(e) => setYear(Number(e.target.value))} /></div>
          )}
          <div><button className="primary" onClick={load} disabled={loading}>{loading ? 'Carregando...' : 'Gerar'}</button></div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className={view === 'valores' ? 'primary' : 'btn ghost'} onClick={() => setView('valores')}>Valores (R$)</button>
          <button className={view === 'percentuais' ? 'primary' : 'btn ghost'} onClick={() => setView('percentuais')}>Percentuais (%)</button>
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
              <div className="kpi income">Receitas<div className="value">{isPct ? '100%' : money(rep.income.total)}</div></div>
              <div className="kpi expense">Despesas<div className="value">{isPct ? pct(rep.expense.total, rep.income.total) : money(rep.expense.total)}</div></div>
              <div className="kpi balance">Resultado<div className="value">{isPct ? pct(rep.result, rep.income.total) : money(rep.result)}</div></div>
            </div>
          </div>

          {prev && (
            <div className="card">
              <h2>Comparativo com período anterior ({prev.label})</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Indicador</th><th style={{ textAlign: 'right' }}>Atual</th><th style={{ textAlign: 'right' }}>Anterior</th><th style={{ textAlign: 'right' }}>Variação</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Receitas</td>
                      <td style={{ textAlign: 'right' }}>{money(rep.income.total)}</td>
                      <td style={{ textAlign: 'right' }}>{money(prev.income.total)}</td>
                      <td style={{ textAlign: 'right' }}><DeltaBadge cur={rep.income.total} prev={prev.income.total} goodUp /></td>
                    </tr>
                    <tr>
                      <td>Despesas</td>
                      <td style={{ textAlign: 'right' }}>{money(rep.expense.total)}</td>
                      <td style={{ textAlign: 'right' }}>{money(prev.expense.total)}</td>
                      <td style={{ textAlign: 'right' }}><DeltaBadge cur={rep.expense.total} prev={prev.expense.total} goodUp={false} /></td>
                    </tr>
                    <tr>
                      <td>Resultado</td>
                      <td style={{ textAlign: 'right' }}>{money(rep.result)}</td>
                      <td style={{ textAlign: 'right' }}>{money(prev.result)}</td>
                      <td style={{ textAlign: 'right' }}><DeltaBadge cur={rep.result} prev={prev.result} goodUp /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <h2>Receitas por categoria</h2>
            <Donut data={asLV(rep.income.byCategory)} mode={view} />
          </div>

          <div className="card">
            <h2>Despesas por categoria</h2>
            <Donut data={asLV(rep.expense.byCategory)} mode={view} />
          </div>

          <div className="card">
            <h2>Receitas por forma de pagamento</h2>
            <Donut data={asLV(rep.income.byMethod)} mode={view} />
          </div>

          <div className="card">
            <h2>Receitas × Despesas — últimos 3 meses</h2>
            <MonthBars data={series} />
          </div>

          <div className="card">
            <h2>Dízimos × Ofertas — últimos 6 meses</h2>
            <SeriesBars data={dzof} series={[{ key: 'dizimos', label: 'Dízimos', color: PALETTE[0] }, { key: 'ofertas', label: 'Ofertas', color: PALETTE[1] }]} />
          </div>

          <div className="card">
            <h2>Faixas de contribuição</h2>
            <small>Nº de membros por total de dízimo no período (sem nomes).</small>
            <div style={{ marginTop: 8 }}>
              <BarsH data={buckets} format="count" keepOrder color={PALETTE[2]} />
            </div>
          </div>

          {people && (
            <div className="card">
              <h2>Pessoas</h2>
              <div className="row" style={{ gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <Gauge pct={people.pctDizima} label={`${people.dizimistas} de ${people.ativos} membros ativos dizimaram no período`} />
                <div className="kpis" style={{ flex: 1, minWidth: 260 }}>
                  <div className="kpi">Ativos<div className="value">{people.ativos}</div></div>
                  <div className="kpi">Obreiros<div className="value">{people.obreiros}</div></div>
                  <div className="kpi">Membros<div className="value">{people.membros}</div></div>
                  <div className="kpi">Congregados<div className="value">{people.congregados}</div></div>
                  <div className="kpi">Dizimistas<div className="value">{people.dizimistas}</div></div>
                  <div className="kpi">Obreiros dizimistas<div className="value">{people.obreirosDizimistas}</div></div>
                </div>
              </div>
              <small className="muted">% dos obreiros que dizimam: <b>{pct(people.obreirosDizimistas, people.obreiros)}</b></small>
            </div>
          )}
        </>
      )}
    </>
  )
}
