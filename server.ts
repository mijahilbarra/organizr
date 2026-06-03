import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { hasFirebaseAdminCredentials } from "./server/firebase/hasFirebaseAdminCredentials";

// Import modular features (each function/endpoint inside its own file)
import { requireFirebaseUser } from "./server/features/auth/requireFirebaseUser";
import { searchEmails } from "./server/features/emails/searchEmails";
import { analyzeEmails } from "./server/features/analyze/analyzeEmails";
import { testExtractor } from "./server/features/analyze/testExtractor";
import { testExtractorWithHtml } from "./server/features/analyze/testExtractorWithHtml";
import { createExtractor } from "./server/features/extractors/createExtractor";
import { listExtractors } from "./server/features/extractors/listExtractors";
import { getExtractor } from "./server/features/extractors/getExtractor";
import { updateExtractor } from "./server/features/extractors/updateExtractor";
import { triggerExtractor } from "./server/features/extractors/triggerExtractor";
import { toggleSchedule } from "./server/features/extractors/toggleSchedule";
import { updateWebhook } from "./server/features/extractors/updateWebhook";
import { deleteExtractor } from "./server/features/extractors/deleteExtractor";
import { editExtractorSchema } from "./server/features/extractors/editExtractorSchema";
import { getProfile } from "./server/features/profile/getProfile";
import { updateProfile } from "./server/features/profile/updateProfile";
import { connectGmail } from "./server/features/profile/connectGmail";
import { revokeGmail } from "./server/features/profile/revokeGmail";
import { listExtractorSubjects } from "./server/features/extractors/listExtractorSubjects";
import { addExtractorSubject } from "./server/features/extractors/addExtractorSubject";
import { getExtractorSubject } from "./server/features/extractors/getExtractorSubject";
import { updateExtractorSubject } from "./server/features/extractors/updateExtractorSubject";
import { deleteExtractorSubject } from "./server/features/extractors/deleteExtractorSubject";
import { listExtractorOperations } from "./server/features/operations/listExtractorOperations";
import { sendGptSessionCapabilities } from "./server/features/gpt/sendGptSessionCapabilities";
import { createExtractorFromSubject } from "./server/features/gpt/createExtractorFromSubject";
import { createExtractorFromCustomGptAnalysis } from "./server/features/gpt/createExtractorFromCustomGptAnalysis";
import { listPendingComputedOperations } from "./server/features/gpt/listPendingComputedOperations";
import { processPendingComputedOperations } from "./server/features/gpt/processPendingComputedOperations";
import { createGptTicket } from "./server/features/gpt/createGptTicket";
import { listGptExtractors } from "./server/features/gpt/listGptExtractors";
import { getGptExtractor } from "./server/features/gpt/getGptExtractor";
import { sendPrivacyPolicy } from "./server/features/legal/sendPrivacyPolicy";
import { sendOAuthAuthorizePage } from "./server/features/oauth/sendOAuthAuthorizePage";
import { createOAuthCodeFromRequest } from "./server/features/oauth/createOAuthCodeFromRequest";
import { exchangeOAuthToken } from "./server/features/oauth/exchangeOAuthToken";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const PORT = 3000;

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function loadOpenApiDocument() {
  const candidates = [
    path.resolve(process.cwd(), "functions", "openapi.json"),
    path.resolve(process.cwd(), "openapi.json"),
    path.resolve(process.cwd(), "../functions", "openapi.json"),
  ];
  const openApiPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!openApiPath) {
    throw new Error("functions/openapi.json was not found in the runtime directory.");
  }

  return JSON.parse(fs.readFileSync(openApiPath, "utf8"));
}

const configRoutes = ["/api/config", "/config"];
const openApiRoutes = ["/openapi.json", "/api/openapi.json"];
const privacyPolicyRoutes = ["/privacy-policy", "/politica-de-privacidad", "/api/privacy-policy", "/api/politica-de-privacidad"];
const oauthAuthorizeRoutes = ["/oauth/authorize", "/api/oauth/authorize"];
const oauthCreateCodeRoutes = ["/oauth/create-code", "/api/oauth/create-code"];
const oauthTokenRoutes = ["/oauth/token", "/api/oauth/token"];
const emailRoutes = ["/api/emails", "/emails"];
const analyzeRoutes = ["/api/analyze", "/analyze"];
const extractorRoutes = ["/api/extractors", "/extractors"];
const profileRoutes = ["/api/profile"];
const gptRoutes = ["/api/gpt"];
const authenticatedApiRoutes = [
  ...emailRoutes,
  ...analyzeRoutes,
  ...extractorRoutes,
  ...profileRoutes,
  ...gptRoutes,
];

