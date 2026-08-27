import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../globalState/authContext'
import PrivateRoute from './PrivateRoute'

function renderWithAuth(authValue, initialEntry = '/mi-cuenta/perfil') {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route
            path="/mi-cuenta/perfil"
            element={
              <PrivateRoute>
                <div>CONTENIDO PROTEGIDO</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('PrivateRoute', () => {
  it('redirige a /login cuando el usuario no está autenticado', () => {
    renderWithAuth({ isAuthenticated: false, initializing: false })

    expect(screen.getByText('LOGIN')).toBeInTheDocument()
    expect(screen.queryByText('CONTENIDO PROTEGIDO')).not.toBeInTheDocument()
  })

  it('renderiza el contenido protegido cuando el usuario está autenticado', () => {
    renderWithAuth({ isAuthenticated: true, initializing: false })

    expect(screen.getByText('CONTENIDO PROTEGIDO')).toBeInTheDocument()
  })

  it('no renderiza nada (ni redirige) mientras se resuelve la sesión (initializing)', () => {
    const { container } = renderWithAuth({ isAuthenticated: false, initializing: true })

    expect(container).toBeEmptyDOMElement()
  })
})
