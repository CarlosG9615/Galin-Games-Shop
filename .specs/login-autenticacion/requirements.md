# Requirements Document

## Introduction

Este documento describe los requisitos del sistema de autenticación de la tienda de videojuegos GalinGames. El sistema cubre el ciclo completo de alta e inicio de sesión: el formulario de registro React (`Registro.jsx`) conectado al endpoint `POST /api/auth/register`, el formulario de login React (`Login.jsx`) conectado al endpoint `POST /api/auth/login`, la API REST en el backend Node.js/Express, y la persistencia en MongoDB (base de datos `GalinGames`, colección `users`). Se aplican las mejores prácticas de ciberseguridad: hashing bcrypt, tokens JWT con expiración, protección anti-fuerza bruta, CORS restrictivo, sanitización de entradas y almacenamiento seguro del token. Un usuario creado mediante el flujo de registro puede iniciar sesión de forma inmediata con las credenciales elegidas.

---

## Glossary

- **Sistema**: El conjunto formado por el frontend React y el backend Node.js que implementan el registro y el login.
- **Login_Form**: El componente React `Login.jsx` que presenta el formulario de inicio de sesión al usuario.
- **Register_Form**: El componente React `Registro.jsx` que presenta el formulario de registro al usuario.
- **Auth_API**: El servidor Express que expone los endpoints `POST /api/auth/login` y `POST /api/auth/register`.
- **User_Repository**: El módulo que interactúa con MongoDB a través de Mongoose para consultar y crear datos de usuario.
- **Token_Service**: El módulo responsable de generar, firmar y verificar tokens JWT.
- **Rate_Limiter**: El middleware Express que limita el número de peticiones desde una misma IP.
- **Validator**: El módulo que valida y sanitiza los datos de entrada recibidos en el backend.
- **JWT**: JSON Web Token. Credencial firmada digitalmente que representa la sesión del usuario.
- **httpOnly cookie**: Cookie de navegador inaccesible desde JavaScript del cliente, usada para almacenar el JWT de forma segura.
- **bcrypt**: Algoritmo de hashing adaptativo para contraseñas.
- **Usuario**: Persona que se registra o intenta iniciar sesión en la tienda.
- **GalinGames**: Nombre de la base de datos MongoDB que almacena los datos de la tienda.
- **Refresh_Token**: Token de larga duración (7 días) almacenado en httpOnly cookie exclusiva, usado para obtener nuevos access tokens sin requerir re-login.
- **Access_Token**: El JWT de corta duración (15 minutos) almacenado en httpOnly cookie, usado para autenticar peticiones a endpoints protegidos.
- **Session_Store**: Objeto `{ isLoggedIn, userId, username }` guardado en localStorage, sin datos sensibles, usado para restaurar el estado visual de la UI al recargar la página.
- **Silent_Refresh**: Proceso automático por el que el frontend llama a `POST /api/auth/refresh` al arrancar la app si detecta `isLoggedIn: true` en localStorage.
- **PendingUser**: Documento temporal en MongoDB que almacena los datos de un registro aún no verificado (incluida la contraseña ya hasheada con bcrypt) junto al hash del token de verificación, hasta que el usuario confirma su email o el registro caduca.
- **Verification_Token**: Token opaco de un solo uso, generado en el momento del registro, enviado por email en un enlace, usado para confirmar la propiedad del email y activar la cuenta definitiva en `users`.
- **Email_Service**: El módulo backend responsable de construir y enviar el correo de verificación con la plantilla de marca GalinGames, usando las credenciales SMTP configuradas por variables de entorno.

---

## Requirements

### Requisito 1: Formulario de Login en el Frontend

**User Story:** Como usuario registrado, quiero un formulario de inicio de sesión con campos de nombre de usuario y contraseña, para poder acceder a mi cuenta en la tienda de videojuegos.

#### Criterios de Aceptación

1. THE Login_Form SHALL renderizar un campo de texto con `name="username"` (máximo 50 caracteres) y un campo de contraseña con `name="password"` (máximo 128 caracteres).
2. THE Login_Form SHALL aplicar el estilo visual gaming existente, reutilizando las clases CSS `videojuego-title`, `videojuego-text`, `botonRegistro`, `marginForm`, `fondo-gaming` y `contenido-registro`.
3. THE Login_Form SHALL utilizar el componente reutilizable `InputBox` para los campos `username` y `password`.
4. WHEN el usuario envía el formulario, THE Login_Form SHALL ejecutar la petición al endpoint de autenticación sin recargar la página mediante `preventDefault`.
5. WHEN el usuario envía el formulario con el campo `username` o `password` vacíos, THE Login_Form SHALL mostrar un mensaje de error de validación y no enviar la petición al backend.
6. WHILE la petición de login está en curso, THE Login_Form SHALL mostrar un indicador visual de carga superpuesto o adyacente al botón de envío y deshabilitar el botón de envío para prevenir envíos duplicados.
7. IF el servidor devuelve un error de autenticación, THEN THE Login_Form SHALL mostrar un mensaje de error genérico visible al usuario sin revelar si el fallo fue por username incorrecto o contraseña incorrecta, y re-habilitar el botón de envío.
8. WHEN la petición de login no recibe respuesta en 10 segundos, THE Login_Form SHALL cancelar la petición, mostrar un mensaje de error de timeout y re-habilitar el botón de envío.
9. IF el servidor devuelve éxito, THEN THE Login_Form SHALL redirigir al usuario a la página principal de la tienda sin recargar la página completa.
10. THE Login_Form SHALL incluir un enlace visible hacia el formulario de registro para usuarios sin cuenta.
11. IF el Login_Form recibe un error HTTP 429, THEN THE Login_Form SHALL deshabilitar el botón de envío durante el tiempo indicado en la cabecera `Retry-After` y mostrar una cuenta atrás en segundos actualizada cada segundo.

