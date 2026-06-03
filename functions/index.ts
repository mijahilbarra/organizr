import { onRequest } from "firebase-functions/v2/https";
import { app } from "../server";

export const api = onRequest(
  {
    region: "us-central1",
    invoker: "public",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  app,
);
