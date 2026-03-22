import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../App'
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Wallet,
  Tag, Repeat, Upload, LogOut, DollarSign, FileBarChart,
  Menu, X
} from 'lucide-react'

const navSections = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/budgets', label: 'Budgets', icon: PiggyBank },
      { path: '/accounts', label: 'Accounts', icon: Wallet },
      { path: '/categories', label: 'Categories', icon: Tag },
      { path: '/recurring', label: 'Recurring', icon: Repeat },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/reports', label: 'Monthly Report', icon: FileBarChart },
      { path: '/import-export', label: 'Import / Export', icon: Upload },
    ],
  },
]

// Bottom nav items for mobile (most used pages)
const bottomNavItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/budgets', label: 'Budgets', icon: PiggyBank },
  { path: '/accounts', label: 'Accounts', icon: Wallet },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="app-layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={22} />
        </button>
        <div className="mobile-header-title">
          <DollarSign size={18} style={{ color: 'var(--accent-light)' }} />
          <span>MoneyMap</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>
              <span><DollarSign size={21} /></span>
              MoneyMap
            </h1>
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <p>{user?.full_name || user?.username}</p>
        </div>
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={logout}>
            <LogOut />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="bottom-nav">
        {bottomNavItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
