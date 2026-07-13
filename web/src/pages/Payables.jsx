import { useEffect, useRef, useState } from 'react'
import {
  createPayable,
  formatMoney,
  listCategories,
  listRecentPayables,
  uploadReceipt
} from '../api'
import ReceiptLink from '../components/ReceiptLink.jsx'

const EMPTY = {
  description: '',
  category: '',
  amount: '',
  due_date: '',
  payment_date: ''
}

export default function Payables() {
  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])
  const fileRef = useRef(null)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function load() {
    try {
      const [cats, pays] = await Promise.all([listCategories(), listRecentPayables()])
      setCategories(cats.expense)
      setRows(pays)
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
      const receipt_path = await uploadReceipt(fileRef.current?.files?.[0])
      const hasPayment = !!form.payment_date

      const payable = await createPayable({
        description: form.description.trim(),
        category: form.category || categories[0] || null,
        amount: Number(form.amount),
        due_date: form.due_date,
        payment_date: form.payment_date || null,
        status: hasPayment ? 'Pago' : 'Em aberto',
        receipt_path
      })

      setBanner({ type: 'ok', msg: `Conta "${payable.description}" registrada (${payable.status}).` })
      setForm(EMPTY)
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <form className="card" onSubmit={save}>
        <h2>Nova Conta a Pagar</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}

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
            <label>Valor (R$)</label>
            <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
          </div>
          <div>
            <label>Vencimento</label>
            <input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} required />
          </div>
        </div>

        <label>Pagamento <small>(opcional)</small></label>
        <input type="date" value={form.payment_date} onChange={(e) => set('payment_date', e.target.value)} />
        <small>Se preenchido, a conta é registrada como <b>Paga</b>.</small>

        <label style={{ marginTop: 14 }}>Comprovante <small>(opcional — imagem ou PDF)</small></label>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" />

        <button className="primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>

      <div className="card">
        <h2>Contas recentes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Situação</th>
                <th>Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.description}</td>
                  <td>{p.category || '—'}</td>
                  <td>{formatMoney(p.amount)}</td>
                  <td>{p.due_date}</td>
                  <td>{p.status}</td>
                  <td><ReceiptLink path={p.receipt_path} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ color: '#999' }}>Nenhuma conta ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
