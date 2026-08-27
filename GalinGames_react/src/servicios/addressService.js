import { httpClient } from './httpClient'

async function listAddresses() {
  return httpClient.get('/api/addresses')
}

async function createAddress(datos) {
  return httpClient.post('/api/addresses', datos)
}

async function updateAddress(id, datos) {
  return httpClient.put(`/api/addresses/${id}`, datos)
}

async function setDefaultAddress(id) {
  return httpClient.patch(`/api/addresses/${id}/predeterminada`)
}

async function deleteAddress(id) {
  return httpClient.del(`/api/addresses/${id}`)
}

export const addressService = { listAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress }
