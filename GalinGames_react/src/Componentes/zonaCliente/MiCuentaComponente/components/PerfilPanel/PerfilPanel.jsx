import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import InputBox from '../../../../compGlobales/InputBoxComponente/InputBox'
import { IconoLapiz, IconoCamara, IconoPapelera } from '../../icons/MiCuentaIconos'
import { accountService } from '../../../../../servicios/accountService'
import { getNacionalidades } from '../../data/nacionalidades'
import ComboboxSelect from '../../../../compGlobales/ComboboxSelectComponente/ComboboxSelect'
import './PerfilPanel.scss'

const CAMPOS = [
  { name: 'nombre', labelKey: 'miCuenta.perfil.fieldNombre' },
  { name: 'apellidos', labelKey: 'miCuenta.perfil.fieldApellidos' },
  { name: 'username', labelKey: 'miCuenta.perfil.fieldUsername' },
  { name: 'telefono', labelKey: 'miCuenta.perfil.fieldTelefono' },
  { name: 'nacionalidad', labelKey: 'miCuenta.perfil.fieldNacionalidad' },
]

const USERNAME_CHECK_DEBOUNCE_MS = 400
const AVATAR_TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_TAMANO_MAX_BYTES = 5 * 1024 * 1024

function PerfilPanel() {
  const { t, i18n } = useTranslation()
  const nacionalidades = useMemo(() => getNacionalidades(i18n.language), [i18n.language])
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editando, setEditando] = useState(false)
  const [valores, setValores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [usernameEstado, setUsernameEstado] = useState(null)
  const [avatarSubiendo, setAvatarSubiendo] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarBorrando, setAvatarBorrando] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    let activo = true

    async function cargar() {
      setLoading(true)
      setLoadError('')
      const result = await accountService.getMe()
      if (!activo) return

      if (result.ok) {
        setDatos(result.data)
        setValores(result.data)
      } else {
        setLoadError(t('miCuenta.loadError'))
      }
      setLoading(false)
    }

    cargar()
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo se carga una vez al montar
  }, [])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const handleEditar = () => {
    setEditando(true)
    setSaveError('')
    setSaveSuccess('')
  }

  const handleCancelar = () => {
    setEditando(false)
    setValores(datos)
    setUsernameEstado(null)
    setSaveError('')
  }

  const comprobarUsername = useCallback(
    (valor) => {
      const result = accountService.checkUsername(valor)
      return result
    },
    [],
  )

  const handleChange = (campo) => (e) => {
    const valor = e.target.value
    setValores((prev) => ({ ...prev, [campo]: valor }))

    if (campo !== 'username') return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Requisito 5.4: coincide con el username actual -> "sin cambios", sin consulta.
    if (valor.trim() === datos.username) {
      setUsernameEstado(null)
      return
    }

    setUsernameEstado('checking')
    debounceRef.current = setTimeout(async () => {
      const result = await comprobarUsername(valor.trim())
      if (result.ok) {
        setUsernameEstado(result.data.available ? 'available' : 'taken')
      } else {
        setUsernameEstado(null)
      }
    }, USERNAME_CHECK_DEBOUNCE_MS)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (usernameEstado === 'taken') return

    setGuardando(true)
    setSaveError('')

    const cambios = {}
    for (const { name } of CAMPOS) {
      // Requisito 4.3 (revisado): también se envían campos que antes no tenían
      // valor (p. ej. teléfono/nacionalidad insertados por primera vez).
      if (valores[name] !== datos[name]) {
        cambios[name] = valores[name]
      }
    }

    const result = await accountService.updateMe(cambios)
    setGuardando(false)

    if (result.ok) {
      setDatos(result.data)
      setValores(result.data)
      setEditando(false)
      setUsernameEstado(null)
      setSaveSuccess(t('miCuenta.perfil.updateSuccess'))
    } else if (result.status === 409) {
      setUsernameEstado('taken')
    } else {
      setSaveError(t('miCuenta.perfil.updateError'))
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!AVATAR_TIPOS_VALIDOS.includes(file.type)) {
      setAvatarError(t('miCuenta.perfil.avatarInvalidType'))
      return
    }
    if (file.size > AVATAR_TAMANO_MAX_BYTES) {
      setAvatarError(t('miCuenta.perfil.avatarTooLarge'))
      return
    }

    setAvatarError('')
    setAvatarSubiendo(true)
    const result = await accountService.uploadAvatar(file)
    setAvatarSubiendo(false)

    if (result.ok) {
      setDatos((prev) => ({ ...prev, avatarUrl: result.data.avatarUrl }))
      setValores((prev) => ({ ...prev, avatarUrl: result.data.avatarUrl }))
    } else {
      setAvatarError(t('miCuenta.perfil.avatarUploadError'))
    }
  }

  const handleAvatarBorrar = async () => {
    if (!window.confirm(t('miCuenta.perfil.avatarDeleteConfirm'))) return

    setAvatarError('')
    setAvatarBorrando(true)
    const result = await accountService.deleteAvatar()
    setAvatarBorrando(false)

    if (result.ok) {
      setDatos((prev) => ({ ...prev, avatarUrl: null }))
      setValores((prev) => ({ ...prev, avatarUrl: null }))
    } else {
      setAvatarError(t('miCuenta.perfil.avatarDeleteError'))
    }
  }

  if (loading) {
    return <p className="texto-tema" role="status">{t('common.loading')}</p>
  }

  if (loadError) {
    return <p className="texto-tema" role="alert">{loadError}</p>
  }

  return (
    <div className="perfil-panel">
      <div className="perfil-panel__avatar-zona">
        <div className="perfil-panel__avatar">
          {datos.avatarUrl ? (
            <img src={datos.avatarUrl} alt="" className="perfil-panel__avatar-img" />
          ) : (
            <div className="perfil-panel__avatar-vacio" aria-hidden="true" />
          )}
          <label className="perfil-panel__avatar-boton" aria-label={t('miCuenta.perfil.avatarChangeAria')}>
            <IconoCamara />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={avatarSubiendo}
              className="perfil-panel__avatar-input"
            />
          </label>
          {datos.avatarUrl && (
            <button
              type="button"
              className="perfil-panel__avatar-borrar"
              aria-label={t('miCuenta.perfil.avatarDeleteAria')}
              onClick={handleAvatarBorrar}
              disabled={avatarBorrando}
            >
              <IconoPapelera />
            </button>
          )}
        </div>
        {avatarError && <p className="texto-tema" role="alert">{avatarError}</p>}
      </div>

      <div className="perfil-panel__separador" aria-hidden="true" />

      <form onSubmit={handleGuardar} className="perfil-panel__form" noValidate>
        <div className="perfil-panel__grid">
          {CAMPOS.map(({ name, labelKey }) => {
            // Requisito 4.2/4.3 (revisado): en modo edición, todos los campos son
            // editables, incluidos los que no tenían valor previo.
            const puedeEditar = editando
            return (
              <div className="perfil-panel__campo" key={name}>
                {name === 'nacionalidad' ? (
                  <div className="mb-2">
                    <label htmlFor={name} className="form-label texto-tema texto-tema--tenue">
                      {t(labelKey)}
                    </label>
                    <ComboboxSelect
                      id={name}
                      value={valores.nacionalidad || ''}
                      onChange={(code) => handleChange(name)({ target: { value: code } })}
                      options={nacionalidades}
                      disabled={!puedeEditar}
                      placeholder={t('miCuenta.perfil.fieldNacionalidadPlaceholder')}
                    />
                  </div>
                ) : (
                  <InputBox
                    nameInput={name}
                    labelInput={t(labelKey)}
                    typeInput="text"
                    placeholderInput={t(labelKey)}
                    eventoOnChange={handleChange(name)}
                    value={valores[name] || ''}
                    disabled={!puedeEditar}
                    required={false}
                  />
                )}
                {name === 'username' && usernameEstado === 'checking' && (
                  <p className="perfil-panel__username-estado texto-tema">{t('miCuenta.perfil.usernameChecking')}</p>
                )}
                {name === 'username' && usernameEstado === 'available' && (
                  <p className="perfil-panel__username-estado texto-tema texto-tema--exito">{t('miCuenta.perfil.usernameAvailable')}</p>
                )}
                {name === 'username' && usernameEstado === 'taken' && (
                  <p className="perfil-panel__username-estado perfil-panel__username-estado--error" role="alert">{t('miCuenta.perfil.usernameTaken')}</p>
                )}
              </div>
            )
          })}
        </div>

        {!editando ? (
          <button type="button" className="perfil-panel__editar" onClick={handleEditar}>
            <IconoLapiz />
            {t('miCuenta.perfil.editButton')}
          </button>
        ) : (
          <div className="perfil-panel__acciones">
            <button type="submit" className="boton-primario" disabled={guardando || usernameEstado === 'taken'}>
              {t('common.save')}
            </button>
            <button type="button" className="perfil-panel__cancelar" onClick={handleCancelar} disabled={guardando}>
              {t('common.cancel')}
            </button>
          </div>
        )}

        {saveError && <p className="texto-tema" role="alert">{saveError}</p>}
        {saveSuccess && <p className="texto-tema texto-tema--exito" role="status">{saveSuccess}</p>}
      </form>
    </div>
  )
}

export default PerfilPanel
