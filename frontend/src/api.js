const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Something went wrong. Please try again.' }))

    if (res.status === 401 && !path.startsWith('/auth/')) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return
    }

    throw new Error(err.detail || 'Something went wrong. Please try again.')
  }

  if (res.headers.get('content-type')?.includes('text/csv')) {
    return res.blob()
  }

  return res.json()
}

export const api = {
  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),

  // Accounts
  getAccounts: () => request('/accounts/'),
  createAccount: (data) => request('/accounts/', { method: 'POST', body: data }),
  updateAccount: (id, data) => request(`/accounts/${id}`, { method: 'PUT', body: data }),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: (type) => request(`/categories/${type ? `?transaction_type=${type}` : ''}`),
  createCategory: (data) => request('/categories/', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
    return request(`/transactions/?${qs}`)
  },
  createTransaction: (data) => request('/transactions/', { method: 'POST', body: data }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: data }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: () => request('/budgets/'),
  createBudget: (data) => request('/budgets/', { method: 'POST', body: data }),
  updateBudget: (id, data) => request(`/budgets/${id}`, { method: 'PUT', body: data }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),

  // Recurring
  getRecurring: () => request('/recurring/'),
  createRecurring: (data) => request('/recurring/', { method: 'POST', body: data }),
  deleteRecurring: (id) => request(`/recurring/${id}`, { method: 'DELETE' }),
  processRecurring: () => request('/recurring/process', { method: 'POST' }),

  // Analytics
  getDashboard: () => request('/analytics/dashboard'),
  getSpendingByCategory: (start, end) => {
    const qs = new URLSearchParams()
    if (start) qs.set('start_date', start)
    if (end) qs.set('end_date', end)
    return request(`/analytics/spending-by-category?${qs}`)
  },

  // Reports
  getMonthlyReport: (year, month) => {
    const qs = new URLSearchParams()
    if (year) qs.set('year', year)
    if (month) qs.set('month', month)
    return request(`/reports/monthly?${qs}`)
  },

  // Import/Export
  importCSV: (file, accountId) => {
    const formData = new FormData()
    formData.append('file', file)
    const qs = accountId ? `?account_id=${accountId}` : ''
    return request(`/import-export/import-csv${qs}`, { method: 'POST', body: formData })
  },
  exportCSV: (start, end) => {
    const qs = new URLSearchParams()
    if (start) qs.set('start_date', start)
    if (end) qs.set('end_date', end)
    return request(`/import-export/export-csv?${qs}`)
  },
}
