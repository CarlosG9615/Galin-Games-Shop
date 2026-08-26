import { describe, it, expect } from 'vitest';
import {
  isLocked,
  registerFailedAttempt,
  resetLock,
  MAX_ATTEMPTS,
  BLOCK_DURATION_MS,
} from '../../src/services/sensitiveActionLockService.js';

function buildUser() {
  return {
    sensitiveActionLocks: {
      emailChange: { attempts: 0, blockedUntil: null },
      deleteAccount: { attempts: 0, blockedUntil: null },
      changePassword: { attempts: 0, blockedUntil: null },
    },
  };
}

describe('src/services/sensitiveActionLockService.js', () => {
  it('isLocked devuelve false cuando no hay bloqueo activo', () => {
    const user = buildUser();
    expect(isLocked(user, 'emailChange')).toBe(false);
  });

  it('registerFailedAttempt incrementa el contador de intentos', () => {
    const user = buildUser();
    registerFailedAttempt(user, 'emailChange');
    expect(user.sensitiveActionLocks.emailChange.attempts).toBe(1);
    expect(user.sensitiveActionLocks.emailChange.blockedUntil).toBeNull();
  });

  it('registerFailedAttempt no bloquea antes de alcanzar MAX_ATTEMPTS', () => {
    const user = buildUser();
    for (let i = 0; i < MAX_ATTEMPTS - 1; i += 1) {
      registerFailedAttempt(user, 'emailChange');
    }
    expect(user.sensitiveActionLocks.emailChange.attempts).toBe(MAX_ATTEMPTS - 1);
    expect(isLocked(user, 'emailChange')).toBe(false);
  });

  it('registerFailedAttempt bloquea al alcanzar MAX_ATTEMPTS intentos consecutivos', () => {
    const user = buildUser();
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      registerFailedAttempt(user, 'emailChange');
    }
    expect(user.sensitiveActionLocks.emailChange.attempts).toBe(MAX_ATTEMPTS);
    expect(isLocked(user, 'emailChange')).toBe(true);
  });

  it('el blockedUntil fijado tras el bloqueo es ~24h en el futuro', () => {
    const user = buildUser();
    const before = Date.now();
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      registerFailedAttempt(user, 'emailChange');
    }
    const blockedUntil = user.sensitiveActionLocks.emailChange.blockedUntil.getTime();
    expect(blockedUntil).toBeGreaterThanOrEqual(before + BLOCK_DURATION_MS - 1000);
    expect(blockedUntil).toBeLessThanOrEqual(Date.now() + BLOCK_DURATION_MS + 1000);
  });

  it('isLocked restablece automáticamente el contador cuando el bloqueo ya caducó', () => {
    const user = buildUser();
    user.sensitiveActionLocks.emailChange = { attempts: MAX_ATTEMPTS, blockedUntil: new Date(Date.now() - 1000) };
    expect(isLocked(user, 'emailChange')).toBe(false);
    expect(user.sensitiveActionLocks.emailChange.attempts).toBe(0);
    expect(user.sensitiveActionLocks.emailChange.blockedUntil).toBeNull();
  });

  it('resetLock restablece attempts a 0 y blockedUntil a null', () => {
    const user = buildUser();
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      registerFailedAttempt(user, 'emailChange');
    }
    resetLock(user, 'emailChange');
    expect(user.sensitiveActionLocks.emailChange.attempts).toBe(0);
    expect(user.sensitiveActionLocks.emailChange.blockedUntil).toBeNull();
    expect(isLocked(user, 'emailChange')).toBe(false);
  });

  it('las acciones son independientes entre sí', () => {
    const user = buildUser();
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      registerFailedAttempt(user, 'deleteAccount');
    }
    expect(isLocked(user, 'deleteAccount')).toBe(true);
    expect(isLocked(user, 'emailChange')).toBe(false);
    expect(isLocked(user, 'changePassword')).toBe(false);
  });
});
