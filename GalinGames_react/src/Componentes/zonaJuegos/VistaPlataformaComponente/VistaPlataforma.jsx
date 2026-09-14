import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Breadcrumb from '../../compGlobales/BreadcrumbComponente/Breadcrumb'
import GameCard from '../../zonaHome/GameCardComponente/GameCard'
import { gameService } from '../../../servicios/gameService'
import './VistaPlataforma.scss'

// Mapeo slug de la URL -> valor real del enum de plataforma (mismo criterio que
// platformSlug.js en el backend): GameCard necesita el nombre real de la plataforma
// para su texto y para el query param de navegación a la Vista de Detalle, y la API
// de listado no lo repite en cada juego (ya viene fijado por la propia URL).
const SLUG_A_PLATAFORMA = { pc: 'PC', playstation: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo' }

function VistaPlataforma() {
  const { t } = useTranslation()
  const { plataforma: slug } = useParams()
  const [juegos, setJuegos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(false)

    async function cargar() {
      const result = await gameService.getJuegosPorPlataforma(slug)
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
  }, [slug])

  const plataforma = SLUG_A_PLATAFORMA[slug]

  return (
    <div className="vista-plataforma">
      <h1 className="vista-plataforma__titulo">{t(`juegos.plataforma.${slug}.titulo`)}</h1>
      <p className="vista-plataforma__subtitulo">{t(`juegos.plataforma.${slug}.subtitulo`)}</p>

      <Breadcrumb
        ariaLabel={t('juegos.breadcrumb.ariaLabel')}
        items={[
          { label: t('juegos.breadcrumb.inicio'), to: '/' },
          { label: t('juegos.breadcrumb.juegos') },
          { label: t(`juegos.plataforma.${slug}.titulo`) },
        ]}
      />

      {loading ? (
        <p className="texto-tema" role="status">{t('common.loading')}</p>
      ) : error ? (
        <p className="texto-tema" role="alert">{t('juegos.errorCarga')}</p>
      ) : juegos.length === 0 ? (
        <p className="texto-tema" role="status">{t('juegos.vacio')}</p>
      ) : (
        <div className="vista-plataforma__lista">
          {juegos.map((juego) => (
            <GameCard
              key={juego.id}
              id={juego.id}
              imagenPortada={juego.imagenPortada}
              nombre={juego.nombre}
              plataforma={plataforma}
              precio={juego.precio}
              videoPreviewUrl={juego.videoPreviewUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default VistaPlataforma
