# Requirements Document

## Introduction

Esta feature construye el catálogo de videojuegos de GalinGames: el dropdown
de plataformas del Navbar (hoy "Juegos" es un placeholder deshabilitado en
`ENLACES_PROXIMAMENTE` de `Navbar.jsx`), el grid de portadas del Home (hoy
`GamesGrid.jsx` usa un array estático `JUEGOS` con imágenes locales de
`public/`), una nueva vista de plataforma con breadcrumb, y una nueva vista
de detalle de juego con una cabecera de ancho completo (wallpaper) bajo el
Navbar y una sección "INFO" con especificaciones y características al hacer
scroll. Todas estas vistas pasan a alimentarse de una colección de juegos en
MongoDB que no existe todavía en el backend (`GalinGames_nodejs/src/models/`).

La feature también define el modelo de datos completo de un juego (portada,
wallpaper, vídeo de preview, plataformas disponibles con su formato
físico/digital, precio, stock, especificaciones técnicas y características
generales), las reglas de negocio de fecha de estreno (compra vs. reserva) y
de stock (compra vs. aviso por email cuando vuelva a haber disponibilidad,
reutilizando `emailService.js`), la migración a Cloudinary de las imágenes y
wallpapers del catálogo, y los datos reales de los 6 juegos que hoy están
hardcodeados en el Home: Assassin's Creed Black Flag Resynced, The Blood of
Dawnwalker, Dragon Ball: Sparking! Zero, EA Sports FC 27, Grand Theft Auto VI
y Marvel's Wolverine.

Quedan explícitamente **fuera de alcance** de esta spec: el flujo real de
compra/checkout, la gestión de reservas como transacción, y cualquier panel
de administración completo para gestionar el catálogo. Los controles de
"Comprar" y "Reservar" quedan preparados a nivel de UI (visibles, con la
lógica de qué botón mostrar ya resuelta) pero sin ejecutar ningún pedido
real. Para poder probar el flujo de aviso de stock se habilita el mínimo
mecanismo necesario para modificar el stock de un juego (ver Requisito 18),
sin que esto constituya un panel de administración.

## Glossary

- **Catálogo de juegos**: conjunto de documentos de la colección `games` de
  MongoDB que representan los videojuegos vendidos en la tienda.
- **Dropdown de plataformas**: menú desplegable del Navbar que sustituye al
  placeholder actual de "Juegos", con 4 opciones: PC, PlayStation, Xbox y
  Nintendo, cada una con su icono SVG inline.
- **Plataforma**: una de las 4 categorías fijas del catálogo: `PC`,
  `PlayStation`, `Xbox`, `Nintendo`.
- **Disponibilidad de plataforma**: subdocumento embebido en un juego que
  representa los datos propios de la combinación juego+plataforma: formatos
  disponibles, precio, stock y especificaciones técnicas.
- **Formato**: modo de adquisición de un juego en una plataforma concreta,
  `fisico` o `digital`. En la plataforma `PC` solo existe el formato
  `digital`; en `PlayStation`, `Xbox` y `Nintendo` puede haber uno, otro o
  ambos.
- **Fecha de estreno**: fecha real de lanzamiento original del juego (no la
  fecha de alta del documento en la base de datos).
- **Juego estrenado**: juego cuya fecha de estreno es anterior o igual a la
  fecha actual.
- **Juego en preventa**: juego cuya fecha de estreno es posterior a la fecha
  actual.
- **Tarjeta de juego**: componente `GameCard` que representa un juego en el
  Home o en la Vista de Plataforma: imagen de portada (con vídeo de preview
  al pasar el ratón), nombre, plataforma asociada a esa tarjeta y precio.
- **Vídeo de preview**: vídeo corto en bucle (no un tráiler) asociado a un
  juego, reproducido en la tarjeta mientras el ratón está encima.
- **Vista de Plataforma**: página nueva que muestra título, subtítulo,
  breadcrumb y el grid de tarjetas de los juegos disponibles en una
  plataforma concreta.
- **Vista de Detalle del Juego**: página nueva que muestra toda la
  información de un juego concreto para una plataforma seleccionada.
- **Cabecera de la Vista de Detalle**: bloque de ancho completo, situado
  inmediatamente debajo del Navbar, que usa la imagen wallpaper del juego
  como fondo y que muestra superpuestos un div con la portada del juego (a
  la izquierda) y un div con plataforma/stock/precio/acción (a la derecha).
