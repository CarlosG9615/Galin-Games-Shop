---
description: Genera design.md a partir del requirements.md de una feature
argument-hint: <nombre-feature>
---

Vas a generar el documento `design.md` de una feature siguiendo la metodología spec-driven descrita en `CLAUDE.md`.

Nombre de la feature indicado por el usuario:

$ARGUMENTS

## Pasos

1. Localiza `.specs/<feature>/requirements.md`. Si no existe:
   - Detente y avisa al usuario: no se puede generar `design.md` sin `requirements.md` aprobado. Sugiere ejecutar `/spec-requirements` primero. No continúes.
2. Lee `requirements.md` completo. Si además ya existe `.specs/<feature>/design.md`, léelo también (puede ser una regeneración/ampliación en vez de una creación desde cero).
3. Explora el código real del proyecto (`GalinGames_react/`, `GalinGames_nodejs/`) para basar el diseño en la arquitectura, convenciones y componentes que realmente existen — no inventes rutas, nombres de archivo o dependencias sin comprobarlas.
4. Redacta `.specs/<feature>/design.md` cubriendo, como mínimo:
   - `## Overview` — resumen técnico de la solución.
   - `## Architecture` — diagrama (usa mermaid si aporta claridad) de los componentes implicados y cómo se conectan.
   - `## Components and Interfaces` — estructura de carpetas/archivos nuevos o modificados, firmas de funciones/módulos clave.
   - `## Data Models` — esquemas de datos si aplica.
   - `## API Design` — endpoints, request/response, códigos de estado si aplica.
   - `## Security` / `## Error Handling` — cuando la feature lo requiera.
   - `## Design Decisions` — alternativas consideradas y por qué se descartaron, en formato tabla si es posible.
   - Referencia explícitamente los números de requisito de `requirements.md` que cada decisión de diseño cubre (ej. "Valida: Requisitos 2.3, 5.1").
5. Verifica que **todos** los requisitos de `requirements.md` quedan cubiertos por al menos una parte del diseño; si detectas huecos, señálalos en vez de omitirlos silenciosamente.
6. Muestra el documento generado al usuario para su revisión.
7. Recuérdale explícitamente: **no se generará código hasta que apruebe este `design.md`** (y el `requirements.md` previo). Pregunta si lo aprueba, quiere ajustes, o prefiere seguir directamente a `/spec-tasks`.
