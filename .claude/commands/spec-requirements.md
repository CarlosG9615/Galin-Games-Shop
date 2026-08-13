---
description: Genera requirements.md en notación EARS para una feature nueva
argument-hint: <descripción de la feature>
---

Vas a generar el documento `requirements.md` de una nueva feature siguiendo la metodología spec-driven descrita en `CLAUDE.md` (sección "Metodología Spec-Driven").

Descripción de la feature proporcionada por el usuario:

$ARGUMENTS

## Pasos

1. A partir de la descripción, deriva un nombre de feature en kebab-case (ej. `carrito-compra`, `pagos-stripe`). Si ya existe una carpeta en `.specs/` que claramente corresponde a esta feature, reutilízala; si no, créala.
2. Comprueba si `.specs/<feature>/requirements.md` ya existe:
   - Si existe, muéstraselo al usuario y pregunta si quiere ampliarlo/regenerarlo o si se refiere a otra feature, antes de sobrescribir nada.
3. Explora el código relevante del proyecto (frontend `GalinGames_react/`, backend `GalinGames_nodejs/`) para entender componentes, endpoints o modelos existentes que la feature vaya a tocar o reutilizar. No asumas nombres de archivos: verifícalos.
4. Redacta `.specs/<feature>/requirements.md` con esta estructura:
   - `# Requirements Document`
   - `## Introduction` — resumen de qué cubre la feature y por qué.
   - `## Glossary` — términos y componentes clave usados en los criterios (nombres de componentes, servicios, modelos).
   - `## Requirements` — una sección `### Requisito N: <título>` por cada capacidad, cada una con:
     - `**User Story:** Como <rol>, quiero <capacidad>, para <beneficio>.`
     - `#### Criterios de Aceptación` — lista numerada, cada criterio en notación EARS:
       - `WHEN [condición] THEN el sistema DEBERÁ [comportamiento]`
       - `IF [condición] THEN el sistema DEBERÁ [comportamiento]` (para casos de error/excepción)
       - `WHILE [estado] THE <componente> SHALL [comportamiento]` (para comportamiento continuo)
       - `WHERE [contexto/entorno] THE <componente> SHALL [comportamiento]` (para comportamiento condicionado al entorno)
       - `THE <componente> SHALL [comportamiento]` (para invariantes sin condición)
   - Cubre explícitamente casos de error, validación de entradas, límites/tamaños, y seguridad cuando aplique — no solo el camino feliz.
5. Muestra el documento generado al usuario para su revisión.
6. Recuérdale explícitamente: **no se generará código ni `design.md` hasta que apruebe este `requirements.md`**. Pregunta si lo aprueba tal cual, quiere ajustes, o prefiere seguir directamente a `/spec-design`.
