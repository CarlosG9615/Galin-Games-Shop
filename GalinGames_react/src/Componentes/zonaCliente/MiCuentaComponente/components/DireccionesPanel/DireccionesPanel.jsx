import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import TarjetaDireccion from './components/TarjetaDireccion/TarjetaDireccion'
import FormularioDireccion from './components/FormularioDireccion/FormularioDireccion'
import { addressService } from '../../../../../servicios/addressService'
import './DireccionesPanel.scss'

function BloqueDirecciones({ titulo, direcciones, onSetDefault, onEdit, onDelete, onNueva, permiteNueva }) {
  const { t } = useTranslation()
  return (
    <div className="direcciones-panel__bloque">
      <h3 className="titulo-tema direcciones-panel__titulo">{titulo}</h3>
      {direcciones.map((direccion) => (
        <TarjetaDireccion key={direccion._id} direccion={direccion} onSetDefault={onSetDefault} onEdit={onEdit} onDelete={onDelete} />
      ))}
      {permiteNueva && (
        <button type="button" className="direcciones-panel__nueva" onClick={onNueva}>
          {t('miCuenta.direcciones.newAddressButton')}
        </button>
      )}
    </div>
  )
}

function DireccionesPanel() {
  const { t } = useTranslation()
  const [direcciones, setDirecciones] = useState({ envio: [], facturacion: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formulario, setFormulario] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [reuseInfo, setReuseInfo] = useState(null)

  // mostrarCargando=false en los refrescos tras una acción (predeterminada/eliminar/
  // guardar): con mostrarCargando=true (el valor por defecto, para la carga inicial)
  // el componente desmonta TODO el árbol para pintar el "Cargando..." y lo vuelve a
  // montar desde cero al terminar, un parpadeo innecesario para un refresco que ya
  // tiene datos en pantalla — solo la carga inicial (sin nada que mostrar todavía)
  // necesita el estado de carga.
  const cargar = useCallback(async ({ mostrarCargando = true } = {}) => {
    if (mostrarCargando) setLoading(true)
    setLoadError('')
    const result = await addressService.listAddresses()
    if (result.ok) {
      setDirecciones(result.data)
    } else {
      setLoadError(t('miCuenta.direcciones.loadError'))
    }
    if (mostrarCargando) setLoading(false)
  }, [t])

  useEffect(() => {
    cargar()
  }, [cargar])

  const handleSetDefault = async (direccion) => {
    const result = await addressService.setDefaultAddress(direccion._id)
    if (result.ok) cargar({ mostrarCargando: false })
  }

  // La confirmación ("¿seguro?") vive en TarjetaDireccion.jsx, junto al botón que la
  // dispara — aquí solo se asume ya confirmada.
  const handleEliminar = async (direccion) => {
    const result = await addressService.deleteAddress(direccion._id)
    if (result.ok) cargar({ mostrarCargando: false })
  }

  const handleCrear = (tipo) => {
    setFormulario({ tipo, direccion: null })
    setSaveError('')
  }

  const handleEditar = (direccion) => {
    setFormulario({ tipo: direccion.tipo, direccion })
    setSaveError('')
  }

  const handleGuardarDireccion = async (datos) => {
    setSaveError('')
    const esCreacion = !formulario.direccion
    const result = esCreacion
      ? await addressService.createAddress({ ...datos, tipo: formulario.tipo })
      : await addressService.updateAddress(formulario.direccion._id, { ...datos, tipo: formulario.tipo })

    if (!result.ok) {
      setSaveError(t('miCuenta.direcciones.saveError'))
      return
    }

    const tipoCreado = formulario.tipo
    setFormulario(null)
    await cargar({ mostrarCargando: false })

    // Requisito 13.2/13.3: solo al crear, y solo si el backend indica que el otro
    // tipo no tiene ninguna dirección todavía.
    if (esCreacion && result.data.offerReuseForOtherType) {
      setReuseInfo({ otroTipo: tipoCreado === 'envio' ? 'facturacion' : 'envio', datos })
    }
  }

  const handleConfirmarReutilizar = async () => {
    if (!reuseInfo) return
    await addressService.createAddress({ ...reuseInfo.datos, tipo: reuseInfo.otroTipo })
    setReuseInfo(null)
    await cargar({ mostrarCargando: false })
  }

  if (loading) {
    return <p className="texto-tema" role="status">{t('common.loading')}</p>
  }

  if (loadError) {
    return <p className="texto-tema" role="alert">{loadError}</p>
  }

  return (
    <div className="direcciones-panel">
      <BloqueDirecciones
        titulo={t('miCuenta.direcciones.envioTitle')}
        direcciones={direcciones.envio}
        onSetDefault={handleSetDefault}
        onEdit={handleEditar}
        onDelete={handleEliminar}
        onNueva={() => handleCrear('envio')}
        permiteNueva
      />

      <BloqueDirecciones
        titulo={t('miCuenta.direcciones.facturacionTitle')}
        direcciones={direcciones.facturacion}
        onSetDefault={handleSetDefault}
        onEdit={handleEditar}
        onDelete={handleEliminar}
        onNueva={() => handleCrear('facturacion')}
        // Solo puede existir una dirección de facturación (petición de usuario): el
        // botón desaparece en cuanto hay una, en vez de dejar crear una segunda.
        permiteNueva={direcciones.facturacion.length === 0}
      />

      {formulario && (
        <FormularioDireccion
          tipo={formulario.tipo}
          direccion={formulario.direccion}
          onCancel={() => setFormulario(null)}
          onSave={handleGuardarDireccion}
          error={saveError}
        />
      )}

      {reuseInfo && (
        <div className="direcciones-panel__reuse-overlay" onClick={() => setReuseInfo(null)}>
          <div className="direcciones-panel__reuse-caja tarjeta-tema" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className="texto-tema">
              {t('miCuenta.direcciones.reuseQuestionMessage', {
                tipo: t(
                  reuseInfo.otroTipo === 'envio'
                    ? 'miCuenta.direcciones.reuseTipoEnvio'
                    : 'miCuenta.direcciones.reuseTipoFacturacion',
                ),
              })}
            </p>
            <div className="direcciones-panel__reuse-acciones">
              <button type="button" className="boton-primario" onClick={handleConfirmarReutilizar}>
                {t('miCuenta.direcciones.reuseConfirm')}
              </button>
              <button type="button" className="direcciones-panel__reuse-cancelar" onClick={() => setReuseInfo(null)}>
                {t('miCuenta.direcciones.reuseCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DireccionesPanel