---

### Requisito 2: Endpoint de Autenticación en el Backend

**User Story:** Como sistema, quiero un endpoint seguro que reciba credenciales y devuelva un JWT, para gestionar sesiones de usuario de forma stateless.

#### Criterios de Aceptación

1. THE Auth_API SHALL exponer el endpoint `POST /api/auth/login` que acepta un cuerpo JSON con los campos `username` (cadena, máximo 100 caracteres) y `password` (cadena, máximo 128 caracteres).
2. WHEN se recibe una petición en `POST /api/auth/login`, THE Auth_API SHALL responder en un tiempo máximo de 2000 ms bajo condiciones normales de carga (hasta 100 peticiones concurrentes).
3. WHEN las credenciales son válidas, THE Auth_API SHALL responder con código HTTP 200 e incluir el JWT en una httpOnly cookie con atributo `Secure` y `SameSite=Strict`, con tiempo de expiración de 24 horas.
4. IF las credenciales son inválidas, THEN THE Auth_API SHALL responder con código HTTP 401 y un mensaje de error genérico sin indicar qué campo falló, en un tiempo no inferior a 200 ms ni superior a 600 ms para evitar ataques de timing.
5. IF el cuerpo de la petición no contiene los campos `username` o `password`, THEN THE Auth_API SHALL responder con código HTTP 400 y un mensaje de error indicando que los campos requeridos están ausentes, sin ejecutar ninguna lógica de autenticación.
6. IF el usuario no existe en la base de datos, THEN THE Auth_API SHALL ejecutar igualmente la comparación de hash para prevenir ataques de timing que permitan enumerar usuarios, respondiendo con código HTTP 401 en un tiempo no inferior a 200 ms ni superior a 600 ms.
7. WHEN se reciben más de 5 intentos fallidos de autenticación para el mismo `username` en un período de 60 segundos, THE Auth_API SHALL bloquear las peticiones de ese `username` durante 300 segundos y responder con código HTTP 429.
8. THE Auth_API SHALL configurar CORS para aceptar únicamente peticiones desde los orígenes autorizados definidos en las variables de entorno, rechazando con código HTTP 403 cualquier petición de origen no autorizado.

---

### Requisito 3: Validación y Sanitización de Entradas

**User Story:** Como experto en seguridad, quiero que todas las entradas del formulario sean validadas y sanitizadas antes de procesarse, para prevenir inyecciones y datos malformados.

#### Criterios de Aceptación

1. WHEN se recibe una petición en `POST /api/auth/login`, THE Validator SHALL rechazar la petición con HTTP 400 si el campo `username`, tras aplicar trim, está vacío o supera los 50 caracteres.
2. WHEN se recibe una petición en `POST /api/auth/login`, THE Validator SHALL rechazar la petición con HTTP 400 si el campo `password` está ausente, vacío o supera los 128 caracteres.
3. THE Validator SHALL eliminar espacios en blanco iniciales y finales (`trim`) del campo `username` antes de consultar la base de datos.
4. WHEN el cuerpo de la petición contiene campos distintos a `username` y `password`, THE Validator SHALL rechazar la petición con HTTP 400 e incluir en la respuesta la lista de campos no permitidos recibidos.
5. THE Login_Form SHALL aplicar `trim` al valor del campo `username` antes de enviarlo al backend.
6. WHEN el campo `username` o `password` contiene caracteres de control (código ASCII menor que 32), THE Validator SHALL rechazar la petición con HTTP 400.
7. WHEN THE Validator rechaza una petición con HTTP 400, THE Validator SHALL incluir en el cuerpo de la respuesta un objeto JSON con la propiedad `errors` que enumera qué campo incumple qué regla de validación, sin incluir el valor recibido en el mensaje de error.

---

### Requisito 4: Hashing de Contraseñas con bcrypt

**User Story:** Como experto en seguridad, quiero que las contraseñas se almacenen y comparen usando bcrypt, para que una filtración de la base de datos no exponga las contraseñas en texto plano.

#### Criterios de Aceptación

