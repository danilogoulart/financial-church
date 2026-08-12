import { useEffect, useState } from 'react'
import { getSession, onAuthChange, signOut } from './auth'
import { getMyRole, getMyMember } from './api'
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
import { SitePosts, SiteEvents, SiteStudies, SitePages, SiteCarousel } from './pages/Site.jsx'
import { MyCredential, MyContributions, MyProfile } from './pages/MemberPortal.jsx'

const TABS_MEMBER = [
  { id: 'my-credential', label: '🪪 Credencial', Component: MyCredential },
  { id: 'my-contrib', label: '💰 Contribuições', Component: MyContributions },
  { id: 'my-profile', label: '👤 Meus Dados', Component: MyProfile }
]

// Menu do staff em grupos. `roles` define quem enxerga cada grupo.
// 'editor' só vê o grupo Site; a Home (finanças) fica de fora dele.
const GROUPS = [
  {
    id: 'inicio',
    label: '🏠 Início',
    roles: ['admin', 'presidencia', 'tesoureiro', 'consulta'],
    tabs: [{ id: 'home', label: '🏠 Início', Component: Home }]
  },
  {
    id: 'financeiro',
    label: '📁 Financeiro',
    roles: ['admin', 'presidencia', 'tesoureiro', 'consulta'],
    tabs: [
      { id: 'transactions', label: '💰 Movimentações', Component: Transactions },
      { id: 'payables', label: '📄 Contas a Pagar', Component: Payables },
      { id: 'recurring', label: '🔁 Recorrentes', Component: Recurring },
      { id: 'cashbook', label: '📗 Livro Caixa', Component: CashBook },
      { id: 'reports', label: '📑 Relatórios', Component: Reports },
      { id: 'dashboard', label: '📊 Dashboard', Component: Dashboard }
    ]
  },
  {
    id: 'pessoas',
    label: '👥 Pessoas',
    roles: ['admin', 'presidencia', 'secretaria', 'tesoureiro', 'consulta'],
    tabs: [
      { id: 'members', label: '👤 Membros', Component: Members },
      { id: 'credentials', label: '🪪 Credenciais', Component: Credentials }
    ]
  },
  {
    id: 'site',
    label: '🌐 Site',
    roles: ['admin', 'presidencia', 'editor'],
    tabs: [
      { id: 'site-posts', label: '📰 Notícias', Component: SitePosts },
      { id: 'site-events', label: '📅 Eventos', Component: SiteEvents },
      { id: 'site-studies', label: '📖 Estudos Bíblicos', Component: SiteStudies },
      { id: 'site-carousel', label: '🎠 Carrossel', Component: SiteCarousel },
      { id: 'site-pages', label: '📄 Páginas', Component: SitePages }
    ]
  },
  {
    id: 'config',
    label: '⚙️ Configurações',
    roles: ['admin', 'presidencia', 'tesoureiro', 'secretaria', 'consulta'],
    tabs: [{ id: 'settings', label: '⚙️ Configurações', Component: Settings }]
  }
]

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState(null)
  const [role, setRole] = useState('consulta')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState(null)
  const [recovery, setRecovery] = useState(false)
  const [memberBlocked, setMemberBlocked] = useState(false)

  useEffect(() => {
    getSession().then((s) => {
      setSession(s)
      setReady(true)
    })
    return onAuthChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
  }, [])

  useEffect(() => {
    if (session) getMyRole().then(setRole).catch(() => setRole('consulta'))
    else setRole('consulta')
  }, [session])

  // Membro desativado tem o acesso barrado (o login "cai" no próximo carregamento).
  useEffect(() => {
    if (role === 'membro') {
      getMyMember().then((m) => setMemberBlocked(!!m && m.active === false)).catch(() => {})
    } else {
      setMemberBlocked(false)
    }
  }, [role])

  if (!ready) return <div className="center">Carregando...</div>
  if (recovery) return <SetPassword onDone={() => setRecovery(false)} />
  if (!session) return <Login />
  if (memberBlocked) {
    return (
      <div className="center">
        <div className="card login">
          <h1>Acesso desativado</h1>
          <p style={{ color: 'var(--muted)' }}>
            Seu cadastro está desativado. Fale com a secretaria da igreja.
          </p>
          <button className="primary" onClick={() => signOut()}>Sair</button>
        </div>
      </div>
    )
  }

  const isAdmin = role === 'admin' || role === 'presidencia'
  const ctx = {
    role,
    isAdmin,
    canWriteFinance: isAdmin || role === 'tesoureiro',
    canWriteMembers: isAdmin || role === 'secretaria',
    canReadFinance: isAdmin || role === 'tesoureiro' || role === 'consulta',
    canEditSite: isAdmin || role === 'editor'
  }
  const roleLabel = {
    admin: 'Admin',
    presidencia: 'Presidência',
    tesoureiro: 'Tesoureiro',
    secretaria: 'Secretaria',
    consulta: 'Consulta',
    membro: 'Membro',
    editor: 'Editor'
  }[role]

  // Membro usa um menu simples (portal); demais papéis usam grupos filtrados.
  const isMember = role === 'membro'
  const groups = isMember
    ? [{ id: 'portal', label: 'Portal', tabs: TABS_MEMBER }]
    : GROUPS.filter((g) => g.roles.includes(role))
  const allTabs = groups.flatMap((g) => g.tabs)

  // Mantém a aba escolhida se ainda visível; senão cai na primeira disponível.
  const active = allTabs.find((t) => t.id === tab) || allTabs[0]
  const Active = active?.Component
  const activeGroup = groups.find((g) => g.tabs.some((t) => t.id === active?.id))

  function go(tabId) {
    setTab(tabId)
    setMenuOpen(false)
    setOpenGroup(null)
  }

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
          <button className="logout" onClick={() => signOut()}>
            Sair
          </button>
        </div>
      </header>

      <nav className={menuOpen ? 'open' : ''}>
        {groups.map((g) => {
          // Grupo de uma aba só vira botão direto (sem dropdown).
          if (g.tabs.length === 1) {
            const t = g.tabs[0]
            return (
              <div className="nav-group" key={g.id}>
                <button
                  className={'nav-group-btn' + (active?.id === t.id ? ' active' : '')}
                  onClick={() => go(t.id)}
                >
                  {g.label}
                </button>
              </div>
            )
          }
          const isOpen = openGroup === g.id
          return (
            <div className={'nav-group' + (isOpen ? ' open' : '')} key={g.id}>
              <button
                className={'nav-group-btn' + (activeGroup?.id === g.id ? ' active' : '')}
                aria-expanded={isOpen}
                onClick={() => setOpenGroup((o) => (o === g.id ? null : g.id))}
              >
                {g.label} <span className="caret">▾</span>
              </button>
              <div className="nav-dropdown">
                {g.tabs.map((t) => (
                  <button
                    key={t.id}
                    className={active?.id === t.id ? 'active' : ''}
                    onClick={() => go(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </nav>
      {openGroup && <div className="nav-backdrop" onClick={() => setOpenGroup(null)} />}

      <main>
        {role === 'consulta' && (
          <div className="card" style={{ padding: '10px 16px' }}>
            <small>👁️ Acesso somente leitura (perfil Consulta).</small>
          </div>
        )}
        {Active && <Active />}
      </main>
    </RoleContext.Provider>
  )
}
