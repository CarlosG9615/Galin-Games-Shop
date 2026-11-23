import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../../../hooks/useAuth'
import { useLanguage } from '../../../../../hooks/useLanguage'
import { gameService } from '../../../../../servicios/gameService'
import Breadcrumb from '../../../../compGlobales/BreadcrumbComponente/Breadcrumb'
import { IconoPC, IconoPlayStation, IconoXbox, IconoNintendo } from '../../../../compGlobales/NavbarComponente/PlataformasIconos'
import './CabeceraJuego.scss'

// Inverso del SLUG_A_PLATAFORMA de VistaPlataforma.jsx: el breadcrumb necesita volver
// a construir la URL de la Vista de Plataforma (/juegos/<slug>) a partir del valor real
// de plataforma que ya tenemos aquí (mismo criterio que platformSlug.js en el backend).
const PLATAFORMA_A_SLUG = { PC: 'pc', PlayStation: 'playstation', Xbox: 'xbox', Nintendo: 'nintendo' }

// Mismos iconos que el dropdown del Navbar (PlataformasIconos.jsx), reutilizados aquí
// para el chip resumen en vez de duplicar los SVG.
const ICONOS_POR_PLATAFORMA = { PC: IconoPC, PlayStation: IconoPlayStation, Xbox: IconoXbox, Nintendo: IconoNintendo }

function IconoTick() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 12 9 17 20 6" />
    </svg>
  )
}

function IconoCruz() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}

function IconoCorazon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-6.7-4.35-9.3-8.2C1.1 10.4 1.6 7 4.3 5.6c2.2-1.1 4.6-.3 5.9 1.5.4.5.7 1 .8 1.3.1-.3.4-.8.8-1.3 1.3-1.8 3.7-2.6 5.9-1.5 2.7 1.4 3.2 4.8 1.6 7.2C18.7 16.65 12 21 12 21z" />
    </svg>
  )
}

