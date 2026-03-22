import { NavLink } from 'react-router-dom'
import { useAuth } from '../App'
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Wallet,
  Tag, Repeat, Upload, LogOut, DollarSign, FileBarChart
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

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>
            <span><DollarSign size={21} /></span>
            FinTrack
          </h1>
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
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
