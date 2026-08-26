import { describe, it, expect, vi } from 'vitest'
import { accountService } from './accountService'
import { httpClient } from './httpClient'

vi.mock('./httpClient', () => ({
  httpClient: {
    get: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    post: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    put: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    patch: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    del: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    postForm: vi.fn().mockResolvedValue({ ok: true, data: {} }),
  },
}))

describe('accountService', () => {
  it('getMe() llama a GET /api/users/me', async () => {
    await accountService.getMe()
    expect(httpClient.get).toHaveBeenCalledWith('/api/users/me')
  })

  it('updateMe() llama a PATCH /api/users/me con el body dado', async () => {
    await accountService.updateMe({ nombre: 'Carlos' })
    expect(httpClient.patch).toHaveBeenCalledWith('/api/users/me', { nombre: 'Carlos' })
  })

  it('checkUsername() codifica el username en la query', async () => {
    await accountService.checkUsername('carlos galindo')
    expect(httpClient.get).toHaveBeenCalledWith('/api/users/me/check-username?username=carlos%20galindo')
  })

  it('uploadAvatar() envía un FormData con el campo "avatar"', async () => {
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    await accountService.uploadAvatar(file)

    const [url, formData] = httpClient.postForm.mock.calls[0]
    expect(url).toBe('/api/users/me/avatar')
    expect(formData.get('avatar')).toBe(file)
  })

  it('verifyPassword() llama a POST /api/users/me/verify-password con password y action', async () => {
    await accountService.verifyPassword('secreta', 'emailChange')
    expect(httpClient.post).toHaveBeenCalledWith('/api/users/me/verify-password', { password: 'secreta', action: 'emailChange' })
  })

  it('requestEmailChange() llama a PUT /api/users/me/email', async () => {
    await accountService.requestEmailChange('secreta', 'nuevo@example.com')
    expect(httpClient.put).toHaveBeenCalledWith('/api/users/me/email', { password: 'secreta', newEmail: 'nuevo@example.com' })
  })

  it('changePassword() llama a PUT /api/users/me/password', async () => {
    await accountService.changePassword('actual', 'nueva123456', 'nueva123456')
    expect(httpClient.put).toHaveBeenCalledWith('/api/users/me/password', {
      currentPassword: 'actual',
      newPassword: 'nueva123456',
      repeatNewPassword: 'nueva123456',
    })
  })

  it('deleteAccount() llama a DELETE /api/users/me con la contraseña', async () => {
    await accountService.deleteAccount('secreta')
    expect(httpClient.del).toHaveBeenCalledWith('/api/users/me', { password: 'secreta' })
  })
})
