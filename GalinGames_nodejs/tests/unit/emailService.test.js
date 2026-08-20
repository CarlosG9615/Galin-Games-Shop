import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmailService, buildVerificationEmailHtml } from '../../src/services/emailService.js';

const sendMailMock = vi.fn();

describe('src/services/emailService.js', () => {
  beforeEach(() => {
    sendMailMock.mockReset();
  });

  it('buildVerificationEmailHtml incluye el texto exacto del botón y el username', () => {
    const html = buildVerificationEmailHtml('carlos', 'http://localhost:3001/api/auth/verify-email?token=abc');
    expect(html).toContain('Haz click aquí para confirmar tu email');
    expect(html).toContain('carlos');
    expect(html).toContain('http://localhost:3001/api/auth/verify-email?token=abc');
  });

  it('buildVerificationEmailHtml no duplica el enlace en texto plano fuera del botón', () => {
    const link = 'http://localhost:3001/api/auth/verify-email?token=abc';
    const html = buildVerificationEmailHtml('carlos', link);
    const occurrences = html.split(link).length - 1;
    expect(occurrences).toBe(1);
  });

  it('buildVerificationEmailHtml escapa caracteres HTML del username', () => {
    const html = buildVerificationEmailHtml('<img src=x onerror=alert(1)>', 'http://localhost:3001/api/auth/verify-email?token=abc');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('sendVerificationEmail llama a transporter.sendMail con to, subject y el html correcto', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: '123' });
    const { sendVerificationEmail } = createEmailService({ sendMail: sendMailMock });

    await sendVerificationEmail('cliente@example.com', 'carlos', 'token-en-claro');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const callArgs = sendMailMock.mock.calls[0][0];
    expect(callArgs.to).toBe('cliente@example.com');
    expect(callArgs.subject).toContain('GalinGames');
    expect(callArgs.html).toContain('Haz click aquí para confirmar tu email');
    expect(callArgs.html).toContain('carlos');
    expect(callArgs.html).toContain('token=token-en-claro');
  });

  it('sendVerificationEmail propaga la excepción si transporter.sendMail rechaza', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'));
    const { sendVerificationEmail } = createEmailService({ sendMail: sendMailMock });

    await expect(sendVerificationEmail('cliente@example.com', 'carlos', 'token')).rejects.toThrow('SMTP down');
  });
});
