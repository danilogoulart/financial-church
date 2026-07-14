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

export async function listMembersPage(page = 0, size = 20, filters = {}) {
  const from = page * size
  let q = supabase.from('members').select('*', { count: 'exact' })
  if (filters.search) q = q.ilike('name', `%${filters.search}%`)
  if (filters.ministry) q = q.eq('ministry', filters.ministry)
  if (filters.activeOnly) q = q.eq('active', true)
  const { data, count, error } = await q
    .order('created_at', { ascending: false })
    .range(from, from + size - 1)
  if (error) throw error
  return { rows: data, total: count || 0 }
}

export async function memberCounts() {
  const base = () => supabase.from('members').select('id', { count: 'exact', head: true })
  const [{ count: total }, { count: active }, { count: tithers }] = await Promise.all([
    base(),
    base().eq('active', true),
    base().eq('tither', true)
  ])
  return { total: total || 0, active: active || 0, tithers: tithers || 0 }
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

export async function listAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, kind, name')
    .order('kind')
    .order('name')
  if (error) throw error
  return data
}

export async function createCategory(kind, name) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ kind, name: name.trim() })
    .select()
    .single()
  if (error) throw mapError(error)
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ---------- Papéis / usuários ----------

export async function getMyRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'consulta'
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (error) return 'consulta'
  return data?.role || 'consulta'
}

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .order('email')
  if (error) throw error
  return data
}

export async function setProfileRole(id, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error
}

// ---------- Backup ----------

export async function fullBackup() {
  const tables = ['members', 'categories', 'transactions', 'payables', 'recurring_expenses']
  const out = { exported_at: new Date().toISOString() }
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*')
    if (error) throw error
    out[t] = data
  }
  return out
}

// ---------- Movimentações ----------

export async function listTransactionsPage(page = 0, size = 20, filters = {}) {
  const from = page * size
  let q = supabase.from('transactions').select('*, member:members(name)', { count: 'exact' })
  if (filters.type) q = q.eq('type', filters.type)
  if (filters.category) q = q.eq('category', filters.category)
  if (filters.from) q = q.gte('date', filters.from)
  if (filters.to) q = q.lte('date', filters.to)
  const { data, count, error } = await q
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + size - 1)
  if (error) throw error
  return { rows: data, total: count || 0 }
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