- **Sección INFO**: bloque que aparece al hacer scroll por debajo de la
  Cabecera, sobre el fondo normal de la página (no sobre el wallpaper), con
  la información y especificaciones técnicas ampliadas del juego y el
  bloque de características.
- **Características del juego**: conjunto de datos generales del juego
  (número de jugadores, online, crossplay, HDR, mandos compatibles) que se
  muestran como divs individuales dentro de la Sección INFO.
- **Chip de stock**: indicador visual del estado de stock (con stock / sin
  stock) de la combinación juego+plataforma actualmente seleccionada en la
  Vista de Detalle del Juego.
- **Suscripción de disponibilidad**: registro que vincula a un usuario
  autenticado con una combinación juego+plataforma para notificarle por
  email cuando el stock pase de 0 a un valor mayor que 0.
- **Especificaciones técnicas**: datos de requisitos para poder ejecutar el
  juego en una plataforma. Para `PC`: CPU, RAM, GPU, almacenamiento y
  sistema operativo/DirectX, en perfil mínimo y recomendado. Para el resto
  de plataformas: espacio en disco necesario y notas adicionales (p. ej.
  "PS5 Pro Enhanced").
- **Descripción del juego**: sinopsis/texto de presentación del producto,
  almacenada en el campo `descripcion` del documento del juego en MongoDB,
  mostrada en la Sección INFO de la Vista de Detalle.
- **Proyección reducida**: forma de un juego devuelta por los endpoints de
  listado (`/destacados`, `/plataforma/:plataforma`) que excluye
  deliberadamente los campos pesados (`descripcion`, especificaciones,
  características), a diferencia de la proyección completa que devuelve el
  endpoint de detalle (`/:id`).

## Requirements

### Requisito 1: Dropdown de plataformas en el Navbar

**User Story:** Como usuario, quiero pulsar "Juegos" en el Navbar y ver las
plataformas disponibles, para poder navegar directamente al catálogo de la
plataforma que me interesa.

#### Criterios de Aceptación

1. WHEN el catálogo de juegos pasa a ser funcional THEN el sistema DEBERÁ
   eliminar `'navbar.linkJuegos'` del array `ENLACES_PROXIMAMENTE` de
   `Navbar.jsx` y el atributo `aria-disabled` asociado a dicho enlace.
2. WHEN el usuario pulsa o activa por teclado el enlace "Juegos" del Navbar
   THEN el sistema DEBERÁ desplegar un dropdown con 4 opciones: PC,
   PlayStation, Xbox y Nintendo, cada una precedida de su icono de
   plataforma.
3. THE dropdown de plataformas SHALL seguir el mismo patrón de accesibilidad
   e interacción que `LanguageToggle.jsx`: `aria-haspopup="true"`,
   `aria-expanded` sincronizado con su estado, `role="menu"` con
   `role="menuitem"` en cada opción, cierre al hacer click fuera y cierre con
   la tecla Escape.
4. WHEN el usuario pulsa una plataforma del dropdown THEN el sistema DEBERÁ
   navegar a la Vista de Plataforma correspondiente y cerrar el dropdown.
5. THE iconos de PC, PlayStation, Xbox y Nintendo SHALL implementarse como
   SVG inline propios (mismo patrón que `NavbarIconos.jsx`, sin librería de
   iconos externa), heredando el color del tema activo vía `currentColor`.

### Requisito 2: Grid de juegos del Home alimentado por el backend

**User Story:** Como usuario, quiero ver en el Home juegos reales de la
tienda con su precio, para hacerme una idea del catálogo disponible antes de
navegar más.

#### Criterios de Aceptación

1. WHEN se carga el Home THEN el sistema DEBERÁ solicitar al backend la
   lista de juegos destacados a través de un nuevo servicio (p. ej.
   `servicios/gameService.js`, construido sobre `httpClient.js` siguiendo el
   mismo patrón que `accountService.js`) en lugar de usar el array estático
   `JUEGOS` actualmente definido en `GamesGrid.jsx`.
2. THE Home SHALL seguir mostrando exactamente 6 tarjetas de juego.
3. WHILE la petición de juegos destacados está en curso THE `GamesGrid`
   SHALL mostrar un estado de carga en lugar de un grid vacío o con datos
   inconsistentes.
