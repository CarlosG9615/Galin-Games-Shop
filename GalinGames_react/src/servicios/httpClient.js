const REQUEST_TIMEOUT_MS = 10_000

function buildErrorResult(res, data) {
  return {
    ok: false,
    status: res.status,
    message: data && data.message,
    errors: data && data.errors,
    blockedUntil: data && data.blockedUntil,
  }
}

async function request(method, url, body) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return buildErrorResult(res, data)
    }

    return { ok: true, data }
  } catch (err) {
    clearTimeout(timeoutId)
    // Sin `message` hardcodeado (regla i18n de CLAUDE.md): `reason` deja que el
    // componente que llama elija la clave de traducción (common.timeoutError /
    // common.networkError), ya que este módulo no tiene acceso a t().
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, reason: 'timeout' }
    }
    return { ok: false, status: 0, reason: 'network' }
  }
}

// multipart/form-data (subida de avatar): sin JSON.stringify ni Content-Type manual,
// el navegador fija el boundary correcto a partir del FormData.
async function postForm(url, formData) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return buildErrorResult(res, data)
    }

    return { ok: true, data }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, reason: 'timeout' }
    }
    return { ok: false, status: 0, reason: 'network' }
  }
}

async function get(url) {
  return request('GET', url)
}
async function post(url, body) {
  return request('POST', url, body)
}
async function put(url, body) {
  return request('PUT', url, body)
}
async function patch(url, body) {
  return request('PATCH', url, body)
}
async function del(url, body) {
  return request('DELETE', url, body)
}

export const httpClient = { get, post, put, patch, del, postForm }
