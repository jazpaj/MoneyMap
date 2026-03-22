import { useState, useEffect } from 'react'
import { api } from '../api'
import { useToast } from '../App'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function Categories() {
  const showToast = useToast()
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', color: '#6366F1', transaction_type: 'expense' })

  const load = () => api.getCategories().then(setCategories)
  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', color: '#6366F1', transaction_type: 'expense' })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, color: c.color, transaction_type: c.transaction_type })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.updateCategory(editing.id, form)
        showToast('Category updated')
      } else {
        await api.createCategory(form)
        showToast('Category created')
      }
      setShowModal(false)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try {
      await api.deleteCategory(id)
      showToast('Category deleted')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filtered = categories.filter(
    (c) => (!filter || c.transaction_type === filter)
  )

  const incomeCategories = filtered.filter((c) => c.transaction_type === 'income')
  const expenseCategories = filtered.filter((c) => c.transaction_type === 'expense')

  const renderGroup = (title, cats) => (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-header">
        <h3>{title} ({cats.length})</h3>
      </div>
      {cats.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {cats.map((c) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="cat-dot" style={{ backgroundColor: c.color, margin: 0 }} />
                <span style={{ fontSize: '0.875rem' }}>{c.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Pencil size={12} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No categories</p>
      )}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h2>Categories</h2>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add Category</button>
      </div>

      <div className="filters-bar">
        <select className="form-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {(!filter || filter === 'income') && renderGroup('Income Categories', incomeCategories)}
      {(!filter || filter === 'expense') && renderGroup('Expense Categories', expenseCategories)}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-input" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 50, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
                </div>
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
