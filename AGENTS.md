# AGENTS.md

Guia de trabajo para agentes y colaboradores en este proyecto.

## Desarrollo Activo

Este proyecto esta en desarrollo activo.

Reglas:

- No introducir codigo de retrocompatibilidad.
- No introducir excepciones de compatibilidad para payloads, rutas, documentos o UI anteriores.
- Si una estructura cambia, actualizar el flujo actual completo en lugar de mantener formas viejas en paralelo.
- Si durante un cambio aparece logica legacy o fallback de compatibilidad, eliminarla en el mismo trabajo si pertenece al scope tocado.
- Preferir contratos explicitos y unicos sobre adaptadores temporales.
- Jamas crear puertas traseras, accesos ocultos, bypasses de autorizacion o mecanismos especiales no documentados para destrabar flujos.

## Contexto Inicial

Antes de analizar o modificar el proyecto, escanear los nombres de los archivos para entender la estructura actual.

Comando recomendado:

```bash
rg --files
```

Si `rg` no esta disponible, usar `find . -type f`.

La lectura del arbol de archivos es parte del flujo de trabajo normal, porque este proyecto esta organizado por features y cada nombre de archivo comunica intencion.

## Feature Slide Design

La UI se organiza por pantallas tipo slide dentro de `src/features`.

Reglas:

- Cada feature visual debe vivir en su propia carpeta bajo `src/features/<feature>/`.
- El componente principal de una feature debe usar el patron `<FeatureName>Slide.tsx`.
- Las piezas auxiliares de una feature deben quedarse cerca de esa feature cuando no sean compartidas.
- Evitar crear pantallas genericas sin contexto de producto. Cada slide debe representar un paso claro del flujo del usuario.
- Mantener los slides enfocados: autenticacion, busqueda, esquema, script, dashboard, etc.

## Funciones Independientes

Todas las funciones deben vivir en archivos independientes: una funcion principal por archivo.

Reglas:

- El archivo debe tener un nombre explicito que describa la accion.
- El nombre de la funcion debe coincidir con la intencion del archivo.
- Evitar archivos tipo `utils.ts`, `helpers.ts` o `services.ts` cuando oculten varias responsabilidades.
- Si una funcion crece o mezcla responsabilidades, dividirla en archivos mas pequenos y explicitos.
- Las funciones de backend deben seguir el patron actual bajo `server/features/<domain>/<action>.ts`.
- Antes de crear una funcion nueva, buscar por nombre e intencion en el arbol de archivos. Si ya existe logica equivalente, reutilizarla o extraer un helper explicito en lugar de duplicar codigo.
- Si dos endpoints necesitan el mismo flujo de lectura, busqueda, validacion o transformacion, compartir esa parte en una funcion independiente con nombre de dominio.
- Despues de cambios que agreguen logica, correr `npm run duplicates` y revisar clones nuevos. No introducir duplicacion funcional en backend, auth, Firebase, Gmail, Firestore o llamadas API.

Ejemplos actuales:

- `server/features/auth/requireFirebaseUser.ts`
- `server/features/auth/verifyFirebaseIdToken.ts`
- `server/features/emails/searchEmails.ts`
- `server/features/extractors/createExtractor.ts`

## Documentacion Visual

El flujo principal debe mantenerse documentado con Mermaid en `sequence-diagram.md`.
La estructura persistida de entidades debe mantenerse documentada con Mermaid en `entityDiagram.md`.

Reglas:

- Actualizar `sequence-diagram.md` cuando cambie la interaccion entre usuario, frontend, backend, Gmail, Gemini, Firebase o webhooks.
- Actualizar `entityDiagram.md` cuando cambien colecciones, documentos persistidos, campos guardados, relaciones o estructuras embebidas relevantes.
- El diagrama debe mostrar quien inicia cada accion y que sistema responde.
- El diagrama de entidades debe distinguir entre colecciones reales de Firestore y estructuras embebidas cuando aplique.
- Si se agrega un endpoint, una pantalla o una integracion externa relevante, revisar si el diagrama necesita cambios.
- Mantener el diagrama como referencia de producto e implementacion, no como decoracion.

## Firebase Runtime

Durante cambios relacionados con Firebase:

- Reemplazar supuestos de runtime por configuracion explicita.
- Mantener separadas las decisiones de frontend, backend, autenticacion, persistencia y deploy.
- Preferir Firestore para datos persistentes si reemplaza la base local actual.
- Documentar cambios de flujo en `sequence-diagram.md` cuando Firebase entre en el recorrido.

## Endpoints Para Agentes

Algunos endpoints pueden estar diseniados para trabajar mejor con agentes tipo Custom GPT, no solo con UIs tradicionales.

Approach recomendado:

- Permitir un primer intento incompleto orientado por intencion, por ejemplo un `message` en lenguaje natural.
- Si la intencion sola no alcanza para persistir con seguridad, responder con el contexto exacto del recurso actual y con la forma explicita del payload esperado.
- Esperar un segundo intento del agente con el payload completo y validable antes de guardar.
- Mantener la persistencia final basada en contratos explicitos, no en texto libre.

