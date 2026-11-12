import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiLogin, apiSignup, apiGetMe } from '../api/auth.js'
import { TOKEN_KEY, USER_KEY } from '../api/client.js'

const AuthContext = createContext(null)

export const DEFAULT_CREDENTIALS = {
  usernames: ['admin', '1234', 'user', 'demo'],
  password: '1234',
}

/**
 * Checks if the given username and password match the default frontend-only credentials.
 */
export function isDefaultCredential(name, password) {
  const trimmed = (name || '').trim().toLowerCase()
  return (
    password === DEFAULT_CREDENTIALS.password &&
    (DEFAULT_CREDENTIALS.usernames.includes(trimmed) || trimmed === '1234')
  )
}

/**
 * Returns initials (up to 2 chars) from a display name string.
 * e.g. "Praveen C" → "PC", "alice" → "AL"
 */
export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)   // true while /auth/me check is in flight

  // ── Bootstrap: check token validity on app load ─────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      setLoading(false)
      return
    }

    // Default frontend mock token session
    if (storedToken.startsWith('mock_token_')) {
      const storedUser = localStorage.getItem(USER_KEY)
      let resolvedUser = { id: 'default-user', name: 'admin', username: 'admin' }
      if (storedUser) {
        try {
          resolvedUser = JSON.parse(storedUser)
        } catch {
          // ignore parsing error, use fallback
        }
      }
      setUser(resolvedUser)
      setToken(storedToken)
      setLoading(false)
      return
    }

    apiGetMe()
      .then((data) => {
        // Backend may return { user } or the user object directly
        const resolvedUser = data?.user ?? data
        setUser(resolvedUser)
        setToken(storedToken)
        localStorage.setItem(USER_KEY, JSON.stringify(resolvedUser))
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (name, password) => {
    const trimmedName = (name || '').trim()

    // Authenticate through the backend
    const data = await apiLogin({
      name: trimmedName,
      password,
    })

    const resolvedToken = data?.access_token ?? data?.token

    if (!resolvedToken) {
      throw new Error('Backend did not return an access token.')
    }

    const resolvedUser = data?.user ?? data

    const userWithName = {
      ...resolvedUser,
      name: resolvedUser.name ?? resolvedUser.username ?? trimmedName,
    }

    localStorage.setItem(TOKEN_KEY, resolvedToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userWithName))

    setToken(resolvedToken)
    setUser(userWithName)

    return data
  }, [])

  // ── signup ───────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, password) => {
    const data = await apiSignup({ name, password })
    const resolvedUser = data?.user ?? data
    const resolvedToken = data?.token ?? data?.access_token
    localStorage.setItem(TOKEN_KEY, resolvedToken)
    localStorage.setItem(USER_KEY, JSON.stringify(resolvedUser))
    setToken(resolvedToken)
    setUser(resolvedUser)
    return data
  }, [])

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