function textoFormato(formato, t) {
  return formato === 'digital' ? t('juegos.cabecera.formatoDigital') : t('juegos.cabecera.formatoFisico')
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
  // Solo visual por ahora (sin persistencia ni endpoint): no hay spec de favoritos
  // todavía, igual que Comprar/Reservar (design.md → Design Decisions, Requisito 12.5).
  const [esFavorito, setEsFavorito] = useState(false)
  // Precio y stock viven a nivel de plataforma, no de formato (Data Model de Game): el
  // formato es solo descriptivo, así que cambiarlo no afecta a precio/stock/acción.
  const [formatoSeleccionado, setFormatoSeleccionado] = useState(
    () => juego.plataformas.find((p) => p.plataforma === plataformaSeleccionada).formatos[0],
  )

  useEffect(() => {
    const disponibilidadNueva = juego.plataformas.find((p) => p.plataforma === plataformaSeleccionada)
    setEstadoAviso('idle')
    setFormatoSeleccionado(disponibilidadNueva.formatos[0])
    // Solo `plataformaSeleccionada`: `juego` es estable durante la vida de este
    // componente, no hace falta re-ejecutar el efecto si cambiara de identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plataformaSeleccionada])

  const disponibilidad = juego.plataformas.find((p) => p.plataforma === plataformaSeleccionada)
  const puedeElegirFormato = disponibilidad.formatos.length > 1
  const IconoPlataforma = ICONOS_POR_PLATAFORMA[plataformaSeleccionada]

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

  const slugPlataforma = PLATAFORMA_A_SLUG[plataformaSeleccionada]

  return (
    <header
      className={`cabecera-juego ${juego.imagenWallpaper ? '' : 'cabecera-juego--sin-wallpaper'}`}
      style={wallpaperStyle}
    >
      <div className="cabecera-juego__overlay">
        <div className="cabecera-juego__breadcrumb">
          <Breadcrumb
            ariaLabel={t('juegos.breadcrumb.ariaLabel')}
            items={[
              { label: t('juegos.breadcrumb.inicio'), to: '/' },
              { label: t('juegos.breadcrumb.juegos') },
              { label: t(`juegos.plataforma.${slugPlataforma}.titulo`), to: `/juegos/${slugPlataforma}` },
              { label: juego.nombre },
            ]}
          />
        </div>

        <div className="cabecera-juego__fila">
          <div className="cabecera-juego__panel cabecera-juego__panel--portada">
            <img className="cabecera-juego__portada" src={juego.imagenPortada} alt={juego.nombre} />
          </div>

          <div className="cabecera-juego__panel">
            <div className="cabecera-juego__derecha">
              <h1 className="cabecera-juego__nombre">{juego.nombre}</h1>

              <div className="cabecera-juego__chip">
                <span className="cabecera-juego__chip-item">
                  <IconoPlataforma />
                  {plataformaSeleccionada}
                </span>
                <span className="cabecera-juego__chip-separador" aria-hidden="true" />
                <span className={`cabecera-juego__chip-item ${disponibilidad.stock > 0 ? 'cabecera-juego__chip-item--con-stock' : 'cabecera-juego__chip-item--sin-stock'}`}>
                  {disponibilidad.stock > 0 ? <IconoTick /> : <IconoCruz />}
                  {disponibilidad.stock > 0 ? t('juegos.stock.conStock') : t('juegos.stock.sinStock')}
                </span>
                <span className="cabecera-juego__chip-separador" aria-hidden="true" />
                <span className="cabecera-juego__chip-item">{textoFormato(formatoSeleccionado, t)}</span>
              </div>

              <div className="cabecera-juego__selects">
                <select
                  aria-label={t('juegos.cabecera.plataformaLabel')}
                  className="cabecera-juego__select"
                  value={plataformaSeleccionada}
                  onChange={(e) => onCambiarPlataforma(e.target.value)}
                >
                  {juego.plataformas.map((p) => (
                    <option key={p.plataforma} value={p.plataforma}>{p.plataforma}</option>
                  ))}
                </select>

                <select
                  aria-label={t('juegos.cabecera.formatoLabel')}
                  className="cabecera-juego__select"
                  value={formatoSeleccionado}
                  disabled={!puedeElegirFormato}
                  onChange={(e) => setFormatoSeleccionado(e.target.value)}
                >
                  {disponibilidad.formatos.map((formato) => (
                    <option key={formato} value={formato}>{textoFormato(formato, t)}</option>
                  ))}
                </select>
              </div>

              <p className="cabecera-juego__precio">{precioFormateado}</p>

              <div className="cabecera-juego__acciones">
                {!juego.estrenado ? (
                  <button type="button" className="boton-primario cabecera-juego__boton-accion">{t('juegos.acciones.reservar')}</button>
                ) : disponibilidad.stock > 0 ? (
                  <button type="button" className="boton-primario cabecera-juego__boton-accion">{t('juegos.acciones.comprar')}</button>
                ) : estadoAviso === 'suscrito' ? (
                  <p className="texto-tema texto-tema--exito" role="status">{t('juegos.acciones.yaSuscrito')}</p>
                ) : (
                  <button
                    type="button"
                    className="boton-primario cabecera-juego__boton-accion"
                    disabled={estadoAviso === 'enviando'}
                    onClick={handleAvisarme}
                  >
                    {estadoAviso === 'enviando' ? t('juegos.acciones.avisarmeEnviando') : t('juegos.acciones.avisarme')}
                  </button>
                )}

                <button
                  type="button"
                  className="cabecera-juego__favorito"
                  aria-pressed={esFavorito}
                  aria-label={esFavorito ? t('juegos.acciones.favoritoQuitar') : t('juegos.acciones.favoritoAgregar')}
                  onClick={() => setEsFavorito((prev) => !prev)}
                >
                  <IconoCorazon />
                </button>
              </div>

              {estadoAviso === 'error' && (
                <p className="texto-tema" role="alert">{t('juegos.acciones.avisarmeError')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default CabeceraJuego
