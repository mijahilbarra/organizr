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
import { deleteExtractor } from "./server/features/extractors/deleteExtractor";
import { getProfile } from "./server/features/profile/getProfile";
import { updateProfile } from "./server/features/profile/updateProfile";
import { connectGmail } from "./server/features/profile/connectGmail";
import { revokeGmail } from "./server/features/profile/revokeGmail";
import { listExtractorSubjects } from "./server/features/extractors/listExtractorSubjects";
import { addExtractorSubject } from "./server/features/extractors/addExtractorSubject";
import { listExtractorOperations } from "./server/features/operations/listExtractorOperations";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const PORT = 3000;

export const app = express();

app.use(express.json());

const configRoutes = ["/api/config", "/config"];
const emailRoutes = ["/api/emails", "/emails"];
const analyzeRoutes = ["/api/analyze", "/analyze"];
const extractorRoutes = ["/api/extractors", "/extractors"];
const profileRoutes = ["/api/profile"];
const authenticatedApiRoutes = [
  ...emailRoutes,
  ...analyzeRoutes,
  ...extractorRoutes,
  ...profileRoutes,
];

// API: Check system configurations and credentials
app.get(configRoutes, (_req, res) => {
  res.json({
    hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasFirebaseAdminCredentials: hasFirebaseAdminCredentials(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    appUrl: process.env.APP_URL || "",
    firestoreUsersCollection: process.env.FIRESTORE_USERS_COLLECTION || "users",
    firestoreExtractorsCollection: process.env.FIRESTORE_EXTRACTORS_COLLECTION || "extractors",
  });
});

// API: Firebase-authenticated application routes
app.use(authenticatedApiRoutes, requireFirebaseUser);

// API: Profile and persisted Gmail connection routing
app.get(profileRoutes, getProfile);
app.patch(profileRoutes, updateProfile);
app.post("/api/profile/gmail", connectGmail);
app.delete("/api/profile/gmail", revokeGmail);

// API: Gmail crawler and lookup endpoints
app.get(emailRoutes, searchEmails);

// API: Schema intelligence and parsing tests
app.post(analyzeRoutes, analyzeEmails);
app.post(["/api/extractors/test", "/extractors/test"], testExtractor);

// API: Extractor lifecycle routing
app.get(extractorRoutes, listExtractors);
app.post(extractorRoutes, createExtractor);
app.get(["/api/extractors/:id/subjects", "/extractors/:id/subjects"], listExtractorSubjects);
app.post(["/api/extractors/:id/subjects", "/extractors/:id/subjects"], addExtractorSubject);
app.get(["/api/extractors/:id/operations", "/extractors/:id/operations"], listExtractorOperations);
app.post(["/api/extractors/:id/run", "/extractors/:id/run"], triggerExtractor);
app.post(["/api/extractors/:id/schedule", "/extractors/:id/schedule"], toggleSchedule);
app.post(["/api/extractors/:id/webhook", "/extractors/:id/webhook"], updateWebhook);
app.delete(["/api/extractors/:id", "/extractors/:id"], deleteExtractor);

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
