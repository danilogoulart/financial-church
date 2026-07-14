import { useEffect, useRef, useState } from 'react'
import {
  createTransaction,
  deleteTransaction,
  formatMoney,
  listCategories,
  listMembers,
  listTransactionsPage,
  updateTransaction,
  uploadReceipt
} from '../api'
import ReceiptLink from '../components/ReceiptLink.jsx'
import Pagination from '../components/Pagination.jsx'
import { CULTS, PAYMENT_METHODS } from '../constants'

const today = () => new Date().toISOString().slice(0, 10)
const SIZE = 20

const EMPTY = {
  date: today(),
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
  const [editingId, setEditingId] = useState(null)
  const [existingReceipt, setExistingReceipt] = useState(null)
  const [members, setMembers] = useState([])
  const [categories, setCategories] = useState({ income: [], expense: [] })
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [reload, setReload] = useState(0)
  const fileRef = useRef(null)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function load() {
    try {
      const [ms, cats, txs] = await Promise.all([
        listMembers(),
        listCategories(),
        listTransactionsPage(page, SIZE)
      ])
      setMembers(ms)
      setCategories(cats)
      setRows(txs.rows)
      setTotal(txs.total)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reload])

  const refresh = () => setReload((r) => r + 1)

  const categoryOptions = form.type === 'Despesa' ? categories.expense : categories.income

  function startEdit(t) {
    setEditingId(t.id)
    setExistingReceipt(t.receipt_path || null)
    setForm({
      date: t.date,
      member_id: t.member_id || '',
      type: t.type,
      category: t.category || '',
      cult: t.cult || '',
      payment_method: t.payment_method || 'Dinheiro',
      amount: t.amount,
      observation: t.observation || ''
    })
    if (fileRef.current) fileRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setExistingReceipt(null)
    setForm({ ...EMPTY, date: today() })
    setBanner(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save(e) {
    e.preventDefault()
    setBanner(null)

    const file = fileRef.current?.files?.[0]
    // Despesa exige comprovante: ao criar, ou ao editar se ainda não houver um.
    if (form.type === 'Despesa' && !file && !existingReceipt) {
      setBanner({ type: 'err', msg: 'Comprovante é obrigatório para despesas.' })
      return
    }

    setSaving(true)
    try {
      let receipt_path = editingId ? existingReceipt : null
      if (file) receipt_path = await uploadReceipt(file)

      const payload = {
        date: form.date,
        member_id: form.member_id || null,
        type: form.type,
        category: form.category || categoryOptions[0] || null,
        cult: form.cult,
        payment_method: form.payment_method,
        amount: Number(form.amount),
        observation: form.observation,
        receipt_path
      }

      if (editingId) {
        await updateTransaction(editingId, payload)
        setBanner({ type: 'ok', msg: 'Movimentação atualizada.' })
        setEditingId(null)
        setExistingReceipt(null)
      } else {
        const trx = await createTransaction(payload)
        setBanner({ type: 'ok', msg: `Movimentação de ${formatMoney(trx.amount)} registrada.` })
        setPage(0)
      }
      setForm({ ...EMPTY, date: today() })
      if (fileRef.current) fileRef.current.value = ''
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function remove(t) {
    if (!window.confirm(`Excluir a movimentação de ${formatMoney(t.amount)}?`)) return
    try {
      await deleteTransaction(t.id)
      if (editingId === t.id) cancelEdit()
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  return (
    <>
      <form className="card" onSubmit={save}>
        <h2>{editingId ? 'Editar Movimentação' : 'Nova Movimentação'}</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}

        <label>Data</label>
        <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />

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

        {form.type === 'Despesa' && (
          <>
            <label>
              Comprovante{' '}
              <small>
                {existingReceipt
                  ? '(há um comprovante; envie outro só para substituir)'
                  : '(obrigatório para despesa — imagem ou PDF)'}
              </small>
            </label>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" />
          </>
        )}

        <button className="primary" disabled={saving}>
          {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
        </button>
        {editingId && (
          <button type="button" className="link-btn" style={{ marginTop: 10 }} onClick={cancelEdit}>
            Cancelar edição
          </button>
        )}
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
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Comprovante</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.type}</td>
                  <td>{t.category || '—'}</td>
                  <td>{t.member?.name || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{formatMoney(t.amount)}</td>
                  <td><ReceiptLink path={t.receipt_path} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="link-btn" onClick={() => startEdit(t)}>editar</button>
                    {' · '}
                    <button className="link-btn" onClick={() => remove(t)}>excluir</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ color: '#999' }}>Nenhuma movimentação ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} size={SIZE} total={total} onPage={setPage} />
      </div>
    </>
  )
}
