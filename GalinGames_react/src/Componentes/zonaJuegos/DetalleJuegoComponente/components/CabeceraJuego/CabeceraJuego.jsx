import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../../../hooks/useAuth'
import { useLanguage } from '../../../../../hooks/useLanguage'
import { gameService } from '../../../../../servicios/gameService'
import './CabeceraJuego.scss'

function formatoTexto(formatos, t) {
  if (formatos.length === 2) return t('juegos.cabecera.formatoFisicoYDigital')
  return formatos[0] === 'digital' ? t('juegos.cabecera.formatoDigital') : t('juegos.cabecera.formatoFisico')
}

// juego: documento completo de GET /api/games/:id. plataformaSeleccionada/onCambiarPlataforma
// son estado controlado por DetalleJuego.jsx (Requisito 9.3: cambiar de plataforma no
// dispara una nueva petición, ya tenemos todas las plataformas en `juego.plataformas`).
function CabeceraJuego({ juego, plataformaSeleccionada, onCambiarPlataforma }) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [estadoAviso, setEstadoAviso] = useState('idle')

  useEffect(() => {
    setEstadoAviso('idle')
  }, [plataformaSeleccionada])

  const disponibilidad = juego.plataformas.find((p) => p.plataforma === plataformaSeleccionada)

  const precioFormateado = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(disponibilidad.precio)

  const handleAvisarme = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setEstadoAviso('enviando')
    const result = await gameService.suscribirNotificacion(juego.id, plataformaSeleccionada)
    setEstadoAviso(result.ok ? 'suscrito' : 'error')
  }

  const wallpaperStyle = juego.imagenWallpaper
    ? { backgroundImage: `url(${juego.imagenWallpaper})` }
    : undefined

  return (
    <header
      className={`cabecera-juego ${juego.imagenWallpaper ? '' : 'cabecera-juego--sin-wallpaper'}`}
      style={wallpaperStyle}
    >
      <div className="cabecera-juego__overlay">
        <img className="cabecera-juego__portada" src={juego.imagenPortada} alt={juego.nombre} />

        <div className="cabecera-juego__derecha">
          <h1 className="cabecera-juego__nombre">{juego.nombre}</h1>

          <div className="cabecera-juego__campo">
            <label className="cabecera-juego__label" htmlFor="cabecera-juego-plataforma">
              {t('juegos.cabecera.plataformaLabel')}
            </label>
            <select
              id="cabecera-juego-plataforma"
              className="cabecera-juego__select"
              value={plataformaSeleccionada}
              onChange={(e) => onCambiarPlataforma(e.target.value)}
            >
              {juego.plataformas.map((p) => (
                <option key={p.plataforma} value={p.plataforma}>{p.plataforma}</option>
              ))}
            </select>
          </div>

          <p className="cabecera-juego__formato">{formatoTexto(disponibilidad.formatos, t)}</p>

          <span className={`cabecera-juego__chip ${disponibilidad.stock > 0 ? 'cabecera-juego__chip--con-stock' : 'cabecera-juego__chip--sin-stock'}`}>
            {disponibilidad.stock > 0 ? t('juegos.stock.conStock') : t('juegos.stock.sinStock')}
          </span>

          <p className="cabecera-juego__precio">{precioFormateado}</p>

          {!juego.estrenado ? (
            <button type="button" className="boton-primario">{t('juegos.acciones.reservar')}</button>
          ) : disponibilidad.stock > 0 ? (
            <button type="button" className="boton-primario">{t('juegos.acciones.comprar')}</button>
          ) : estadoAviso === 'suscrito' ? (
            <p className="texto-tema texto-tema--exito" role="status">{t('juegos.acciones.yaSuscrito')}</p>
          ) : (
            <>
              <button
                type="button"
                className="boton-primario"
                disabled={estadoAviso === 'enviando'}
                onClick={handleAvisarme}
              >
                {estadoAviso === 'enviando' ? t('juegos.acciones.avisarmeEnviando') : t('juegos.acciones.avisarme')}
              </button>
              {estadoAviso === 'error' && (
                <p className="texto-tema" role="alert">{t('juegos.acciones.avisarmeError')}</p>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default CabeceraJuego
