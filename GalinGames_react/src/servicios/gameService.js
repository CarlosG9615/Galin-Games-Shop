import { httpClient } from './httpClient'

async function getJuegosDestacados() {
  return httpClient.get('/api/games/destacados')
}

async function getJuegosPorPlataforma(plataformaSlug) {
  return httpClient.get(`/api/games/plataforma/${plataformaSlug}`)
}

async function getJuegoPorId(id) {
  return httpClient.get(`/api/games/${id}`)
}

async function suscribirNotificacion(gameId, plataforma) {
  return httpClient.post(`/api/games/${gameId}/notificarme`, { plataforma })
}

export const gameService = { getJuegosDestacados, getJuegosPorPlataforma, getJuegoPorId, suscribirNotificacion }