4. IF la petición de juegos destacados falla (error de red o del servidor)
   THEN el sistema DEBERÁ mostrar un mensaje de error traducible en lugar
   del grid, sin dejar tarjetas a medio pintar.
5. THE backend SHALL asignar a cada uno de los 6 juegos destacados una
   plataforma distinta de entre las que ese juego tiene disponibles, de
   forma que las tarjetas del Home muestren variedad de plataformas.

### Requisito 3: Contenido y formato de la tarjeta de juego

**User Story:** Como usuario, quiero ver de un vistazo el nombre, la
plataforma y el precio de cada juego en su tarjeta, para comparar opciones
sin tener que entrar en cada una.

#### Criterios de Aceptación

1. THE tarjeta de juego (`GameCard`) SHALL mostrar el texto en el formato
   `"<nombreJuego>" - <plataforma>   <precio>`, usando la plataforma e
   importe recibidos del backend para esa tarjeta.
2. THE precio mostrado en la tarjeta SHALL formatearse como moneda en euros
   acorde al idioma activo (`react-i18next` / `Intl.NumberFormat`), nunca
   como número plano concatenado.
3. IF la imagen de portada del juego falla al cargar THEN el sistema DEBERÁ
   mantener el comportamiento de fallback ya existente en `GameCard.jsx`
   (bloque `game-card__fallback` con el nombre del juego).
4. THE tarjeta de juego SHALL reutilizarse sin cambios de comportamiento
   tanto en el Home como en la Vista de Plataforma.

### Requisito 4: Vídeo de preview al pasar el ratón sobre la tarjeta

**User Story:** Como usuario, quiero ver un vídeo corto del juego al pasar el
ratón por su tarjeta, para hacerme una idea del gameplay sin salir del
listado.

#### Criterios de Aceptación

1. WHEN el puntero del ratón entra en el área de una tarjeta de juego THEN el
   sistema DEBERÁ sustituir la imagen de portada por el vídeo de preview del
   juego, reproducido en bucle (`loop`), silenciado y sin controles.
2. WHEN el puntero del ratón sale del área de la tarjeta THEN el sistema
   DEBERÁ volver a mostrar la imagen de portada, deteniendo la reproducción
   del vídeo.
3. THE vídeo de preview SHALL reproducirse a partir de la URL almacenada en
   el propio documento del juego (campo de vídeo), sin que el frontend ni el
   backend generen, transcodifiquen o suban ningún fichero de vídeo nuevo en
   esta feature.
4. IF un juego no tiene vídeo de preview asociado THEN el sistema DEBERÁ
   mantener visible la imagen de portada de forma permanente para esa
   tarjeta, sin error visible para el usuario.
5. THE comportamiento de vídeo en hover SHALL activarse únicamente en
   dispositivos con puntero de tipo ratón (no debe intentar activarse por
   toque en dispositivos táctiles sin puntero).

### Requisito 5: Navegación desde una tarjeta a la Vista de Detalle del Juego

**User Story:** Como usuario, quiero pulsar sobre una tarjeta de juego para
ver toda su información, para decidir si quiero comprarlo o reservarlo.

#### Criterios de Aceptación

1. WHEN el usuario pulsa sobre una tarjeta de juego (en el Home o en la Vista
   de Plataforma) THEN el sistema DEBERÁ navegar a la Vista de Detalle del
   Juego correspondiente, identificando el juego por su identificador de
   MongoDB.
2. WHEN la navegación a la Vista de Detalle del Juego se origina desde una
   tarjeta que muestra una plataforma concreta THEN el sistema DEBERÁ
   preseleccionar esa misma plataforma en el select de la Vista de Detalle
   del Juego.
3. IF el identificador de juego de la URL no corresponde a ningún juego
   existente THEN el sistema DEBERÁ mostrar un estado de "juego no
   encontrado" traducible, en lugar de una vista de detalle vacía o rota.

### Requisito 6: Vista de Plataforma

**User Story:** Como usuario, quiero ver solo los juegos disponibles en la
plataforma que elegí, para no tener que buscar entre juegos que no me sirven.

#### Criterios de Aceptación

1. WHEN el usuario navega a la Vista de Plataforma de una plataforma
   concreta THEN el sistema DEBERÁ mostrar un título con el nombre de esa
   plataforma y un subtítulo acorde a ella.
