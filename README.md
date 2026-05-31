# Organizr

React + Express app for discovering repeated Gmail email structures, proposing schemas with Gemini, and saving reusable extractors.

## Local Development

Prerequisites:

- Node.js 20+
- Firebase project with Authentication and Firestore enabled
- Google provider enabled in Firebase Auth
- Gmail API enabled in the related Google Cloud project

Setup:

1. Install root dependencies:
   `npm install`
2. Install Functions dependencies:
   `npm --prefix functions install`
3. Copy `.env.example` to `.env` and fill Firebase, Gemini, and Gmail values.
4. Run locally:
   `npm run dev`

## Firebase Emulator Development

Use this mode to test the Firebase-shaped runtime locally while keeping Firestore in production.

```bash
npm run dev:firebase
```

This starts:

- Firebase Functions Emulator at `http://127.0.0.1:5001/organizr-skip/us-central1/api`
- Vite frontend at `http://localhost:5173`

The Vite dev server proxies `/api/**` to the local Functions Emulator. Do not start the Firestore emulator if you want reads and writes to use the production Firestore database.

You can also run each side separately:

```bash
npm run dev:functions
npm run dev:frontend
```

## Firebase

The Express backend is exported from `server.ts` and exposed to Firebase Functions through `functions/index.ts` as the `api` HTTPS function. Firebase Hosting serves `dist` and rewrites `/api/**` to that Function.

Before deploying:

- Confirm `.firebaserc` points to the intended Firebase project.
- Set `APP_URL` to the Firebase Hosting URL.
- Keep `FIREBASE_FUNCTIONS_REGION` aligned with `firebase.json` and `functions/index.ts`.
- Configure Firebase Auth authorized domains for `localhost` and the deployed domain.

Build checks:

```bash
npm run lint
npm run firebase:build
```
