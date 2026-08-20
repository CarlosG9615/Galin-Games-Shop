const REQUEST_TIMEOUT_MS = 10_000

function buildErrorResult(res, data) {
  return {
    ok: false,
    status: res.status,
    message: data && data.message,
    retryAfter: (data && data.retryAfter) ?? res.headers.get('Retry-After'),
    errors: data && data.errors,
  }
}

async function postJson(url, body) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await res.json()

    if (!res.ok) {
      return buildErrorResult(res, data)
    }

    return { ok: true, data }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, message: 'La petición tardó demasiado. Inténtalo de nuevo.' }
    }
    return { ok: false, status: 0, message: 'Error de red. Comprueba tu conexión.' }
  }
}

async function login(username, password) {
  return postJson('/api/auth/login', { username: username.trim(), password })
}

async function register(datos) {
  return postJson('/api/auth/register', datos)
}

async function logout() {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { ok: false, message: data.message }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Error de red. Comprueba tu conexión.' }
  }
}

async function silentRefresh() {
  const result = await postJson('/api/auth/refresh', {})
  if (!result.ok) {
    return { ok: false, status: result.status }
  }
  return result
}

export const authService = { login, register, logout, silentRefresh }