2. THE Vista de Plataforma SHALL mostrar, debajo del título y subtítulo, un
   breadcrumb padre que indique la categoría/plataforma actual dentro de la
   navegación del sitio.
3. WHEN se carga la Vista de Plataforma THEN el sistema DEBERÁ solicitar al
   backend únicamente los juegos que tienen esa plataforma entre sus
   plataformas disponibles y pintarlos como tarjetas de juego debajo del
   breadcrumb.
4. IF ninguna plataforma tiene juegos disponibles para la plataforma
   seleccionada THEN el sistema DEBERÁ mostrar un mensaje de estado vacío
   traducible en lugar de un grid vacío sin explicación.
5. WHEN el usuario pulsa una tarjeta dentro de la Vista de Plataforma THEN el
   sistema DEBERÁ aplicar el mismo comportamiento de navegación y
   preselección de plataforma definido en el Requisito 5.

### Requisito 7: Cabecera de la Vista de Detalle del Juego (wallpaper)

**User Story:** Como usuario, quiero que la ficha de un juego tenga una
cabecera visual grande con la imagen ambiente del juego y sus datos clave
bien organizados, para identificar el juego y su disponibilidad de un
vistazo.

#### Criterios de Aceptación

1. WHEN se carga la Vista de Detalle del Juego THEN el sistema DEBERÁ
   mostrar, inmediatamente debajo del Navbar, una cabecera de ancho completo
   que usa la imagen wallpaper del juego como fondo.
2. THE cabecera SHALL mostrar, superpuestos sobre el wallpaper, un div a la
   izquierda con la imagen de portada del juego y un div a la derecha con el
   select de plataforma (Requisito 9), el chip de stock (Requisito 12), el
   precio de la combinación seleccionada y el control de acción
   correspondiente (Comprar/Reservar/Avisarme, Requisito 12).
3. WHEN el usuario hace scroll hacia abajo en la Vista de Detalle del Juego
   THEN el sistema DEBERÁ mostrar, a continuación de la cabecera y sobre el
   fondo normal de la página (no sobre el wallpaper), la Sección INFO con la
   información y especificaciones ampliadas del juego (Requisito 10) y el
   bloque de características (Requisito 8).
4. THE cabecera SHALL mantener una altura estable, sin expandirse ni
   recortarse por la longitud del nombre del juego o el contenido del div
   derecho.
5. IF el juego no tiene imagen wallpaper todavía cargada THEN el sistema
   DEBERÁ mostrar un fondo de respaldo (color/degradado del tema) en la
   cabecera en lugar de un hueco vacío o una imagen rota.

### Requisito 8: Características del juego en la Sección INFO

**User Story:** Como usuario, quiero ver si el juego es de un jugador o
multijugador, si tiene online, crossplay, HDR y qué mandos soporta, para
saber si se ajusta a cómo juego.

#### Criterios de Aceptación

1. THE Sección INFO SHALL mostrar, debajo de la información y
   especificaciones ampliadas, un bloque de características del juego
   representado como divs individuales.
2. THE bloque de características SHALL incluir como mínimo: número de
   jugadores (un jugador / multijugador, con el número máximo si aplica),
   disponibilidad de modo online, disponibilidad de crossplay,
   disponibilidad de HDR y compatibilidad de mandos.
3. IF alguna característica no está definida para un juego concreto (dato no
   disponible) THEN el sistema DEBERÁ ocultar ese div de característica en
   lugar de mostrarlo vacío o con un valor por defecto engañoso.
4. THE backend SHALL almacenar estas características a nivel de juego (no
   por plataforma), de forma que no cambien al cambiar la plataforma
   seleccionada en el select.

### Requisito 9: Select de plataforma en la Vista de Detalle del Juego

**User Story:** Como usuario, quiero poder cambiar de plataforma dentro de la
ficha de un juego, para consultar precio, stock y requisitos de la
plataforma que realmente me interesa.

#### Criterios de Aceptación

1. THE Vista de Detalle del Juego SHALL mostrar un select con únicamente las
   plataformas en las que ese juego concreto está disponible.
2. WHEN se abre la Vista de Detalle del Juego THEN el sistema DEBERÁ
   preseleccionar en el select la plataforma de origen (Requisito 5.2) si
   fue indicada, o la primera plataforma disponible del juego en caso
   contrario.
