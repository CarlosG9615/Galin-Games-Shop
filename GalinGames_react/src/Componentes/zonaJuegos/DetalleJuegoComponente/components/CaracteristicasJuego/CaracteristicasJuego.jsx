import { useTranslation } from 'react-i18next'
import './CaracteristicasJuego.scss'

// Cada característica es un div independiente que se oculta si el dato no está
// disponible (Requisito 8.3): jugadores.tipo es opcional, online/crossplay/hdr son
// booleanos con default false en el schema (siempre "definidos"), así que aquí
// "disponible" para ellos significa concretamente `true` — no tiene sentido mostrar
// un chip "Sin HDR" para cada juego que no lo tiene.
function CaracteristicasJuego({ caracteristicas }) {
  const { t } = useTranslation()

  if (!caracteristicas) return null

  const { jugadores, online, crossplay, hdr, mandosCompatibles } = caracteristicas

  const textoJugadores = jugadores?.tipo === 'individual'
    ? t('juegos.caracteristicas.jugadoresIndividual')
    : jugadores?.tipo === 'multijugador'
      ? jugadores.maximo
        ? t('juegos.caracteristicas.jugadoresMultijugador', { maximo: jugadores.maximo })
        : t('juegos.caracteristicas.jugadoresMultijugadorGenerico')
      : null

  const hayMandos = Array.isArray(mandosCompatibles) && mandosCompatibles.length > 0
  const hayAlgunaCaracteristica = textoJugadores || online || crossplay || hdr || hayMandos

  if (!hayAlgunaCaracteristica) return null

  return (
    <div className="caracteristicas-juego">
      <h2 className="caracteristicas-juego__titulo">{t('juegos.caracteristicas.titulo')}</h2>
      <div className="caracteristicas-juego__lista">
        {textoJugadores && <div className="caracteristicas-juego__item">{textoJugadores}</div>}
        {online && <div className="caracteristicas-juego__item">{t('juegos.caracteristicas.online')}</div>}
        {crossplay && <div className="caracteristicas-juego__item">{t('juegos.caracteristicas.crossplay')}</div>}
        {hdr && <div className="caracteristicas-juego__item">{t('juegos.caracteristicas.hdr')}</div>}
        {hayMandos && (
          <div className="caracteristicas-juego__item">
            {t('juegos.caracteristicas.mandosCompatibles')}: {mandosCompatibles.join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

export default CaracteristicasJuego
