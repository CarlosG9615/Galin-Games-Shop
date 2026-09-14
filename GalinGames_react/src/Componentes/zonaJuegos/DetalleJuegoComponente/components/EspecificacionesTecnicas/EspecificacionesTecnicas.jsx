import { useTranslation } from 'react-i18next'
import './EspecificacionesTecnicas.scss'

function BloquePerfil({ titulo, perfil }) {
  const { t } = useTranslation()
  if (!perfil) return null

  const campos = [
    ['cpu', perfil.cpu],
    ['ram', perfil.ram],
    ['gpu', perfil.gpu],
    ['almacenamiento', perfil.almacenamiento],
    ['sistemaOperativo', perfil.sistemaOperativo],
  ].filter(([, valor]) => Boolean(valor))

  if (campos.length === 0) return null

  return (
    <div className="especificaciones-tecnicas__bloque">
      <h3 className="especificaciones-tecnicas__subtitulo">{titulo}</h3>
      <dl className="especificaciones-tecnicas__lista">
        {campos.map(([clave, valor]) => (
          <div className="especificaciones-tecnicas__campo" key={clave}>
            <dt>{t(`juegos.especificaciones.${clave}`)}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// Oculta el bloque completo si no hay datos para la combinación juego+plataforma
// seleccionada (Requisito 10.3); en PC, "mínimas" y "recomendadas" son independientes
// entre sí (Data Models de design.md), así que cada una se oculta por separado.
function EspecificacionesTecnicas({ plataforma, especificacionesPC, especificacionesConsola }) {
  const { t } = useTranslation()

  if (plataforma === 'PC') {
    if (!especificacionesPC) return null
    if (!especificacionesPC.minimas && !especificacionesPC.recomendadas) return null

    return (
      <div className="especificaciones-tecnicas">
        <BloquePerfil titulo={t('juegos.especificaciones.minimas')} perfil={especificacionesPC.minimas} />
        <BloquePerfil titulo={t('juegos.especificaciones.recomendadas')} perfil={especificacionesPC.recomendadas} />
      </div>
    )
  }

  if (!especificacionesConsola) return null
  const { almacenamiento, notas } = especificacionesConsola
  const hayNotas = Array.isArray(notas) && notas.length > 0
  if (!almacenamiento && !hayNotas) return null

  return (
    <div className="especificaciones-tecnicas">
      <dl className="especificaciones-tecnicas__lista">
        {almacenamiento && (
          <div className="especificaciones-tecnicas__campo">
            <dt>{t('juegos.especificaciones.almacenamiento')}</dt>
            <dd>{almacenamiento}</dd>
          </div>
        )}
        {hayNotas && (
          <div className="especificaciones-tecnicas__campo">
            <dt>{t('juegos.especificaciones.notas')}</dt>
            <dd>{notas.join(', ')}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export default EspecificacionesTecnicas
