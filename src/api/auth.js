import client, { AUTH_ENDPOINTS } from './client.js'

/**
 * Sign up a new user.
 * @param {{ name: string, password: string }} payload
 * @returns {{ token: string, user: object }}
 */
export async function apiSignup({ name, password }) {
  const { data } = await client.post(AUTH_ENDPOINTS.signup, {
    username: name,
    password,
  })

  return data
}


/**
 * Sign in an existing user.
 * @param {{ name: string, password: string }} payload
 * @returns {{ token: string, user: object }}
 */
export async function apiLogin({ name, password }) {
  const form = new URLSearchParams()
  form.append('username', name)
  form.append('password', password)

  const { data } = await client.post(
    AUTH_ENDPOINTS.login,
    form,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  return data
}

/**
 * Fetch the currently authenticated user (requires Authorization header).
 * @returns {{ user: object } | object}
 */
export async function apiGetMe() {
  const { data } = await client.get(AUTH_ENDPOINTS.me)
  return data
}

