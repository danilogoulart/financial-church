import { useEffect, useState } from 'react'
import {
  createRecurring,
  currentCompetency,
  formatMoney,
  listCategories,
  listRecurring,
  setRecurringActive
} from '../api'

const EMPTY = {
  description: '',
  category: '',
  amount: '',
  due_day: 5,
  kind: 'fixa',
  installments_total: 12,
  start_competency: currentCompetency()
}

export default function Recurring() {
  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function load() {
    try {
      const [cats, recs] = await Promise.all([listCategories(), listRecurring()])
      setCategories(cats.expense)
      setRows(recs)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      const isParcelada = form.kind === 'parcelada'
      const rec = await createRecurring({
        description: form.description.trim(),
        category: form.category || categories[0] || null,
        amount: Number(form.amount),
        due_day: Number(form.due_day),
        kind: form.kind,
        installments_total: isParcelada ? Number(form.installments_total) : null,
        start_competency: form.start_competency,
        active: true
      })
      setBanner({ type: 'ok', msg: `Despesa recorrente "${rec.description}" cadastrada.` })
      setForm({ ...EMPTY, start_competency: currentCompetency() })
      load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function toggle(rec) {
    try {
      await setRecurringActive(rec.id, !rec.active)
      load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  const isParcelada = form.kind === 'parcelada'

  return (
    <>
      <form className="card" onSubmit={save}>
        <h2>Nova Despesa Recorrente</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}

        <label>Tipo</label>
        <select value={form.kind} onChange={(e) => set('kind', e.target.value)}>
          <option value="fixa">Fixa (todo mês, sem fim)</option>
          <option value="parcelada">Parcelada (nº de parcelas)</option>
        </select>

        <label>Descrição</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)} required />

        <label>Categoria</label>
        <select value={form.category} onChange={(e) => set('category', e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="row">
          <div>
            <label>Valor (R$){isParcelada ? ' por parcela' : ' por mês'}</label>
            <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
          </div>
          <div>
            <label>Dia do vencimento</label>
            <input type="number" min="1" max="28" value={form.due_day} onChange={(e) => set('due_day', e.target.value)} required />
          </div>
        </div>

        <div className="row">
          <div>
            <label>Mês inicial</label>
            <input type="month" value={form.start_competency} onChange={(e) => set('start_competency', e.target.value)} required />
          </div>
          {isParcelada && (
            <div>
              <label>Nº de parcelas</label>
              <input type="number" min="1" value={form.installments_total} onChange={(e) => set('installments_total', e.target.value)} required />
            </div>
          )}
        </div>

        <button className="primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>

      <div className="card">
        <h2>Despesas recorrentes cadastradas</h2>
        <small>Use "Gerar contas do mês" na aba Contas a Pagar para criar as contas a partir daqui.</small>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Venc.</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.description}</td>
                  <td>
                    {r.kind === 'parcelada'
                      ? `Parcelada (${r.installments_total}x)`
                      : 'Fixa'}
                  </td>
                  <td>{formatMoney(r.amount)}</td>
                  <td>dia {r.due_day}</td>
                  <td>
                    <span className={`pill ${r.active ? 'ok' : 'warn'}`}>
                      {r.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => toggle(r)}>
                      {r.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ color: '#999' }}>Nenhuma despesa recorrente ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