export async function updateTransaction(id, fields) {
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw mapError(error)
  return data
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

// ---------- Contas a pagar ----------

export async function listPayablesPage(page = 0, size = 20, filters = {}) {
  const from = page * size
  let q = supabase.from('payables').select('*', { count: 'exact' })
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.search) q = q.ilike('description', `%${filters.search}%`)
  if (filters.from) q = q.gte('due_date', filters.from)
  if (filters.to) q = q.lte('due_date', filters.to)
  const { data, count, error } = await q
    .order('due_date', { ascending: false })
    .range(from, from + size - 1)
  if (error) throw error
  return { rows: data, total: count || 0 }
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

export async function updatePayable(id, fields) {
  const { data, error } = await supabase
    .from('payables')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw mapError(error)
  return data
}

export async function deletePayable(id) {
  const { error } = await supabase.from('payables').delete().eq('id', id)
  if (error) throw error
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

// Totais do período [from, to] (YYYY-MM-DD). Sem args = todo o histórico.
// Receitas/despesas/categorias são filtradas pelo período; "contas em
// aberto" é sempre o retrato atual (não depende do período).
export async function dashboardTotals(from, to) {
  const [{ data: txs, error: e1 }, { data: pays, error: e2 }] = await Promise.all([
    supabase.from('transactions').select('type, category, amount, date'),
    supabase.from('payables').select('status, amount, category, payment_date')
  ])
  if (e1) throw e1
  if (e2) throw e2

  const inRange = (d) => (!from || (d && d >= from)) && (!to || (d && d <= to))

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
    if (!inRange(t.date)) return
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
      if (!inRange(p.payment_date)) return
      payablePaid += amount
      // Conta paga entra como despesa nos gráficos/relatórios.
      addExpense(p.category, amount)
    } else {
      // Em aberto: retrato atual, independente do período.
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
    const msg = String(error.message)
    if (msg.includes('members_name_unique')) {
      return new Error('Já existe um membro com esse nome.')
    }
    if (msg.includes('categories_kind_name_unique')) {
      return new Error('Essa categoria já existe.')
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
      .select('member_id, date')
      .eq('type', 'Receita')
      .eq('category', 'Dízimos')
      .gte('date', months[0] + '-01')
      .lt('date', currentCompetency() + '-01')
  ])
  if (e1) throw e1
  if (e2) throw e2

  const byMember = {}
  tithes.forEach((t) => {
    if (!t.member_id) return
    ;(byMember[t.member_id] = byMember[t.member_id] || new Set()).add((t.date || '').slice(0, 7))
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
    supabase.from('transactions').select('type, amount, date'),
    supabase.from('payables').select('amount, payment_date').eq('status', 'Pago')
  ])
  if (e1) throw e1
  if (e2) throw e2

  const base = {}
  months.forEach((m) => (base[m] = { month: m, income: 0, expense: 0 }))

  txs.forEach((t) => {
    const row = base[(t.date || '').slice(0, 7)]
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

// ---------- Alertas de contas (vencidas / a vencer) ----------

export async function payableAlerts(days = 7) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const limitDate = new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('payables')
    .select('id, description, amount, due_date')
    .neq('status', 'Pago')
    .order('due_date')
  if (error) throw error

  const overdue = data.filter((p) => p.due_date && p.due_date < today)
  const soon = data.filter((p) => p.due_date && p.due_date >= today && p.due_date <= limitDate)
  const sum = (arr) => arr.reduce((s, p) => s + Number(p.amount), 0)

  return {
    days,
    overdue,
    soon,
    overdueTotal: sum(overdue),
    soonTotal: sum(soon)
  }
}

// ---------- Projeção de caixa (forecast) ----------

// Projeta os próximos n meses: despesas conhecidas (recorrentes + parcelas
// + contas avulsas em aberto) e receita estimada pela média dos 3 meses
// anteriores; devolve o saldo projetado acumulado a partir do caixa atual.
export async function forecast(n = 3) {
  const [{ data: recs, error: e1 }, { data: pays, error: e2 }, { data: txs, error: e3 }] =
    await Promise.all([
      supabase.from('recurring_expenses').select('*'),
      supabase.from('payables').select('status, amount, due_date, recurring_id'),
      supabase.from('transactions').select('type, amount, date')
    ])
  if (e1) throw e1
  if (e2) throw e2
  if (e3) throw e3

  // Saldo atual em caixa (histórico completo).
  let currentBalance = 0
  txs.forEach((t) => {
    currentBalance += t.type === 'Receita' ? Number(t.amount) : -Number(t.amount)
  })
  pays.forEach((p) => {
    if (p.status === 'Pago') currentBalance -= Number(p.amount)
  })

  // Receita média dos 3 meses anteriores.
  const avgMonths = previousMonths(3)
  const incomeByMonth = {}
  txs.forEach((t) => {
    if (t.type !== 'Receita') return
    const m = (t.date || '').slice(0, 7)
    if (!avgMonths.includes(m)) return
    incomeByMonth[m] = (incomeByMonth[m] || 0) + Number(t.amount)
  })
  const avgIncome =
    avgMonths.reduce((s, m) => s + (incomeByMonth[m] || 0), 0) / avgMonths.length

  const months = nextNMonths(n)
  let balance = currentBalance

  const rows = months.map((month) => {
    const idx = compIndex(month)
    let expense = 0

    // Recorrentes previstas (fixas vigentes + parcelas no intervalo).
    recs.forEach((r) => {
      const start = compIndex(r.start_competency)
      if (idx < start) return
      if (r.kind === 'fixa') {
        if (r.active) expense += Number(r.amount)
      } else {
        const parcela = idx - start + 1
        if (parcela >= 1 && parcela <= (r.installments_total || 0)) expense += Number(r.amount)
      }
    })

    // Contas avulsas (não recorrentes) em aberto com vencimento no mês.
    pays.forEach((p) => {
      if (p.status === 'Pago' || p.recurring_id) return
      if ((p.due_date || '').slice(0, 7) !== month) return
      expense += Number(p.amount)
    })

    balance += avgIncome - expense
    return { month, income: avgIncome, expense, balance }
  })

  return { currentBalance, avgIncome, rows }
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

export function nextNMonths(n) {
  const start = compIndex(currentCompetency())
  const out = []
  for (let i = 1; i <= n; i++) out.push(indexToComp(start + i))
  return out
}

export function monthLabel(competency) {
  const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const [y, m] = String(competency).split('-')
  return `${names[Number(m) - 1]}/${y.slice(2)}`
}
