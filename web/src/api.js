import { supabase } from './supabaseClient'
import { WORKER_MINISTRIES } from './constants'

// ---------- Membros ----------

export async function listMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data
}

export async function listRecentMembers(limit = 50) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function createMember(member) {
  const { data, error } = await supabase
    .from('members')
    .insert(member)
    .select()
    .single()
  if (error) throw mapError(error)
  return data
}

export async function updateMember(id, fields) {
  const { data, error } = await supabase
    .from('members')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw mapError(error)
  return data
}

export async function setMemberActive(id, active) {
  const { error } = await supabase.from('members').update({ active }).eq('id', id)
  if (error) throw error
}

// ---------- Categorias ----------

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('kind, name')
    .order('name')
  if (error) throw error

  const income = []
  const expense = []
  data.forEach((c) => (c.kind === 'expense' ? expense : income).push(c.name))
  return { income, expense }
}

// ---------- Movimentações ----------

export async function listRecentTransactions(limit = 50) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, member:members(name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function createTransaction(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single()
  if (error) throw mapError(error)
  return data
}

// ---------- Contas a pagar ----------

export async function listRecentPayables(limit = 50) {
  const { data, error } = await supabase
    .from('payables')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function createPayable(payable) {
  const { data, error } = await supabase
    .from('payables')
    .insert(payable)
    .select()
    .single()
  if (error) throw mapError(error)
  return data
}

// ---------- Comprovantes (Storage) ----------

export async function uploadReceipt(file) {
  if (!file) return null

  const safeName = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${crypto.randomUUID()}-${safeName}`

  const { error } = await supabase.storage.from('receipts').upload(path, file)
  if (error) throw error
  return path
}

export async function receiptUrl(path) {
  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

// URL que força download (Content-Disposition: attachment).
export async function receiptDownloadUrl(path) {
  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, 3600, { download: true })
  if (error) throw error
  return data.signedUrl
}

// Link compartilhável válido por 7 dias (para enviar a contador/auditor).
export async function receiptShareUrl(path) {
  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, 7 * 24 * 3600)
  if (error) throw error
  return data.signedUrl
}

// ---------- Dashboard ----------

export async function dashboardTotals() {
  const [{ data: txs, error: e1 }, { data: pays, error: e2 }] = await Promise.all([
    supabase.from('transactions').select('type, category, amount'),
    supabase.from('payables').select('status, amount, category')
  ])
  if (e1) throw e1
  if (e2) throw e2

  let totalIncome = 0
  let totalExpense = 0
  const incomeByCategory = {}
  const expenseByCategory = {}

  const addExpense = (category, amount) => {
    totalExpense += amount
    const key = category || '(sem categoria)'
    expenseByCategory[key] = (expenseByCategory[key] || 0) + amount
  }

  txs.forEach((t) => {
    const amount = Number(t.amount) || 0
    if (t.type === 'Receita') {
      totalIncome += amount
      const key = t.category || '(sem categoria)'
      incomeByCategory[key] = (incomeByCategory[key] || 0) + amount
    } else {
      addExpense(t.category, amount)
    }
  })

  let payableOpen = 0
  let payableOpenCount = 0
  let payablePaid = 0

  pays.forEach((p) => {
    const amount = Number(p.amount) || 0
    if (p.status === 'Pago') {
      payablePaid += amount
      // Conta paga entra como despesa nos gráficos/relatórios.
      addExpense(p.category, amount)
    } else {
      payableOpen += amount
      payableOpenCount++
    }
  })

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    incomeByCategory,
    expenseByCategory,
    payableOpen,
    payableOpenCount,
    payablePaid
  }
}

// ---------- util ----------

function mapError(error) {
  if (error.code === '23505') {
    // unique_violation
    if (String(error.message).includes('members_name_unique')) {
      return new Error('Já existe um membro com esse nome.')
    }
    return new Error('Registro duplicado.')
  }
  return new Error(error.message || 'Erro ao salvar.')
}

export function formatMoney(value) {
  return (Number(value) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

// ---------- Marcar conta como paga ----------

export async function markPayablePaid(id) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('payables')
    .update({ status: 'Pago', payment_date: today })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------- Despesas recorrentes (fixas / parceladas) ----------

export async function listRecurring() {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createRecurring(rec) {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert(rec)
    .select()
    .single()
  if (error) throw mapError(error)
  return data
}

export async function setRecurringActive(id, active) {
  const { error } = await supabase
    .from('recurring_expenses')
    .update({ active })
    .eq('id', id)
  if (error) throw error
}

// ---------- Geração das contas do mês ----------

export async function monthGenerated(competency) {
  const { count, error } = await supabase
    .from('payables')
    .select('id', { count: 'exact', head: true })
    .eq('competency', competency)
    .not('recurring_id', 'is', null)
  if (error) throw error
  return (count || 0) > 0
}

// Cria as Contas a Pagar do mês a partir das recorrentes vigentes.
// Idempotente: não duplica o que já foi gerado para o mês.
export async function generateMonthPayables(competency) {
  const { data: recs, error } = await supabase.from('recurring_expenses').select('*')
  if (error) throw error

  const target = compIndex(competency)
  const applicable = []

  recs.forEach((r) => {
    const start = compIndex(r.start_competency)
    if (target < start) return
    if (r.kind === 'fixa') {
      if (r.active) applicable.push({ r, parcela: null })
    } else {
      const parcela = target - start + 1
      if (parcela >= 1 && parcela <= (r.installments_total || 0)) {
        applicable.push({ r, parcela })
      }
    }
  })

  if (applicable.length === 0) return { created: 0, skipped: 0 }

  const { data: existing, error: e2 } = await supabase
    .from('payables')
    .select('recurring_id')
    .eq('competency', competency)
    .not('recurring_id', 'is', null)
  if (e2) throw e2
  const done = new Set((existing || []).map((p) => p.recurring_id))

  const rows = applicable
    .filter(({ r }) => !done.has(r.id))
    .map(({ r, parcela }) => ({
      description: parcela
        ? `${r.description} (Parcela ${parcela}/${r.installments_total})`
        : r.description,
      category: r.category,
      amount: r.amount,
      due_date: `${competency}-${String(Math.min(r.due_day, 28)).padStart(2, '0')}`,
      status: 'Em aberto',
      recurring_id: r.id,
      competency
    }))

  if (rows.length === 0) return { created: 0, skipped: applicable.length }

  const { error: e3 } = await supabase.from('payables').insert(rows)
  if (e3) throw e3

  return { created: rows.length, skipped: applicable.length - rows.length }
}

// ---------- Relatórios ----------

// Dizimistas: em quantos dos 3 meses anteriores ao mês atual houve dízimo.
export async function tithersLast3Months() {
  const months = previousMonths(3)

  const [{ data: tithers, error: e1 }, { data: tithes, error: e2 }] = await Promise.all([
    supabase.from('members').select('id, name, ministry').eq('tither', true).order('name'),
    supabase
      .from('transactions')
      .select('member_id, competency')
      .eq('type', 'Receita')
      .eq('category', 'Dízimos')
      .in('competency', months)
  ])
  if (e1) throw e1
  if (e2) throw e2

  const byMember = {}
  tithes.forEach((t) => {
    if (!t.member_id) return
    ;(byMember[t.member_id] = byMember[t.member_id] || new Set()).add(t.competency)
  })

  const rows = tithers.map((m) => {
    const set = byMember[m.id] || new Set()
    return {
      id: m.id,
      name: m.name,
      ministry: m.ministry,
      perMonth: months.map((mm) => set.has(mm)),
      monthsTithed: months.filter((mm) => set.has(mm)).length
    }
  })

  // Quem tithou em menos meses primeiro (destaca quem está faltando).
  rows.sort((a, b) => a.monthsTithed - b.monthsTithed || a.name.localeCompare(b.name))

  return { months, rows }
}

// Obreiros (altar/obreiros) que não são dizimistas.
export async function nonTitherWorkers() {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, ministry, phone')
    .eq('tither', false)
    .in('ministry', WORKER_MINISTRIES)
    .order('name')
  if (error) throw error
  return data
}

// ---------- Série mensal (gráfico receitas x despesas) ----------

export async function monthlySeries(n = 6) {
  const months = lastNMonths(n)

  const [{ data: txs, error: e1 }, { data: pays, error: e2 }] = await Promise.all([
    supabase.from('transactions').select('type, amount, competency'),
    supabase.from('payables').select('amount, payment_date').eq('status', 'Pago')
  ])
  if (e1) throw e1
  if (e2) throw e2

  const base = {}
  months.forEach((m) => (base[m] = { month: m, income: 0, expense: 0 }))

  txs.forEach((t) => {
    const row = base[t.competency]
    if (!row) return
    const amount = Number(t.amount) || 0
    if (t.type === 'Receita') row.income += amount
    else row.expense += amount
  })

  pays.forEach((p) => {
    const row = base[(p.payment_date || '').slice(0, 7)]
    if (row) row.expense += Number(p.amount) || 0
  })

  return months.map((m) => base[m])
}

// ---------- Livro Caixa ----------

// Movimentos de caixa (receitas + despesas de Movimentações + contas pagas)
// em ordem cronológica, com saldo anterior e saldo acumulado no período.
export async function cashBook(from, to) {
  const [{ data: txs, error: e1 }, { data: pays, error: e2 }] = await Promise.all([
    supabase.from('transactions').select('date, type, amount, category, observation, receipt_path'),
    supabase
      .from('payables')
      .select('payment_date, amount, category, description, receipt_path')
      .eq('status', 'Pago')
  ])
  if (e1) throw e1
  if (e2) throw e2

  const all = []

  txs.forEach((t) => {
    all.push({
      date: t.date,
      kind: t.type === 'Receita' ? 'Entrada' : 'Saída',
      description: t.observation || t.category || t.type,
      category: t.category || '',
      amount: t.type === 'Receita' ? Number(t.amount) : -Number(t.amount),
      receipt_path: t.receipt_path || null
    })
  })

  pays.forEach((p) => {
    all.push({
      date: p.payment_date,
      kind: 'Saída',
      description: p.description,
      category: p.category || '',
      amount: -Number(p.amount),
      receipt_path: p.receipt_path || null
    })
  })

  all.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const opening = all
    .filter((e) => from && e.date < from)
    .reduce((s, e) => s + e.amount, 0)

  let balance = opening
  let totalIn = 0
  let totalOut = 0
  const entries = []

  all.forEach((e) => {
    if (from && e.date < from) return
    if (to && e.date > to) return
    balance += e.amount
    if (e.amount >= 0) totalIn += e.amount
    else totalOut += -e.amount
    entries.push({ ...e, balance })
  })

  return { opening, entries, totalIn, totalOut, closing: balance }
}

// ---------- Competência (YYYY-MM) ----------

function compIndex(competency) {
  const [y, m] = String(competency).split('-').map(Number)
  return y * 12 + (m - 1)
}

function indexToComp(index) {
  const y = Math.floor(index / 12)
  const m = (index % 12) + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

export function currentCompetency() {
  return new Date().toISOString().slice(0, 7)
}

export function lastNMonths(n) {
  const end = compIndex(currentCompetency())
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(indexToComp(end - i))
  return out
}

export function previousMonths(n) {
  const end = compIndex(currentCompetency()) - 1
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(indexToComp(end - i))
  return out
}

export function monthLabel(competency) {
  const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const [y, m] = String(competency).split('-')
  return `${names[Number(m) - 1]}/${y.slice(2)}`
}