1. WHEN se crea un usuario en el sistema, THE User_Repository SHALL almacenar únicamente el hash bcrypt de la contraseña con un factor de coste entre 12 y 14 inclusive.
2. WHEN se recibe una petición de login con credenciales, THE Auth_API SHALL comparar la contraseña recibida con el hash almacenado usando `bcrypt.compare` en ningún punto del flujo comparando texto plano.
3. IF `bcrypt.compare` lanza una excepción durante la comparación, THEN THE Auth_API SHALL responder con HTTP 500 y un mensaje de error genérico sin exponer detalles del error interno.
4. THE User_Repository SHALL garantizar que el campo `password` esté ausente del objeto serializado en cualquier respuesta JSON de la API.
5. FOR ALL intentos de login con contraseña incorrecta, THE Auth_API SHALL devolver la misma respuesta HTTP 401 con un tiempo de respuesta no inferior a 250 ms, equivalente al tiempo mínimo de `bcrypt.compare` con factor de coste 12.

---

### Requisito 5: Generación y Validación de JWT

**User Story:** Como sistema, quiero generar tokens JWT firmados con expiración para gestionar sesiones de forma segura sin estado en el servidor.

#### Criterios de Aceptación

1. WHEN las credenciales son válidas, THE Token_Service SHALL generar un JWT firmado con el algoritmo HS256 usando el secreto almacenado en la variable de entorno `JWT_SECRET`.
2. THE Token_Service SHALL establecer el tiempo de expiración del JWT en el valor configurado por la variable de entorno `JWT_EXPIRES_IN`, con un valor por defecto de 24 horas si la variable no está definida, y rechazar valores superiores a 24 horas.
3. THE Token_Service SHALL incluir en el payload del JWT únicamente el `userId` y el `username`, sin incluir datos sensibles como la contraseña o el email.
4. WHEN el cliente envía una petición a un endpoint protegido con un JWT cuya fecha de expiración (`exp`) es anterior al momento actual del servidor, THE Auth_API SHALL responder con HTTP 401 indicando que el token ha expirado.
5. IF el JWT recibido tiene una firma que no coincide con la generada usando `JWT_SECRET` o cuya estructura base64url está malformada, THEN THE Auth_API SHALL responder con HTTP 401 indicando que el token es inválido.
6. THE Token_Service SHALL incluir en cada JWT generado un campo `iat` (issued at) con el timestamp Unix en segundos del momento exacto de generación, de forma que dos tokens generados para el mismo `userId` en instantes distintos produzcan valores `iat` distintos.
7. IF la variable de entorno `JWT_SECRET` no está definida o tiene una longitud inferior a 32 caracteres al arrancar el servicio, THEN THE Token_Service SHALL rechazar la inicialización y registrar un error indicando que la configuración del secreto es inválida.

---

### Requisito 6: Protección contra Fuerza Bruta

**User Story:** Como experto en seguridad, quiero limitar el número de intentos de login por IP, para impedir ataques de fuerza bruta contra las cuentas de usuario.

#### Criterios de Aceptación

1. THE Rate_Limiter SHALL limitar a un máximo de 10 peticiones al endpoint `POST /api/auth/login` por dirección IP en una ventana de tiempo deslizante de 15 minutos, contando todas las peticiones independientemente del resultado.
2. WHEN una IP supera el límite de peticiones, THE Rate_Limiter SHALL responder con HTTP 429 e incluir en el cuerpo el número de segundos que el cliente debe esperar antes de volver a intentarlo.
3. THE Rate_Limiter SHALL incluir en las cabeceras de respuesta de todas las peticiones los campos `Retry-After` (entero, segundos hasta reset) y `X-RateLimit-Remaining` (entero no negativo, peticiones restantes en la ventana).
4. WHERE el entorno de despliegue sea producción, THE Rate_Limiter SHALL utilizar la primera entrada del encabezado `X-Forwarded-For` para identificar la IP real del cliente cuando este encabezado esté presente.
5. IF el Login_Form recibe un error HTTP 429, THEN THE Login_Form SHALL deshabilitar el botón de envío durante exactamente los segundos indicados en la cabecera `Retry-After` y mostrar una cuenta atrás visible actualizada cada segundo.
6. IF en producción no es posible determinar la IP del cliente porque el encabezado `X-Forwarded-For` está ausente y la IP de conexión directa no está disponible, THEN THE Rate_Limiter SHALL rechazar la petición con HTTP 503.

---

### Requisito 7: Variables de Entorno y Configuración Segura

**User Story:** Como desarrollador, quiero que todos los secretos y configuraciones sensibles se gestionen mediante variables de entorno, para evitar exponer datos críticos en el código fuente.

#### Criterios de Aceptación

