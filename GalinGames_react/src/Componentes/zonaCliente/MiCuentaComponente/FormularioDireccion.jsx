import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import InputBox from '../../compGlobales/InputBoxComponente/InputBox'
import './FormularioDireccion.scss'

const CAMPOS_DIRECCION = [
  { name: 'titulo', labelKey: 'miCuenta.direcciones.fieldTitulo' },
  { name: 'calle', labelKey: 'miCuenta.direcciones.fieldCalle' },
  { name: 'numero', labelKey: 'miCuenta.direcciones.fieldNumero' },
  { name: 'pisoPuerta', labelKey: 'miCuenta.direcciones.fieldPisoPuerta' },
  { name: 'ciudad', labelKey: 'miCuenta.direcciones.fieldCiudad' },
  { name: 'provincia', labelKey: 'miCuenta.direcciones.fieldProvincia' },
  { name: 'codigoPostal', labelKey: 'miCuenta.direcciones.fieldCodigoPostal' },
  { name: 'pais', labelKey: 'miCuenta.direcciones.fieldPais' },
]
const CAMPOS_OBLIGATORIOS = CAMPOS_DIRECCION.filter(({ name }) => name !== 'pisoPuerta').map(({ name }) => name)

// Mismo componente para crear y editar (Requisito 14.3, design.md): reenvía siempre
// el objeto completo, nunca un PATCH parcial.
function FormularioDireccion({ tipo, direccion, onCancel, onSave, error }) {
  const { t } = useTranslation()
  const [valores, setValores] = useState(() => ({
    titulo: direccion?.titulo || '',
    calle: direccion?.calle || '',
    numero: direccion?.numero || '',
    pisoPuerta: direccion?.pisoPuerta || '',
    ciudad: direccion?.ciudad || '',
    provincia: direccion?.provincia || '',
    codigoPostal: direccion?.codigoPostal || '',
    pais: direccion?.pais || '',
  }))
  const [guardando, setGuardando] = useState(false)

  const handleChange = (campo) => (e) => {
    setValores((prev) => ({ ...prev, [campo]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    await onSave(valores)
    setGuardando(false)
  }

  const tituloFormulario = direccion
    ? t('miCuenta.direcciones.formTitleEdit')
    : t(tipo === 'envio' ? 'miCuenta.direcciones.formTitleCreateEnvio' : 'miCuenta.direcciones.formTitleCreateFacturacion')

  const faltanObligatorios = CAMPOS_OBLIGATORIOS.some((campo) => !valores[campo].trim())

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- overlay decorativo, el cierre real es el botón "Cancelar"
    <div className="formulario-direccion__overlay" onClick={onCancel}>
      <div className="formulario-direccion__caja tarjeta-tema" role="dialog" aria-label={tituloFormulario} onClick={(e) => e.stopPropagation()}>
        <h3 className="titulo-tema formulario-direccion__titulo">{tituloFormulario}</h3>
        <form onSubmit={handleSubmit} noValidate>
          <div className="formulario-direccion__grid">
            {CAMPOS_DIRECCION.map(({ name, labelKey }) => (
              <InputBox
                key={name}
                nameInput={name}
                labelInput={t(labelKey)}
                typeInput="text"
                placeholderInput={t(labelKey)}
                eventoOnChange={handleChange(name)}
                value={valores[name]}
                required={false}
              />
            ))}
          </div>
          {error && <p className="texto-tema" role="alert">{error}</p>}
          <div className="formulario-direccion__acciones">
            <button type="submit" className="boton-primario" disabled={guardando || faltanObligatorios}>
              {direccion ? t('common.save') : t('miCuenta.direcciones.createButton')}
            </button>
            <button type="button" className="formulario-direccion__cancelar" onClick={onCancel} disabled={guardando}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioDireccion
