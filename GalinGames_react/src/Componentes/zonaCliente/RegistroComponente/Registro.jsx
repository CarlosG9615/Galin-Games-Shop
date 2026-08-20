import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import InputBox from '/src/Componentes/compGlobales/InputBoxComponente/InputBox'
import { authService } from '../../../servicios/authService'
import './Registro.css'

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
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false)
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

    if (!aceptaTerminos || !aceptaPrivacidad) {
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
      setSuccessMessage(`¡Bienvenido, ${campos.username}! Tu cuenta se ha creado correctamente.`)
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

  if (successMessage) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
        <div className="fondo-gaming" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }} />
        <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <div className="contenido-registro marginForm rounded">
            <p className="videojuego-text" role="status">{successMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
      <div className="fondo-gaming" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }} />
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
        <div className="contenido-registro form-box">
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-3 color-fondo marginForm rounded">
              <h1 className="videojuego-title">Datos de la cuenta</h1>
              {CAMPOS_FORM.map(({ name, label, type }) => (
                <div key={name}>
                  <InputBox
                    nameInput={name}
                    labelInput={label}
                    typeInput={type}
                    placeholderInput={`Introduce tu ${label.toLowerCase()}...`}
                    eventoOnChange={handleFieldChange(name)}
                  />
                  {fieldErrors[name] && <p className="videojuego-text" role="alert">{fieldErrors[name]}</p>}
                </div>
              ))}
              <div className="d-flex align-items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="comprobarTerminos"
                  checked={aceptaTerminos}
                  onChange={e => setAceptaTerminos(e.target.checked)}
                />
                <label className="form-check-label videojuego-conditions" htmlFor="comprobarTerminos">Acepto los términos y condiciones</label>
              </div>
              <div className="d-flex align-items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="comprobarPolitica"
                  checked={aceptaPrivacidad}
                  onChange={e => setAceptaPrivacidad(e.target.checked)}
                />
                <label className="m-2 form-check-label videojuego-conditions" htmlFor="comprobarPolitica">
                  He leído y acepto la{' '}
                  <a href="#" className="text-primary text-decoration-underline">Política de privacidad</a>
                </label>
              </div>

              {error && <p className="videojuego-text" role="alert">{error}</p>}
              {retryCountdown > 0 && (
                <p className="videojuego-text" role="alert">Vuelve a intentarlo en {retryCountdown} segundos.</p>
              )}

              <div className="mt-3 w-100 d-flex justify-content-end">
                <button type="submit" className="btn btn-primary botonRegistro" disabled={loading || retryCountdown > 0}>
                  {loading ? 'Enviando...' : 'Registrarse'}
                </button>
              </div>
              <div>
                <Link to="/login" className="videojuego-conditions text-decoration-underline">¿Ya tienes cuenta? Inicia sesión</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Registro
