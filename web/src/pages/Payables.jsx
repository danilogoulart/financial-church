import { useEffect, useRef, useState } from 'react'
import {
  createPayable,
  currentCompetency,
  deletePayable,
  formatMoney,
  generateMonthPayables,
  listCategories,
  listPayablesPage,
  markPayablePaid,
  monthGenerated,
  monthLabel,
  updatePayable,
  uploadReceipt
} from '../api'
import ReceiptLink from '../components/ReceiptLink.jsx'
import Pagination from '../components/Pagination.jsx'

const EMPTY = {
  description: '',
  category: '',
  amount: '',
  due_date: '',
  payment_date: ''
}
const SIZE = 20

export default function Payables() {
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [existingReceipt, setExistingReceipt] = useState(null)
  const [categories, setCategories] = useState([])
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [reload, setReload] = useState(0)
  const [filters, setFilters] = useState({ status: '', search: '', from: '', to: '' })
  const [month, setMonth] = useState(currentCompetency())
  const [generating, setGenerating] = useState(false)
  const [needsGenerate, setNeedsGenerate] = useState(false)
  const fileRef = useRef(null)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(0)
  }

  async function load() {
    try {
      const [cats, pays, generated] = await Promise.all([
        listCategories(),
        listPayablesPage(page, SIZE, filters),
        monthGenerated(currentCompetency())
      ])
      setCategories(cats.expense)
      setRows(pays.rows)
      setTotal(pays.total)
      setNeedsGenerate(!generated)
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reload, filters])

  const refresh = () => setReload((r) => r + 1)

  async function generate(competency) {
    setGenerating(true)
    setBanner(null)
    try {
      const { created, skipped } = await generateMonthPayables(competency)
      setBanner({
        type: 'ok',
        msg: `${monthLabel(competency)}: ${created} conta(s) gerada(s)` +
          (skipped ? `, ${skipped} já existia(m).` : '.')
      })
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setGenerating(false)
    }
  }

  async function pay(id) {
    setBanner(null)
    try {
      await markPayablePaid(id)
      setBanner({ type: 'ok', msg: 'Conta marcada como paga (entra como despesa).' })
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  function startEdit(p) {
    setEditingId(p.id)
    setExistingReceipt(p.receipt_path || null)
    setForm({
      description: p.description,
      category: p.category || '',
      amount: p.amount,
      due_date: p.due_date || '',
      payment_date: p.payment_date || ''
    })
    if (fileRef.current) fileRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setExistingReceipt(null)
    setForm(EMPTY)
    setBanner(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function remove(p) {
    if (!window.confirm(`Excluir a conta "${p.description}"?`)) return
    try {
      await deletePayable(p.id)
      if (editingId === p.id) cancelEdit()
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    }
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      let receipt_path = editingId ? existingReceipt : null
      const file = fileRef.current?.files?.[0]
      if (file) receipt_path = await uploadReceipt(file)

      const hasPayment = !!form.payment_date
      const payload = {
        description: form.description.trim(),
        category: form.category || categories[0] || null,
        amount: Number(form.amount),
        due_date: form.due_date,
        payment_date: form.payment_date || null,
        status: hasPayment ? 'Pago' : 'Em aberto',
        receipt_path
      }

      if (editingId) {
        await updatePayable(editingId, payload)
        setBanner({ type: 'ok', msg: 'Conta atualizada.' })
        setEditingId(null)
        setExistingReceipt(null)
      } else {
        const payable = await createPayable(payload)
        setBanner({ type: 'ok', msg: `Conta "${payable.description}" registrada (${payable.status}).` })
        setPage(0)
      }
      setForm(EMPTY)
      if (fileRef.current) fileRef.current.value = ''
      refresh()
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {needsGenerate && (
        <div className="card" style={{ borderColor: 'var(--primary)' }}>
          <div className="banner ok" style={{ marginBottom: 12 }}>
            Você ainda não gerou as contas fixas/parceladas de <b>{monthLabel(currentCompetency())}</b>.
          </div>
          <button
            className="primary"
            disabled={generating}
            onClick={() => generate(currentCompetency())}
          >
            {generating ? 'Gerando...' : `Gerar contas de ${monthLabel(currentCompetency())}`}
          </button>
        </div>
      )}

      <div className="card">
        <h2>Gerar contas do mês</h2>
        {banner && <div className={`banner ${banner.type}`}>{banner.msg}</div>}
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>Mês</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div>
            <button className="primary" disabled={generating} onClick={() => generate(month)}>
              {generating ? 'Gerando...' : 'Gerar'}
            </button>
          </div>
        </div>
        <small>Cria as contas das despesas recorrentes vigentes. Pode clicar mais de uma vez sem duplicar.</small>
      </div>

      <form className="card" onSubmit={save}>
        <h2>{editingId ? 'Editar Conta' : 'Nova Conta Avulsa'}</h2>

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

        <label style={{ marginTop: 14 }}>
          Comprovante{' '}
          <small>
            {existingReceipt ? '(há um; envie outro só para substituir)' : '(opcional — imagem ou PDF)'}
          </small>
        </label>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" />

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
        <h2>Contas</h2>

        <div className="row">
          <div style={{ flex: 2 }}>
            <label>Buscar por descrição</label>
            <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Descrição..." />
          </div>
          <div>
            <label>Situação</label>
            <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">Todas</option>
              <option value="Em aberto">Em aberto</option>
              <option value="Pago">Pago</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <label>Vencimento de</label>
            <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
          </div>
          <div>
            <label>Vencimento até</label>
            <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Situação</th>
                <th>Comprovante</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.description}</td>
                  <td>{formatMoney(p.amount)}</td>
                  <td>{p.due_date}</td>
                  <td>{p.status}</td>
                  <td><ReceiptLink path={p.receipt_path} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {p.status !== 'Pago' && (
                      <>
                        <button className="link-btn" onClick={() => pay(p.id)}>pagar</button>
                        {' · '}
                      </>
                    )}
                    <button className="link-btn" onClick={() => startEdit(p)}>editar</button>
                    {' · '}
                    <button className="link-btn" onClick={() => remove(p)}>excluir</button>
                  </td>
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
        <Pagination page={page} size={SIZE} total={total} onPage={setPage} />
      </div>
    </>
  )
}
