import { createContext, useState, useCallback, useEffect } from 'react'
import { authService } from '../servicios/authService'

// eslint-disable-next-line react-refresh/only-export-components -- AuthContext y AuthProvider viven juntos por diseño (ver design.md)
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('session')
    if (!stored) {
      setInitializing(false)
      return
    }

    let session
    try {
      session = JSON.parse(stored)
    } catch {
      localStorage.removeItem('session')
      setInitializing(false)
      return
    }

    if (!session.isLoggedIn) {
      setInitializing(false)
      return
    }

    authService.silentRefresh()
      .then((result) => {
        if (result.ok) {
          setUser({ userId: result.data.userId, username: result.data.username })
          localStorage.setItem('session', JSON.stringify({
            isLoggedIn: true,
            userId: result.data.userId,
            username: result.data.username,
          }))
        } else {
          localStorage.removeItem('session')
        }
      })
      .finally(() => setInitializing(false))
  }, [])

  const login = useCallback((userId, username) => {
    setUser({ userId, username })
    localStorage.setItem('session', JSON.stringify({ isLoggedIn: true, userId, username }))
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    localStorage.removeItem('session')
  }, [])

  const value = {
    user,
    isAuthenticated: user !== null,
    initializing,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
