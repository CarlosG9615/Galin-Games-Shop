import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import InputBox from '../../compGlobales/InputBoxComponente/InputBox'
import ErrorPage from '../../compGlobales/ErrorPageComponente/ErrorPage'
import ThemeToggle from '../../compGlobales/NavbarComponente/ThemeToggle'
import BotonesSocial from '../../compGlobales/SocialLoginComponente/BotonesSocial'
import { authService } from '../../../servicios/authService'
import { useAuth } from '../../../hooks/useAuth'
import './Login.scss'

const USERNAME_MAX_LENGTH = 50
const PASSWORD_MAX_LENGTH = 128
const EMAIL_VERIFICADO_DURACION_MS = 60000

function Login() {
  const [campos, setCampos] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [unexpectedStatus, setUnexpectedStatus] = useState(null)

  const navigate = useNavigate()
  const authContext = useAuth()
  const [searchParams] = useSearchParams()
  const [emailVerificado, setEmailVerificado] = useState(() => searchParams.get('verificado') === 'true')

  useEffect(() => {
    if (retryCountdown <= 0) return undefined
    const intervalId = setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [retryCountdown])

  useEffect(() => {
    if (!emailVerificado) return undefined
    const timeoutId = setTimeout(() => setEmailVerificado(false), EMAIL_VERIFICADO_DURACION_MS)
    return () => clearTimeout(timeoutId)
  }, [emailVerificado])

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
    <div className="pagina-dividida">
      <ThemeToggle />
      <div className="pagina-dividida__formulario">
        <form onSubmit={handleSubmit} autoComplete="off">
          <h1 className="titulo-tema">Iniciar sesión</h1>

          <BotonesSocial />

          {emailVerificado && (
            <p className="texto-tema texto-tema--exito" role="status">¡Email verificado correctamente! Ya puedes iniciar sesión.</p>
          )}

          <InputBox
            nameInput="username"
            labelInput="Nombre de usuario"
            typeInput="text"
            placeholderInput="Nombre de usuario"
            eventoOnChange={handleUsernameChange}
            ocultarLabel
          />
          <InputBox
            nameInput="password"
            labelInput="Contraseña"
            typeInput="password"
            placeholderInput="Contraseña"
            eventoOnChange={handlePasswordChange}
            ocultarLabel
          />

          {error && <p className="texto-tema" role="alert">{error}</p>}
          {retryCountdown > 0 && (
            <p className="texto-tema" role="alert">Vuelve a intentarlo en {retryCountdown} segundos.</p>
          )}

          <div className="mt-2 w-100 d-flex justify-content-center">
            <button
              type="submit"
              className="boton-primario"
              disabled={loading || retryCountdown > 0}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
          <div className="pagina-dividida__enlaces-fila">
            <Link to="/registro" className="texto-tema texto-tema--condiciones pagina-dividida__enlace-secundario">¿Aún no tienes cuenta?</Link>
            <Link to="#" className="texto-tema texto-tema--condiciones pagina-dividida__enlace-secundario" aria-disabled="true">¿Has olvidado tu contraseña?</Link>
          </div>
          <Link to="/" className="pagina-dividida__volver">‹ Volver al inicio</Link>
        </form>
      </div>
      <div className="pagina-dividida__imagen">
        <button type="button" className="pagina-dividida__cerrar" onClick={() => navigate('/')} aria-label="Volver al inicio">
          ×
        </button>
      </div>
    </div>
  )
}

export default Login
