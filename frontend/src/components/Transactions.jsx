import { useState, useEffect } from 'react'
import { api } from '../api'
import { useToast } from '../App'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
}

export default function Transactions() {
  const showToast = useToast()
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({
    search: '', transaction_type: '', account_id: '', category_id: '', start_date: '', end_date: ''
  })
  const [form, setForm] = useState({
    account_id: '', category_id: '', transaction_type: 'expense', amount: '', description: '', date: new Date().toISOString().split('T')[0], notes: ''
  })

  const load = async () => {
    try {
      const [txns, accts, cats] = await Promise.all([
        api.getTransactions(filters),
        api.getAccounts(),
        api.getCategories(),
      ])
      setTransactions(txns)
      setAccounts(accts)
      setCategories(cats)
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  useEffect(() => { load() }, [filters])

  const openNew = () => {
    setEditing(null)
    setForm({
      account_id: accounts[0]?.id || '',
      category_id: '',
      transaction_type: 'expense',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setShowModal(true)
  }

  const openEdit = (txn) => {
    setEditing(txn)
    setForm({
      account_id: txn.account_id,
      category_id: txn.category_id || '',
      transaction_type: txn.transaction_type,
      amount: txn.amount,
      description: txn.description,
      date: txn.date,
      notes: txn.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      }
      if (editing) {
        await api.updateTransaction(editing.id, payload)
        showToast('Transaction updated')
      } else {
        await api.createTransaction(payload)
        showToast('Transaction added')
      }
      setShowModal(false)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await api.deleteTransaction(id)
      showToast('Transaction deleted')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filteredCategories = categories.filter(
    (c) => !form.transaction_type || c.transaction_type === form.transaction_type
  )

  return (
    <div>
      <div className="page-header">
        <h2>Transactions</h2>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Transaction</button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 32, width: '100%' }}
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select className="form-input" value={filters.transaction_type} onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="form-input" value={filters.account_id} onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}>
          <option value="">All Accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="form-input" type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
        <input className="form-input" type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
      </div>

      {/* Table */}
      <div className="card">
        {transactions.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{txn.date}</td>
                    <td>{txn.description || '-'}</td>
                    <td>
                      {txn.category ? (
                        <span>
                          <span className="cat-dot" style={{ backgroundColor: txn.category.color }} />
                          {txn.category.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{txn.account?.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${txn.transaction_type}`}>
                        {txn.transaction_type === 'income' ? '+' : '-'}{formatMoney(txn.amount)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(txn)}><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(txn.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>No transactions found</p></div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Edit Transaction' : 'New Transaction'}</h3>
            <form onSubmit={handleSubmit}>
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
              <div className="form-group">
                <label>Description</label>
                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this for?" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Account</label>
                  <select className="form-input" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} required>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Uncategorized</option>
                    {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
