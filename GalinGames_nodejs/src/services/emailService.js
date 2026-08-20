const nodemailer = require('nodemailer');
const env = require('../config/env');

const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// validator.js no restringe caracteres HTML en `username` (solo caracteres de control
// y longitud) — hay que escaparlo aquí para que no se inyecte HTML en el correo.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

function buildVerificationEmailHtml(username, verificationLink) {
  const safeUsername = escapeHtml(username);
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#1a0533; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a0533;">
      <tr>
        <td style="background-color:#3a0ca3; border-bottom:2px solid rgba(255,255,255,0.15); padding:24px 16px; text-align:center;">
          <h1 style="margin:0; color:#ffffff; font-size:36px; font-weight:800; letter-spacing:2px; text-shadow:0 2px 8px #000;">
            GalinGames
          </h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" style="max-width:480px;">
            <tr>
              <td style="text-align:center;">
                <h2 style="margin:0 0 24px 0; color:#ffffff; font-size:20px; font-weight:800; letter-spacing:1px; text-shadow:0 2px 8px #000;">
                  ¡Confirma tu email!
                </h2>
                <p style="margin:0 0 16px 0; color:#ffffff; font-size:15px; line-height:1.5;">
                  Hola, <strong>${safeUsername}</strong>
                </p>
                <p style="margin:0 0 28px 0; color:#ffffff; font-size:14px; line-height:1.6; opacity:0.9;">
                  Gracias por registrarte en GalinGames. Para activar tu cuenta y poder acceder al contenido, confirma tu dirección de email haciendo clic en el siguiente botón:
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;">
                  <tr>
                    <td style="border-radius:12px; background:linear-gradient(180deg, #7d2ae8 60%, #3a0ca3 100%); border:2.5px solid #fff; box-shadow:0 4px 0 #2d0066;">
                      <a href="${verificationLink}" target="_blank" rel="noopener noreferrer"
                        style="display:inline-block; padding:14px 28px; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none; letter-spacing:0.5px;">
                        Haz click aquí para confirmar tu email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0; color:#ffffff; font-size:11px; opacity:0.6;">
                  Si tú no has solicitado este registro, puedes ignorar este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

// Inyección del transporter: permite sustituirlo por un doble de prueba en tests
// sin depender del mocking de módulos nativos de nodemailer (ver tests/unit/emailService.test.js).
function createEmailService(transporter) {
  async function sendVerificationEmail(to, username, verificationToken) {
    const verificationLink = `${env.BACKEND_URL}/api/auth/verify-email?token=${verificationToken}`;
    const html = buildVerificationEmailHtml(username, verificationLink);

    await transporter.sendMail({
      from: `"GalinGames" <${env.EMAIL_USER}>`,
      to,
      subject: 'Confirma tu email en GalinGames',
      html,
      text: `Hola ${username}, confirma tu cuenta en GalinGames visitando: ${verificationLink}`,
    });
  }

  return { sendVerificationEmail };
}

const defaultTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_APP_PASSWORD,
  },
});

const { sendVerificationEmail } = createEmailService(defaultTransporter);

module.exports = { sendVerificationEmail, buildVerificationEmailHtml, createEmailService };
