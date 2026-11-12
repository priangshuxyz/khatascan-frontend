import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// ── Validation helpers ───────────────────────────────────────────────────────
const NAME_RE = /^[a-zA-Z0-9 _]{3,30}$/

function validateName(v) {
  const t = v.trim()
  if (!t) return 'Name is required.'
  if (t.length < 3) return 'Name must be at least 3 characters.'
  if (t.length > 30) return 'Name must be at most 30 characters.'
  if (!NAME_RE.test(t)) return 'Only letters, numbers, spaces and underscores allowed.'
  return ''
}

function validatePassword(v) {
  if (!v) return 'Password is required.'
  if (v.length < 4) return 'Password must be at least 4 characters.'
  return ''
}

function validateConfirm(v, pwd) {
  if (!v) return 'Please confirm your password.'
  if (v !== pwd) return 'Passwords do not match.'
  return ''
}

// ── Eye icon ─────────────────────────────────────────────────────────────────
function EyeIcon({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function SignUpPage() {
  const { signup }              = useAuth()
  const navigate                = useNavigate()
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [showCfm, setShowCfm]   = useState(false)
  const [nameErr, setNameErr]   = useState('')
  const [pwdErr, setPwdErr]     = useState('')
  const [cfmErr, setCfmErr]     = useState('')
  const [serverErr, setServerErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submitLock              = useRef(false)

  function handleSubmit(e) {
    e.preventDefault()
    const ne = validateName(name)
    const pe = validatePassword(password)
    const ce = validateConfirm(confirm, password)
    setNameErr(ne)
    setPwdErr(pe)
    setCfmErr(ce)
    setServerErr('')
    if (ne || pe || ce) return
    if (submitLock.current) return
    submitLock.current = true
    setSubmitting(true)

    signup(name.trim(), password)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Could not create account. Please try again.'
        setServerErr(msg)
      })
      .finally(() => {
        setSubmitting(false)
        submitLock.current = false
      })
  }

  return (
    <div style={s.page}>
      {/* Logo */}
      <div style={s.logoBlock}>
        <div style={s.logoIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3.5h12v17l-2.2-1.5-1.8 1.5-2-1.5-2 1.5-1.8-1.5L6 20.5v-17z" />
            <path d="M9 8h6M9 12h6M9 16h4" />
          </svg>
        </div>
        <span style={s.logoText}>Khatascan</span>
      </div>

      {/* Card */}
      <div style={s.card}>
        <h1 style={s.heading}>Create your account</h1>
        <p style={s.subheading}>Start tracking your expenses</p>

        {serverErr && <div style={s.serverError}>{serverErr}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameErr('') }}
              placeholder="Choose a username"
              autoComplete="username"
              style={{ ...s.input, ...(nameErr ? s.inputError : {}) }}
              disabled={submitting}
            />
            {nameErr && <span style={s.fieldError}>{nameErr}</span>}
          </div>

          {/* Password */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Password</label>
            <div style={s.passwordWrap}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwdErr('') }}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                style={{ ...s.input, ...s.passwordInput, ...(pwdErr ? s.inputError : {}) }}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={s.eyeBtn}
                tabIndex={-1}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                <span style={{ color: 'var(--text-muted-cream)' }}>
                  <EyeIcon visible={showPwd} />
                </span>
              </button>
            </div>
            {pwdErr && <span style={s.fieldError}>{pwdErr}</span>}
          </div>

          {/* Confirm Password */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Confirm Password</label>
            <div style={s.passwordWrap}>
              <input
                type={showCfm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setCfmErr('') }}
                placeholder="Repeat password"
                autoComplete="new-password"
                style={{ ...s.input, ...s.passwordInput, ...(cfmErr ? s.inputError : {}) }}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowCfm((v) => !v)}
                style={s.eyeBtn}
                tabIndex={-1}
                aria-label={showCfm ? 'Hide password' : 'Show password'}
              >
                <span style={{ color: 'var(--text-muted-cream)' }}>
                  <EyeIcon visible={showCfm} />
                </span>
              </button>
            </div>
            {cfmErr && <span style={s.fieldError}>{cfmErr}</span>}
          </div>

          <button type="submit" style={s.submitBtn} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={s.switchText}>
          Already have an account?{' '}
          <Link to="/signin" style={s.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100dvh',
    backgroundColor: 'var(--bg-cream)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    boxSizing: 'border-box',
  },
  logoBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'var(--surface-cream)',
    border: '1px solid var(--border-cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-serif)',
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.3px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    border: '1px solid var(--border-cream)',
    padding: '32px 28px',
    boxSizing: 'border-box',
  },
  heading: {
    fontFamily: 'var(--font-serif)',
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.3px',
    marginBottom: '4px',
  },
  subheading: {
    fontSize: '13px',
    color: 'var(--text-muted-cream)',
    marginBottom: '24px',
  },
  serverError: {
    backgroundColor: 'rgba(229,115,106,0.12)',
    border: '1px solid rgba(229,115,106,0.3)',
    borderRadius: '12px',
    color: 'var(--danger)',
    fontSize: '13px',
    padding: '10px 14px',
    marginBottom: '16px',
  },
  fieldGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '600',
    color: 'var(--text-muted-cream)',
    marginBottom: '6px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 18px',
    borderRadius: '9999px',
    border: '1px solid var(--border-cream)',
    backgroundColor: 'var(--bg-cream)',
    color: 'var(--text-on-cream)',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  inputError: {
    borderColor: 'rgba(229,115,106,0.5)',
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: '48px',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },
  fieldError: {
    display: 'block',
    fontSize: '12px',
    color: 'var(--danger)',
    marginTop: '5px',
    paddingLeft: '8px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '9999px',
    border: 'none',
    backgroundColor: 'var(--accent)',
    color: '#04100C',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.15s',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--text-muted-cream)',
    marginTop: '20px',
  },
  switchLink: {
    color: 'var(--accent-dark)',
    fontWeight: '600',
    textDecoration: 'none',
  },
}

