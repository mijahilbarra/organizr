import { Request, Response } from "express";
import { getCustomGptOAuthConfig } from "./getCustomGptOAuthConfig";

function getFirebaseClientConfig() {
  return {
    apiKey: process.env.ORGANIZR_WEB_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "",
    authDomain: process.env.ORGANIZR_WEB_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.ORGANIZR_WEB_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.ORGANIZR_WEB_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.ORGANIZR_WEB_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.ORGANIZR_WEB_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || "",
  };
}

export function sendOAuthAuthorizePage(req: Request, res: Response) {
  const clientId = String(req.query.client_id || "");
  const redirectUri = String(req.query.redirect_uri || "");
  const state = String(req.query.state || "");
  const responseType = String(req.query.response_type || "");
  const scope = String(req.query.scope || getCustomGptOAuthConfig().defaultScope);
  const firebaseConfig = getFirebaseClientConfig();

  if (!clientId || !redirectUri || responseType !== "code") {
    return res.status(400).type("html").send("<h1>Invalid OAuth request</h1>");
  }

  res.type("html").send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Autorizar Organizr Custom GPT</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      main { max-width: 520px; margin: 0 auto; padding: 48px 20px; }
      section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
      h1 { font-size: 24px; margin: 0 0 12px; }
      p { color: #475569; line-height: 1.6; }
      button { width: 100%; border: 0; border-radius: 10px; padding: 12px 16px; background: #0f172a; color: #fff; font-weight: 700; cursor: pointer; }
      button:disabled { opacity: .6; cursor: wait; }
      .error { color: #b91c1c; font-size: 14px; min-height: 20px; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Autorizar Organizr Custom GPT</h1>
        <p>Inicia sesion con Google para permitir que ChatGPT identifique tu cuenta de Organizr y ejecute acciones autorizadas.</p>
        <button id="authorize">Iniciar sesion y autorizar</button>
        <p id="error" class="error"></p>
      </section>
    </main>
    <script type="module">
      import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
      import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

      const firebaseConfig = ${JSON.stringify(firebaseConfig)};
      const oauthRequest = ${JSON.stringify({ clientId, redirectUri, state, scope })};
      const button = document.getElementById("authorize");
      const error = document.getElementById("error");
      const missingKeys = Object.entries(firebaseConfig)
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missingKeys.length > 0) {
        button.disabled = true;
        error.textContent = "Firebase OAuth no esta configurado en el servidor: " + missingKeys.join(", ");
        throw new Error(error.textContent);
      }

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/gmail.readonly");

      button.addEventListener("click", async () => {
        button.disabled = true;
        error.textContent = "";
        try {
          const result = await signInWithPopup(auth, provider);
          const firebaseIdToken = await result.user.getIdToken();
          const response = await fetch("/oauth/create-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...oauthRequest, firebaseIdToken }),
          });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "No se pudo autorizar.");
          window.location.href = payload.redirectUrl;
        } catch (err) {
          error.textContent = err.message || "No se pudo autorizar.";
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`);
}
