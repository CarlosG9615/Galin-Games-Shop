import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import InputBox from '../../compGlobales/InputBoxComponente/InputBox'
import ModalConfirmarPassword from './ModalConfirmarPassword'
import { IconoLapiz } from './MiCuentaIconos'
import { accountService } from '../../../servicios/accountService'
import { useAuth } from '../../../hooks/useAuth'
import './EmailPasswordPanel.scss'

function EmailPasswordPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [email, setEmail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [modalEmailAbierto, setModalEmailAbierto] = useState(false)
  const [modalEmailError, setModalEmailError] = useState('')
  const [modalEmailBlockedUntil, setModalEmailBlockedUntil] = useState(null)
  const [modalEmailSubmitting, setModalEmailSubmitting] = useState(false)
  const [emailHabilitado, setEmailHabilitado] = useState(false)
  const [passwordVerificada, setPasswordVerificada] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [emailChangeError, setEmailChangeError] = useState('')
  const [emailChangeSuccess, setEmailChangeSuccess] = useState('')
  const [validando, setValidando] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatNewPassword, setRepeatNewPassword] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState('')
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('')
  const [cambiandoPassword, setCambiandoPassword] = useState(false)

  const [modalDeleteAbierto, setModalDeleteAbierto] = useState(false)
  const [modalDeleteError, setModalDeleteError] = useState('')
  const [modalDeleteBlockedUntil, setModalDeleteBlockedUntil] = useState(null)
  const [modalDeleteSubmitting, setModalDeleteSubmitting] = useState(false)

  useEffect(() => {
    let activo = true

    async function cargar() {
      setLoading(true)
      const result = await accountService.getMe()
      if (!activo) return

      if (result.ok) {
        setEmail(result.data.email)
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

  const abrirModalEmail = () => {
    setModalEmailError('')
    setModalEmailBlockedUntil(null)
    setModalEmailAbierto(true)
  }

  const handleVerifyPasswordEmail = async (password) => {
    setModalEmailSubmitting(true)
    setModalEmailError('')
    const result = await accountService.verifyPassword(password, 'emailChange')
    setModalEmailSubmitting(false)

    if (result.ok) {
      // La contraseña ya verificada se guarda en memoria (nunca en localStorage) para
      // reenviarla en requestEmailChange al pulsar "Validar" — el backend la vuelve a
      // comprobar por sí mismo (design.md → Design Decisions: defensa en profundidad).
      setPasswordVerificada(password)
      setEmailHabilitado(true)
      setModalEmailAbierto(false)
      setNuevoEmail('')
      setEmailChangeError('')
      setEmailChangeSuccess('')
    } else if (result.status === 423) {
      setModalEmailBlockedUntil(result.blockedUntil)
    } else {
      setModalEmailError(t('miCuenta.modal.wrongPassword'))
    }
  }

  const handleValidarEmail = async (e) => {
    e.preventDefault()
    setValidando(true)
    setEmailChangeError('')
    const result = await accountService.requestEmailChange(passwordVerificada, nuevoEmail.trim())
    setValidando(false)

    if (result.ok) {
      setEmailChangeSuccess(t('miCuenta.emailPassword.emailChangeSuccess'))
      setEmailHabilitado(false)
      setNuevoEmail('')
      setPasswordVerificada('')
    } else if (result.status === 409) {
      setEmailChangeError(t('miCuenta.emailPassword.emailChangeInUse'))
    } else if (result.status === 400) {
      setEmailChangeError(t('miCuenta.emailPassword.emailChangeSameAsCurrent'))
    } else {
      setEmailChangeError(t('miCuenta.emailPassword.emailChangeError'))
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordChangeError('')
    setPasswordChangeSuccess('')

    if (newPassword !== repeatNewPassword) {
      setPasswordChangeError(t('miCuenta.emailPassword.passwordMismatch'))
      return
    }

    setCambiandoPassword(true)
    const result = await accountService.changePassword(currentPassword, newPassword, repeatNewPassword)
    setCambiandoPassword(false)

    if (result.ok) {
      setPasswordChangeSuccess(t('miCuenta.emailPassword.changeSuccess'))
      setCurrentPassword('')
      setNewPassword('')
      setRepeatNewPassword('')
    } else if (result.status === 423) {
      setPasswordChangeError(t('miCuenta.modal.blockedMessage'))
    } else {
      setPasswordChangeError(t('miCuenta.emailPassword.changeError'))
    }
  }

  const abrirModalDelete = () => {
    setModalDeleteError('')
    setModalDeleteBlockedUntil(null)
    setModalDeleteAbierto(true)
  }

  const handleDeleteAccount = async (password) => {
    setModalDeleteSubmitting(true)
    setModalDeleteError('')
    const result = await accountService.deleteAccount(password)
    setModalDeleteSubmitting(false)

    if (result.ok) {
      setModalDeleteAbierto(false)
      await logout()
      navigate('/')
    } else if (result.status === 423) {
      setModalDeleteBlockedUntil(result.blockedUntil)
    } else {
      setModalDeleteError(t('miCuenta.modal.wrongPassword'))
    }
  }

  if (loading) {
    return <p className="texto-tema" role="status">{t('common.loading')}</p>
  }

  if (loadError) {
    return <p className="texto-tema" role="alert">{loadError}</p>
  }

  return (
    <div className="email-password-panel">
      <div className="email-password-panel__campo-email">
        <InputBox
          nameInput="email"
          labelInput={t('miCuenta.emailPassword.fieldEmail')}
          typeInput="email"
          placeholderInput={t('miCuenta.emailPassword.fieldEmail')}
          eventoOnChange={() => {}}
          value={email}
          disabled
          required={false}
        />
        {!emailHabilitado && (
          <button type="button" className="email-password-panel__modificar" onClick={abrirModalEmail}>
            <IconoLapiz />
            {t('miCuenta.emailPassword.modifyEmailButton')}
          </button>
        )}
      </div>

      {emailHabilitado && (
        <form onSubmit={handleValidarEmail} className="email-password-panel__form-email">
          <InputBox
            nameInput="nuevoEmail"
            labelInput={t('miCuenta.emailPassword.fieldNewEmail')}
            typeInput="email"
            placeholderInput={t('miCuenta.emailPassword.fieldNewEmail')}
            eventoOnChange={(e) => setNuevoEmail(e.target.value)}
            value={nuevoEmail}
            required={false}
          />
          <button type="submit" className="boton-primario" disabled={validando || !nuevoEmail.trim()}>
            {t('miCuenta.emailPassword.validateButton')}
          </button>
        </form>
      )}
      {emailChangeError && <p className="texto-tema" role="alert">{emailChangeError}</p>}
      {emailChangeSuccess && <p className="texto-tema texto-tema--exito" role="status">{emailChangeSuccess}</p>}

      <form onSubmit={handleChangePassword} className="email-password-panel__form-password" noValidate>
        <InputBox
          nameInput="currentPassword"
          labelInput={t('miCuenta.emailPassword.fieldCurrentPassword')}
          typeInput="password"
          placeholderInput={t('miCuenta.emailPassword.fieldCurrentPassword')}
          eventoOnChange={(e) => setCurrentPassword(e.target.value)}
          value={currentPassword}
          required={false}
        />
        <InputBox
          nameInput="newPassword"
          labelInput={t('miCuenta.emailPassword.fieldNewPassword')}
          typeInput="password"
          placeholderInput={t('miCuenta.emailPassword.fieldNewPassword')}
          eventoOnChange={(e) => setNewPassword(e.target.value)}
          value={newPassword}
          required={false}
        />
        <InputBox
          nameInput="repeatNewPassword"
          labelInput={t('miCuenta.emailPassword.fieldRepeatNewPassword')}
          typeInput="password"
          placeholderInput={t('miCuenta.emailPassword.fieldRepeatNewPassword')}
          eventoOnChange={(e) => setRepeatNewPassword(e.target.value)}
          value={repeatNewPassword}
          required={false}
        />
        <button
          type="submit"
          className="boton-primario"
          disabled={cambiandoPassword || !currentPassword || !newPassword || !repeatNewPassword}
        >
          {t('miCuenta.emailPassword.changePasswordButton')}
        </button>
        {passwordChangeError && <p className="texto-tema" role="alert">{passwordChangeError}</p>}
        {passwordChangeSuccess && <p className="texto-tema texto-tema--exito" role="status">{passwordChangeSuccess}</p>}
      </form>

      <div className="email-password-panel__twofa">
        <h3 className="texto-tema email-password-panel__twofa-titulo">{t('miCuenta.emailPassword.twoFaTitle')}</h3>
        <p className="texto-tema email-password-panel__twofa-pendiente">{t('miCuenta.emailPassword.twoFaPending')}</p>
      </div>

      <button type="button" className="email-password-panel__eliminar" onClick={abrirModalDelete}>
        {t('miCuenta.emailPassword.deleteAccountButton')}
      </button>

      <ModalConfirmarPassword
        visible={modalEmailAbierto}
        onClose={() => setModalEmailAbierto(false)}
        onSubmit={handleVerifyPasswordEmail}
        submitting={modalEmailSubmitting}
        error={modalEmailError}
        blockedUntil={modalEmailBlockedUntil}
      />

      <ModalConfirmarPassword
        visible={modalDeleteAbierto}
        onClose={() => setModalDeleteAbierto(false)}
        onSubmit={handleDeleteAccount}
        submitting={modalDeleteSubmitting}
        error={modalDeleteError}
        blockedUntil={modalDeleteBlockedUntil}
      />
    </div>
  )
}

export default EmailPasswordPanel
