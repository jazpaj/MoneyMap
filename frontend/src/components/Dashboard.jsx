import { useState, useEffect } from 'react'
import { api } from '../api'
import { useToast, useAuth } from '../App'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'

function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(8, 12, 24, 0.96)',
      border: '1px solid rgba(40, 55, 85, 0.6)',
      borderRadius: 12,
      padding: '0.7rem 1rem',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#556178', fontSize: '0.7rem', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.5 }}>
          {entry.name}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const { user } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    api.getDashboard().then(setData).catch((e) => showToast(e.message, 'error'))
  }, [])

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>Loading your finances...</p>
        </div>
      </div>
    )
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    {
      label: 'Total Balance',
      value: data.total_balance,
      icon: Wallet,
      iconBg: 'rgba(99, 102, 241, 0.12)',
      iconColor: '#818cf8',
      valueClass: data.total_balance >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Monthly Income',
      value: data.monthly_income,
      icon: ArrowUpRight,
      iconBg: 'rgba(52, 211, 153, 0.1)',
      iconColor: '#34d399',
      valueClass: 'positive',
    },
    {
      label: 'Monthly Expenses',
      value: data.monthly_expenses,
      icon: ArrowDownRight,
      iconBg: 'rgba(248, 113, 113, 0.1)',
      iconColor: '#f87171',
      valueClass: 'negative',
    },
    {
      label: 'Net Savings',
      value: data.monthly_net,
      icon: Activity,
      iconBg: 'rgba(96, 165, 250, 0.1)',
      iconColor: '#60a5fa',
      valueClass: data.monthly_net >= 0 ? 'positive' : 'negative',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{greeting()}, {user?.full_name?.split(' ')[0] || user?.username}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4, fontWeight: 500 }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>
                <Icon size={18} />
              </div>
              <div className="label">{s.label}</div>
              <div className={`value ${s.valueClass}`}>{formatMoney(s.value)}</div>
            </div>
          )
        })}
      </div>

      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        {/* Monthly Trends Chart */}
        <div className="card">
          <div className="card-header">
            <h3>Monthly Overview</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_trends}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,55,85,0.2)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#556178', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#556178', fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} fill="url(#incomeGrad)" name="Income" dot={false} activeDot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" dot={false} activeDot={{ r: 4, fill: '#f87171', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category */}
        <div className="card">
          <div className="card-header">
            <h3>Spending Breakdown</h3>
          </div>
          {data.spending_by_category.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.spending_by_category}
                    dataKey="total"
                    nameKey="category_name"
                    cx="50%"
                    cy="45%"
                    outerRadius={85}
                    innerRadius={58}
                    strokeWidth={2}
                    stroke="rgba(5, 8, 15, 0.9)"
                    paddingAngle={2}
                  >
                    {data.spending_by_category.map((entry, i) => (
                      <Cell key={i} fill={entry.category_color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: '0.75rem' }}
                    formatter={(value) => <span style={{ color: '#8b97b0', fontWeight: 500 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p>No spending data this month</p>
              <p className="empty-subtitle">Add transactions to see your breakdown</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transactions')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {data.recent_transactions.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {txn.category && (
                            <span className="cat-dot" style={{ backgroundColor: txn.category.color }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.855rem' }}>{txn.description || 'No description'}</div>
                            {txn.category && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 }}>{txn.category.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500 }}>{txn.date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${txn.transaction_type}`}>
                          {txn.transaction_type === 'income' ? '+' : '-'}{formatMoney(txn.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No transactions yet</p>
              <p className="empty-subtitle">Start by adding your first transaction</p>
            </div>
          )}
        </div>

        {/* Budget Alerts */}
        <div className="card">
          <div className="card-header">
            <h3>
              <AlertTriangle size={13} style={{ color: 'var(--yellow)' }} />
              Budget Alerts
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/budgets')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
              Manage <ArrowRight size={12} />
            </button>
          </div>
          {data.budget_alerts.length > 0 ? (
            data.budget_alerts.map((b) => (
              <div key={b.id} className="budget-item">
                <div className="budget-header">
                  <h4>{b.name}</h4>
                  <span className={`badge ${b.percentage >= 100 ? 'badge-expense' : 'badge-warning'}`}>
                    {b.percentage}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(b.percentage, 100)}%`,
                      backgroundColor: b.percentage >= 100 ? 'var(--red)' : 'var(--yellow)',
                    }}
                  />
                </div>
                <div className="budget-amounts">
                  <span>{formatMoney(b.spent)} spent</span>
                  <span>{formatMoney(b.amount)} budget</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No budget alerts</p>
              <p className="empty-subtitle">Create budgets to track spending limits</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
