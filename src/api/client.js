import axios from 'axios'

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_BASE = rawBase.replace(/\/+$/, '')

// ── Auth endpoint paths — change here if the backend routes differ ──────────
export const AUTH_ENDPOINTS = {
  signup: '/auth/signup',
  login:  '/auth/login',
  me:     '/auth/me',
}

export const TOKEN_KEY = 'khatascan_token'
export const USER_KEY = 'khatascan_user'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// On 401 → clear token and redirect to sign-in
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem(TOKEN_KEY)
      // If logged in via frontend default credentials, avoid forced logout on backend 401s
      if (token && token.startsWith('mock_token_')) {
        return Promise.reject(err)
      }
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      // Avoid redirect loop on the auth pages themselves
      if (!window.location.pathname.startsWith('/signin') && !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/signin'
      }
    }
    return Promise.reject(err)
  }
)

export const apiBase = API_BASE
export default client