1. THE Auth_API SHALL leer los valores de `JWT_SECRET`, `JWT_EXPIRES_IN`, `MONGODB_URI`, `PORT` y `ALLOWED_ORIGINS` exclusivamente desde variables de entorno mediante `dotenv`, sin asignar valores por defecto a `JWT_SECRET` ni a `MONGODB_URI` en el código fuente.
2. IF la variable de entorno `JWT_SECRET` no está definida o es una cadena vacía al iniciar el servidor, THEN THE Auth_API SHALL abortar el proceso de inicio, devolver el código de salida 1 y emitir un mensaje de error en consola indicando que `JWT_SECRET` es obligatoria.
3. IF la variable de entorno `MONGODB_URI` no está definida o es una cadena vacía al iniciar el servidor, THEN THE Auth_API SHALL abortar el proceso de inicio, devolver el código de salida 1 y emitir un mensaje de error en consola indicando que `MONGODB_URI` es obligatoria.
4. THE Auth_API SHALL incluir en el repositorio un archivo `.env.example` que contenga exactamente los nombres de las variables `JWT_SECRET`, `JWT_EXPIRES_IN`, `MONGODB_URI`, `PORT` y `ALLOWED_ORIGINS`, cada una asignada a un valor de ejemplo que no constituya un secreto real.
5. THE Auth_API SHALL incluir el archivo `.env` en el `.gitignore` del proyecto backend, de modo que ninguna ejecución de `git status` lo liste como archivo rastreado o pendiente de commit.
6. IF `JWT_EXPIRES_IN` no está definida en el entorno, THEN THE Auth_API SHALL asumir una duración de expiración de token de 3600 segundos como valor por defecto.

---

### Requisito 8: Configuración HTTPS y Cabeceras de Seguridad

**User Story:** Como experto en seguridad, quiero que el backend aplique cabeceras de seguridad HTTP y que en producción se fuerce HTTPS, para proteger la comunicación entre cliente y servidor.

#### Criterios de Aceptación

1. WHEN en entorno de producción THE Auth_API recibe una petición HTTP no cifrada (puerto 80 o esquema `http://`), THE Auth_API SHALL responder con HTTP 301 redirigiendo a la URL equivalente con esquema `https://` sin procesar la petición original.
2. WHERE el entorno sea producción, THE Auth_API SHALL incluir la cabecera `Strict-Transport-Security: max-age=31536000; includeSubDomains` en todas las respuestas.
3. THE Auth_API SHALL establecer la cabecera `X-Content-Type-Options: nosniff` en todas las respuestas, independientemente del entorno.
4. THE Auth_API SHALL establecer la cabecera `X-Frame-Options: DENY` en todas las respuestas, independientemente del entorno.
5. WHERE el entorno sea producción, THE Auth_API SHALL configurar la cookie que contiene el JWT con el atributo `Secure`, de modo que el navegador solo la envíe en conexiones HTTPS.
6. WHERE el entorno sea desarrollo, THE Auth_API SHALL omitir el atributo `Secure` en la cookie del JWT, de modo que el navegador la envíe también en conexiones HTTP locales.

---

### Requisito 9: Integración con MongoDB mediante Mongoose

**User Story:** Como desarrollador, quiero que el backend conecte a MongoDB de forma segura y estructurada usando Mongoose, para gestionar el modelo de usuario de forma consistente.

#### Criterios de Aceptación

1. THE User_Repository SHALL definir un esquema Mongoose `UserSchema` en la base de datos `GalinGames`, colección `users`, con los siguientes campos:
   - `username` (String, único, requerido, longitud entre 3 y 50 caracteres)
   - `nombre` (String, requerido)
   - `apellidos` (String, requerido)
   - `email` (String, único, requerido, formato email válido)
   - `password` (String, requerido, longitud mínima de 60 caracteres para admitir hashes bcrypt)
   - `fechaRegistro` (Date, valor por defecto `Date.now`)
2. WHEN THE Auth_API arranca, THE Auth_API SHALL establecer la conexión a MongoDB usando la URI de la variable de entorno `MONGODB_URI` y emitir en consola un mensaje explícito de éxito o fallo de la conexión.
3. IF `MONGODB_URI` no está definida en el entorno al arrancar, THEN THE Auth_API SHALL abortar el proceso antes de intentar la conexión y registrar un error indicando la variable ausente.
4. IF la conexión a MongoDB falla durante el arranque, THEN THE Auth_API SHALL terminar el proceso con código de salida 1 y registrar el error en consola sin exponer las credenciales contenidas en la URI.
5. THE User_Repository SHALL utilizar índices únicos en los campos `username` y `email` para garantizar que no existan dos documentos con el mismo nombre de usuario ni con el mismo correo electrónico en la colección `users`.
6. WHEN se consulta un usuario por `username`, THE User_Repository SHALL realizar la búsqueda de forma case-sensitive, de modo que `"Admin"` y `"admin"` se traten como usuarios distintos.

---

### Requisito 10: Formulario de Registro conectado al Backend

**User Story:** Como nuevo usuario, quiero registrarme con mis datos personales para crear una cuenta y poder iniciar sesión en GalinGames.

