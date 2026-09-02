import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEmailService,
  buildVerificationEmailHtml,
  buildEmailChangeVerificationHtml,
  buildStockAvailableEmailHtml,
} from '../../src/services/emailService.js';

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

  it('buildEmailChangeVerificationHtml incluye el texto exacto del botón y el username', () => {
    const html = buildEmailChangeVerificationHtml('carlos', 'http://localhost:3001/api/users/verify-email-change?token=abc');
    expect(html).toContain('Haz click aquí para confirmar tu nuevo email');
    expect(html).toContain('carlos');
    expect(html).toContain('http://localhost:3001/api/users/verify-email-change?token=abc');
  });

  it('buildEmailChangeVerificationHtml escapa caracteres HTML del username', () => {
    const html = buildEmailChangeVerificationHtml('<img src=x onerror=alert(1)>', 'http://localhost:3001/api/users/verify-email-change?token=abc');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('sendEmailChangeVerification llama a transporter.sendMail con to, subject y el enlace de verify-email-change', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: '456' });
    const { sendEmailChangeVerification } = createEmailService({ sendMail: sendMailMock });

    await sendEmailChangeVerification('nuevo@example.com', 'carlos', 'token-en-claro');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const callArgs = sendMailMock.mock.calls[0][0];
    expect(callArgs.to).toBe('nuevo@example.com');
    expect(callArgs.subject).toContain('nuevo email');
    expect(callArgs.html).toContain('/api/users/verify-email-change?token=token-en-claro');
  });

  it('sendEmailChangeVerification propaga la excepción si transporter.sendMail rechaza', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'));
    const { sendEmailChangeVerification } = createEmailService({ sendMail: sendMailMock });

    await expect(sendEmailChangeVerification('nuevo@example.com', 'carlos', 'token')).rejects.toThrow('SMTP down');
  });

  it('buildStockAvailableEmailHtml incluye el nombre del juego, el username y el enlace', () => {
    const html = buildStockAvailableEmailHtml('carlos', "Assassin's Creed Black Flag Resynced", 'http://localhost:5173/juegos/detalle/abc?plataforma=PC');
    expect(html).toContain('carlos');
    expect(html).toContain('Assassin&#39;s Creed Black Flag Resynced');
    expect(html).toContain('http://localhost:5173/juegos/detalle/abc?plataforma=PC');
  });

  it('buildStockAvailableEmailHtml escapa caracteres HTML del nombre del juego', () => {
    const html = buildStockAvailableEmailHtml('carlos', '<img src=x onerror=alert(1)>', 'http://localhost:5173/juegos/detalle/abc');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('sendStockAvailableEmail llama a transporter.sendMail con to, subject y el enlace de detalle', async () => {
    sendMailMock.mockResolvedValueOnce({ messageId: '789' });
    const { sendStockAvailableEmail } = createEmailService({ sendMail: sendMailMock });

    await sendStockAvailableEmail('cliente@example.com', 'carlos', 'Dragon Ball: Sparking! Zero', 'http://localhost:5173/juegos/detalle/xyz?plataforma=PC');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const callArgs = sendMailMock.mock.calls[0][0];
    expect(callArgs.to).toBe('cliente@example.com');
    expect(callArgs.subject).toContain('Dragon Ball: Sparking! Zero');
    expect(callArgs.html).toContain('http://localhost:5173/juegos/detalle/xyz?plataforma=PC');
  });

  it('sendStockAvailableEmail propaga la excepción si transporter.sendMail rechaza', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'));
    const { sendStockAvailableEmail } = createEmailService({ sendMail: sendMailMock });

    await expect(sendStockAvailableEmail('cliente@example.com', 'carlos', 'Juego', 'http://localhost:5173')).rejects.toThrow('SMTP down');
  });
});