3. WHEN el usuario cambia la plataforma seleccionada en el select THEN el
   sistema DEBERÁ actualizar, sin recargar la página, los datos mostrados de
   formato disponible, precio, especificaciones técnicas y chip de stock
   para la nueva combinación juego+plataforma, usando los datos ya recibidos
   en la petición del Requisito 7.1 (sin necesidad de una nueva petición al
   backend).

### Requisito 10: Especificaciones técnicas por plataforma

**User Story:** Como usuario, quiero ver los requisitos técnicos del juego
para la plataforma que elegí, para saber si podré ejecutarlo.

#### Criterios de Aceptación

1. WHEN la plataforma seleccionada en el select es `PC` THEN el sistema
   DEBERÁ mostrar, dentro de la Sección INFO, dos bloques de
   especificaciones técnicas, mínimas y recomendadas, cada uno con CPU, RAM,
   GPU, almacenamiento requerido y sistema operativo/DirectX.
2. WHEN la plataforma seleccionada es `PlayStation`, `Xbox` o `Nintendo`
   THEN el sistema DEBERÁ mostrar, dentro de la Sección INFO, el espacio en
   disco requerido para esa plataforma y, si existen, notas adicionales
   asociadas (p. ej. "PS5 Pro Enhanced", "Steam Deck Verified").
3. IF la combinación juego+plataforma seleccionada no tiene especificaciones
   técnicas registradas THEN el sistema DEBERÁ ocultar el bloque de
   especificaciones en lugar de mostrarlo vacío o con valores `null`
   visibles.

### Requisito 11: Formato físico/digital según plataforma

**User Story:** Como usuario, quiero saber si puedo comprar un juego en
formato físico o solo en digital según la plataforma, para elegir la opción
que prefiero.

#### Criterios de Aceptación

1. THE backend SHALL garantizar, a nivel de validación del documento del
   juego, que la plataforma `PC` únicamente admite el formato `digital`.
2. THE backend SHALL permitir que las plataformas `PlayStation`, `Xbox` y
   `Nintendo` tengan registrado el formato `fisico`, el formato `digital`, o
   ambos, para una misma combinación juego+plataforma.
3. WHEN la plataforma seleccionada en la Vista de Detalle del Juego es `PC`
   THEN el sistema DEBERÁ mostrar únicamente la disponibilidad en formato
   digital, sin ofrecer selector de formato.
4. WHEN la plataforma seleccionada tiene registrados ambos formatos
   (`fisico` y `digital`) THEN el sistema DEBERÁ mostrar de forma visible
   que ambos están disponibles para esa combinación.

### Requisito 12: Chip de stock y control de acción condicional

**User Story:** Como usuario, quiero ver claramente si un juego tiene stock y
qué puedo hacer al respecto (comprarlo, reservarlo o pedir que me avisen),
para saber qué esperar antes de intentar adquirirlo.

#### Criterios de Aceptación

1. THE Cabecera de la Vista de Detalle del Juego SHALL mostrar un chip que
   indique si hay stock (>0) o no hay stock (=0) para la combinación
   juego+plataforma actualmente seleccionada.
2. WHEN la fecha de estreno del juego es posterior a la fecha actual (juego
   en preventa) THEN el sistema DEBERÁ mostrar el control "Reservar" como
   acción disponible, con independencia del valor de stock.
3. WHEN la fecha de estreno del juego es anterior o igual a la fecha actual
   (juego estrenado) Y el stock de la combinación juego+plataforma
   seleccionada es mayor que 0 THEN el sistema DEBERÁ mostrar el control
   "Comprar" como acción disponible.
4. WHEN la fecha de estreno del juego es anterior o igual a la fecha actual Y
   el stock de la combinación juego+plataforma seleccionada es igual a 0
   THEN el sistema DEBERÁ ocultar el control "Comprar" y mostrar en su lugar
   el control "Avisarme cuando haya stock".
5. THE controles "Comprar" y "Reservar" SHALL quedar implementados a nivel
   de interfaz (visibles, habilitados, con la lógica de qué mostrar ya
   resuelta) pero SHALL NOT ejecutar ningún flujo de pedido, pago o reserva
   real en esta feature.

### Requisito 13: Suscripción a aviso de disponibilidad de stock

**User Story:** Como usuario, quiero pedir que me avisen por email cuando un
juego agotado vuelva a tener stock, para no tener que comprobarlo yo mismo
cada cierto tiempo.

