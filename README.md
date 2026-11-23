# GalinGames

Aplicación web para la gestión de compra de videojuegos **físicos y digitales** destinada a usuarios registrados. Permite navegar el catálogo, añadir productos al carrito y completar pedidos, diferenciando entre formato físico (envío a domicilio) y digital (descarga inmediata). Solo los usuarios con cuenta activa pueden realizar compras.

## Tecnologías

- **Frontend:** React + Vite
- **Backend:** Node.js

## Metodología: Spec Driven Development

El proyecto sigue **Spec Driven Development (SDD)**: antes de implementar una funcionalidad, se definen formalmente sus especificaciones. El flujo tiene tres fases:

1. **Requirements** — el agente recoge y documenta los requisitos funcionales y no funcionales.
2. **Design** — el agente propone la arquitectura, los componentes y el flujo de datos para cumplirlos. El usuario revisa y aprueba el documento.
3. **Tasks** — el agente desglosa el diseño en tareas pequeñas, verificables y con dependencias explícitas.

El agente se ocupa de la estructuración y el diseño; el objetivo es que el usuario practique la implementación:

- Las tareas de `tasks.md` se etiquetan como `[PRÁCTICA]` o `[AGENTE]`. Si no tienen etiqueta, se consideran `[PRÁCTICA]`.
- Por defecto, el usuario realiza las tareas de código, tests, integración y verificación manual. El agente no las implementa: puede explicar conceptos, dar pistas progresivas y revisar el código cuando se lo pidan.
- El agente puede ejecutar tareas de documentación/spec y las tareas `[AGENTE]`. El usuario puede delegar explícitamente una tarea `[PRÁCTICA]` concreta cuando quiera.
- Las tareas se realizan de una en una y respetando sus dependencias. Para cada feature, se aprueban los requisitos y el diseño antes de empezar a implementar.

Las reglas operativas completas están en [CLAUDE.md](./CLAUDE.md).
