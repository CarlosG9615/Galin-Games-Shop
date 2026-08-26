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

const UPDATE_PROFILE_FIELDS = ['nombre', 'apellidos', 'username', 'telefono', 'nacionalidad'];
const UPDATE_PROFILE_MAXLENGTHS = { nombre: 100, apellidos: 150, username: 50, telefono: 30, nacionalidad: 100 };

// PATCH /api/users/me admite actualización parcial (Requisito 4.2): solo se validan
// los campos presentes en el body, no se exige el conjunto completo como en el registro.
function validateUpdateProfileInput(req, res, next) {
  const body = req.body || {};
  const errors = [];
  const extraFields = Object.keys(body).filter((key) => !UPDATE_PROFILE_FIELDS.includes(key));

  for (const field of extraFields) {
    errors.push({ field, rule: 'not_allowed', message: 'Campo no permitido' });
  }

  for (const field of UPDATE_PROFILE_FIELDS) {
    if (!(field in body)) continue;

    const value = body[field];

    if (isBlank(value)) {
      errors.push({ field, rule: 'required', message: 'Campo requerido' });
      continue;
    }

    if (String(value).length > UPDATE_PROFILE_MAXLENGTHS[field]) {
      errors.push({ field, rule: 'maxlength', message: 'Longitud máxima superada' });
      continue;
    }

    if (hasControlChars(value)) {
      errors.push({ field, rule: 'control_chars', message: 'Caracteres no permitidos' });
      continue;
    }

    if (field === 'username' && String(value).trim().length < 3) {
      errors.push({ field: 'username', rule: 'minlength', message: 'El username debe tener al menos 3 caracteres' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  return next();
}

const ADDRESS_FIELDS = ['tipo', 'titulo', 'calle', 'numero', 'pisoPuerta', 'ciudad', 'provincia', 'codigoPostal', 'pais'];
const ADDRESS_REQUIRED_FIELDS = ['tipo', 'titulo', 'calle', 'numero', 'ciudad', 'provincia', 'codigoPostal', 'pais'];
const ADDRESS_MAXLENGTHS = {
  titulo: 100,
  calle: 200,
  numero: 20,
  pisoPuerta: 50,
  ciudad: 100,
  provincia: 100,
  codigoPostal: 12,
  pais: 100,
};

function validateAddressInput(req, res, next) {
  const body = req.body || {};
  const errors = [];
  const extraFields = Object.keys(body).filter((key) => !ADDRESS_FIELDS.includes(key));

  for (const field of extraFields) {
    errors.push({ field, rule: 'not_allowed', message: 'Campo no permitido' });
  }

  if (isBlank(body.tipo)) {
    errors.push({ field: 'tipo', rule: 'required', message: 'Campo requerido' });
  } else if (!['envio', 'facturacion'].includes(body.tipo)) {
    errors.push({ field: 'tipo', rule: 'invalid', message: 'El tipo debe ser "envio" o "facturacion"' });
  }

  for (const field of ADDRESS_REQUIRED_FIELDS) {
    if (field === 'tipo') continue;
    const value = body[field];

    if (isBlank(value)) {
      errors.push({ field, rule: 'required', message: 'Campo requerido' });
      continue;
    }

    if (String(value).length > ADDRESS_MAXLENGTHS[field]) {
      errors.push({ field, rule: 'maxlength', message: 'Longitud máxima superada' });
      continue;
    }

    if (hasControlChars(value)) {
      errors.push({ field, rule: 'control_chars', message: 'Caracteres no permitidos' });
    }
  }

  if (!isBlank(body.pisoPuerta)) {
    if (String(body.pisoPuerta).length > ADDRESS_MAXLENGTHS.pisoPuerta) {
      errors.push({ field: 'pisoPuerta', rule: 'maxlength', message: 'Longitud máxima superada' });
    } else if (hasControlChars(body.pisoPuerta)) {
      errors.push({ field: 'pisoPuerta', rule: 'control_chars', message: 'Caracteres no permitidos' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  return next();
}

const CHANGE_PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'repeatNewPassword'];

function validateChangePasswordInput(req, res, next) {
  const body = req.body || {};
  const errors = [];
  const extraFields = Object.keys(body).filter((key) => !CHANGE_PASSWORD_FIELDS.includes(key));

  for (const field of extraFields) {
    errors.push({ field, rule: 'not_allowed', message: 'Campo no permitido' });
  }

  for (const field of CHANGE_PASSWORD_FIELDS) {
    const value = body[field];

    if (isBlank(value)) {
      errors.push({ field, rule: 'required', message: 'Campo requerido' });
      continue;
    }

    if (hasControlChars(value)) {
      errors.push({ field, rule: 'control_chars', message: 'Caracteres no permitidos' });
      continue;
    }

    if (field === 'newPassword') {
      const length = String(value).length;
      if (length < 8 || length > 72) {
        errors.push({ field: 'newPassword', rule: 'length', message: 'La contraseña debe tener entre 8 y 72 caracteres' });
      }
    }
  }

  if (!isBlank(body.newPassword) && !isBlank(body.repeatNewPassword) && body.newPassword !== body.repeatNewPassword) {
    errors.push({ field: 'repeatNewPassword', rule: 'mismatch', message: 'Las contraseñas no coinciden' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  return next();
}

module.exports = {
  validateLoginInput,
  validateRegisterInput,
  validateUpdateProfileInput,
  validateAddressInput,
  validateChangePasswordInput,
};
