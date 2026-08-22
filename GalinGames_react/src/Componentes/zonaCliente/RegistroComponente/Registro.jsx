import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import InputBox from '/src/Componentes/compGlobales/InputBoxComponente/InputBox'
import ThemeToggle from '../../compGlobales/NavbarComponente/ThemeToggle'
import { authService } from '../../../servicios/authService'
import './Registro.scss'

const CAMPOS_FORM = [
  { name: 'username', label: 'Nombre de usuario', type: 'text' },
  { name: 'nombre', label: 'Nombre', type: 'text' },
  { name: 'apellidos', label: 'Apellidos', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'password', label: 'Contraseña', type: 'password' },
  { name: 'repetirPassword', label: 'Repetir Contraseña', type: 'password' },
]

const CAMPOS_INICIALES = { username: '', nombre: '', apellidos: '', email: '', password: '', repetirPassword: '' }

function Registro() {
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
      alert('Debes aceptar los términos y la política de privacidad.')
      return
    }

    setError('')
    setFieldErrors({})

    const algunCampoVacio = CAMPOS_FORM.some(({ name }) => !campos[name].trim())
    if (algunCampoVacio) {
      setError('Rellena todos los campos.')
      return
    }

    if (campos.password !== campos.repetirPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const result = await authService.register(campos)

    if (result.ok) {
      setSuccessMessage(`¡Ya casi está, ${campos.username}! Te hemos enviado un correo de verificación a ${campos.email}. Confirma tu cuenta para poder iniciar sesión.`)
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    setLoading(false)

    if (result.status === 409) {
      setError(result.message || 'El nombre de usuario o el email ya está en uso.')
      return
    }

    if (result.status === 400) {
      const errores = {}
      for (const err of result.errors || []) {
        errores[err.field] = err.message || 'Campo inválido'
      }
      setFieldErrors(errores)
      setError('Revisa los campos marcados.')
      return
    }

    if (result.status === 429) {
      const retryAfter = Number(result.retryAfter) || 0
      setRetryCountdown(retryAfter)
      setError('Demasiadas peticiones. Inténtalo de nuevo en unos segundos.')
      return
    }

    if (result.status === 0) {
      setError(result.message || 'La petición tardó demasiado. Inténtalo de nuevo.')
      return
    }

    setError('Ha ocurrido un problema inesperado. Inténtalo de nuevo más tarde.')
  }

  return (
    <div className="pagina-dividida">
      <ThemeToggle />
      <div className="pagina-dividida__formulario">
        {successMessage ? (
          <p className="texto-tema" role="status">{successMessage}</p>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off">
            <h1 className="titulo-tema">Datos de la cuenta</h1>

            {CAMPOS_FORM.map(({ name, label, type }) => (
              <div key={name}>
                <InputBox
                  nameInput={name}
                  labelInput={label}
                  typeInput={type}
                  placeholderInput={label}
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
                Acepto los términos y condiciones y la{' '}
                <a href="#" className="text-primary text-decoration-underline">política de privacidad</a>
              </label>
            </div>

            {error && <p className="texto-tema" role="alert">{error}</p>}
            {retryCountdown > 0 && (
              <p className="texto-tema" role="alert">Vuelve a intentarlo en {retryCountdown} segundos.</p>
            )}

            <div className="mt-2 w-100 d-flex justify-content-center">
              <button type="submit" className="boton-primario" disabled={loading || retryCountdown > 0}>
                {loading ? 'Enviando...' : 'Registrarse'}
              </button>
            </div>
            <div>
              <Link to="/login" className="texto-tema texto-tema--condiciones pagina-dividida__enlace-secundario">¿Ya tienes cuenta? Inicia sesión</Link>
            </div>
            <Link to="/" className="pagina-dividida__volver">‹ Volver al inicio</Link>
          </form>
        )}
      </div>
      <div className="pagina-dividida__imagen">
        <button type="button" className="pagina-dividida__cerrar" onClick={() => navigate('/')} aria-label="Volver al inicio">
          ×
        </button>
      </div>
    </div>
  )
}

export default Registro
