import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import InputBox from '../../compGlobales/InputBoxComponente/InputBox'
import ErrorPage from '../../compGlobales/ErrorPageComponente/ErrorPage'
import { authService } from '../../../servicios/authService'
import { useAuth } from '../../../hooks/useAuth'
import './Login.css'

const USERNAME_MAX_LENGTH = 50
const PASSWORD_MAX_LENGTH = 128

function Login() {
  const [campos, setCampos] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [unexpectedStatus, setUnexpectedStatus] = useState(null)

  const navigate = useNavigate()
  const authContext = useAuth()
  const [searchParams] = useSearchParams()
  const emailVerificado = searchParams.get('verificado') === 'true'

  useEffect(() => {
    if (retryCountdown <= 0) return undefined
    const intervalId = setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [retryCountdown])

  const handleUsernameChange = (e) => {
    setCampos((prev) => ({ ...prev, username: e.target.value.slice(0, USERNAME_MAX_LENGTH) }))
  }

  const handlePasswordChange = (e) => {
    setCampos((prev) => ({ ...prev, password: e.target.value.slice(0, PASSWORD_MAX_LENGTH) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!campos.username.trim() || !campos.password.trim()) {
      setError('Rellena tu nombre de usuario y contraseña.')
      return
    }

    setLoading(true)

    const result = await authService.login(campos.username, campos.password)

    if (result.ok) {
      authContext.login(result.data.userId, result.data.username)
      navigate('/')
      return
    }

    setLoading(false)

    if (result.status === 401) {
      setError('Credenciales incorrectas.')
      return
    }

    if (result.status === 429) {
      const retryAfter = Number(result.retryAfter) || 0
      setRetryCountdown(retryAfter)
      setError('Demasiados intentos. Inténtalo de nuevo en unos segundos.')
      return
    }

    if (result.status === 0) {
      setError(result.message || 'La petición tardó demasiado. Inténtalo de nuevo.')
      return
    }

    setUnexpectedStatus(result.status)
  }

  if (unexpectedStatus) {
    return <ErrorPage code={unexpectedStatus} />
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
      <div className="fondo-gaming" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }} />
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
        <div className="contenido-registro form-box">
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-3 color-fondo marginForm rounded">
              <h1 className="videojuego-title">Iniciar sesión</h1>

              {emailVerificado && (
                <p className="videojuego-text" role="status">¡Email verificado correctamente! Ya puedes iniciar sesión.</p>
              )}

              <InputBox
                nameInput="username"
                labelInput="Nombre de usuario"
                typeInput="text"
                placeholderInput="Introduce tu nombre de usuario..."
                eventoOnChange={handleUsernameChange}
              />
              <InputBox
                nameInput="password"
                labelInput="Contraseña"
                typeInput="password"
                placeholderInput="Introduce tu contraseña..."
                eventoOnChange={handlePasswordChange}
              />

              {error && <p className="videojuego-text" role="alert">{error}</p>}
              {retryCountdown > 0 && (
                <p className="videojuego-text" role="alert">Vuelve a intentarlo en {retryCountdown} segundos.</p>
              )}

              <div className="mt-3 w-100 d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-primary botonRegistro"
                  disabled={loading || retryCountdown > 0}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
              <div>
                <Link to="/registro" className="videojuego-conditions text-decoration-underline">¿No tienes cuenta? Regístrate</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