#### Criterios de Aceptación

1. WHEN el usuario envía el formulario de registro, THE Register_Form SHALL enviar una petición `POST /api/auth/register` con un cuerpo JSON que contenga los campos `username`, `nombre`, `apellidos`, `email`, `password` y `repetirPassword`, sin recargar la página mediante `preventDefault`.
2. WHEN el usuario envía el formulario con cualquiera de los campos `username`, `nombre`, `apellidos`, `email`, `password` o `repetirPassword` vacíos o con solo espacios en blanco, THE Register_Form SHALL mostrar un mensaje de error de validación y no enviar la petición al backend.
3. WHEN el valor de `password` no coincide con el valor de `repetirPassword`, THE Register_Form SHALL mostrar un mensaje de error indicando que las contraseñas no coinciden y no enviar la petición al backend.
4. WHILE la petición de registro está en curso, THE Register_Form SHALL deshabilitar el botón de envío y mostrar un indicador visual de carga para prevenir envíos duplicados.
5. IF el servidor devuelve HTTP 201, THEN THE Register_Form SHALL mostrar un mensaje indicando que se ha enviado un correo de verificación a la dirección proporcionada y que debe confirmarlo para activar la cuenta, y redirigir al formulario de login tras 3 segundos.
6. IF el servidor devuelve HTTP 409, THEN THE Register_Form SHALL mostrar un mensaje específico indicando que el nombre de usuario o el email ya está en uso, y re-habilitar el botón de envío.
7. IF el servidor devuelve HTTP 400, THEN THE Register_Form SHALL mostrar los errores de validación devueltos por el servidor en el cuerpo de la respuesta, y re-habilitar el botón de envío.
8. WHEN la petición de registro no recibe respuesta en 10 segundos, THE Register_Form SHALL cancelar la petición, mostrar un mensaje de error de timeout y re-habilitar el botón de envío.
9. IF el servidor devuelve un código de estado HTTP distinto de 201, 400 y 409, THEN THE Register_Form SHALL mostrar un mensaje de error genérico indicando que ha ocurrido un problema inesperado y re-habilitar el botón de envío.
10. THE Register_Form SHALL incluir un enlace visible hacia el formulario de login para usuarios que ya dispongan de cuenta.

---

### Requisito 11: Endpoint de Registro en el Backend

**User Story:** Como sistema, quiero un endpoint seguro que cree un nuevo usuario en MongoDB y devuelva confirmación, para gestionar altas de usuarios con datos consistentes.

#### Criterios de Aceptación

1. THE Auth_API SHALL exponer el endpoint `POST /api/auth/register` que acepta un cuerpo JSON con los campos `username`, `nombre`, `apellidos`, `email`, `password` y `repetirPassword`, todos de tipo cadena con longitud máxima de 255 caracteres cada uno.
2. WHEN se recibe una petición en `POST /api/auth/register` con alguno de los campos `username`, `nombre`, `apellidos`, `email`, `password` o `repetirPassword` ausentes, nulos, vacíos o con solo espacios en blanco, THE Validator SHALL rechazar la petición con HTTP 400 e incluir en la respuesta un objeto JSON con la propiedad `errors` que enumera los campos incumplidos.
3. WHEN los valores de `password` y `repetirPassword` no coinciden en una petición a `POST /api/auth/register`, THE Validator SHALL rechazar la petición con HTTP 400 indicando que las contraseñas no coinciden.
4. WHEN el campo `password` tiene una longitud inferior a 8 caracteres o superior a 72 caracteres, THE Validator SHALL rechazar la petición con HTTP 400 indicando que la contraseña no cumple los requisitos de longitud.
5. IF el campo `username` recibido ya existe en la colección `users` de la base de datos `GalinGames`, THEN THE Auth_API SHALL responder con HTTP 409 y un mensaje específico indicando que el nombre de usuario ya está en uso.
6. IF el campo `email` recibido ya existe en la colección `users` de la base de datos `GalinGames`, THEN THE Auth_API SHALL responder con HTTP 409 y un mensaje específico indicando que el email ya está en uso.
7. WHEN las validaciones son correctas y los datos son únicos, THE Auth_API SHALL hashear el campo `password` con bcrypt usando un factor de coste entre 12 y 14 inclusive antes de persistir el documento en MongoDB.
8. THE Auth_API SHALL garantizar que el campo `repetirPassword` nunca se almacene en la base de datos ni aparezca en ningún log del sistema.
9. WHEN los datos de registro son válidos y únicos, THE Auth_API SHALL crear un `PendingUser` (Requisito 18), enviar el correo de verificación y responder con HTTP 201 y un cuerpo JSON `{ "message": "Te hemos enviado un correo de verificación. Confirma tu cuenta para poder iniciar sesión." }`, sin incluir el campo `password`, `repetirPassword` ni ningún identificador de `users` — el documento definitivo aún no existe hasta que el email se verifica.
10. THE Rate_Limiter SHALL limitar a un máximo de 5 peticiones al endpoint `POST /api/auth/register` por dirección IP en una ventana de tiempo deslizante de 15 minutos, respondiendo con HTTP 429 e incluyendo en el cuerpo el número de segundos que el cliente debe esperar.
11. IF la conexión a MongoDB no está disponible en el momento de ejecutar la inserción del nuevo usuario, THEN THE Auth_API SHALL responder con HTTP 503 y un mensaje genérico sin exponer detalles de la infraestructura.

