# Requirements Document

## Introduction

Esta feature da acceso funcional a las opciones "Mi cuenta" y "Mis pedidos" del
dropdown de usuario del Navbar, que hoy son placeholders no interactivos
(`<span aria-disabled="true">` en `Navbar.jsx`). Introduce una vista de cuenta
de usuario con navegación lateral (menú de secciones) y un panel de contenido
que muestra y permite editar los datos del usuario autenticado: perfil
(datos personales e imagen), credenciales sensibles (email y contraseña),
direcciones de envío/facturación, y un apartado de pedidos que por ahora solo
muestra un estado vacío.

La vista es privada: solo accesible a un usuario autenticado, y cada usuario
únicamente puede ver y modificar su propia información, reutilizando el
mecanismo de autenticación JWT por cookies ya existente en el backend
(`requireAuth` en `authMiddleware.js`).

Quedan fuera de alcance de esta spec: la funcionalidad real de 2FA (solo se
muestra como "pendiente"), y la funcionalidad real de listado/gestión de
pedidos (solo se muestra el estado vacío). Ambas quedarán preparadas a nivel
de UI para una spec futura.

## Glossary

- **Vista Mi Cuenta**: página nueva (ruta protegida) con layout de dos
  columnas: menú lateral + panel de contenido.
- **Menú lateral**: lista vertical de secciones de la Vista Mi Cuenta ("Mi
  perfil", "Direcciones", "Mis pedidos").
- **Panel de contenido**: área a la derecha del menú lateral que pinta la
  información de la sección activa.
- **Sección activa**: ítem del menú lateral actualmente seleccionado; se
  resalta con el color de acento del tema activo.
- **Divisor**: línea vertical `|` entre menú lateral y panel de contenido,
  coloreada según el tema activo (`--color-acento` / `--color-acento-borde`
  de `_tokens.scss`).
- **Tema activo**: tema visual actual de la app (`azul` o `rojo`), gestionado
  por `themeContext.jsx` / `useTheme.js`.
- **Modo edición**: estado de un formulario de la Vista Mi Cuenta en el que
  sus inputs dejan de ser de solo lectura y admiten modificación.
- **Modal de confirmación de contraseña**: diálogo modal, estilado según el
  tema activo, que exige reintroducir la contraseña actual antes de habilitar
  una acción sensible (modificar email, eliminar cuenta). Incluye un control
  de cierre ("X") que lo descarta sin aplicar cambios.
- **Cambio de email pendiente**: solicitud de modificación de email, aún no
  aplicada al documento del usuario, a la espera de verificación por parte
  del titular de la nueva dirección de correo.
- **Dirección**: registro de dirección postal del usuario, de tipo "envío" o
  "facturación", con un título descriptivo asignado por el usuario.
- **Dirección predeterminada**: la dirección de un tipo dado (envío o
  facturación) marcada como la que se usará por defecto; se muestra en primer
  lugar del listado de su tipo.
- **Usuario autenticado**: usuario cuya sesión ha sido validada mediante el
  middleware `requireAuth` (cookie JWT `token` válida).

## Requirements

### Requisito 1: Acceso a la Vista Mi Cuenta desde el Navbar

**User Story:** Como usuario autenticado, quiero poder pulsar "Mi cuenta" o
"Mis pedidos" en el dropdown del Navbar, para acceder a mi información
personal sin tener que buscarla por otra vía.

#### Criterios de Aceptación

1. WHEN un usuario autenticado pulsa la opción "Mi cuenta" del dropdown del
   Navbar THEN el sistema DEBERÁ navegar a la Vista Mi Cuenta mostrando la
   sección "Mi perfil" como sección activa por defecto.
2. WHEN un usuario autenticado pulsa la opción "Mis pedidos" del dropdown del
   Navbar THEN el sistema DEBERÁ navegar a la Vista Mi Cuenta mostrando la
   sección "Mis pedidos" como sección activa.
3. THE Navbar SHALL seguir renderizándose de forma idéntica al resto de la
   aplicación (mismo componente genérico) cuando se muestra la Vista Mi
   Cuenta.
4. IF un usuario no autenticado intenta acceder a la ruta de la Vista Mi
   Cuenta directamente (por URL) THEN el sistema DEBERÁ redirigirlo a la
   página de login.
5. WHEN las opciones "Mi cuenta" y "Mis pedidos" del dropdown pasan a ser
   funcionales THEN el sistema DEBERÁ eliminar el atributo `aria-disabled` y
   el comportamiento de placeholder que tenían previamente.

### Requisito 2: Layout general de la Vista Mi Cuenta

**User Story:** Como usuario, quiero ver un menú de secciones claro junto a
la información correspondiente, para orientarme fácilmente dentro de mi
cuenta.

#### Criterios de Aceptación

1. THE Vista Mi Cuenta SHALL mostrar un menú lateral izquierdo con las
   secciones "Mi perfil", "Direcciones" y "Mis pedidos" apiladas verticalmente,
   y un panel de contenido a la derecha.
2. THE Vista Mi Cuenta SHALL mostrar un divisor vertical entre el menú lateral
   y el panel de contenido, cuyo color se corresponde con el color de acento
   del tema activo.
3. WHEN el usuario cambia el tema activo (azul/rojo) mientras está en la
   Vista Mi Cuenta THEN el sistema DEBERÁ actualizar el color del divisor, el
   resaltado de la sección activa y los demás elementos temáticos (iconos de
   lápiz, bordes) sin necesidad de recargar la página.
4. WHEN el usuario pulsa un ítem del menú lateral THEN el sistema DEBERÁ
   actualizar el panel de contenido con la información de esa sección y
   marcar dicho ítem como sección activa, resaltándolo con el color de acento
   del tema activo.
5. THE Vista Mi Cuenta SHALL organizar los inputs de cada formulario de
   sección en una cuadrícula de un máximo de 2 columnas por fila (hasta 3
   filas de inputs visibles agrupadas de esta forma), separando visualmente
   las columnas con un divisor `|`, en lugar de apilar todos los inputs en una
   única columna.
6. THE Vista Mi Cuenta SHALL usar únicamente las variables de color y clases
   compartidas ya definidas en `_tokens.scss` / `_shared.scss` para cualquier
   color dependiente del tema, sin declarar colores de tema propios.
7. THE Vista Mi Cuenta SHALL resolver todo texto visible mediante claves de
   `react-i18next` presentes tanto en `es.json` como en `en.json`, sin
   literales de texto en el JSX.

### Requisito 3: Consulta y visualización de datos de perfil

**User Story:** Como usuario, quiero ver mis datos personales ya guardados al
entrar en "Mi perfil", para comprobar qué información tiene la tienda sobre
mí.

#### Criterios de Aceptación

1. WHEN el usuario selecciona la sección "Mi perfil" THEN el sistema DEBERÁ
   solicitar al backend los datos del usuario autenticado y pintarlos en los
   inputs correspondientes: nombre, apellidos, nombre de usuario, teléfono y
   nacionalidad.
2. IF un campo del usuario no tiene valor almacenado en la base de datos
   (por ejemplo teléfono o nacionalidad aún no introducidos) THEN el sistema
   DEBERÁ mostrar su input vacío, sin placeholder ni texto de relleno
   indicativo.
3. THE panel "Mi perfil" SHALL mostrar la imagen de perfil del usuario de
   forma redonda y centrada en la parte superior, con un icono para
   insertar/cambiar la imagen.
4. IF el usuario no tiene imagen de perfil configurada THEN el sistema
   DEBERÁ mostrar un estado por defecto del avatar (sin imagen) manteniendo
   visible el icono de inserción.
5. THE panel "Mi perfil" SHALL mostrar, inmediatamente debajo de la imagen de
   perfil, un separador horizontal coloreado según el color de acento del
   tema activo.
6. IF la petición de datos de perfil al backend falla (error de red o del
   servidor) THEN el sistema DEBERÁ mostrar un mensaje de error traducible en
   el panel de contenido en lugar de un formulario vacío o inconsistente.

### Requisito 4: Edición de datos personales no sensibles

**User Story:** Como usuario, quiero poder modificar mis datos personales
(nombre, apellidos, nombre de usuario, teléfono, nacionalidad), para
mantenerlos actualizados.

#### Criterios de Aceptación

1. THE panel "Mi perfil" SHALL mostrar, debajo de los datos personales, un
   control "Modificar datos personales" acompañado de un icono de lápiz
   coloreado según el tema activo.
2. WHEN el usuario pulsa "Modificar datos personales" THEN el sistema DEBERÁ
   habilitar para edición los inputs de nombre, apellidos, nombre de usuario,
   teléfono y nacionalidad que tengan un valor existente.
3. IF un input de datos personales está vacío (sin valor previo) THEN el
   sistema DEBERÁ mantenerlo no seleccionable/no editable incluso en modo
   edición, hasta que dicho dato se inserte por otra vía fuera de esta spec.
4. WHEN el usuario guarda los cambios de datos personales válidos THEN el
   sistema DEBERÁ persistirlos en la base de datos asociados al usuario
   autenticado y reflejar los valores actualizados en el panel.
5. IF el usuario cancela la edición sin guardar THEN el sistema DEBERÁ
   descartar los cambios introducidos y volver a mostrar los valores
   previamente persistidos.

### Requisito 5: Validación de disponibilidad del nombre de usuario

**User Story:** Como usuario, quiero saber al instante si el nombre de
usuario que quiero poner ya está en uso, para no intentar guardar un cambio
que vaya a fallar.

#### Criterios de Aceptación

1. WHEN el usuario, en modo edición, modifica el input de nombre de usuario a
   un valor distinto de su nombre de usuario actual THEN el sistema DEBERÁ
   consultar al backend si ese nombre de usuario ya está registrado por otro
   usuario.
2. IF el nombre de usuario introducido ya existe en la base de datos (y
   pertenece a otro usuario) THEN el sistema DEBERÁ mostrar junto al input un
   mensaje en rojo tipo alerta ("¡Ese nombre de usuario ya existe!") y
   DEBERÁ impedir el guardado del formulario mientras persista ese valor.
3. IF el nombre de usuario introducido está disponible THEN el sistema
   DEBERÁ mostrar junto al input un mensaje en verde ("Nombre de usuario
   válido").
4. IF el valor introducido en el input de nombre de usuario coincide
   exactamente con el nombre de usuario actual del propio usuario THEN el
   sistema DEBERÁ tratarlo como "sin cambios", sin realizar la consulta de
   disponibilidad ni mostrar ningún mensaje de validación.
5. WHILE la consulta de disponibilidad está en curso THE input de nombre de
   usuario SHALL indicar visualmente un estado de comprobación pendiente
   (sin mostrar aún ni el mensaje verde ni el rojo).

### Requisito 6: Subida de imagen de perfil a Cloudinary

**User Story:** Como usuario, quiero poder subir una foto de perfil, para
personalizar mi cuenta.

#### Criterios de Aceptación

1. WHEN el usuario pulsa el icono de inserción/cambio de imagen y selecciona
   un archivo de imagen válido THEN el sistema DEBERÁ subir la imagen a
   Cloudinary a través de un endpoint propio del backend (usando las
   credenciales `CLOUDINARY_*` de variables de entorno, nunca hardcodeadas en
   el código fuente ni expuestas al frontend) y almacenar la URL resultante
   asociada al usuario.
2. IF el archivo seleccionado no es una imagen o excede el tamaño máximo
   permitido THEN el sistema DEBERÁ rechazar la subida y mostrar un mensaje
   de error traducible, sin modificar la imagen de perfil actual.
3. WHEN la subida de una nueva imagen se completa con éxito y el usuario ya
   tenía una imagen previa en Cloudinary THEN el sistema DEBERÁ sustituir la
   imagen anterior por la nueva en el perfil del usuario.
4. WHILE la subida de la imagen está en curso THE icono/control de subida
   SHALL reflejar un estado de carga y SHALL impedir el envío de una segunda
   subida simultánea.
5. THE endpoint de subida de imagen SHALL estar protegido por el middleware
   de autenticación (`requireAuth`), de forma que solo un usuario autenticado
   pueda subir o sustituir su propia imagen de perfil.

### Requisito 7: Visualización y modificación protegida del email

**User Story:** Como usuario, quiero que cambiar mi email requiera confirmar
mi contraseña y verificar la nueva dirección, para evitar que alguien
distinto a mí pueda secuestrar mi cuenta cambiando el correo asociado.

#### Criterios de Aceptación

1. THE panel de datos sensibles SHALL mostrar el input de email en modo solo
   lectura por defecto, junto a un control "Modificar email" con icono de
   lápiz coloreado según el tema activo.
2. WHEN el usuario pulsa "Modificar email" THEN el sistema DEBERÁ abrir un
   modal de confirmación de contraseña, estilado según el tema activo, con un
   control de cierre ("X") que lo descarta sin realizar cambios.
3. WHEN el usuario introduce su contraseña actual en el modal y esta es
   correcta THEN el sistema DEBERÁ cerrar el modal y habilitar el input de
   email para edición.
4. IF la contraseña introducida en el modal es incorrecta THEN el sistema
   DEBERÁ mostrar un mensaje de texto plano debajo del input de contraseña
   del modal indicando el error, sin habilitar el input de email.
5. WHEN el usuario, tras habilitar el input de email, introduce una nueva
   dirección y pulsa "validar" THEN el sistema DEBERÁ enviar un correo de
   verificación a la nueva dirección de email, sin modificar todavía el email
   almacenado del usuario.
6. WHEN el titular de la nueva dirección de email confirma la verificación
   (siguiendo el enlace recibido) THEN el sistema DEBERÁ actualizar el email
   del usuario en la base de datos con la nueva dirección verificada.
7. IF el enlace de verificación de cambio de email expira o no se usa antes
   de su caducidad THEN el sistema DEBERÁ mantener el email original sin
   cambios y DEBERÁ descartar la solicitud de cambio pendiente.

### Requisito 8: Bloqueo por intentos fallidos de contraseña en acciones sensibles

**User Story:** Como usuario, quiero que mi cuenta se proteja frente a
intentos repetidos de adivinar mi contraseña al intentar modificar el email o
eliminar la cuenta, para reducir el riesgo de acceso no autorizado.

#### Criterios de Aceptación

1. WHEN el usuario introduce una contraseña incorrecta en el modal de
   confirmación de contraseña THEN el sistema DEBERÁ incrementar de forma
   persistente el contador de intentos fallidos asociado a esa acción para
   ese usuario.
2. IF el número de intentos fallidos consecutivos alcanza 5 THEN el sistema
   DEBERÁ bloquear el input de contraseña del modal y mostrar un aviso claro
   de bloqueo, impidiendo nuevos intentos.
3. WHILE el bloqueo por intentos fallidos está activo THE modal de
   confirmación de contraseña SHALL rechazar cualquier intento adicional,
   incluso con la contraseña correcta, hasta que transcurran 24 horas desde
   el bloqueo.
4. WHEN transcurren 24 horas desde el momento del bloqueo THEN el sistema
   DEBERÁ restablecer automáticamente el contador de intentos fallidos y
   permitir nuevos intentos.
5. WHEN el usuario introduce la contraseña correcta antes de alcanzar el
   límite de intentos THEN el sistema DEBERÁ restablecer el contador de
   intentos fallidos de esa acción a cero.

### Requisito 9: Cambio de contraseña

**User Story:** Como usuario, quiero poder cambiar mi contraseña indicando
la actual y la nueva dos veces, para mantener mi cuenta segura.

#### Criterios de Aceptación

1. THE panel de datos sensibles SHALL mostrar tres inputs para el cambio de
   contraseña: contraseña actual, nueva contraseña y repetir nueva
   contraseña.
2. WHEN el usuario envía el formulario de cambio de contraseña THEN el
   sistema DEBERÁ verificar que la contraseña actual introducida coincide con
   la almacenada antes de aplicar cualquier cambio.
3. IF la nueva contraseña y su repetición no coinciden THEN el sistema
   DEBERÁ mostrar un mensaje de error traducible y DEBERÁ impedir el envío
   del cambio.
4. IF la contraseña actual introducida es incorrecta THEN el sistema DEBERÁ
   mostrar un mensaje de error traducible y DEBERÁ contabilizar el intento
   fallido según el Requisito 8.
5. WHEN la verificación de la contraseña actual es correcta y la nueva
   contraseña cumple los requisitos de formato ya usados en el registro
   THEN el sistema DEBERÁ actualizar el hash de contraseña almacenado del
   usuario.

### Requisito 10: Indicador de 2FA pendiente

**User Story:** Como usuario, quiero ver que existe una futura opción de
verificación en dos pasos, para saber que la tienda está trabajando en
mejorar la seguridad de mi cuenta.

#### Criterios de Aceptación

1. THE panel de datos sensibles SHALL mostrar, debajo de los inputs de email
   y contraseña, un bloque de "Verificación en dos pasos (2FA)" con un
   mensaje indicando que la funcionalidad está pendiente/próximamente.
2. THE bloque de 2FA SHALL mostrarse como no interactivo (sin controles
   funcionales de activación) en esta versión de la Vista Mi Cuenta.

### Requisito 11: Eliminación de cuenta

**User Story:** Como usuario, quiero poder eliminar mi cuenta confirmando mi
contraseña, para dejar de usar el servicio y que se elimine mi información.

#### Criterios de Aceptación

1. THE panel de datos sensibles SHALL mostrar, debajo del bloque de 2FA, un
   botón "Eliminar cuenta" con estilo de aviso (rojo).
2. WHEN el usuario pulsa "Eliminar cuenta" THEN el sistema DEBERÁ abrir el
   mismo tipo de modal de confirmación de contraseña que el de modificar
   email, incluyendo su control de cierre ("X").
3. WHEN el usuario introduce la contraseña correcta en el modal de
   eliminación de cuenta THEN el sistema DEBERÁ eliminar la cuenta del
   usuario de la base de datos de forma inmediata, sin enviar ningún correo
   de confirmación previo.
4. IF la contraseña introducida en el modal de eliminación de cuenta es
   incorrecta THEN el sistema DEBERÁ aplicar el mismo tratamiento de error y
   bloqueo por intentos fallidos definido en el Requisito 8.
5. WHEN la cuenta se elimina con éxito THEN el sistema DEBERÁ cerrar la
   sesión del usuario y redirigirlo fuera de la Vista Mi Cuenta.

### Requisito 12: Consulta y listado de direcciones

**User Story:** Como usuario, quiero ver mis direcciones de envío y de
facturación ya guardadas, para poder identificarlas rápidamente.

#### Criterios de Aceptación

1. WHEN el usuario selecciona la sección "Direcciones" THEN el sistema
   DEBERÁ solicitar al backend las direcciones de envío y de facturación
   del usuario autenticado y mostrarlas en dos bloques separados: envío y
   facturación.
2. THE sección "Direcciones" SHALL representar cada dirección registrada
   como una lámina horizontal (ancho, no alto), con bordes redondeados y
   coloreados según el tema activo, mostrando el título de la dirección en
   tipografía más grande y la dirección completa en tipografía más pequeña
   debajo.
3. THE sección "Direcciones" SHALL listar las direcciones de cada tipo en
   columna (una lámina debajo de otra).
4. IF no existe ninguna dirección registrada de un tipo (envío o
   facturación) THEN el sistema DEBERÁ mostrar únicamente el control
   "+ Nueva dirección" de ese tipo, sin ninguna lámina.
5. THE control "+ Nueva dirección" de cada tipo SHALL mostrarse siempre
   debajo de las láminas de direcciones ya pintadas de ese mismo tipo.

### Requisito 13: Creación de direcciones y reutilización entre tipos

**User Story:** Como usuario, quiero que al crear mi primera dirección se me
ofrezca reutilizarla para el otro tipo (envío/facturación), para no tener que
introducir los mismos datos dos veces.

#### Criterios de Aceptación

1. WHEN el usuario rellena el formulario de nueva dirección (de envío o de
   facturación) y pulsa "Crear" con datos válidos THEN el sistema DEBERÁ
   persistir la nueva dirección del tipo correspondiente asociada al usuario.
2. IF, en el momento de crear una dirección de un tipo, el usuario no tiene
   ninguna dirección registrada del otro tipo THEN el sistema DEBERÁ
   preguntar al usuario si desea utilizar la dirección recién creada también
   como dirección del otro tipo.
3. IF el usuario ya tiene al menos una dirección registrada del otro tipo
   THEN el sistema NO DEBERÁ mostrar dicha pregunta de reutilización.
4. WHEN el usuario confirma la reutilización de la dirección para el otro
   tipo THEN el sistema DEBERÁ crear también una dirección equivalente de ese
   otro tipo con los mismos datos.
5. IF los datos introducidos en el formulario de nueva dirección no son
   válidos (campos obligatorios vacíos o con formato incorrecto) THEN el
   sistema DEBERÁ impedir la creación y mostrar los errores de validación
   correspondientes junto a cada campo.

### Requisito 14: Dirección predeterminada y edición

**User Story:** Como usuario, quiero marcar una dirección como predeterminada
y poder editar mis direcciones existentes, para que la tienda use siempre la
que yo prefiera y mantenerlas actualizadas.

#### Criterios de Aceptación

1. THE lámina de cada dirección SHALL mostrar, antes del icono de lápiz de
   modificación, un icono para marcarla como predeterminada de su tipo.
2. WHEN el usuario marca una dirección como predeterminada THEN el sistema
   DEBERÁ desmarcar cualquier otra dirección predeterminada previa del mismo
   tipo, mover la dirección seleccionada a la primera posición del listado de
   su tipo y mostrar un indicativo visual claro de que es la predeterminada.
3. THE lámina de cada dirección SHALL mostrar un icono de lápiz, coloreado
   según el tema activo, que habilita la edición de esa dirección.
4. WHEN el usuario edita una dirección existente y guarda cambios válidos
   THEN el sistema DEBERÁ persistir los cambios y reflejarlos en la lámina
   correspondiente.
5. THE backend SHALL garantizar que, como máximo, una dirección por tipo y
   por usuario esté marcada como predeterminada en todo momento.

### Requisito 15: Sección "Mis pedidos" (estado vacío)

**User Story:** Como usuario, quiero ver una sección de "Mis pedidos" dentro
de mi cuenta, para saber dónde consultaré mis pedidos en el futuro, aunque
todavía no tenga ninguno.

#### Criterios de Aceptación

1. WHEN el usuario selecciona la sección "Mis pedidos" THEN el sistema
   DEBERÁ mostrar el mensaje "Aún no tienes ningún pedido registrado" en el
   panel de contenido.
2. THE sección "Mis pedidos" SHALL mostrar únicamente dicho mensaje de estado
   vacío en esta versión, sin realizar ninguna consulta de pedidos al
   backend.

### Requisito 16: Protección de acceso a los datos de cuenta

**User Story:** Como usuario, quiero tener la garantía de que solo yo puedo
ver y modificar mi propia información de cuenta, para que mis datos
personales y direcciones no queden expuestos a otros usuarios.

#### Criterios de Aceptación

1. THE backend SHALL proteger todos los endpoints nuevos de perfil, imagen,
   email/contraseña, direcciones y eliminación de cuenta con el middleware
   `requireAuth`.
2. WHEN se resuelve cualquier endpoint nuevo de esta feature THEN el sistema
   DEBERÁ operar exclusivamente sobre los datos del usuario identificado por
   `req.user.userId`, ignorando cualquier identificador de usuario recibido
   por parámetro, query o body.
3. IF un usuario autenticado intenta acceder o modificar datos de perfil,
   direcciones o cuenta de otro usuario (por ejemplo manipulando un
   identificador en la petición) THEN el sistema DEBERÁ rechazar la
   operación con un error de autorización.
