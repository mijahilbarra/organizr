import express from "express";
import path from "path";
import dotenv from "dotenv";
import { hasFirebaseAdminCredentials } from "./server/firebase/hasFirebaseAdminCredentials";

// Import modular features (each function/endpoint inside its own file)
import { requireFirebaseUser } from "./server/features/auth/requireFirebaseUser";
import { searchEmails } from "./server/features/emails/searchEmails";
import { analyzeEmails } from "./server/features/analyze/analyzeEmails";
import { testExtractor } from "./server/features/analyze/testExtractor";
import { createExtractor } from "./server/features/extractors/createExtractor";
import { listExtractors } from "./server/features/extractors/listExtractors";
import { triggerExtractor } from "./server/features/extractors/triggerExtractor";
import { toggleSchedule } from "./server/features/extractors/toggleSchedule";
import { updateWebhook } from "./server/features/extractors/updateWebhook";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const PORT = 3000;

export const app = express();

app.use(express.json());

// API: Check system configurations and credentials
app.get("/api/config", (_req, res) => {
  res.json({
    hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasFirebaseAdminCredentials: hasFirebaseAdminCredentials(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    appUrl: process.env.APP_URL || "",
    firestoreDbCollection: process.env.FIRESTORE_DB_COLLECTION || "organizr",
    firestoreDbDocumentId: process.env.FIRESTORE_DB_DOCUMENT_ID || "database",
  });
});

// API: Firebase-authenticated application routes
app.use(["/api/emails", "/api/analyze", "/api/extractors"], requireFirebaseUser);

// API: Gmail crawler and lookup endpoints
app.get("/api/emails", searchEmails);

// API: Schema intelligence and parsing tests
app.post("/api/analyze", analyzeEmails);
app.post("/api/extractors/test", testExtractor);

// API: Extractor lifecycle routing
app.get("/api/extractors", listExtractors);
app.post("/api/extractors", createExtractor);
app.post("/api/extractors/:id/run", triggerExtractor);
app.post("/api/extractors/:id/schedule", toggleSchedule);
app.post("/api/extractors/:id/webhook", updateWebhook);

// Global JSON Error Handler - Ensures backend errors do not crash client with HTML payloads
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Express Error Handler caught unhandled exception:", err);
  res.status(500).json({
    error: err.message || "An unhandled internal server error occurred."
  });
});

// Start integration server inside runtime context
export async function startServer() {
  // Mount Vite development middlewares or serve static assets
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started. Binding to http://0.0.0.0:${PORT}`);
  });
}

if (process.argv.some((value) => /(?:^|\/)server\.(ts|cjs|js)$/.test(value))) {
  startServer();
}
