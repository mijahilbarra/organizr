import { Request, Response } from "express";

export function sendPrivacyPolicy(_req: Request, res: Response) {
  const appUrl = process.env.APP_URL || "https://api-45fybwj2xq-uc.a.run.app";

  res.type("html").send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Politica de privacidad | Organizr</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; margin: 0; color: #0f172a; background: #f8fafc; }
      main { max-width: 760px; margin: 0 auto; padding: 48px 20px 64px; background: #ffffff; min-height: 100vh; }
      h1 { font-size: 32px; line-height: 1.2; margin: 0 0 8px; }
      h2 { font-size: 18px; margin-top: 32px; }
      p, li { font-size: 15px; }
      .muted { color: #64748b; }
      a { color: #2563eb; }
    </style>
  </head>
  <body>
    <main>
      <h1>Politica de privacidad</h1>
      <p class="muted">Ultima actualizacion: 1 de junio de 2026</p>

      <p>Organizr ayuda a usuarios autenticados a buscar correos de Gmail, analizar ejemplos seleccionados y crear extractores reutilizables. Esta politica explica que datos procesa la aplicacion y como se usan.</p>

      <h2>Datos que procesamos</h2>
      <ul>
        <li>Datos de cuenta de Firebase, como identificador de usuario, correo, nombre y foto de perfil.</li>
        <li>Tokens de acceso de Gmail cuando el usuario conecta Gmail para permitir busquedas de solo lectura.</li>
        <li>Contenido y metadatos de correos seleccionados por el usuario para crear o ejecutar extractores.</li>
        <li>Configuracion del usuario, extractores, esquemas, operaciones generadas, webhooks y preferencias de proveedor LLM.</li>
        <li>Llaves API de Gemini u OpenAI si el usuario decide guardarlas para ejecutar analisis con su propio proveedor.</li>
      </ul>

      <h2>Como usamos los datos</h2>
      <p>Usamos los datos para autenticar al usuario, conectar Gmail, buscar mensajes solicitados, generar esquemas de extraccion, ejecutar extractores, guardar resultados y mostrar el estado de configuracion de la cuenta.</p>

      <h2>Proveedores externos</h2>
      <p>Cuando el usuario solicita analisis con IA, Organizr puede enviar muestras seleccionadas a Gemini u OpenAI, segun la configuracion disponible del usuario o del servidor. Los webhooks configurados por el usuario reciben los registros extraidos cuando corresponda.</p>

      <h2>Seguridad y secretos</h2>
      <p>Los tokens de Gmail y llaves API se guardan en el backend y no se devuelven al frontend. Las respuestas sanitizadas solo indican si una conexion o llave existe.</p>

      <h2>Control del usuario</h2>
      <p>El usuario puede revocar Gmail desde el perfil, cambiar su proveedor LLM, reemplazar llaves API, eliminar extractores y dejar de usar webhooks.</p>

      <h2>Contacto</h2>
      <p>Para consultas sobre privacidad, contacta al administrador del proyecto Organizr. URL de la aplicacion: <a href="${appUrl}">${appUrl}</a>.</p>
    </main>
  </body>
</html>`);
}