---

### Requisito 12: Sincronización Registro-Login

**User Story:** Como usuario recién registrado, quiero poder iniciar sesión inmediatamente con las credenciales que acabo de crear, para que el flujo de registro y login sea coherente.

#### Criterios de Aceptación

1. WHEN un usuario completa el registro Y verifica su email exitosamente (Requisito 18), THE Sistema SHALL garantizar que una petición de login con el mismo `username` y la misma contraseña en texto plano funcione correctamente en un tiempo no superior a 5 segundos tras la verificación del email.
2. THE User_Repository SHALL utilizar el mismo campo `username` como clave de búsqueda tanto en el flujo de login como en el flujo de registro, de modo que el documento creado por el endpoint de registro sea localizable por el endpoint de login sin transformaciones adicionales.
3. IF un usuario intenta hacer login con un `username` que no existe en la colección `users` de `GalinGames`, THEN THE Auth_API SHALL responder con HTTP 401 y un mensaje genérico sin revelar que el usuario no existe.
4. THE User_Repository SHALL almacenar el campo `username` con el mismo valor exacto (incluyendo mayúsculas y minúsculas) con el que fue enviado en el registro, de modo que el login con ese mismo valor exacto funcione de forma inmediata.
5. IF un usuario intenta hacer login con un `username` existente pero con una contraseña incorrecta, THEN THE Auth_API SHALL responder con HTTP 401 y el mismo mensaje genérico utilizado en el criterio 3, sin revelar que el username existe pero la contraseña es errónea.

---

### Requisito 13: Refresh Token — Generación y Rotación

**User Story:** Como sistema, quiero generar un refresh token de larga duración junto al access token en el login, para que los usuarios puedan renovar su sesión sin re-autenticarse mientras el refresh token sea válido.

#### Criterios de Aceptación

1. WHEN las credenciales son válidas en `POST /api/auth/login`, THE Auth_API SHALL generar dos tokens: un access token JWT con expiración de 15 minutos y un refresh token opaco con expiración de 7 días.
2. THE Auth_API SHALL almacenar el refresh token en una httpOnly cookie separada llamada `refreshToken`, con atributos `HttpOnly`, `SameSite=Strict`, `Path=/api/auth/refresh` y `Max-Age=604800` (7 días).
3. THE Auth_API SHALL almacenar el hash del refresh token en la colección `users` de MongoDB en un campo `refreshTokenHash`, para poder invalidarlo en el logout.
4. WHEN el refresh token es usado exitosamente en `POST /api/auth/refresh`, THE Auth_API SHALL generar un nuevo access token Y un nuevo refresh token (rotación), invalidando el refresh token anterior.
5. IF el refresh token recibido no coincide con el hash almacenado en la base de datos, THEN THE Auth_API SHALL responder con HTTP 401, eliminar la cookie `refreshToken` y limpiar el campo `refreshTokenHash` del usuario (detección de reutilización).
6. WHEN el usuario hace logout en `POST /api/auth/logout`, THE Auth_API SHALL eliminar ambas cookies (`token` y `refreshToken`) y limpiar el campo `refreshTokenHash` del usuario en MongoDB.

---

### Requisito 14: Endpoint de Refresco de Token

**User Story:** Como sistema, quiero un endpoint dedicado que acepte el refresh token y devuelva un nuevo par de tokens, para mantener la sesión activa sin exponer el proceso de refresco al resto de la API.

#### Criterios de Aceptación

1. THE Auth_API SHALL exponer el endpoint `POST /api/auth/refresh` que lee el refresh token exclusivamente desde la cookie `refreshToken` (nunca del cuerpo de la petición).
2. WHEN se recibe una petición en `POST /api/auth/refresh` con una cookie `refreshToken` válida y no expirada, THE Auth_API SHALL responder con HTTP 200, establecer un nuevo access token en la cookie `token` y un nuevo refresh token en la cookie `refreshToken`.
3. IF la cookie `refreshToken` está ausente en la petición, THEN THE Auth_API SHALL responder con HTTP 401 sin ejecutar ninguna lógica adicional.
4. IF el refresh token ha expirado, THEN THE Auth_API SHALL responder con HTTP 401, eliminar la cookie `refreshToken` y devolver un mensaje que indique que la sesión ha expirado.
5. THE Rate_Limiter SHALL limitar a un máximo de 20 peticiones al endpoint `POST /api/auth/refresh` por dirección IP en una ventana de 15 minutos para prevenir abuso.
6. WHEN `POST /api/auth/refresh` devuelve HTTP 200, THE Auth_API SHALL incluir en el cuerpo JSON los campos `userId` y `username` para que el frontend pueda restaurar el contexto de la sesión.