// API: Check system configurations and credentials
app.get(configRoutes, (_req, res) => {
  res.json({
    hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasFirebaseAdminCredentials: hasFirebaseAdminCredentials(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenAiKey: !!process.env.OPEN_AI_KEY || !!process.env.OPENAI_API_KEY,
    appUrl: process.env.APP_URL || "",
    firestoreUsersCollection: process.env.FIRESTORE_USERS_COLLECTION || "users",
    firestoreExtractorsCollection: process.env.FIRESTORE_EXTRACTORS_COLLECTION || "extractors",
  });
});

// API: Public OpenAPI document for Custom GPT Actions
app.get(openApiRoutes, (_req, res) => {
  res.json(loadOpenApiDocument());
});

// API: Public privacy policy for Custom GPT and OAuth setup
app.get(privacyPolicyRoutes, sendPrivacyPolicy);

// API: OAuth bridge for Custom GPT Actions
app.get(oauthAuthorizeRoutes, sendOAuthAuthorizePage);
app.post(oauthCreateCodeRoutes, createOAuthCodeFromRequest);
app.post(oauthTokenRoutes, exchangeOAuthToken);

// API: Firebase-authenticated application routes
app.use(authenticatedApiRoutes, requireFirebaseUser);

// API: Profile and persisted Gmail connection routing
app.get(profileRoutes, getProfile);
app.patch(profileRoutes, updateProfile);
app.post("/api/profile/gmail", connectGmail);
app.delete("/api/profile/gmail", revokeGmail);

// API: Custom GPT action-safe orchestration endpoints
app.get("/api/gpt/session/capabilities", sendGptSessionCapabilities);
app.get("/api/gpt/extractors", listGptExtractors);
app.get("/api/gpt/extractors/:extractorId", getGptExtractor);
app.post("/api/gpt/extractor-from-subject", createExtractorFromSubject);
app.post("/api/gpt/extractor-from-analysis", createExtractorFromCustomGptAnalysis);
app.post("/api/gpt/tickets", createGptTicket);
app.get("/api/gpt/extractors/:extractorId/computed/pending", listPendingComputedOperations);
app.post("/api/gpt/extractors/:extractorId/computed/pending/process", processPendingComputedOperations);

// API: Gmail crawler and lookup endpoints
app.get(emailRoutes, searchEmails);

// API: Schema intelligence and parsing tests
app.post(analyzeRoutes, analyzeEmails);
app.post(["/api/extractors/test", "/extractors/test"], testExtractor);
app.post(["/api/extractors/test-html", "/extractors/test-html"], testExtractorWithHtml);

// API: Extractor lifecycle routing
app.get(extractorRoutes, listExtractors);
app.get(["/api/extractors/:id", "/extractors/:id"], getExtractor);
app.post(extractorRoutes, createExtractor);
app.patch(["/api/extractors/:id", "/extractors/:id"], updateExtractor);
app.get(["/api/extractors/:id/subjects", "/extractors/:id/subjects"], listExtractorSubjects);
app.post(["/api/extractors/:id/subjects", "/extractors/:id/subjects"], addExtractorSubject);
app.get(["/api/extractors/:id/subjects/:subjectId", "/extractors/:id/subjects/:subjectId"], getExtractorSubject);
app.patch(["/api/extractors/:id/subjects/:subjectId", "/extractors/:id/subjects/:subjectId"], updateExtractorSubject);
app.delete(["/api/extractors/:id/subjects/:subjectId", "/extractors/:id/subjects/:subjectId"], deleteExtractorSubject);
app.get(["/api/extractors/:id/operations", "/extractors/:id/operations"], listExtractorOperations);
app.post(["/api/extractors/:id/run", "/extractors/:id/run"], triggerExtractor);
app.post(["/api/extractors/:id/schedule", "/extractors/:id/schedule"], toggleSchedule);
app.post(["/api/extractors/:id/webhook", "/extractors/:id/webhook"], updateWebhook);
app.post(["/api/extractors/:id/schema-edits", "/extractors/:id/schema-edits"], editExtractorSchema);
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
