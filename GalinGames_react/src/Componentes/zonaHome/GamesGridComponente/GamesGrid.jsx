import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import GameCard from '../GameCardComponente/GameCard'
import { gameService } from '../../../servicios/gameService'
import './GamesGrid.scss'

function GamesGrid() {
  const { t } = useTranslation()
  const [juegos, setJuegos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      const result = await gameService.getJuegosDestacados()
      if (cancelado) return
      if (result.ok) {
        setJuegos(result.data)
      } else {
        setError(true)
      }
      setLoading(false)
    }

    cargar()
    return () => { cancelado = true }
  }, [])

  return (
    <section className="games-grid" aria-labelledby="games-grid-titulo">
      <h2 id="games-grid-titulo" className="games-grid__titulo">{t('gamesGrid.title')}</h2>
      {loading ? (
        <p className="texto-tema" role="status">{t('common.loading')}</p>
      ) : error ? (
        <p className="texto-tema" role="alert">{t('juegos.errorCarga')}</p>
      ) : (
        <div className="games-grid__lista">
          {juegos.map((juego) => (
            <GameCard
              key={juego.id}
              id={juego.id}
              imagenPortada={juego.imagenPortada}
              nombre={juego.nombre}
              plataforma={juego.plataforma}
              precio={juego.precio}
              videoPreviewUrl={juego.videoPreviewUrl}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default GamesGrid
