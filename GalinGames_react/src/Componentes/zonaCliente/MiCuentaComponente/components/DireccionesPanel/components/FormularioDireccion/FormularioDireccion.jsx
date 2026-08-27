import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import InputBox from '../../../../../../compGlobales/InputBoxComponente/InputBox'
import ComboboxSelect from '../../../../../../compGlobales/ComboboxSelectComponente/ComboboxSelect'
import { getNacionalidades } from '../../../../data/nacionalidades'
import { getProvincias } from '../../../../data/provincias'
import './FormularioDireccion.scss'

// País antes que Provincia y Ciudad (a propósito, no alfabético/libre): la cascada
// obliga a elegir país primero, provincia se habilita después (Provincia depende de
// qué país tiene seleccionado el ComboboxSelect) y ciudad la última (solo tiene
// sentido una vez hay provincia). Ver handlePaisChange/handleProvinciaChange más abajo.
const CAMPOS_DIRECCION = [
  { name: 'titulo', labelKey: 'miCuenta.direcciones.fieldTitulo' },
  { name: 'calle', labelKey: 'miCuenta.direcciones.fieldCalle' },
  { name: 'numero', labelKey: 'miCuenta.direcciones.fieldNumero' },
  { name: 'pisoPuerta', labelKey: 'miCuenta.direcciones.fieldPisoPuerta' },
  { name: 'pais', labelKey: 'miCuenta.direcciones.fieldPais' },
  { name: 'provincia', labelKey: 'miCuenta.direcciones.fieldProvincia' },
  { name: 'ciudad', labelKey: 'miCuenta.direcciones.fieldCiudad' },
  { name: 'codigoPostal', labelKey: 'miCuenta.direcciones.fieldCodigoPostal' },
]
const CAMPOS_OBLIGATORIOS = CAMPOS_DIRECCION.filter(({ name }) => name !== 'pisoPuerta').map(({ name }) => name)

// Mismo componente para crear y editar (Requisito 14.3, design.md): reenvía siempre
// el objeto completo, nunca un PATCH parcial.
function FormularioDireccion({ tipo, direccion, onCancel, onSave, error }) {
  const { t, i18n } = useTranslation()
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

  const nacionalidades = useMemo(() => getNacionalidades(i18n.language), [i18n.language])

  // Países vía i18n-iso-countries (mismo origen que Nacionalidad en PerfilPanel.jsx),
  // pero aquí el valor que se guarda es el nombre (Address.pais es texto libre
  // mostrado tal cual en TarjetaDireccion, no hay ningún sitio que necesite el código
  // ISO) — code = nombre para que ComboboxSelect ya devuelva directamente ese texto.
  const paises = useMemo(() => nacionalidades.map(({ nombre }) => ({ code: nombre, nombre })), [nacionalidades])

  // Provincia depende del país elegido: hace falta su código ISO alpha-2 para
  // consultar country-region-data (que no indexa por nombre) — se recupera buscando
  // en `nacionalidades` el nombre ya guardado en valores.pais.
  const paisCodigoIso = useMemo(
    () => nacionalidades.find((p) => p.nombre === valores.pais)?.code || null,
    [nacionalidades, valores.pais],
  )

  const provincias = useMemo(() => getProvincias(paisCodigoIso), [paisCodigoIso])

  const paisElegido = Boolean(valores.pais)
  const provinciaElegida = Boolean(valores.provincia)
  // Edge case real (1 de 250 países, ver provincias.js): si country-region-data no
  // tiene regiones para el país elegido, Provincia cae a texto libre en vez de dejar
  // un select vacío sin nada que elegir.
  const provinciaSinDatos = paisElegido && provincias.length === 0

  const handleChange = (campo) => (e) => {
    setValores((prev) => ({ ...prev, [campo]: e.target.value }))
  }

  // Cambiar de país invalida la provincia/ciudad ya elegidas (son de otro país) — se
  // resetean para no dejar una combinación inconsistente guardable.
  const handlePaisChange = (nombrePais) => {
    setValores((prev) => ({ ...prev, pais: nombrePais, provincia: '', ciudad: '' }))
  }

  // Igual que con país: cambiar de provincia invalida la ciudad ya elegida.
  const handleProvinciaChange = (nombreProvincia) => {
    setValores((prev) => ({ ...prev, provincia: nombreProvincia, ciudad: '' }))
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
    <div className="formulario-direccion__overlay" onClick={onCancel}>
      <div className="formulario-direccion__caja tarjeta-tema" role="dialog" aria-label={tituloFormulario} onClick={(e) => e.stopPropagation()}>
        <h3 className="titulo-tema formulario-direccion__titulo">{tituloFormulario}</h3>
        <form onSubmit={handleSubmit} noValidate>
          <div className="formulario-direccion__grid">
            {CAMPOS_DIRECCION.map(({ name, labelKey }) => {
              if (name === 'pais') {
                return (
                  <div className="mb-2" key={name}>
                    <label htmlFor={name} className="form-label texto-tema texto-tema--tenue">{t(labelKey)}</label>
                    <ComboboxSelect
                      id={name}
                      value={valores.pais}
                      onChange={handlePaisChange}
                      options={paises}
                      disabled={false}
                      placeholder={t('miCuenta.direcciones.fieldPaisPlaceholder')}
                    />
                  </div>
                )
              }

              if (name === 'provincia') {
                if (provinciaSinDatos) {
                  return (
                    <InputBox
                      key={name}
                      nameInput={name}
                      labelInput={t(labelKey)}
                      typeInput="text"
                      placeholderInput={t(labelKey)}
                      eventoOnChange={handleChange(name)}
                      value={valores.provincia}
                      required={false}
                    />
                  )
                }
                return (
                  <div className="mb-2" key={name}>
                    <label htmlFor={name} className="form-label texto-tema texto-tema--tenue">{t(labelKey)}</label>
                    <ComboboxSelect
                      id={name}
                      value={valores.provincia}
                      onChange={handleProvinciaChange}
                      options={provincias}
                      disabled={!paisElegido}
                      placeholder={t('miCuenta.direcciones.fieldProvinciaPlaceholder')}
                    />
                  </div>
                )
              }

              return (
                <InputBox
                  key={name}
                  nameInput={name}
                  labelInput={t(labelKey)}
                  typeInput="text"
                  placeholderInput={t(labelKey)}
                  eventoOnChange={handleChange(name)}
                  value={valores[name]}
                  disabled={name === 'ciudad' ? !provinciaElegida : false}
                  required={false}
                />
              )
            })}
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