---

### Requisito 15: Persistencia de Sesión en el Frontend

**User Story:** Como usuario, quiero que al cerrar y reabrir el navegador mi sesión esté restaurada automáticamente si mi refresh token sigue siendo válido, para no tener que volver a hacer login cada vez.

#### Criterios de Aceptación

1. WHEN el login es exitoso, THE Login_Form SHALL guardar en localStorage el objeto `{ isLoggedIn: true, userId, username }` sin incluir ningún token ni dato sensible.
2. WHEN el usuario hace logout, THE sistema SHALL eliminar la entrada de localStorage y limpiar el AuthContext.
3. WHEN la aplicación arranca (montaje de AuthProvider), IF localStorage contiene `{ isLoggedIn: true }`, THEN THE sistema SHALL ejecutar automáticamente una petición silent refresh a `POST /api/auth/refresh` antes de renderizar rutas protegidas.
4. IF el silent refresh devuelve HTTP 200, THEN THE sistema SHALL restaurar el AuthContext con `{ userId, username }` obtenidos de la respuesta y permitir el acceso a rutas protegidas.
5. IF el silent refresh devuelve HTTP 401, THEN THE sistema SHALL eliminar la entrada de localStorage, limpiar el AuthContext y redirigir al usuario a `/login`.
6. WHILE el silent refresh está en curso al arrancar la app, THE sistema SHALL mostrar un estado de carga (spinner o pantalla en blanco) y no renderizar rutas protegidas ni redirigir al login hasta que la petición complete.
7. THE Login_Form SHALL actualizar la entrada de localStorage con los nuevos `userId` y `username` si difieren de los almacenados previamente.

---

### Requisito 16: Defensive Guards en el Backend — Protección contra Datos Ausentes

**User Story:** Como experto en seguridad, quiero que el backend compruebe explícitamente que ningún campo procesado sea `undefined`, `null` o cadena vacía antes de ejecutar lógica de negocio, para evitar que valores no controlados lleguen a la base de datos o a funciones sensibles como bcrypt o JWT.

#### Criterios de Aceptación

1. WHEN cualquier campo requerido del cuerpo de una petición es `undefined`, `null`, o cadena vacía tras aplicar trim, THE Validator SHALL rechazar la petición con HTTP 400 antes de que ese valor alcance cualquier función de negocio (bcrypt, Mongoose, JWT).
2. THE Auth_API SHALL nunca pasar un valor `undefined` o `null` como argumento a `bcrypt.hash`, `bcrypt.compare`, `jwt.sign` o `jwt.verify` — si alguno de estos valores no está disponible, se lanzará un error controlado con HTTP 500 antes de llamar a la función.
3. WHEN Mongoose recibe un documento con un campo requerido `undefined` o `null`, THE User_Repository SHALL capturar el error de validación de Mongoose y responder con HTTP 400, sin propagar el error sin manejar.
4. THE Auth_API SHALL nunca incluir en ninguna respuesta JSON el texto literal `"undefined"` ni `"null"` como valor de cadena no intencionado — todo campo ausente se omite o se establece a un valor por defecto documentado.
5. WHEN se produce cualquier excepción inesperada en cualquier endpoint, THE Auth_API SHALL capturarla con un middleware global de errores, responder con HTTP 500 y cuerpo `{ "code": 500, "message": "Error interno del servidor" }`, y registrar el error completo en el log del servidor sin exponerlo al cliente.
6. THE Auth_API SHALL incluir un middleware global de errores registrado como último `app.use` en `server.js` que capture cualquier error no manejado y devuelva siempre una respuesta JSON con los campos `code` (número HTTP) y `message` (cadena genérica).

---

### Requisito 17: Componente Global de Página de Error en el Frontend

**User Story:** Como usuario, quiero ver una página de error clara y coherente con el estilo de la aplicación cuando algo falla o accedo a una ruta inexistente, en lugar de una pantalla en blanco o un crash, para entender qué ha ocurrido y poder navegar de vuelta.

#### Criterios de Aceptación

