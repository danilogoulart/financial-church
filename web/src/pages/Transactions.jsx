import { useEffect, useRef, useState } from 'react'
import {
  createTransaction,
  formatMoney,
  listCategories,
  listMembers,
  listRecentTransactions,
  uploadReceipt
} from '../api'
import ReceiptLink from '../components/ReceiptLink.jsx'
import { CULTS, PAYMENT_METHODS } from '../constants'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY = {
  date: today(),
  competency: today().slice(0, 7),
  member_id: '',
  type: 'Receita',
  category: '',
  cult: '',
  payment_method: 'Dinheiro',
  amount: '',
  observation: ''
}

export default function Transactions() {
  const [form, setForm] = useState(EMPTY)
  const [members, setMembers] = useState([])
  const [categories, setCategories] = useState({ income: [], expense: [] })
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])
  const fileRef = useRef(null)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function load() {
    try {
      const [ms, cats, txs] = await Promise.all([
        listMembers(),
        listCategories(),
        listRecentTransactions()
      ])
      setMembers(ms)
      setCategories(cats)
      setRows(txs)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const categoryOptions = form.type === 'Despesa' ? categories.expense : categories.income

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      const receipt_path = await uploadReceipt(fileRef.current?.files?.[0])

      const trx = await createTransaction({
        date: form.date,
        competency: form.competency,
        member_id: form.member_id || null,
        type: form.type,
        category: form.category || categoryOptions[0] || null,
        cult: form.cult,
        payment_method: form.payment_method,
        amount: Number(form.amount),
        observation: form.observation,
        receipt_path
      })

      setBanner({ type: 'ok', msg: `Movimentação de ${formatMoney(trx.amount)} registrada.` })
      setForm({ ...EMPTY, date: today(), competency: today().slice(0, 7) })
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
        <h2>Nova Movimentação</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}

        <div className="row">
          <div>
            <label>Data</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div>
            <label>Competência</label>
            <input type="month" value={form.competency} onChange={(e) => set('competency', e.target.value)} />
          </div>
        </div>

        <label>Tipo</label>
        <select value={form.type} onChange={(e) => set('type', e.target.value)}>
          <option value="Receita">Receita</option>
          <option value="Despesa">Despesa</option>
        </select>

        <label>Membro</label>
        <select value={form.member_id} onChange={(e) => set('member_id', e.target.value)}>
          <option value="">— (opcional)</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <label>Categoria</label>
        <select value={form.category} onChange={(e) => set('category', e.target.value)}>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="row">
          <div>
            <label>Culto</label>
            <select value={form.cult} onChange={(e) => set('cult', e.target.value)}>
              <option value="">—</option>
              {CULTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Forma de pagamento</label>
            <select value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <label>Valor (R$)</label>
        <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />

        <label>Observação</label>
        <textarea rows="2" value={form.observation} onChange={(e) => set('observation', e.target.value)} />

        <label>Comprovante <small>(opcional — imagem ou PDF)</small></label>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" />

        <button className="primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>

      <div className="card">
        <h2>Movimentações recentes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Membro</th>
                <th>Valor</th>
                <th>Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.type}</td>
                  <td>{t.category || '—'}</td>
                  <td>{t.member?.name || '—'}</td>
                  <td>{formatMoney(t.amount)}</td>
                  <td><ReceiptLink path={t.receipt_path} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ color: '#999' }}>Nenhuma movimentação ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
