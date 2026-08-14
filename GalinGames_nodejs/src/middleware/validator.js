const CONTROL_CHARS_REGEX = /[\x00-\x1F]/;

function hasControlChars(value) {
  return typeof value === 'string' && CONTROL_CHARS_REGEX.test(value);
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function validateLoginInput(req, res, next) {
  const body = req.body || {};
  const errors = [];
  const allowedFields = ['username', 'password'];
  const extraFields = Object.keys(body).filter((key) => !allowedFields.includes(key));

  if (extraFields.length > 0) {
    for (const field of extraFields) {
      errors.push({ field, rule: 'not_allowed' });
    }
  }

  const { username, password } = body;

  if (isBlank(username)) {
    errors.push({ field: 'username', rule: 'required' });
  } else if (String(username).length > 50) {
    errors.push({ field: 'username', rule: 'maxlength' });
  } else if (hasControlChars(username)) {
    errors.push({ field: 'username', rule: 'control_chars' });
  }

  if (isBlank(password)) {
    errors.push({ field: 'password', rule: 'required' });
  } else if (String(password).length > 128) {
    errors.push({ field: 'password', rule: 'maxlength' });
  } else if (hasControlChars(password)) {
    errors.push({ field: 'password', rule: 'control_chars' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  req.body.username = String(username).trim();
  return next();
}

const REGISTER_FIELDS = ['username', 'nombre', 'apellidos', 'email', 'password', 'repetirPassword'];

function validateRegisterInput(req, res, next) {
  const body = req.body || {};
  const errors = [];
  const extraFields = Object.keys(body).filter((key) => !REGISTER_FIELDS.includes(key));

  if (extraFields.length > 0) {
    for (const field of extraFields) {
      errors.push({ field, rule: 'not_allowed', message: 'Campo no permitido' });
    }
  }

  for (const field of REGISTER_FIELDS) {
    const value = body[field];

    if (isBlank(value)) {
      errors.push({ field, rule: 'required', message: 'Campo requerido' });
      continue;
    }

    if (String(value).length > 255) {
      errors.push({ field, rule: 'maxlength', message: 'Longitud máxima superada' });
      continue;
    }

    if (hasControlChars(value)) {
      errors.push({ field, rule: 'control_chars', message: 'Caracteres no permitidos' });
      continue;
    }

    if (field === 'password') {
      const length = String(value).length;
      if (length < 8 || length > 72) {
        errors.push({ field: 'password', rule: 'length', message: 'La contraseña debe tener entre 8 y 72 caracteres' });
      }
    }
  }

  if (!isBlank(body.password) && !isBlank(body.repetirPassword) && body.password !== body.repetirPassword) {
    errors.push({ field: 'repetirPassword', rule: 'mismatch', message: 'Las contraseñas no coinciden' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  return next();
}

module.exports = { validateLoginInput, validateRegisterInput };
