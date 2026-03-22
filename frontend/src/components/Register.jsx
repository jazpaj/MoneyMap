import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../App'
import { DollarSign, UserPlus, AlertCircle, User, Lock, Mail, FileText } from 'lucide-react'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const clearError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: false }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (!form.username.trim()) {
      setFieldErrors({ username: true })
      setError('Please choose a username.')
      triggerShake()
      return
    }
    if (form.username.length < 3) {
      setFieldErrors({ username: true })
      setError('Username must be at least 3 characters long.')
      triggerShake()
      return
    }
    if (!form.email.trim()) {
      setFieldErrors({ email: true })
      setError('Please enter your email address.')
      triggerShake()
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFieldErrors({ email: true })
      setError('Please enter a valid email address.')
      triggerShake()
      return
    }
    if (!form.password) {
      setFieldErrors({ password: true })
      setError('Please create a password.')
      triggerShake()
      return
    }
    if (form.password.length < 6) {
      setFieldErrors({ password: true })
      setError('Password must be at least 6 characters long.')
      triggerShake()
      return
    }

    setLoading(true)
    try {
      await api.register(form)
      await login({ username: form.username, password: form.password })
      navigate('/')
    } catch (err) {
      const msg = err.message
      setError(msg)
      triggerShake()
      if (msg.toLowerCase().includes('username')) {
        setFieldErrors({ username: true })
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: true })
      } else if (msg.toLowerCase().includes('password')) {
        setFieldErrors({ password: true })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className={`auth-card ${shake ? 'auth-shake' : ''}`}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            15%, 45%, 75% { transform: translateX(-6px); }
            30%, 60%, 90% { transform: translateX(6px); }
          }
          .auth-shake { animation: shake 0.45s ease; }
          .input-error { border-color: var(--red) !important; box-shadow: 0 0 0 3px var(--red-bg) !important; }
          .input-icon-wrap {
            position: relative;
          }
          .input-icon-wrap .input-icon {
            position: absolute;
            left: 0.85rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            pointer-events: none;
            transition: color 0.2s;
          }
          .input-icon-wrap .form-input {
            padding-left: 2.6rem;
          }
          .input-icon-wrap:focus-within .input-icon {
            color: var(--accent-light);
          }
          .input-error-wrap .input-icon {
            color: var(--red) !important;
          }
        `}</style>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
          }}>
            <DollarSign size={28} color="white" />
          </div>
          <h1>Create account</h1>
          <p className="subtitle">Start tracking your finances today</p>
        </div>

        {error && (
          <div className="error-msg" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-icon-wrap">
              <FileText size={16} className="input-icon" />
              <input
                className="form-input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Username</label>
            <div className={`input-icon-wrap ${fieldErrors.username ? 'input-error-wrap' : ''}`}>
              <User size={16} className="input-icon" />
              <input
                className={`form-input ${fieldErrors.username ? 'input-error' : ''}`}
                value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); clearError('username') }}
                placeholder="Choose a username"
                autoComplete="username"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div className={`input-icon-wrap ${fieldErrors.email ? 'input-error-wrap' : ''}`}>
              <Mail size={16} className="input-icon" />
              <input
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError('email') }}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className={`input-icon-wrap ${fieldErrors.password ? 'input-error-wrap' : ''}`}>
              <Lock size={16} className="input-icon" />
              <input
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                type="password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError('password') }}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite',
                }} />
                Creating account...
              </span>
            ) : (
              <><UserPlus size={18} /> Create Account</>
            )}
          </button>
        </form>
        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