#### Criterios de Aceptación

1. WHEN un usuario autenticado pulsa "Avisarme cuando haya stock" en una
   combinación juego+plataforma sin stock THEN el sistema DEBERÁ registrar
   una suscripción de disponibilidad asociada a su `userId`, el juego y esa
   plataforma.
2. IF el usuario no está autenticado y pulsa "Avisarme cuando haya stock"
   THEN el sistema DEBERÁ redirigirlo a la página de login antes de poder
   registrar la suscripción.
3. IF el usuario ya tiene una suscripción de disponibilidad activa para esa
   misma combinación juego+plataforma THEN el sistema DEBERÁ evitar crear un
   duplicado y mostrar un mensaje confirmando que ya está apuntado.
4. WHEN el stock de una combinación juego+plataforma pasa de 0 a un valor
   mayor que 0 THEN el sistema DEBERÁ enviar, para cada suscripción de
   disponibilidad activa de esa combinación, un correo usando
   `emailService.js` (mismo patrón de plantilla HTML y remitente "GalinGames"
   ya usado en `sendVerificationEmail`/`sendEmailChangeVerification`) con un
   enlace directo a la Vista de Detalle de ese juego.
5. WHEN el correo de disponibilidad se envía correctamente para una
   suscripción THEN el sistema DEBERÁ marcar esa suscripción como notificada
   o eliminarla, de forma que no se vuelva a notificar al mismo usuario por
   la misma combinación juego+plataforma en el futuro (salvo que se vuelva a
   agotar y se suscriba de nuevo).

### Requisito 14: Modelo de datos del juego en MongoDB

**User Story:** Como equipo de desarrollo, quiero un modelo de datos que
represente fielmente un juego con todas sus plataformas y características,
para poder pintar correctamente el catálogo y aplicar las reglas de negocio
de estreno y stock.

#### Criterios de Aceptación

1. THE backend SHALL definir un nuevo modelo Mongoose `Game` en
   `GalinGames_nodejs/src/models/Game.js` con, como mínimo: nombre, slug,
   URL de imagen de portada, URL de imagen wallpaper, URL de vídeo de
   preview, fecha de estreno, características generales (Requisito 8) y un
   array de disponibilidad por plataforma.
2. THE subdocumento de disponibilidad por plataforma SHALL incluir: nombre
   de la plataforma (`PC`, `PlayStation`, `Xbox`, `Nintendo`), formatos
   disponibles (`fisico`/`digital`), precio, stock (entero, por defecto 0) y
   especificaciones técnicas (estructura distinta para `PC` que para el
   resto, según Requisito 10).
3. THE backend SHALL definir un nuevo modelo Mongoose
   `GameStockSubscription.js` (o campo equivalente embebido) que referencie
   al usuario mediante `ObjectId` con `ref: 'User'`, al juego mediante
   `ObjectId` con `ref: 'Game'`, y a la plataforma concreta suscrita,
   siguiendo el mismo patrón de referencia por `ObjectId` ya usado en
   `Address.js`.
4. THE backend SHALL validar, a nivel de schema, que el precio y el stock de
   cada plataforma sean valores numéricos no negativos.
5. WHEN se actualiza el stock de una combinación juego+plataforma THEN el
   sistema DEBERÁ realizar la actualización mediante una operación atómica
   (`findOneAndUpdate` con `$inc` o condición equivalente) en lugar de una
   transacción multi-documento, dado que el entorno de MongoDB de desarrollo
   no dispone de replica set.
6. THE campo de características generales SHALL incluir, como mínimo:
   jugadores (mínimo/máximo o un valor "un jugador"/"multijugador"), online
   (booleano), crossplay (booleano), HDR (booleano) y una lista de mandos
   compatibles.

### Requisito 15: Endpoints públicos de consulta del catálogo

**User Story:** Como frontend, quiero endpoints claros para listar juegos
destacados, juegos por plataforma y el detalle de un juego, para alimentar
el Home, la Vista de Plataforma y la Vista de Detalle sin lógica ad-hoc.

#### Criterios de Aceptación

1. THE backend SHALL exponer un endpoint público (sin `requireAuth`) que
   devuelva los 6 juegos destacados del Home, cada uno con la plataforma
   asignada (Requisito 2.5) y su precio para esa plataforma.
