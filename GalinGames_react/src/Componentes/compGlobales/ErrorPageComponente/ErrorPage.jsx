import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../NavbarComponente/Navbar'
import './ErrorPage.scss'

const ERROR_CONFIG = {
  400: { title: 'Petición incorrecta', message: 'Los datos enviados no son válidos. Revisa el formulario.' },
  401: { title: 'No autorizado', message: 'Debes iniciar sesión para acceder a este contenido.' },
  403: { title: 'Acceso denegado', message: 'No tienes permiso para ver esta página.' },
  404: { title: 'Página no encontrada', message: 'La página que buscas no existe o ha sido movida.' },
  410: { title: 'Enlace caducado', message: 'Este enlace de verificación no es válido o ha caducado. Regístrate de nuevo si no llegaste a confirmarlo a tiempo.' },
  429: { title: 'Demasiadas peticiones', message: 'Has superado el límite de intentos. Espera un momento.' },
  500: { title: 'Error del servidor', message: 'Algo ha salido mal en nuestro servidor. Inténtalo más tarde.' },
  503: { title: 'Servicio no disponible', message: 'El servicio está temporalmente fuera de línea. Vuelve pronto.' },
}

function ErrorPage({ code: codeProp, retryAfter }) {
  const { code: codeParam } = useParams()
  const navigate = useNavigate()

  const code = Number(codeProp ?? codeParam)
  const config = ERROR_CONFIG[code] ?? { title: 'Error', message: 'Ha ocurrido un error inesperado.' }

  const [countdown, setCountdown] = useState(retryAfter ?? 0)

  useEffect(() => {
    if (code !== 429 || !retryAfter) return undefined

    setCountdown(retryAfter)
    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [code, retryAfter])

  const handleVolver = () => {
    navigate('/login')
  }

  return (
    <>
      <Navbar />
      <main className="pagina-tematica">
        <div className="pagina-tematica__contenido">
          <div className="tarjeta-tema tarjeta-tema--error">
            <span className="error-page-codigo titulo-tema">{code || '???'}</span>
            <h1 className="titulo-tema">{config.title}</h1>
            {code === 429 && retryAfter ? (
              <p className="texto-tema">Podrás volver a intentarlo en {countdown} segundos.</p>
            ) : (
              <p className="texto-tema">{config.message}</p>
            )}
            <button type="button" className="boton-primario" onClick={handleVolver}>
              Volver al login
            </button>
          </div>
        </div>
      </main>
    </>
  )
}

export default ErrorPage
