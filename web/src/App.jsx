import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { APP_NAME, LOGO_URL } from './brand'
import Login from './Login.jsx'
import Members from './pages/Members.jsx'
import Transactions from './pages/Transactions.jsx'
import Payables from './pages/Payables.jsx'
import Recurring from './pages/Recurring.jsx'
import Reports from './pages/Reports.jsx'
import Dashboard from './pages/Dashboard.jsx'

const TABS = [
  { id: 'members', label: '👤 Membros', Component: Members },
  { id: 'transactions', label: '💰 Movimentações', Component: Transactions },
  { id: 'payables', label: '📄 Contas a Pagar', Component: Payables },
  { id: 'recurring', label: '🔁 Recorrentes', Component: Recurring },
  { id: 'reports', label: '📑 Relatórios', Component: Reports },
  { id: 'dashboard', label: '📊 Dashboard', Component: Dashboard }
]

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('members')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) return <div className="center">Carregando...</div>
  if (!session) return <Login />

  const Active = TABS.find((t) => t.id === tab).Component

  return (
    <div>
      <header>
        <div className="brand">
          <img
            className="logo"
            src={LOGO_URL}
            alt={APP_NAME}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <span className="brand-name">{APP_NAME}</span>
        </div>
        <button className="logout" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </header>

      <nav>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        <Active />
      </main>
    </div>
  )
}
