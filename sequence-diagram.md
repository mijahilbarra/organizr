# Sequence Diagrams

Este documento describe el flujo vivo por historias de usuario. Debe actualizarse cuando cambien pantallas, endpoints, integraciones o persistencia.

## Historia 1: Autenticarse Con Firebase Auth Y Autorizar Gmail

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant FirebaseAuth as Firebase Auth
  participant GoogleProvider as Google Provider
  participant Function as Firebase Function api
  participant Firestore as Firestore

  User->>Frontend: Abre la app
  Frontend->>Frontend: Lee configuracion VITE_FIREBASE_*
  Frontend-->>User: Muestra landing con beneficios y CTA Crear cuenta o Iniciar sesion
  User->>Frontend: Presiona Crear cuenta o Iniciar sesion
  Frontend->>FirebaseAuth: signInWithPopup(GoogleProvider + gmail.readonly)
  FirebaseAuth->>GoogleProvider: Solicita identidad y scope Gmail readonly
  User->>GoogleProvider: Autoriza cuenta y permisos
  GoogleProvider-->>FirebaseAuth: Devuelve credencial Google
  FirebaseAuth-->>Frontend: Devuelve usuario Firebase
  Frontend->>Frontend: Obtiene Firebase ID token
  Frontend->>Function: getProfile() con Authorization Firebase
  Function->>Firestore: Crea o lee users/{uid}
  Firestore-->>Function: Perfil y estado Gmail
  Function-->>Frontend: Devuelve perfil sin access token
  alt Google entrega access token Gmail
    Frontend->>Function: connectGmail(accessToken, expiresInSeconds) con Authorization Firebase
    Function->>Firestore: Guarda access token en users/{uid} con expiracion real derivada del proveedor
    Function-->>Frontend: Devuelve perfil con Gmail conectado
  end
  Frontend->>Function: listExtractors() con Authorization Firebase
  Function->>Firestore: Consulta extractors donde userId = uid
  Function-->>Frontend: Devuelve extractores
  Frontend-->>User: Oculta landing y muestra dashboard con opcion de crear extractor
  User->>Frontend: Abre el menu Avatar y entra a /profile
  Frontend-->>User: Muestra ProfileSlide fuera del flujo principal
```

## Historia 2: Crear Extractor Con Primer Asunto Y Buscar Correos Candidatos

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Gmail as Gmail API

  User->>Frontend: Entra a /extractors/create y escribe el primer asunto del correo
  Frontend->>Frontend: Guarda el asunto inicial como subjects del extractor en creacion
  Frontend->>Function: searchEmails(subject) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee token Gmail persistido en users/{uid}
  alt Token activo
    Function->>Gmail: Busca mensajes candidatos con access token Gmail
  else Token ausente, revocado o expirado
    Function->>Firestore: Limpia conexion Gmail vencida si aun seguia persistida
    Function-->>Frontend: Solicita reconectar Gmail
  end
  Gmail-->>Function: Lista de mensajes y metadata
  Function-->>Frontend: Devuelve correos candidatos
  Frontend-->>User: Muestra correos candidatos para seleccionar y extraer
```

## Historia 3: Analizar Un Correo Y Proponer Esquema

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Gemini as Gemini API
  participant OpenAI as OpenAI API

  User->>Frontend: Selecciona correos ejemplo
  Frontend->>Function: analyzeEmails(emails, provider auto/gemini/openai) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee users/{uid} y capacidades Gmail/LLM sin exponer secretos
  alt Gemini disponible por usuario o servidor
    Function->>Gemini: Solicita esquema y datos extraidos
    Gemini-->>Function: Esquema propuesto y extraccion inicial
  else OpenAI disponible por usuario o servidor
    Function->>OpenAI: Solicita esquema y datos extraidos
    OpenAI-->>Function: Esquema propuesto y extraccion inicial
  else Falta proveedor LLM
    Function-->>Frontend: Devuelve actionCode CONFIGURE_LLM_PROVIDER y actionUrl /profile
  end
  Function->>Firestore: Incrementa users/{uid}.llmConsumeByMonth para la llamada LLM
  loop Rebotes de perfeccionamiento
    Function->>Function: Prueba parser contra correos seleccionados
    alt Proveedor resuelto es Gemini
      Function->>Gemini: Envia fallos, campos vacios y feedback del parser
      Gemini-->>Function: Devuelve parser/esquema corregido
    else Proveedor resuelto es OpenAI
      Function->>OpenAI: Envia fallos, campos vacios y feedback del parser
      OpenAI-->>Function: Devuelve parser/esquema corregido
    end
    Function->>Firestore: Incrementa users/{uid}.llmConsumeByMonth por cada rebote LLM
  end
  Function-->>Frontend: Devuelve propuesta y logs informativos
  Frontend-->>User: Muestra esquema, datos y log de refinamiento
