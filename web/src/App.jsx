import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { getMyRole } from './api'
import { RoleContext } from './role'
import { APP_NAME, LOGO_URL } from './brand'
import Login from './Login.jsx'
import SetPassword from './SetPassword.jsx'
import Home from './pages/Home.jsx'
import Members from './pages/Members.jsx'
import Credentials from './pages/Credentials.jsx'
import Transactions from './pages/Transactions.jsx'
import Payables from './pages/Payables.jsx'
import Recurring from './pages/Recurring.jsx'
import CashBook from './pages/CashBook.jsx'
import Reports from './pages/Reports.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Settings from './pages/Settings.jsx'
import { MyCredential, MyContributions, MyProfile } from './pages/MemberPortal.jsx'

const TABS_MEMBER = [
  { id: 'my-credential', label: '🪪 Credencial', Component: MyCredential },
  { id: 'my-contrib', label: '💰 Contribuições', Component: MyContributions },
  { id: 'my-profile', label: '👤 Meus Dados', Component: MyProfile }
]

const TABS = [
  { id: 'home', label: '🏠 Início', Component: Home },
  { id: 'members', label: '👤 Membros', Component: Members },
  { id: 'credentials', label: '🪪 Credenciais', Component: Credentials },
  { id: 'transactions', label: '💰 Movimentações', Component: Transactions },
  { id: 'payables', label: '📄 Contas a Pagar', Component: Payables },
  { id: 'recurring', label: '🔁 Recorrentes', Component: Recurring },
  { id: 'cashbook', label: '📗 Livro Caixa', Component: CashBook },
  { id: 'reports', label: '📑 Relatórios', Component: Reports },
  { id: 'dashboard', label: '📊 Dashboard', Component: Dashboard },
  { id: 'settings', label: '⚙️ Configurações', Component: Settings }
]

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('home')
  const [role, setRole] = useState('consulta')
  const [menuOpen, setMenuOpen] = useState(false)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) getMyRole().then(setRole).catch(() => setRole('consulta'))
    else setRole('consulta')
  }, [session])

  if (!ready) return <div className="center">Carregando...</div>
  if (recovery) return <SetPassword onDone={() => setRecovery(false)} />
  if (!session) return <Login />

  const ctx = { role, canWrite: role === 'admin' || role === 'tesoureiro', isAdmin: role === 'admin' }
  const roleLabel = { admin: 'Admin', tesoureiro: 'Tesoureiro', consulta: 'Consulta', membro: 'Membro' }[role]
  const tabs = role === 'membro' ? TABS_MEMBER : TABS
  const active = tabs.find((t) => t.id === tab) || tabs[0]
  const Active = active.Component

  return (
    <RoleContext.Provider value={ctx}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="hamburger" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
            ☰
          </button>
          <div className="brand">
            <img
              className="logo"
              src={LOGO_URL}
              alt={APP_NAME}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="brand-name">{APP_NAME}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="role-chip">{roleLabel}</span>
          <button className="logout" onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </header>

      <nav className={menuOpen ? 'open' : ''}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={t.id === active.id ? 'active' : ''}
            onClick={() => {
              setTab(t.id)
              setMenuOpen(false)
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {role === 'consulta' && (
          <div className="card" style={{ padding: '10px 16px' }}>
            <small>👁️ Acesso somente leitura (perfil Consulta).</small>
          </div>
        )}
        <Active />
      </main>
    </RoleContext.Provider>
  )
}
