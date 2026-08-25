import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../NavbarComponente/Navbar'
import './ErrorPage.scss'

const CODIGOS_SOPORTADOS = [400, 401, 403, 404, 410, 429, 500, 503]

function getErrorConfig(code, t) {
  if (CODIGOS_SOPORTADOS.includes(code)) {
    return {
      title: t(`errorPage.codes.${code}.title`),
      message: t(`errorPage.codes.${code}.message`),
    }
  }
  return { title: t('errorPage.defaultTitle'), message: t('errorPage.defaultMessage') }
}

function ErrorPage({ code: codeProp, retryAfter }) {
  const { t } = useTranslation()
  const { code: codeParam } = useParams()
  const navigate = useNavigate()

  const code = Number(codeProp ?? codeParam)
  const config = getErrorConfig(code, t)

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
            <span className="error-page-codigo titulo-tema">{code || t('errorPage.unknownCode')}</span>
            <h1 className="titulo-tema">{config.title}</h1>
            {code === 429 && retryAfter ? (
              <p className="texto-tema">{t('errorPage.retryCountdown', { seconds: countdown })}</p>
            ) : (
              <p className="texto-tema">{config.message}</p>
            )}
            <button type="button" className="boton-primario" onClick={handleVolver}>
              {t('errorPage.backToLogin')}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}

export default ErrorPage
