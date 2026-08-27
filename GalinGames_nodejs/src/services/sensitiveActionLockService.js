const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas (Requisito 8.3)

function getLock(user, action) {
  return user.sensitiveActionLocks[action];
}

// Si el bloqueo ya caducó, restablece el contador antes de comprobarlo (Requisito
// 8.4: pasadas 24h no solo se desbloquea, se permiten hasta 5 intentos nuevos, no
// solo 1 antes de volver a bloquear). El controlador es responsable de `user.save()`
// tras llamar a esta función si quiere persistir el restablecimiento de inmediato.
function isLocked(user, action) {
  const lock = getLock(user, action);

  if (!lock.blockedUntil) return false;

  if (Date.now() < new Date(lock.blockedUntil).getTime()) {
    return true;
  }

  lock.attempts = 0;
  lock.blockedUntil = null;
  return false;
}

function registerFailedAttempt(user, action) {
  const lock = getLock(user, action);

  lock.attempts += 1;
  if (lock.attempts >= MAX_ATTEMPTS) {
    lock.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
  }
}

function resetLock(user, action) {
  const lock = getLock(user, action);

  lock.attempts = 0;
  lock.blockedUntil = null;
}

module.exports = { isLocked, registerFailedAttempt, resetLock, MAX_ATTEMPTS, BLOCK_DURATION_MS };
