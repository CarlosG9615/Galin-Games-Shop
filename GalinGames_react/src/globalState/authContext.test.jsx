import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'
import { useContext } from 'react'
import fc from 'fast-check'
import { AuthContext, AuthProvider } from './authContext'
import { authService } from '../servicios/authService'

vi.mock('../servicios/authService', () => ({
  authService: {
    silentRefresh: vi.fn(),
    logout: vi.fn(),
  },
}))

function Probe() {
  const ctx = useContext(AuthContext)
  return (
    <div>
      <span data-testid="user">{ctx.user ? ctx.user.username : 'null'}</span>
      <span data-testid="initializing">{String(ctx.initializing)}</span>
      <button onClick={() => ctx.login('1', 'carlos')}>login</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('llama a silentRefresh al montar si localStorage contiene isLoggedIn: true', async () => {
    localStorage.setItem('session', JSON.stringify({ isLoggedIn: true, userId: '1', username: 'carlos' }))
    authService.silentRefresh.mockResolvedValueOnce({ ok: true, data: { userId: '1', username: 'carlos' } })

    render(<AuthProvider><Probe /></AuthProvider>)

    await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'))
    expect(authService.silentRefresh).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('user').textContent).toBe('carlos')
  })

  it('elimina localStorage cuando silentRefresh responde 401', async () => {
    localStorage.setItem('session', JSON.stringify({ isLoggedIn: true, userId: '1', username: 'carlos' }))
    authService.silentRefresh.mockResolvedValueOnce({ ok: false, status: 401 })

    render(<AuthProvider><Probe /></AuthProvider>)

    await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'))
    expect(localStorage.getItem('session')).toBeNull()
    expect(screen.getByTestId('user').textContent).toBe('null')
  })

  it('login actualiza el usuario y escribe en localStorage sin incluir tokens', async () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'))

    await act(async () => {
      screen.getByText('login').click()
    })

    expect(screen.getByTestId('user').textContent).toBe('carlos')
    const stored = JSON.parse(localStorage.getItem('session'))
    expect(stored).toEqual({ isLoggedIn: true, userId: '1', username: 'carlos' })
    expect(JSON.stringify(stored)).not.toMatch(/eyJ|token/i)
  })

  it('Propiedad 16: para todo estado de la aplicación, localStorage.getItem(\'session\') nunca contiene "eyJ" ni "refreshToken"', async () => {
    // Alfabeto seguro para userId/username: evita que el propio valor generado
    // contenga por azar "eyJ" o "refreshToken", lo que invalidaría la propiedad.
    const safeCharArb = fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-".split(''),
    )
    const safeStringArb = fc.array(safeCharArb, { minLength: 1, maxLength: 40 }).map((arr) => arr.join(''))

    function LoginProbe({ userId, username }) {
      const ctx = useContext(AuthContext)
      return <button onClick={() => ctx.login(userId, username)}>login</button>
    }

    await fc.assert(
      fc.asyncProperty(safeStringArb, safeStringArb, async (userId, username) => {
        localStorage.clear()
        vi.clearAllMocks()

        render(<AuthProvider><LoginProbe userId={userId} username={username} /></AuthProvider>)

        await act(async () => {
          screen.getByText('login').click()
        })

        const stored = localStorage.getItem('session')
        expect(stored).not.toBeNull()
        expect(stored).not.toContain('eyJ')
        expect(stored).not.toContain('refreshToken')

        cleanup()
      }),
      { numRuns: 30 },
    )
  })
})
