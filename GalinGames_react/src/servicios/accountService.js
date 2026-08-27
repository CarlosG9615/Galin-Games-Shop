import { httpClient } from './httpClient'

async function getMe() {
  return httpClient.get('/api/users/me')
}

async function updateMe(datos) {
  return httpClient.patch('/api/users/me', datos)
}

async function checkUsername(username) {
  return httpClient.get(`/api/users/me/check-username?username=${encodeURIComponent(username)}`)
}

async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)
  return httpClient.postForm('/api/users/me/avatar', formData)
}

async function deleteAvatar() {
  return httpClient.del('/api/users/me/avatar')
}

async function verifyPassword(password, action) {
  return httpClient.post('/api/users/me/verify-password', { password, action })
}

async function requestEmailChange(password, newEmail) {
  return httpClient.put('/api/users/me/email', { password, newEmail })
}

async function changePassword(currentPassword, newPassword, repeatNewPassword) {
  return httpClient.put('/api/users/me/password', { currentPassword, newPassword, repeatNewPassword })
}

async function deleteAccount(password) {
  return httpClient.del('/api/users/me', { password })
}

export const accountService = {
  getMe,
  updateMe,
  checkUsername,
  uploadAvatar,
  deleteAvatar,
  verifyPassword,
  requestEmailChange,
  changePassword,
  deleteAccount,
}