```

## Historia 4: Ajustar Esquema Antes De Aprobar

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Gemini as Gemini API
  participant OpenAI as OpenAI API

  User->>Frontend: Edita campos detectados
  Frontend->>Function: Envia esquema actualizado, contexto y provider auto/gemini/openai
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee users/{uid}, extractors/{extractorId} y valida userId
  alt Gemini disponible por usuario o servidor
    Function->>Gemini: Ajusta propuesta con instrucciones del usuario
    Gemini-->>Function: Nueva propuesta de esquema y datos
    Function->>Firestore: Persiste extractors/{extractorId} actualizado e incrementa consumo LLM
  else OpenAI disponible por usuario o servidor
    Function->>OpenAI: Ajusta propuesta con instrucciones del usuario
    OpenAI-->>Function: Nueva propuesta de esquema y datos
    Function->>Firestore: Persiste extractors/{extractorId} actualizado e incrementa consumo LLM
  else Falta proveedor LLM requerido
    Function-->>Frontend: Devuelve actionCode CONFIGURE_GEMINI_API_KEY, CONFIGURE_OPENAI_API_KEY o CONFIGURE_LLM_PROVIDER
  end
  Function-->>Frontend: Devuelve propuesta actualizada
  Frontend-->>User: Muestra revision actualizada
```

## Historia 5: Crear Y Guardar Extractor

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Gemini as Gemini API
  participant Firestore as Firestore
  participant Pending as Pending computed queue

  User->>Frontend: Aprueba esquema
  Frontend->>Function: createExtractor(schema, subjects, initialEmails) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Gemini: Genera script extractor JS
  Gemini-->>Function: Script extractor
  Function->>Function: testExtractor(script, exampleEmails)

  alt Extractor valido
    Function->>Firestore: Guarda documento extractors/{extractorId} con userId, metadata y sampleEmails/sampleExtractedResults
    alt LLM disponible
      Function->>Firestore: Resuelve campos computed en lote antes de persistir las operaciones iniciales
    else Sin LLM activo
      Function->>Firestore: Marca operations iniciales con computedStatus=pending y pendingComputedFields
      Function->>Pending: Encola operaciones pendientes para resolverlas mas tarde
    end
    Function->>Firestore: Crea operations/{extractorId_emailId} para emails nuevos e incrementa operationCount
    Function-->>Frontend: Devuelve extractor guardado
    Frontend->>Function: listExtractorOperations(extractorId, page, limit 20)
    Function->>Firestore: Lee operationCount acumulado del extractor y operations por extractorId
    Function-->>Frontend: Devuelve pagina, totalCount y totalPages
    Frontend-->>User: Muestra /extractors con cards de extractores guardados
    User->>Frontend: Selecciona una card de extractor
    Frontend-->>User: Abre /extractors/{extractorId} con la tabla paginada
  else Extractor invalido
    Function-->>Frontend: Devuelve error o solicita ajuste
    Frontend-->>User: Muestra estado para correccion
  end
