---
description: Ejecuta la siguiente tarea pendiente de tasks.md para una feature y marca su checkbox
argument-hint: <nombre-feature> [número de tarea opcional]
---

Vas a ejecutar UNA tarea de implementación de `.specs/<feature>/tasks.md`, siguiendo la metodología spec-driven descrita en `CLAUDE.md`.

Argumentos del usuario (nombre de feature y, opcionalmente, un número de tarea concreto a ejecutar en vez de "la siguiente pendiente"):

$ARGUMENTS

## Pasos

1. Localiza `.specs/<feature>/requirements.md`, `design.md` y `tasks.md`. Si falta alguno, detente y avísalo (sugiere el comando que falta: `/spec-requirements`, `/spec-design` o `/spec-tasks`). No escribas código sin los tres documentos.
2. Lee `tasks.md` completo para tener el contexto de dependencias.
3. Identifica la tarea a ejecutar:
   - Si el usuario indicó un número concreto, usa esa tarea (verifica que sus dependencias declaradas ya están marcadas `[x]`; si no lo están, avisa y pregunta si continuar de todos modos).
   - Si no, toma la **primera tarea/subtarea no marcada `[ ]`** en orden del documento cuyas dependencias ya estén completadas.
   - Si no queda ninguna tarea pendiente, informa al usuario de que `tasks.md` está completo y no hagas nada más.
4. Lee también `requirements.md` y `design.md` en las partes relevantes a esta tarea, para implementarla de forma consistente con lo ya aprobado.
5. Implementa **únicamente** el alcance de esa tarea (no adelantes trabajo de tareas posteriores).
6. **Verificación de compilación/build.** Ejecuta los comandos relevantes al código tocado (`npm run build`, `npm run lint`, arranque del servidor, tests si existen para esa tarea, etc.). Si algo falla, corrígelo antes de continuar — no marques la tarea como completada con errores pendientes.
7. **Revisión de seguridad de lo implementado en esta tarea.** Repasa el diff en busca de problemas relevantes al alcance tocado: inyección (SQL/NoSQL/comandos), XSS, secretos o credenciales hardcodeadas, validación/sanitización ausente en entradas de usuario, fallos de autenticación/autorización, uso incorrecto de criptografía (hashing, JWT, tokens), exposición de datos sensibles en respuestas o logs, y cabeceras/cookies de seguridad mal configuradas. Si la tarea es de alto riesgo (auth, tokens, manejo de contraseñas, validación de entrada) o el usuario lo pide, invoca el skill `security-review` para una revisión más profunda. Si encuentras algo, corrígelo antes de continuar.
8. Marca la tarea como `[x]` en `.specs/<feature>/tasks.md` (y su(s) subtarea(s) si aplica). Si la tarea tiene subtareas y solo completaste una parte, marca solo las subtareas realmente terminadas y dilo explícitamente.
9. Muestra al usuario el diff de los cambios de código y del propio `tasks.md`, junto con un resumen de la verificación de build/tests y de la revisión de seguridad (qué se comprobó, qué se corrigió si algo).
10. **No hagas commit.** El usuario hace los commits manualmente a su ritmo; tu trabajo termina en el diff verificado y la tarea marcada.
11. No pases automáticamente a la siguiente tarea: pregunta al usuario si quiere continuar con la siguiente o parar aquí. El push y la apertura del PR (para que GitHub Actions valide el conjunto de commits acumulados) solo se hacen cuando el usuario lo pida explícitamente — nunca de forma automática tras una tarea.
