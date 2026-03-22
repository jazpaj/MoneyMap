import { useState, useEffect } from 'react'
import { api } from '../api'
import { useToast } from '../App'
import { Plus, Pencil, Trash2, Wallet, Building, CreditCard, Banknote } from 'lucide-react'

function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
}

const typeIcons = {
  checking: Building,
  savings: Banknote,
  credit: CreditCard,
  cash: Wallet,
}

export default function Accounts() {
  const showToast = useToast()
  const [accounts, setAccounts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', account_type: 'checking', balance: '', color: '#4F46E5',
  })

  const load = () => api.getAccounts().then(setAccounts)
  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', account_type: 'checking', balance: '', color: '#4F46E5' })
    setShowModal(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({ name: a.name, account_type: a.account_type, balance: a.balance, color: a.color })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, balance: parseFloat(form.balance || 0) }
      if (editing) {
        await api.updateAccount(editing.id, payload)
        showToast('Account updated')
      } else {
        await api.createAccount(payload)
        showToast('Account created')
      }
      setShowModal(false)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this account and all its transactions?')) return
    try {
      await api.deleteAccount(id)
      showToast('Account deleted')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Accounts</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Total: <strong style={{ color: totalBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatMoney(totalBalance)}</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Account</button>
      </div>

      <div className="grid-3">
        {accounts.map((a) => {
          const Icon = typeIcons[a.account_type] || Wallet
          return (
            <div key={a.id} className="card">
              <div className="account-card">
                <div className="account-icon" style={{ backgroundColor: a.color + '20', color: a.color }}>
                  <Icon size={22} />
                </div>
                <div className="account-info">
                  <h4>{a.name}</h4>
                  <span className="type">{a.account_type}</span>
                </div>
                <div className="account-balance" style={{ color: a.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {formatMoney(a.balance)}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: '0.75rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}><Pencil size={14} /> Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Edit Account' : 'New Account'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-input" value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Starting Balance</label>
                  <input className="form-input" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Color</label>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 50, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
