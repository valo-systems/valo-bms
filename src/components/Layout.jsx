import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, FileText, Receipt, TrendingUp,
  Building2, LogOut, Menu, X, ChevronRight, UserCog, Inbox, MailOpen,
} from 'lucide-react'
import logoOnDark from '../assets/logo-on-dark.png'
import logoSymbol from '../assets/logo-symbol.svg'

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',       short: 'Home'     },
  { to: '/clients',   icon: Users,           label: 'Clients',         short: 'Clients'  },
  { to: '/invoices',  icon: Receipt,         label: 'Invoices',        short: 'Invoices' },
  { to: '/expenses',  icon: TrendingUp,      label: 'Financials',      short: 'Finance'  },
  { to: '/documents', icon: FileText,        label: 'Commercial Docs', short: 'Docs'     },
  { to: '/inbox',           icon: Inbox,           label: 'Inbox',           short: 'Inbox'    },
  { to: '/email-templates', icon: MailOpen,        label: 'Email Templates', short: 'Templates'},
  { to: '/team',            icon: UserCog,         label: 'Team',            short: 'Team'     },
  { to: '/company',         icon: Building2,       label: 'Company',         short: 'Company'  },
]

// Mobile bottom nav shows 5 items max — most-used only
const BOTTOM_NAV = ['/', '/clients', '/invoices', '/expenses', '/company']

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'V'
}

export default function Layout({ children }) {
  const { user, logout }  = useAuth()
  const location          = useLocation()
  const navigate          = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <div className="flex h-[100dvh] bg-valo-black overflow-hidden">
      {/* ── Mobile drawer overlay ─────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Sidebar (desktop always visible, mobile as drawer) ────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-valo-dark border-r border-valo-border
        flex flex-col transition-transform duration-200 ease-in-out
        ${drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-valo-border shrink-0">
          <img src={logoOnDark} alt="Valo BMS" className="h-7 w-auto" />
          {/* Close button mobile only */}
          <button onClick={() => setDrawerOpen(false)} className="ml-auto p-1 text-valo-subtle lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            return (
              <Link key={to} to={to} onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-valo-accent/15 text-valo-accent' : 'text-valo-subtle hover:text-valo-text hover:bg-valo-card'}`}
              >
                <Icon size={17} className="shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight size={13} className="ml-auto shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* User block */}
        <div className="p-3 border-t border-valo-border shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-valo-card transition-colors">
            <div className="w-8 h-8 bg-valo-accent/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-valo-accent text-xs font-semibold">{initials(user?.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-valo-text text-xs font-medium truncate">{user?.name || 'User'}</div>
              <div className="text-valo-muted text-xs truncate capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-valo-subtle hover:text-red-400 rounded transition-colors shrink-0" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-valo-dark border-b border-valo-border flex items-center px-4 gap-3 shrink-0">
          {/* Hamburger — mobile only */}
          <button onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 -ml-1 text-valo-subtle hover:text-valo-text rounded-lg transition-colors"
            aria-label="Open menu">
            <Menu size={20} />
          </button>

          {/* Mobile: logo + page title */}
          <img src={logoSymbol} alt="" className="lg:hidden h-6 w-6 shrink-0" />
          <span className="lg:hidden text-valo-text text-sm font-medium truncate flex-1">
            {nav.find(n => isActive(n.to))?.label || 'VALO BMS'}
          </span>

          {/* Desktop: spacer */}
          <div className="hidden lg:block flex-1" />

          {/* User avatar — quick access */}
          <Link to={`/team/${user?.id || ''}`}
            className="w-8 h-8 bg-valo-accent/20 rounded-full flex items-center justify-center hover:bg-valo-accent/30 transition-colors"
            title={user?.name}>
            <span className="text-valo-accent text-xs font-semibold">{initials(user?.name)}</span>
          </Link>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>

        {/* ── Mobile bottom navigation ──────────────────────────────────── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-valo-dark border-t border-valo-border safe-area-inset-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {nav.filter(n => BOTTOM_NAV.includes(n.to)).map(({ to, icon: Icon, short }) => {
              const active = isActive(to)
              return (
                <Link key={to} to={to}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px]
                    ${active ? 'text-valo-accent' : 'text-valo-muted hover:text-valo-subtle'}`}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                  <span className={`text-[10px] font-medium ${active ? 'text-valo-accent' : 'text-valo-muted'}`}>{short}</span>
                </Link>
              )
            })}
            {/* "More" opens the drawer for Team + Company + Docs */}
            <button onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-valo-muted hover:text-valo-subtle transition-colors min-w-[52px]">
              <Menu size={22} strokeWidth={1.75} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
