import { useTranslation } from 'react-i18next'
import { IconoCasa, IconoTarjeta, IconoLapiz, IconoEstrella, IconoPapelera } from '../../../../icons/MiCuentaIconos'
import './TarjetaDireccion.scss'

function TarjetaDireccion({ direccion, onSetDefault, onEdit, onDelete }) {
  const { t } = useTranslation()

  const lineaDireccion = [
    `${direccion.calle} ${direccion.numero}${direccion.pisoPuerta ? `, ${direccion.pisoPuerta}` : ''}`,
    `${direccion.codigoPostal} ${direccion.ciudad}, ${direccion.provincia}`,
    direccion.pais,
  ].join(' · ')

  // Casa para envío (entrega a domicilio), tarjeta de pago para facturación — más
  // identificativo de cada tipo que repetir el mismo icono en las dos (ajuste tras
  // petición de usuario).
  const IconoTipo = direccion.tipo === 'facturacion' ? IconoTarjeta : IconoCasa

  const handleEliminar = () => {
    if (window.confirm(t('miCuenta.direcciones.deleteConfirm'))) {
      onDelete(direccion)
    }
  }

  return (
    <div className={`tarjeta-direccion${direccion.esPredeterminada ? ' tarjeta-direccion--predeterminada' : ''}`}>
      <span
        className={`tarjeta-direccion__casa${direccion.esPredeterminada ? ' tarjeta-direccion__casa--predeterminada' : ''}`}
        aria-hidden="true"
      >
        <IconoTipo />
      </span>

      <div className="tarjeta-direccion__contenido">
        <p className="tarjeta-direccion__titulo">
          {direccion.titulo}
          {direccion.esPredeterminada && (
            <span className="tarjeta-direccion__badge">{t('miCuenta.direcciones.defaultBadge')}</span>
          )}
        </p>
        <p className="tarjeta-direccion__detalle">{lineaDireccion}</p>
      </div>

      <div className="tarjeta-direccion__acciones">
        <button
          type="button"
          className="tarjeta-direccion__accion tarjeta-direccion__accion--favorito"
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
        <button
          type="button"
          className="tarjeta-direccion__accion tarjeta-direccion__accion--eliminar"
          onClick={handleEliminar}
          aria-label={t('miCuenta.direcciones.deleteAria')}
        >
          <IconoPapelera />
        </button>
      </div>
    </div>
  )
}

export default TarjetaDireccion
