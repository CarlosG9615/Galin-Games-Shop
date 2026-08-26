import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../../globalState/authContext'
import { ThemeProvider } from '../../../globalState/themeContext'
import { LanguageProvider } from '../../../globalState/languageContext'
import { accountService } from '../../../servicios/accountService'
import { addressService } from '../../../servicios/addressService'
import { authService } from '../../../servicios/authService'
import MiCuenta from './MiCuenta'

vi.mock('../../../servicios/accountService', () => ({
  accountService: {
    getMe: vi.fn().mockResolvedValue({ ok: true, data: { nombre: 'Carlos', apellidos: 'Galindo', username: 'carlos', telefono: '', nacionalidad: '', email: 'carlos@example.com', avatarUrl: null } }),
    updateMe: vi.fn(),
    checkUsername: vi.fn(),
    uploadAvatar: vi.fn(),
    verifyPassword: vi.fn(),
    requestEmailChange: vi.fn(),
    changePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}))

vi.mock('../../../servicios/addressService', () => ({
  addressService: {
    listAddresses: vi.fn().mockResolvedValue({ ok: true, data: { envio: [], facturacion: [] } }),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
  },
}))

vi.mock('../../../servicios/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    silentRefresh: vi.fn(),
  },
}))

function renderMiCuenta(ruta = '/mi-cuenta/perfil') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/mi-cuenta/:seccion" element={<MiCuenta />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  )
}

describe('MiCuenta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    accountService.getMe.mockResolvedValue({ ok: true, data: { nombre: 'Carlos', apellidos: 'Galindo', username: 'carlos', telefono: '', nacionalidad: '', email: 'carlos@example.com', avatarUrl: null } })
    addressService.listAddresses.mockResolvedValue({ ok: true, data: { envio: [], facturacion: [] } })
    authService.silentRefresh.mockResolvedValue({ ok: false })
  })

  it('muestra el Navbar y el menú lateral junto con la sección "Mi perfil" por defecto', async () => {
    renderMiCuenta('/mi-cuenta/perfil')

    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /menú de mi cuenta/i })).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Carlos')).toBeInTheDocument()
  })

  it('"Email y contraseña" es una sección propia, no se muestra junto a "Mi perfil"', async () => {
    renderMiCuenta('/mi-cuenta/perfil')
    await screen.findByDisplayValue('Carlos')

    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })

  it('muestra la sección de email y contraseña cuando la ruta es /mi-cuenta/email-password', async () => {
    renderMiCuenta('/mi-cuenta/email-password')

    expect(await screen.findByDisplayValue('carlos@example.com')).toBeInTheDocument()
  })

  it('muestra la sección de direcciones cuando la ruta es /mi-cuenta/direcciones', async () => {
    renderMiCuenta('/mi-cuenta/direcciones')

    expect(await screen.findAllByRole('button', { name: /nueva dirección/i })).toHaveLength(2)
  })

  it('muestra el estado vacío de pedidos cuando la ruta es /mi-cuenta/pedidos', async () => {
    renderMiCuenta('/mi-cuenta/pedidos')

    expect(await screen.findByText('Aún no tienes ningún pedido registrado')).toBeInTheDocument()
  })

  it('redirige a /mi-cuenta/perfil cuando la sección de la URL no es válida', async () => {
    renderMiCuenta('/mi-cuenta/no-existe')

    expect(await screen.findByDisplayValue('Carlos')).toBeInTheDocument()
  })

  it('al pulsar "Direcciones" en el menú, cambia el panel de contenido', async () => {
    const user = userEvent.setup()
    renderMiCuenta('/mi-cuenta/perfil')
    await screen.findByDisplayValue('Carlos')

    await user.click(screen.getByRole('link', { name: 'Direcciones' }))

    await waitFor(() => expect(screen.getAllByRole('button', { name: /nueva dirección/i })).toHaveLength(2))
  })

  it('al pulsar "Email y contraseña" en el menú, cambia el panel de contenido', async () => {
    const user = userEvent.setup()
    renderMiCuenta('/mi-cuenta/perfil')
    await screen.findByDisplayValue('Carlos')

    await user.click(screen.getByRole('link', { name: 'Email y contraseña' }))

    expect(await screen.findByDisplayValue('carlos@example.com')).toBeInTheDocument()
  })
})
