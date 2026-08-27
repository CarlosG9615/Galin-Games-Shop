import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PerfilPanel from './PerfilPanel'
import { accountService } from '../../../servicios/accountService'

vi.mock('../../../servicios/accountService', () => ({
  accountService: {
    getMe: vi.fn(),
    updateMe: vi.fn(),
    checkUsername: vi.fn(),
    uploadAvatar: vi.fn(),
    deleteAvatar: vi.fn(),
  },
}))

const datosCompletos = {
  nombre: 'Carlos',
  apellidos: 'Galindo',
  username: 'carlos',
  telefono: '',
  nacionalidad: '',
  email: 'carlos@example.com',
  avatarUrl: null,
}

describe('PerfilPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra los datos cargados y deja vacíos (y no seleccionables) los campos sin valor', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })

    render(<PerfilPanel />)

    expect(await screen.findByDisplayValue('Carlos')).toBeInTheDocument()
    const telefonoInput = screen.getByLabelText('Teléfono')
    expect(telefonoInput).toHaveValue('')
    expect(telefonoInput).toBeDisabled()
  })

  it('muestra un mensaje de error si falla la carga inicial', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: false, status: 500 })

    render(<PerfilPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudieron cargar/i)
  })

  it('al pulsar "Modificar datos personales" habilita todos los campos, incluidos los que estaban vacíos', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    const user = userEvent.setup()
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')

    await user.click(screen.getByRole('button', { name: /modificar datos personales/i }))

    expect(screen.getByLabelText('Nombre')).not.toBeDisabled()
    expect(screen.getByLabelText('Teléfono')).not.toBeDisabled()
    expect(screen.getByLabelText('Nacionalidad')).not.toBeDisabled()
  })

  it('al escribir un valor en un campo antes vacío (teléfono) y guardar, lo envía como cambio nuevo', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    accountService.updateMe.mockResolvedValueOnce({ ok: true, data: { ...datosCompletos, telefono: '600123456' } })
    const user = userEvent.setup()
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')
    await user.click(screen.getByRole('button', { name: /modificar datos personales/i }))

    await user.type(screen.getByLabelText('Teléfono'), '600123456')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(accountService.updateMe).toHaveBeenCalledWith(expect.objectContaining({ telefono: '600123456' })))
  })

  it('no consulta disponibilidad si el username no cambia respecto al actual', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    const user = userEvent.setup()
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')
    await user.click(screen.getByRole('button', { name: /modificar datos personales/i }))

    const usernameInput = screen.getByLabelText('Nombre de usuario')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'carlos')

    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(accountService.checkUsername).not.toHaveBeenCalled()
  })

  it('muestra "nombre válido" en verde cuando el username está disponible', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    accountService.checkUsername.mockResolvedValueOnce({ ok: true, data: { available: true } })
    const user = userEvent.setup()
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')
    await user.click(screen.getByRole('button', { name: /modificar datos personales/i }))

    const usernameInput = screen.getByLabelText('Nombre de usuario')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'carlosnuevo')

    expect(await screen.findByText(/nombre de usuario válido/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar/i })).not.toBeDisabled()
  })

  it('muestra la alerta roja y bloquea el guardado cuando el username ya existe', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    accountService.checkUsername.mockResolvedValueOnce({ ok: true, data: { available: false } })
    const user = userEvent.setup()
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')
    await user.click(screen.getByRole('button', { name: /modificar datos personales/i }))

    const usernameInput = screen.getByLabelText('Nombre de usuario')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'yaexiste')

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya existe/i)
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled()
  })

  it('al guardar con éxito, actualiza los datos y sale del modo edición', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    accountService.updateMe.mockResolvedValueOnce({ ok: true, data: { ...datosCompletos, nombre: 'Carlos II' } })
    const user = userEvent.setup()
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')
    await user.click(screen.getByRole('button', { name: /modificar datos personales/i }))

    const nombreInput = screen.getByLabelText('Nombre')
    await user.clear(nombreInput)
    await user.type(nombreInput, 'Carlos II')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/actualizados correctamente/i))
    expect(screen.getByRole('button', { name: /modificar datos personales/i })).toBeInTheDocument()
  })

  it('rechaza en cliente un tipo de imagen no permitido sin llamar a uploadAvatar', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    // applyAccept:false — sin esto, userEvent filtra por el atributo `accept` del
    // input y nunca dispara el evento para un tipo no permitido; aquí se quiere
    // ejercitar la validación propia del componente, no la del selector de archivos.
    const user = userEvent.setup({ applyAccept: false })
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')

    const fileInput = screen.getByLabelText(/cambiar foto de perfil/i)
    const archivoInvalido = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, archivoInvalido)

    expect(await screen.findByRole('alert')).toHaveTextContent(/jpeg, png o webp/i)
    expect(accountService.uploadAvatar).not.toHaveBeenCalled()
  })

  it('sube una imagen válida y actualiza el avatarUrl mostrado', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    accountService.uploadAvatar.mockResolvedValueOnce({ ok: true, data: { avatarUrl: 'https://res.cloudinary.com/demo/a.jpg' } })
    const user = userEvent.setup()
    const { container } = render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')

    const fileInput = screen.getByLabelText(/cambiar foto de perfil/i)
    const archivoValido = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, archivoValido)

    await waitFor(() => expect(accountService.uploadAvatar).toHaveBeenCalledWith(archivoValido))
    // alt="" es deliberado (imagen decorativa, Requisito 3.3): el rol de accesibilidad
    // pasa a "presentation", así que se consulta por selector en vez de getByRole('img').
    await waitFor(() =>
      expect(container.querySelector('.perfil-panel__avatar-img')).toHaveAttribute('src', 'https://res.cloudinary.com/demo/a.jpg'),
    )
  })

  it('no muestra el botón de eliminar avatar cuando no hay imagen', async () => {
    accountService.getMe.mockResolvedValueOnce({ ok: true, data: datosCompletos })
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')

    expect(screen.queryByLabelText(/eliminar foto de perfil/i)).not.toBeInTheDocument()
  })

  it('al pulsar el botón de eliminar avatar, pide confirmación y borra si se acepta', async () => {
    accountService.getMe.mockResolvedValueOnce({
      ok: true,
      data: { ...datosCompletos, avatarUrl: 'https://res.cloudinary.com/demo/a.jpg' },
    })
    accountService.deleteAvatar.mockResolvedValueOnce({ ok: true, data: { avatarUrl: null } })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    const { container } = render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')

    await user.click(screen.getByLabelText(/eliminar foto de perfil/i))

    expect(window.confirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(accountService.deleteAvatar).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(container.querySelector('.perfil-panel__avatar-img')).not.toBeInTheDocument())
    expect(screen.queryByLabelText(/eliminar foto de perfil/i)).not.toBeInTheDocument()
  })

  it('si se cancela la confirmación, no llama a deleteAvatar ni cambia el avatar', async () => {
    accountService.getMe.mockResolvedValueOnce({
      ok: true,
      data: { ...datosCompletos, avatarUrl: 'https://res.cloudinary.com/demo/a.jpg' },
    })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    render(<PerfilPanel />)
    await screen.findByDisplayValue('Carlos')

    await user.click(screen.getByLabelText(/eliminar foto de perfil/i))

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(accountService.deleteAvatar).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/eliminar foto de perfil/i)).toBeInTheDocument()
  })
})
