import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import InputBox from '../../compGlobales/InputBoxComponente/InputBox'
import './ModalConfirmarPassword.scss'

// Modal reutilizado por "Modificar email" y "Eliminar cuenta" (Requisitos 7.2, 11.2):
// el padre decide qué hacer con la contraseña (onSubmit) y le pasa de vuelta el
// resultado (error / blockedUntil) — este componente no conoce la acción en curso.
function ModalConfirmarPassword({ visible, title, onClose, onSubmit, submitting, error, blockedUntil }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!visible) setPassword('')
  }, [visible])

  if (!visible) return null

  const bloqueado = Boolean(blockedUntil)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (bloqueado || !password) return
    onSubmit(password)
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- overlay decorativo, el cierre real es el botón "X"
    <div className="modal-password__overlay" onClick={onClose}>
      <div
        className="modal-password__caja tarjeta-tema"
        role="dialog"
        aria-modal="true"
        aria-label={title || t('miCuenta.modal.confirmPasswordTitle')}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-password__cerrar" onClick={onClose} aria-label={t('miCuenta.modal.closeAria')}>
          ×
        </button>
        <h2 className="titulo-tema modal-password__titulo">{title || t('miCuenta.modal.confirmPasswordTitle')}</h2>
        <form onSubmit={handleSubmit}>
          <InputBox
            nameInput="modalPassword"
            labelInput={t('miCuenta.modal.passwordLabel')}
            typeInput="password"
            placeholderInput={t('miCuenta.modal.passwordLabel')}
            eventoOnChange={(e) => setPassword(e.target.value)}
            value={password}
            disabled={bloqueado}
            required={false}
          />
          {bloqueado ? (
            <p className="texto-tema" role="alert">{t('miCuenta.modal.blockedMessage')}</p>
          ) : (
            error && <p className="texto-tema" role="alert">{error}</p>
          )}
          <button type="submit" className="boton-primario" disabled={submitting || bloqueado || !password}>
            {t('miCuenta.modal.submitButton')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ModalConfirmarPassword