Casos donde este approach es util:

- Ediciones complejas donde el agente necesita contexto actual del recurso antes de construir el cambio completo.
- Flujos donde pedirle al agente que acierte el payload correcto en el primer intento produce muchos errores.
- Operaciones donde conviene separar "entender la intencion" de "persistir datos".
- Integraciones con Custom GPTs o asistentes que funcionan mejor cuando el backend corrige el rumbo y devuelve estructura esperada.

Beneficios:

- Reduce la cantidad de instrucciones fijas que necesita el agente para operar bien.
- Disminuye payloads mal formados en el primer intento.
- Mantiene el backend como autoridad del contrato final.
- Hace mas auditable el cambio persistido porque el guardado ocurre solo con datos estructurados.
- Permite que el backend devuelva contexto vivo del recurso en lugar de depender de contexto viejo embebido en el prompt del agente.

Tradeoff:

- El endpoint puede tener una fase intermedia donde todavia no persiste nada.
- Esa fase no debe tratarse como error de producto si forma parte normal del flujo del agente.
- Si se usa este patron, documentar claramente en OpenAPI, README y prompts del agente que el flujo puede requerir dos llamadas.
- En OpenAPI, cada `description` de path, method, operation o schema debe mantenerse corta y directa. Limite maximo: 300 caracteres por description.

Ejemplo:

1. Un Custom GPT quiere editar un extractor y envia solo:

```json
{
  "message": "Agrega el campo total y renombra fecha a issuedAt"
}
```

2. El backend no guarda todavia. Responde con:

- El extractor actual.
- Un codigo como `MANUAL_PAYLOAD_REQUIRED`.
- Un prompt sugerido o contexto estructurado para ayudar al agente a construir el cambio correcto.

3. El agente usa esa respuesta para generar el payload final:

```json
{
  "schemaFields": [
    { "fieldName": "issuedAt", "fieldType": "string" },
    { "fieldName": "vendor", "fieldType": "string" },
    { "fieldName": "total", "fieldType": "number" }
  ],
  "subjectScripts": [
    {
      "subjectId": "sub_1",
      "subject": "Factura de compra",
      "scriptCode": "function extractData(body, subject, sender) { return { issuedAt: '2026-06-01', vendor: 'ACME', total: 120.5 }; }",
      "validationSample": {
        "body": "<html>...</html>"
      }
    }
  ]
}
```

4. El backend valida que el parser y el schema coincidan y recien entonces persiste el cambio.

Regla de diseno:

- Si un endpoint sigue este patron, su comportamiento debe ser intencional y explicito: primer paso para orientar al agente, segundo paso para persistir con contrato cerrado.

## Tickets Para Codex

La coleccion de tickets vive en Firestore como `tickets`.

Campos principales:

- `description`: descripcion del ticket.
- `urgency`: numero del 1 al 5.
- `state`: `backlog`, `todo`, `doing`, `onreview` o `done`.
- `user`: cuenta actual en la UI, o `codex` cuando se crea por script.

Codex debe usar los scripts del proyecto con las credenciales Firebase Admin/service account ya configuradas:

```bash
npm run tickets:read
npm run tickets:read -- --state todo
npm run tickets:create -- --description "Descripcion del ticket" --urgency 3 --state backlog
npm run tickets:update-state -- --id <ticketId> --state done
```

Cuando el usuario pida algo como "resuelve los tickets en to-do", primero leer `todo`. Si Codex recoge un ticket, debe cambiarlo inmediatamente a `doing` con `tickets:update-state`, implementar los cambios necesarios y verificar.

Al resolver tickets, Codex no debe crear ramas nuevas. El trabajo de tickets ocurre sobre la rama actual porque Codex puede estar atendiendo varios tickets en paralelo y cambiar de branch destruye el flujo de trabajo compartido. Si la rama actual no parece correcta, detenerse y pedir instruccion explicita antes de tocar git.

Cuando Codex termine la implementacion de un ticket, debe moverlo a `onreview`, resumir lo hecho y pedir explicitamente al usuario que lo revise y lo coloque en `done` si esta conforme. Codex no debe mover tickets terminados a `done` por su cuenta.

La revision de cambios de un ticket la hace el usuario. Codex no debe usar el browser de Codex para aprobar visualmente o funcionalmente un ticket en revision; puede correr verificaciones tecnicas necesarias, pero la aceptacion final corresponde al usuario.

Cuando el usuario coloque un ticket en `done` o pida procesar tickets en `done`, Codex debe escanear los cambios locales con `git status --short` y `git diff`, revisar que el scope corresponda al ticket aprobado, correr las verificaciones relevantes, crear un commit descriptivo y subirlo al repo remoto. No mezclar en ese commit cambios no relacionados con el ticket.