2. THE backend SHALL exponer un endpoint público que devuelva los juegos
   disponibles para una plataforma dada, para alimentar la Vista de
   Plataforma.
3. THE backend SHALL exponer un endpoint público que devuelva el documento
   completo de un juego por su identificador, incluyendo todas sus
   plataformas disponibles, para alimentar la Vista de Detalle del Juego.
4. THE endpoint de suscripción de disponibilidad (Requisito 13.1) SHALL ser
   el único endpoint de esta feature protegido con `requireAuth`, y SHALL
   operar exclusivamente sobre `req.user.userId`, ignorando cualquier
   identificador de usuario recibido por parámetro, query o body.
5. IF se solicita un juego, plataforma o combinación que no existe en
   cualquiera de estos endpoints THEN el sistema DEBERÁ responder con un
   error 404 gestionado por el patrón `AppError`/`globalErrorHandler` ya
   existente, no con un array vacío disfrazado de éxito.

### Requisito 16: Reglas de fecha de estreno

**User Story:** Como negocio, quiero que la fecha de estreno determine
automáticamente si un juego se puede comprar o solo reservar, para no tener
que gestionarlo manualmente juego a juego.

#### Criterios de Aceptación

1. THE backend SHALL almacenar la fecha de estreno de cada juego como la
   fecha real de lanzamiento original del producto, no la fecha de creación
   del documento en la base de datos.
2. WHEN se calcula si un juego está "estrenado" o "en preventa" THEN el
   sistema DEBERÁ comparar la fecha de estreno almacenada contra la fecha
   actual del servidor en el momento de la petición, tanto en frontend como
   en cualquier validación futura de backend que dependa de este estado.
3. THE sistema SHALL NOT permitir que un juego en preventa (fecha de estreno
   futura) se presente con el control "Comprar" bajo ninguna circunstancia,
   independientemente de su valor de stock.

### Requisito 17: Internacionalización de los textos nuevos

**User Story:** Como usuario que cambia el idioma de la app, quiero que todo
el catálogo de juegos esté traducido, para tener una experiencia consistente
en español e inglés.

#### Criterios de Aceptación

1. THE feature SHALL resolver todo texto visible nuevo (dropdown de
   plataformas, Vista de Plataforma, Cabecera y Sección INFO de la Vista de
   Detalle del Juego, chip de stock, controles de acción, bloque de
   características, mensajes de estado vacío/error) mediante claves de
   `react-i18next`.
2. THE claves nuevas SHALL añadirse tanto a
   `GalinGames_react/src/i18n/locales/es.json` como a
   `GalinGames_react/src/i18n/locales/en.json`, con la misma estructura de
   claves en ambos ficheros, bajo un namespace nuevo (p. ej. `juegos`).
3. THE clave existente `navbar.linkJuegos` SHALL reutilizarse como texto del
   enlace "Juegos" del dropdown, sin duplicarla.

### Requisito 18: Migración de imágenes y datos reales de los 6 juegos existentes

**User Story:** Como equipo de desarrollo, quiero poblar la colección de
juegos con datos e imágenes reales de los 6 títulos que hoy están
hardcodeados en el Home, migrando sus imágenes a Cloudinary, para que la
migración a datos dinámicos no pierda contenido y refleje casos reales de
estreno/stock.

#### Criterios de Aceptación

1. THE seed de datos SHALL incluir los 6 juegos siguientes con su fecha de
   estreno real y sus plataformas reales: Assassin's Creed Black Flag
   Resynced (9 jul 2026; PC, PlayStation, Xbox), The Blood of Dawnwalker (3
   sep 2026; PC, PlayStation, Xbox), Dragon Ball: Sparking! Zero (11 oct
   2024; PC, PlayStation, Xbox, Nintendo), EA Sports FC 27 (25 sep 2026; PC,
   PlayStation, Xbox, Nintendo), Grand Theft Auto VI (19 nov 2026;
   PlayStation, Xbox) y Marvel's Wolverine (15 sep 2026; PlayStation).
2. THE seed SHALL marcar como "con stock" (mayor que 0 en todas sus
   plataformas) el juego Assassin's Creed Black Flag Resynced, y como "sin
   stock" (0 en todas sus plataformas) el juego Dragon Ball: Sparking! Zero,
   siendo ambos los únicos juegos ya estrenados del conjunto a fecha de
   creación de esta spec.
