import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CabeceraJuego from './components/CabeceraJuego/CabeceraJuego'
import SeccionInfo from './components/SeccionInfo/SeccionInfo'
import { gameService } from '../../../servicios/gameService'
import './DetalleJuego.scss'

// Prioridad (design.md → DetalleJuego.jsx): el query param de origen si es válido para
// este juego, si no la plataforma destacada del juego si también lo es, si no la
// primera plataforma disponible.
function resolverPlataformaInicial(juego, plataformaQuery) {
  const disponibles = juego.plataformas.map((p) => p.plataforma)
  if (plataformaQuery && disponibles.includes(plataformaQuery)) return plataformaQuery
  if (juego.plataformaDestacada && disponibles.includes(juego.plataformaDestacada)) return juego.plataformaDestacada
  return disponibles[0]
}

function DetalleJuego() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [juego, setJuego] = useState(null)
  const [plataformaSeleccionada, setPlataformaSeleccionada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setNotFound(false)
    setError(false)

    async function cargar() {
      const result = await gameService.getJuegoPorId(id)
      if (cancelado) return

      if (result.ok) {
        setJuego(result.data)
        setPlataformaSeleccionada(resolverPlataformaInicial(result.data, searchParams.get('plataforma')))
      } else if (result.status === 404) {
        setNotFound(true)
      } else {
        setError(true)
      }
      setLoading(false)
    }

    cargar()
    return () => { cancelado = true }
    // Solo `id`: cambiar de plataforma en el select no debe volver a pedir el juego
    // (Requisito 9.3) — el query param de origen solo se lee una vez, al llegar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return <p className="texto-tema" role="status">{t('common.loading')}</p>
  }

  if (notFound) {
    return <p className="texto-tema" role="status">{t('juegos.noEncontrado')}</p>
  }

  if (error || !juego || !plataformaSeleccionada) {
    return <p className="texto-tema" role="alert">{t('juegos.errorCarga')}</p>
  }

  const disponibilidad = juego.plataformas.find((p) => p.plataforma === plataformaSeleccionada)

  return (
    <div className="detalle-juego">
      <CabeceraJuego
        juego={juego}
        plataformaSeleccionada={plataformaSeleccionada}
        onCambiarPlataforma={setPlataformaSeleccionada}
      />
      <SeccionInfo
        descripcion={juego.descripcion}
        plataforma={plataformaSeleccionada}
        especificacionesPC={disponibilidad?.especificacionesPC}
        especificacionesConsola={disponibilidad?.especificacionesConsola}
        caracteristicas={juego.caracteristicas}
      />
    </div>
  )
}

export default DetalleJuego
