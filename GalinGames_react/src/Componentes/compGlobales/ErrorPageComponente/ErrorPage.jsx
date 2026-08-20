import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './ErrorPage.css'

const ERROR_CONFIG = {
  400: { title: 'Petición incorrecta', message: 'Los datos enviados no son válidos. Revisa el formulario.' },
  401: { title: 'No autorizado', message: 'Debes iniciar sesión para acceder a este contenido.' },
  403: { title: 'Acceso denegado', message: 'No tienes permiso para ver esta página.' },
  404: { title: 'Página no encontrada', message: 'La página que buscas no existe o ha sido movida.' },
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
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
      <div className="fondo-gaming" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }} />
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
        <div className="error-page-contenido">
          <span className="error-page-codigo videojuego-title">{code || '???'}</span>
          <h1 className="videojuego-title">{config.title}</h1>
          {code === 429 && retryAfter ? (
            <p className="videojuego-text">Podrás volver a intentarlo en {countdown} segundos.</p>
          ) : (
            <p className="videojuego-text">{config.message}</p>
          )}
          <button type="button" className="btn btn-primary botonRegistro" onClick={handleVolver}>
            Volver al login
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
