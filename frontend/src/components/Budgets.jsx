import { useState, useEffect } from 'react'
import { api } from '../api'
import { useToast } from '../App'
import { Plus, Trash2 } from 'lucide-react'

function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
}

export default function Budgets() {
  const showToast = useToast()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', amount: '', category_id: '', period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
  })

  const load = async () => {
    const [b, c] = await Promise.all([api.getBudgets(), api.getCategories('expense')])
    setBudgets(b)
    setCategories(c)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createBudget({
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      })
      showToast('Budget created')
      setShowModal(false)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return
    try {
      await api.deleteBudget(id)
      showToast('Budget deleted')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Budgets</h2>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', amount: '', category_id: '', period: 'monthly', start_date: new Date().toISOString().split('T')[0] }); setShowModal(true) }}>
          <Plus size={16} /> New Budget
        </button>
      </div>

      {budgets.length > 0 ? (
        <div className="grid-2">
          {budgets.map((b) => (
            <div key={b.id} className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ color: 'var(--text-primary)' }}>{b.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{b.period}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${b.percentage >= 100 ? 'badge-expense' : b.percentage >= 80 ? 'badge-warning' : 'badge-income'}`}>
                    {b.percentage}%
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(b.percentage, 100)}%`,
                    backgroundColor: b.percentage >= 100 ? 'var(--red)' : b.percentage >= 80 ? 'var(--yellow)' : 'var(--green)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Spent: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(b.spent)}</strong></span>
                <span style={{ color: 'var(--text-secondary)' }}>Budget: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(b.amount)}</strong></span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Remaining: {formatMoney(b.remaining)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><div className="empty-state"><p>No budgets yet. Create one to start tracking your spending.</p></div></div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Budget</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Groceries" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input className="form-input" type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Period</label>
                  <select className="form-input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category (optional)</label>
                  <select className="form-input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">All expenses</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input className="form-input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
