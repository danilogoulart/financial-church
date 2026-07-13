import { supabase } from './supabaseClient'

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

// ---------- Dashboard ----------

export async function dashboardTotals() {
  const [{ data: txs, error: e1 }, { data: pays, error: e2 }] = await Promise.all([
    supabase.from('transactions').select('type, category, amount'),
    supabase.from('payables').select('status, amount')
  ])
  if (e1) throw e1
  if (e2) throw e2

  let totalIncome = 0
  let totalExpense = 0
  const incomeByCategory = {}
  const expenseByCategory = {}

  txs.forEach((t) => {
    const amount = Number(t.amount) || 0
    const category = t.category || '(sem categoria)'
    if (t.type === 'Receita') {
      totalIncome += amount
      incomeByCategory[category] = (incomeByCategory[category] || 0) + amount
    } else {
      totalExpense += amount
      expenseByCategory[category] = (expenseByCategory[category] || 0) + amount
    }
  })

  let payableOpen = 0
  let payableOpenCount = 0
  let payablePaid = 0

  pays.forEach((p) => {
    const amount = Number(p.amount) || 0
    if (p.status === 'Pago') payablePaid += amount
    else {
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