```

## Historia 6: Ejecutar Extractor Existente Y Agregar Asuntos

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Gmail as Gmail API
  participant Gemini as Gemini API
  participant Pending as Pending computed queue

  User->>Frontend: Agrega un nuevo asunto al extractor existente
  Frontend->>Function: addExtractorSubject(extractorId, subject) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractors/{extractorId} y valida userId
  Function->>Firestore: Lee token Gmail persistido en users/{uid}
  Function->>Gmail: Busca correos candidatos por el nuevo subject
  Gmail-->>Function: Devuelve correos candidatos
  Function->>Firestore: Consulta operations/{extractorId_emailId} para evitar duplicados
  Function->>Firestore: Procesa las coincidencias como lote y rellena campos computed solo con LLM
  Function->>Gemini: Extrae datos usando solo el esquema actual del extractor
  Gemini-->>Function: Devuelve datos estructurados por email
  opt Campos computed/calculado sin LLM activo
    Function->>Firestore: Marca cada operation con computedStatus=pending
    Function->>Pending: Agrega la operation a la cola de pendientes
  end
  Function->>Firestore: Guarda operations nuevas e incrementa operationCount
  Function->>Firestore: Actualiza subject y contadores en extractors/{extractorId}
  Function-->>Frontend: Devuelve extractor actualizado y conteo extraido
  Frontend->>Function: listExtractorOperations(extractorId, page 1, limit 20)
  Function-->>Frontend: Devuelve pagina actualizada con totalCount y totalPages
  Frontend-->>User: Muestra tabla principal actualizada y mantiene subjects en panel lateral

  User->>Frontend: Ejecuta extractor o sincroniza correos con fechas opcionales
  Frontend->>Function: triggerExtractor(extractorId, after, before) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractors/{extractorId}, valida userId y lee token Gmail
  Firestore-->>Function: Configuracion del extractor compartido
  alt Token Gmail activo
    loop Por cada asunto registrado
      Function->>Gmail: Busca correos por subject y rango de fechas con access token Gmail
    end
  else Token ausente, revocado o expirado
    Function-->>Frontend: Solicita reconectar Gmail
  end
  Gmail-->>Function: Correos nuevos
  Function->>Firestore: Consulta operations/{extractorId_emailId} para evitar duplicados
  Function->>Function: Ejecuta script extractor
  Function->>Firestore: Resuelve campos computed en lote antes de persistir
  opt Campos computed/calculado sin LLM activo o sin valor resuelto
    Function->>Firestore: Marca la operation con computedStatus=pending y pendingComputedFields
    Function->>Firestore: Acumula la operation en la cola de pendientes
  end
  Function->>Firestore: Guarda operations nuevas e incrementa operationCount
  Function->>Firestore: Actualiza lastScannedAt y triggerCount en extractors/{extractorId}
  Function-->>Frontend: Devuelve resultados
  Frontend->>Function: listExtractorOperations(extractorId, page 1, limit 20)
  Function-->>Frontend: Devuelve pagina actualizada con totalCount y totalPages
  Frontend-->>User: Actualiza tabla paginada como vista principal

  User->>Frontend: Pide cambios de esquema en el panel lateral
  Frontend->>Function: schemaEdit(extractorId, message) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractors/{extractorId} con schema, parsers y samples persistidos
  Function->>Firestore: Lee extractors/{extractorId} y valida userId
  Function->>Gemini: Edita schemaFields y scriptCode con contexto del chat
  Gemini-->>Function: Devuelve extractor actualizado y mensaje de asistente
  Function->>Firestore: Incrementa users/{uid}.llmConsumeByMonth
  Function->>Firestore: Persiste extractors/{extractorId} actualizado
  Function-->>Frontend: Devuelve extractor, mensaje y logs de Gemini
  Frontend-->>User: Actualiza tabla, chat y panel lateral con el esquema vigente

  User->>Frontend: Elimina un extractor guardado
  Frontend->>Function: deleteExtractor(extractorId) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractors/{extractorId} y valida userId
  Function->>Firestore: Borra extractors/{extractorId}
  Function-->>Frontend: Confirma eliminacion
  Frontend-->>User: Quita extractor del dashboard
```

## Historia 7: Configurar Y Enviar A Webhook Externo

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Webhook as Webhook externo

  User->>Frontend: Configura webhook
  Frontend->>Function: updateWebhook(extractorId, url) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Actualiza extractors/{extractorId} tras validar userId
  Function-->>Frontend: Confirma configuracion
  Frontend-->>User: Muestra webhook activo

  User->>Frontend: Solicita enviar extraccion
  Frontend->>Function: sendToWebhook(extractorId, extractionId) con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee extractors/{extractorId}, valida userId y obtiene extraccion/webhook
  Firestore-->>Function: Datos extraidos y URL
  Function->>Webhook: Envia datos extraidos
  Webhook-->>Function: Respuesta del endpoint
  Function-->>Frontend: Devuelve estado de envio
  Frontend-->>User: Muestra resultado del envio
```

## Historia 8: Gestionar Tickets En Kanban

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  actor Codex as Codex CLI
  participant Frontend as Frontend React
  participant FirebaseAuth as Firebase Auth
  participant Firestore as Firestore
  participant AdminScript as Scripts Firebase Admin

  User->>Frontend: Abre /tickets desde el footer
  Frontend->>FirebaseAuth: Usa cuenta actual autenticada
  Frontend->>Firestore: onSnapshot(tickets)
  Firestore-->>Frontend: Devuelve tickets y cambios en vivo
  Frontend-->>User: Muestra kanban Backlog, To do, Doing, On review y Done

  User->>Frontend: Crea, edita, borra o arrastra un ticket
  Frontend->>Firestore: Escribe tickets/{ticketId} con usuario, urgencia y state
  Firestore-->>Frontend: Notifica snapshot actualizado
  Frontend-->>User: Refresca columnas del kanban

  Codex->>AdminScript: npm run tickets:read -- --state todo
  AdminScript->>Firestore: Lee coleccion tickets con Firebase Admin
  Firestore-->>AdminScript: Devuelve tickets filtrados por estado
  AdminScript-->>Codex: Imprime tickets y estados
  Codex->>AdminScript: npm run tickets:create o tickets:update-state
  AdminScript->>Firestore: Crea ticket como codex o cambia state
  Firestore-->>Frontend: Notifica snapshot actualizado
```

