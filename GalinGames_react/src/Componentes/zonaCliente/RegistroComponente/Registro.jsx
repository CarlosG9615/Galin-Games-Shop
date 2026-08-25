import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import InputBox from '/src/Componentes/compGlobales/InputBoxComponente/InputBox'
import ThemeToggle from '../../compGlobales/NavbarComponente/ThemeToggle'
import { authService } from '../../../servicios/authService'
import './Registro.scss'

const CAMPOS_FORM = [
  { name: 'username', label: 'registro.fieldUsername', type: 'text' },
  { name: 'nombre', label: 'registro.fieldNombre', type: 'text' },
  { name: 'apellidos', label: 'registro.fieldApellidos', type: 'text' },
  { name: 'email', label: 'registro.fieldEmail', type: 'email' },
  { name: 'password', label: 'registro.fieldPassword', type: 'password' },
  { name: 'repetirPassword', label: 'registro.fieldRepetirPassword', type: 'password' },
]

const CAMPOS_INICIALES = { username: '', nombre: '', apellidos: '', email: '', password: '', repetirPassword: '' }

function Registro() {
  const { t } = useTranslation()
  const [campos, setCampos] = useState(CAMPOS_INICIALES)
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    if (retryCountdown <= 0) return undefined
    const intervalId = setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [retryCountdown])

  const handleFieldChange = (field) => (e) => {
    setCampos((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!aceptaCondiciones) {
      alert(t('registro.termsAlert'))
      return
    }

    setError('')
    setFieldErrors({})

    const algunCampoVacio = CAMPOS_FORM.some(({ name }) => !campos[name].trim())
    if (algunCampoVacio) {
      setError(t('registro.validationRequired'))
      return
    }

    if (campos.password !== campos.repetirPassword) {
      setError(t('registro.passwordMismatch'))
      return
    }

    setLoading(true)

    const result = await authService.register(campos)

    if (result.ok) {
      setSuccessMessage(t('registro.successMessage', { username: campos.username, email: campos.email }))
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    setLoading(false)

    if (result.status === 409) {
      setError(result.message || t('registro.usernameOrEmailInUse'))
      return
    }

    if (result.status === 400) {
      const errores = {}
      for (const err of result.errors || []) {
        errores[err.field] = err.message || t('registro.invalidField')
      }
      setFieldErrors(errores)
      setError(t('registro.reviewFields'))
      return
    }

    if (result.status === 429) {
      const retryAfter = Number(result.retryAfter) || 0
      setRetryCountdown(retryAfter)
      setError(t('registro.tooManyRequests'))
      return
    }

    if (result.status === 0) {
      setError(result.message || t('common.timeoutError'))
      return
    }

    setError(t('registro.unexpectedError'))
  }

  return (
    <div className="pagina-dividida">
      <ThemeToggle />
      <div className="pagina-dividida__formulario">
        {successMessage ? (
          <p className="texto-tema" role="status">{successMessage}</p>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off">
            <h1 className="titulo-tema">{t('registro.title')}</h1>

            {CAMPOS_FORM.map(({ name, label, type }) => (
              <div key={name}>
                <InputBox
                  nameInput={name}
                  labelInput={t(label)}
                  typeInput={type}
                  placeholderInput={t(label)}
                  eventoOnChange={handleFieldChange(name)}
                  ocultarLabel
                />
                {fieldErrors[name] && <p className="texto-tema" role="alert">{fieldErrors[name]}</p>}
              </div>
            ))}
            <div className="d-flex align-items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="comprobarCondiciones"
                checked={aceptaCondiciones}
                onChange={e => setAceptaCondiciones(e.target.checked)}
              />
              <label className="form-check-label texto-tema texto-tema--condiciones" htmlFor="comprobarCondiciones">
                <Trans i18nKey="registro.acceptTerms">
                  Acepto los términos y condiciones y la <a href="#" className="text-primary text-decoration-underline">política de privacidad</a>
                </Trans>
              </label>
            </div>

            {error && <p className="texto-tema" role="alert">{error}</p>}
            {retryCountdown > 0 && (
              <p className="texto-tema" role="alert">{t('common.retryIn', { seconds: retryCountdown })}</p>
            )}

            <div className="mt-2 w-100 d-flex justify-content-center">
              <button type="submit" className="boton-primario" disabled={loading || retryCountdown > 0}>
                {loading ? t('registro.submitLoading') : t('registro.submit')}
              </button>
            </div>
            <div>
              <Link to="/login" className="texto-tema texto-tema--condiciones pagina-dividida__enlace-secundario">{t('registro.alreadyHaveAccount')}</Link>
            </div>
            <Link to="/" className="pagina-dividida__volver">{t('common.backToHome')}</Link>
          </form>
        )}
      </div>
      <div className="pagina-dividida__imagen">
        <button type="button" className="pagina-dividida__cerrar" onClick={() => navigate('/')} aria-label={t('common.backToHomeAria')}>
          ×
        </button>
      </div>
    </div>
  )
}

export default Registro
