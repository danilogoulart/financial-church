import { useEffect, useState } from 'react'
import { cashBook, currentCompetency, formatMoney } from '../api'
import ReceiptLink from '../components/ReceiptLink.jsx'

const firstOfMonth = () => currentCompetency() + '-01'
const today = () => new Date().toISOString().slice(0, 10)

export default function CashBook() {
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setData(await cashBook(from, to))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exportCSV() {
    if (!data) return
    const header = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Saldo']
    const lines = data.entries.map((e) => [
      e.date,
      e.kind,
      e.description,
      e.category,
      e.amount.toFixed(2).replace('.', ','),
      e.balance.toFixed(2).replace('.', ',')
    ])
    const csv = [header, ...lines]
      .map((r) => r.map(csvCell).join(';'))
      .join('\r\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `livro-caixa_${from}_a_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="card">
        <h2>Livro Caixa</h2>
        {error && <div className="banner err">{error}</div>}

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
            <button className="primary" onClick={load} disabled={loading}>
              {loading ? 'Carregando...' : 'Aplicar'}
            </button>
          </div>
        </div>

        {data && (
          <div className="kpis" style={{ marginTop: 8 }}>
            <div className="kpi income">Entradas<div className="value">{formatMoney(data.totalIn)}</div></div>
            <div className="kpi expense">Saídas<div className="value">{formatMoney(data.totalOut)}</div></div>
            <div className="kpi balance">Saldo final<div className="value">{formatMoney(data.closing)}</div></div>
          </div>
        )}

        <button
          className="link-btn"
          style={{ marginTop: 14 }}
          onClick={exportCSV}
          disabled={!data || data.entries.length === 0}
        >
          ⬇ Exportar CSV
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
                <th>Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {data && (
                <tr>
                  <td colSpan="4" style={{ color: '#666' }}>Saldo anterior</td>
                  <td style={{ textAlign: 'right', color: '#666' }}>{formatMoney(data.opening)}</td>
                  <td></td>
                </tr>
              )}
              {data?.entries.map((e, i) => (
                <tr key={i}>
                  <td>{e.date}</td>
                  <td>{e.description}</td>
                  <td>{e.category || '—'}</td>
                  <td style={{ textAlign: 'right', color: e.amount >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                    {formatMoney(e.amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatMoney(e.balance)}</td>
                  <td>{e.kind === 'Saída' ? <ReceiptLink path={e.receipt_path} /> : '—'}</td>
                </tr>
              ))}
              {data && data.entries.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ color: '#999' }}>Sem movimentos no período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function csvCell(v) {
  const s = String(v ?? '')
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
