import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { api } from './api'
import Layout from './components/Layout'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Budgets from './components/Budgets'
import Accounts from './components/Accounts'
import Categories from './components/Categories'
import RecurringPage from './components/RecurringPage'
import ImportExport from './components/ImportExport'
import Reports from './components/Reports'

export const AuthContext = createContext()
export const ToastContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function useToast() {
  return useContext(ToastContext)
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    const data = await api.login(credentials)
    localStorage.setItem('token', data.access_token)
    const me = await api.getMe()
    setUser(me)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ToastContext.Provider value={showToast}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route
              path="/*"
              element={
                user ? (
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/budgets" element={<Budgets />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/recurring" element={<RecurringPage />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/import-export" element={<ImportExport />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </BrowserRouter>
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      </ToastContext.Provider>
    </AuthContext.Provider>
  )
}

export default App