## Historia 9: Ver Perfil, Actualizar Datos Y Revocar Gmail

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant Frontend as Frontend React
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant GoogleOAuth as Google OAuth

  User->>Frontend: Abre Profile
  Frontend->>Function: getProfile() con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee users/{uid}
  Function-->>Frontend: Devuelve perfil sin access token
  Frontend-->>User: Muestra datos, estado Gmail y consumo LLM mensual

  User->>Frontend: Actualiza nombre o foto
  Frontend->>Function: updateProfile(displayName, photoURL)
  Function->>Firestore: Guarda perfil actualizado en users/{uid}
  Function-->>Frontend: Devuelve perfil actualizado

  User->>Frontend: Revoca Gmail
  Frontend->>Function: revokeGmail()
  Function->>Firestore: Lee access token persistido en users/{uid}
  Function->>GoogleOAuth: Revoca access token
  Function->>Firestore: Elimina conexion Gmail en users/{uid}
  Function-->>Frontend: Devuelve perfil sin Gmail conectado
```

## Historia 10: Crear Extractor Desde Custom GPT Y Completar Análisis Manual

```mermaid
sequenceDiagram
  autonumber
  actor User as Usuario
  participant CustomGPT as Custom GPT
  participant Function as Firebase Function api
  participant FirebaseAuth as Firebase Admin Auth
  participant Firestore as Firestore
  participant Gmail as Gmail API
  participant Gemini as Gemini API

  User->>CustomGPT: Pide crear un extractor desde un asunto Gmail
  CustomGPT->>Function: getGptSessionCapabilities() con Authorization Firebase
  Function->>FirebaseAuth: Verifica Firebase ID token
  FirebaseAuth-->>Function: Usuario verificado
  Function->>Firestore: Lee users/{uid} y estado Gmail
  alt Gmail y proveedor LLM disponibles
    Function-->>CustomGPT: Devuelve READY y capacidades GPT-safe
    CustomGPT->>Function: createExtractorFromGmailSubject(subject)
    Function->>Firestore: Lee access token Gmail persistido en users/{uid}
    Function->>Gmail: Busca mensajes candidatos por subject
    Gmail-->>Function: Devuelve correos candidatos
    alt Gemini u OpenAI disponibles
      Function->>Gemini: Analiza muestras y propone schema/script
      Gemini-->>Function: Devuelve propuesta de extractor
      Function->>Firestore: Guarda extractors/{extractorId}
      Function->>Firestore: Guarda operaciones iniciales en lote y resuelve campos computed
      Function-->>CustomGPT: Devuelve extractor, emailCount y actionUrl
      CustomGPT-->>User: Confirma extractor creado y enlace a Organizr
    else Solo Custom GPT disponible
      Function-->>CustomGPT: Devuelve CUSTOM_GPT_ANALYSIS_REQUIRED con muestras, subject y shape esperado
      CustomGPT->>CustomGPT: Redacta analysis con schemaFields, scriptCode y sampleExtractedResults
      CustomGPT->>Function: createExtractorFromCustomGptAnalysis(subject, emails, analysis)
      Function->>Firestore: Guarda extractors/{extractorId}
      Function->>Firestore: Guarda operaciones iniciales en lote y resuelve campos computed
      Function-->>CustomGPT: Devuelve extractor, emailCount y actionUrl
      CustomGPT-->>User: Confirma extractor creado y enlace a Organizr
    end
  else Falta autenticacion, Gmail o proveedor LLM
    Function-->>CustomGPT: Devuelve codigo accionable, nextSteps y actionUrl
    CustomGPT-->>User: Solicita completar conexion en Organizr
  end

  CustomGPT->>Function: listPendingComputedOperations(extractorId)
  Function->>Firestore: Lee operations con computedStatus=pending
  Function-->>CustomGPT: Devuelve cola pendiente
  CustomGPT->>Function: processPendingComputedOperations(extractorId)
  Function->>Firestore: Recorre operaciones pendientes y completa campos con LLM disponible
  Function->>Firestore: Actualiza operations con computedStatus completo o pendiente
  Function-->>CustomGPT: Devuelve lote procesado
```