3. THE seed SHALL marcar con stock pendiente de entrar (0, a la espera del
   estreno) las plataformas de los 4 juegos en preventa: The Blood of
   Dawnwalker, EA Sports FC 27, Grand Theft Auto VI y Marvel's Wolverine.
4. THE seed SHALL migrar a Cloudinary, siguiendo el mismo patrón de subida ya
   usado para `avatarUrl`/`avatarPublicId` de `User`, las imágenes de
   portada de los 6 juegos que hoy existen como ficheros estáticos en
   `GalinGames_react/public/` (`assassins.jpg`, `blooddownwalker.jpg`,
   `dragonball.jpg`, `fc27.jpg`, `gta.jpg`, `wolverine.jpg`), almacenando la
   URL segura resultante de Cloudinary en el campo de imagen de portada de
   cada documento `Game`, en lugar de servir la imagen desde una ruta
   estática del frontend.
5. WHEN se disponga de una imagen wallpaper descargada para un juego (de una
   fuente oficial o verificada por el usuario) THEN el sistema DEBERÁ
   subirla también a Cloudinary antes de guardar su URL en el campo
   wallpaper del documento `Game` correspondiente.
6. THE seed SHALL usar directamente las URLs de vídeo de preview ya
   proporcionadas (alojadas externamente) en el campo de vídeo de cada
   documento `Game`, sin necesidad de descargarlas ni volver a subirlas a
   Cloudinary.
7. IF, al preparar el seed, no se dispone todavía de una imagen wallpaper
   propia para alguno de los 6 juegos THEN el sistema DEBERÁ dejar ese campo
   pendiente de forma explícita (documentado en `tasks.md`) en lugar de
   inventar o reutilizar una imagen no verificada por el usuario, y el
   equipo de desarrollo DEBERÁ solicitar dicha imagen antes de dar el seed
   por completo.
8. THE especificaciones técnicas de PC del seed SHALL corresponder a los
   requisitos mínimos y recomendados reales investigados para cada juego con
   versión de PC (todos salvo Grand Theft Auto VI y Marvel's Wolverine, que
   no tienen versión de PC anunciada).
9. THE procedimiento de migración de imágenes SHALL documentarse paso a paso
   en `tasks.md`, indicando exactamente qué comando o script ejecutar y qué
   archivo local o URL proporcionar en cada caso, de forma que el usuario
   pueda completarlo sin tener que interpretar código.

### Requisito 19: Todo el contenido de cada juego proviene de MongoDB

**User Story:** Como equipo de desarrollo, quiero que absolutamente todo el
contenido específico de un juego (nombre, descripción, especificaciones,
características, precios, disponibilidad) viva en la base de datos y nunca
en el código fuente, para que añadir o editar un juego no implique tocar
código y para que la solución escale a un catálogo de miles de títulos sin
crecer en líneas de código por cada uno.

#### Criterios de Aceptación

1. THE documento `Game` SHALL incluir un campo `descripcion` (sinopsis del
   producto) con el texto de presentación de cada juego, además de los
   campos ya definidos en el Requisito 14.
2. THE frontend SHALL NOT contener, en código fuente ni en ficheros de
   i18n, ningún texto descriptivo específico de un juego concreto (nombre,
   sinopsis, especificaciones, características); todo ese contenido SHALL
   leerse exclusivamente de la respuesta de los endpoints de `/api/games`.
3. THE namespace `juegos` de i18n (Requisito 17) SHALL limitarse a
   literales de interfaz genéricos (etiquetas, botones, mensajes de
   estado), nunca a contenido propio de un juego concreto.
4. WHEN se añade un juego nuevo al catálogo (vía un script de seed o
   inserción directa en MongoDB) THEN el sistema NO DEBERÁ requerir ningún
   cambio de código en frontend o backend para que ese juego se muestre
   correctamente en el Home, la Vista de Plataforma y la Vista de Detalle.
5. THE endpoints de listado (`/destacados`, `/plataforma/:plataforma`)
   SHALL devolver una proyección reducida de cada juego (sin `descripcion`
   ni especificaciones ni características) y el endpoint de detalle
   (`/:id`) SHALL devolver el documento completo, de forma que el
   contenido pesado de un juego solo viaje por red cuando realmente se
   necesita, sin requerir una colección separada para conseguirlo.
