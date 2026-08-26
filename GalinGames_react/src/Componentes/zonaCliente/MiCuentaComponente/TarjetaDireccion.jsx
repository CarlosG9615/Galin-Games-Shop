import { useTranslation } from 'react-i18next'
import { IconoLapiz, IconoEstrella } from './MiCuentaIconos'
import './TarjetaDireccion.scss'

function TarjetaDireccion({ direccion, onSetDefault, onEdit }) {
  const { t } = useTranslation()

  const lineaDireccion = [
    `${direccion.calle} ${direccion.numero}${direccion.pisoPuerta ? `, ${direccion.pisoPuerta}` : ''}`,
    `${direccion.codigoPostal} ${direccion.ciudad}, ${direccion.provincia}`,
    direccion.pais,
  ].join(' · ')

  return (
    <div className={`tarjeta-direccion${direccion.esPredeterminada ? ' tarjeta-direccion--predeterminada' : ''}`}>
      <button
        type="button"
        className="tarjeta-direccion__accion"
        onClick={() => onSetDefault(direccion)}
        aria-label={t('miCuenta.direcciones.setDefaultAria')}
        disabled={direccion.esPredeterminada}
      >
        <IconoEstrella relleno={direccion.esPredeterminada} />
      </button>
      <button
        type="button"
        className="tarjeta-direccion__accion"
        onClick={() => onEdit(direccion)}
        aria-label={t('miCuenta.direcciones.editAria')}
      >
        <IconoLapiz />
      </button>
      <div className="tarjeta-direccion__contenido">
        <p className="tarjeta-direccion__titulo">
          {direccion.titulo}
          {direccion.esPredeterminada && (
            <span className="tarjeta-direccion__badge">{t('miCuenta.direcciones.defaultBadge')}</span>
          )}
        </p>
        <p className="tarjeta-direccion__detalle">{lineaDireccion}</p>
      </div>
    </div>
  )
}

export default TarjetaDireccion