1. THE sistema SHALL disponer de un componente `ErrorPage` ubicado en `src/Componentes/compGlobales/ErrorPageComponente/` que pueda ser importado por cualquier parte de la aplicación — formularios, router, context — sin acoplamiento.
2. THE ErrorPage SHALL aceptar como prop el código de error numérico (`code`) y renderizar un título y mensaje apropiados para los códigos 400, 401, 403, 404, 429, 500 y 503.
3. THE ErrorPage SHALL aplicar el estilo visual gaming de la aplicación, reutilizando las clases CSS `fondo-gaming`, `videojuego-title` y `videojuego-text`.
4. WHEN el usuario navega a una ruta no definida en el router, THE AppRouter SHALL renderizar `<ErrorPage code={404} />`.
5. WHEN el backend devuelve HTTP 500 o 503 en cualquier flujo (login, registro, refresh), THE componente receptor SHALL renderizar `<ErrorPage code={500} />` o `<ErrorPage code={503} />` respectivamente.
6. WHEN el backend devuelve HTTP 429, THE componente receptor SHALL pasar al ErrorPage la prop `retryAfter` (segundos del header `Retry-After`) para mostrar una cuenta atrás visible.
7. THE ErrorPage SHALL incluir un botón o enlace que permita al usuario volver a la página anterior o a `/login`.
8. THE ErrorPage SHALL ser accesible mediante las rutas `/error/400`, `/error/401`, `/error/403`, `/error/404`, `/error/429`, `/error/500` y `/error/503` para permitir pruebas manuales y navegación programática.

---

### Requisito 18: Verificación de Email tras el Registro

**User Story:** Como sistema, quiero exigir que el usuario confirme su dirección de email antes de activar su cuenta, para evitar registros con emails falsos o ajenos y garantizar que el titular del correo es quien controla la cuenta.

#### Criterios de Aceptación

1. WHEN un usuario completa el formulario de registro con datos válidos y únicos, THE Auth_API SHALL almacenar los datos en un `PendingUser` en vez de crear el documento en la colección `users`, de modo que el usuario NO exista en `users` ni sea localizable por login hasta confirmar su email.
2. WHEN se crea un `PendingUser`, THE Auth_API SHALL generar un `Verification_Token` opaco, almacenar únicamente su hash SHA-256 en el documento, y enviar mediante THE Email_Service un correo a la dirección proporcionada con un enlace que incluye el token en texto plano.
3. THE correo de verificación SHALL aplicar el estilo visual de marca de GalinGames (fondo oscuro degradado y paleta violeta coherente con las clases `fondo-gaming`/`videojuego-title` del frontend), incluir un saludo personalizado con el `username` introducido en el registro, y un botón o enlace con el texto exacto "Haz click aquí para confirmar tu email".
4. THE Email_Service SHALL enviar el correo desde la cuenta `GalinGamesShop@gmail.com`, con las credenciales SMTP leídas exclusivamente desde variables de entorno, sin exponerlas ni registrarlas en ningún log.
5. WHEN el usuario hace clic en el enlace de verificación con un `Verification_Token` válido y no caducado, THE Auth_API SHALL crear el documento definitivo en la colección `users` con los datos almacenados en el `PendingUser` correspondiente, eliminar dicho `PendingUser`, y redirigir el navegador a una página de la aplicación frontend que confirme el éxito.
6. IF el `Verification_Token` recibido no existe, ya fue consumido, o está caducado, THEN THE Auth_API SHALL redirigir el navegador a una página de error de la aplicación frontend indicando que el enlace no es válido, sin crear ningún documento en `users`.
7. THE `PendingUser` SHALL caducar automáticamente transcurrido el número de horas configurado en la variable de entorno `EMAIL_VERIFICATION_EXPIRES_HOURS` (por defecto 24) desde su creación, tras lo cual el token deja de ser válido y el registro se elimina de la base de datos.
8. IF un usuario intenta registrarse de nuevo con un `username` o `email` que ya tiene un `PendingUser` no caducado, THEN THE Auth_API SHALL generar un nuevo `Verification_Token`, actualizar el `PendingUser` existente y reenviar el correo de verificación, respondiendo con el mismo mensaje HTTP 201 genérico que un registro nuevo, sin revelar si ya existía un registro pendiente.
9. IF un usuario intenta iniciar sesión con un `username` cuya cuenta aún no ha sido verificada, THEN THE Auth_API SHALL responder con el mismo HTTP 401 y mensaje genérico definido en el Requisito 12.3 para cualquier `username` inexistente, sin revelar que existe un `PendingUser` asociado.
10. THE Rate_Limiter SHALL limitar el endpoint de verificación de email a un máximo de 20 peticiones por IP en una ventana de 15 minutos, de forma equivalente al resto de endpoints públicos de Auth_API.
11. THE Auth_API SHALL garantizar que el `Verification_Token` sea de un solo uso: una vez consumido con éxito, cualquier intento posterior con el mismo token SHALL fallar con el mismo comportamiento que un token inexistente, sin crear un usuario duplicado.
12. IF el envío del correo de verificación falla (error del proveedor SMTP), THEN THE Auth_API SHALL responder con HTTP 500 y un mensaje genérico, y SHALL eliminar el `PendingUser` recién creado para no dejar un registro huérfano sin ningún correo enviado ni posibilidad de reenvío hasta un nuevo intento de registro.
13. THE Register_Form SHALL mostrar el mensaje de confirmación de envío de correo definido en el Requisito 10.5 independientemente de si el registro creó un `PendingUser` nuevo o reenvió uno existente, para no revelar esa distinción al usuario.
