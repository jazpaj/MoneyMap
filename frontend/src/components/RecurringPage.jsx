import { useState, useEffect } from 'react'
import { api } from '../api'
import { useToast } from '../App'
import { Plus, Trash2, Play } from 'lucide-react'

function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
}

export default function RecurringPage() {
  const showToast = useToast()
  const [items, setItems] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    account_id: '', category_id: '', transaction_type: 'expense',
    amount: '', description: '', interval: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
  })

  const load = async () => {
    const [r, a, c] = await Promise.all([api.getRecurring(), api.getAccounts(), api.getCategories()])
    setItems(r)
    setAccounts(a)
    setCategories(c)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createRecurring({
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id || accounts[0]?.id),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      })
      showToast('Recurring transaction created')
      setShowModal(false)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleProcess = async () => {
    try {
      const res = await api.processRecurring()
      showToast(res.detail)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring transaction?')) return
    try {
      await api.deleteRecurring(id)
      showToast('Deleted')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filteredCats = categories.filter((c) => c.transaction_type === form.transaction_type)

  return (
    <div>
      <div className="page-header">
        <h2>Recurring Transactions</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleProcess}><Play size={16} /> Process Due</button>
          <button className="btn btn-primary" onClick={() => { setForm({ account_id: accounts[0]?.id || '', category_id: '', transaction_type: 'expense', amount: '', description: '', interval: 'monthly', start_date: new Date().toISOString().split('T')[0] }); setShowModal(true) }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="card">
        {items.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Interval</th>
                  <th>Next Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.description || '-'}</td>
                    <td><span className={`badge badge-${r.transaction_type}`}>{r.transaction_type}</span></td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{r.interval}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.next_date}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(r.amount)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>No recurring transactions</p></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Recurring Transaction</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Description</label>
                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Netflix, Rent" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-input" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value, category_id: '' })}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input className="form-input" type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Account</label>
                  <select className="form-input" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">None</option>
                    {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Interval</label>
                  <select className="form-input" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
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
