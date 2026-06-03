# Project Board

## Objective
Build the Custom GPT-ready third usage mode while reducing exception-driven flows. The product should adapt to each user based on connected Gmail, available Gemini/OpenAI provider configuration, and future ChatGPT Action authentication, returning actionable next steps instead of generic failures.

## Roles
- Admin
- QA
- backend-core
- gpt-actions
- frontend-settings
- docs-tests

## Tasks
- [ ] T-001 | owner:backend-core | status:IN_PROGRESS | title:User capabilities and LLM resolver
  - desc: Add backend capability detection for Gmail and LLM providers, plus a shared auto provider resolver for Gemini/OpenAI without leaking secrets.
  - depends_on: []
  - files: server/features/profile/*, server/features/llm/*, server/types.ts
  - acceptance:
    - Backend can report Gmail and LLM provider availability per user
    - Provider selection supports auto, gemini, and openai
    - Missing provider states return actionable JSON instead of generic 500s
    - Existing profile sanitization does not expose tokens or API keys
  - evidence:
  - qa_notes:

- [ ] T-002 | owner:backend-core | status:OPEN | title:Adapt analyze and schema edits to provider auto mode
  - desc: Update analyze and schema-edit flows to use the shared LLM resolver and handle user-specific Gemini/OpenAI availability.
  - depends_on: [T-001]
  - files: server/features/analyze/analyzeEmails.ts, server/features/extractors/editExtractorSchema.ts, server/features/llm/*
  - acceptance:
    - Analyze accepts provider auto/gemini/openai where applicable
    - Schema edits keep existing behavior but support auto mode
    - Provider failures return stable action codes
  - evidence:
  - qa_notes:

- [ ] T-003 | owner:gpt-actions | status:IN_PROGRESS | title:Custom GPT orchestration endpoints
  - desc: Add GPT-oriented endpoints for session/capabilities and creating an extractor from a subject, composing profile, Gmail search, analysis, and extractor creation logic.
  - depends_on: [T-001, T-002]
  - files: server.ts, server/features/gpt/*
  - acceptance:
    - GPT session endpoint reports auth/Gmail/provider next steps
    - From-subject endpoint can search emails, analyze samples, and persist an extractor
    - Endpoint responses include actionable codes and actionUrl where a user connection is needed
  - evidence:
    - gpt-actions 2026-06-01: added authenticated `/api/gpt/session/capabilities` and `/api/gpt/extractor-from-subject` routes in `server.ts`.
    - gpt-actions 2026-06-01: added `server/features/gpt/*` handlers/helpers returning stable codes, `nextSteps`, and `actionUrl`; from-subject composes persisted Gmail token lookup, Gmail search, existing analysis, and existing extractor creation.
    - gpt-actions 2026-06-01: `npm run lint` passed; `npm run duplicates` passed with existing clones outside `server/features/gpt/*`.
  - qa_notes:
    - Waiting on T-001/T-002 to replace temporary env-key provider detection with the shared user capabilities and auto provider resolver.

- [ ] T-004 | owner:gpt-actions | status:IN_PROGRESS | title:OpenAPI schema for GPT Actions
  - desc: Create an OpenAPI document for the Custom GPT action surface and document required auth strategy assumptions.
  - depends_on: [T-003]
  - files: openapi.json, functions/openapi.json, README.md
  - acceptance:
    - OpenAPI includes operationIds, request bodies, auth, and response shapes
    - Schema only exposes GPT-safe endpoints
    - Auth/connect assumptions are documented
  - evidence:
    - gpt-actions 2026-06-01: consolidated the GPT-safe contract into `openapi.json` and `functions/openapi.json` with Firebase bearer auth, operationIds, request body, and GPT-safe response schemas.
    - gpt-actions 2026-06-01: documented Custom GPT action auth/setup assumptions in `README.md`.
  - qa_notes:
    - Contract is ready for review but should be revisited after T-001/T-002 finalize provider capability fields.

- [ ] T-005 | owner:frontend-settings | status:BLOCKED | title:Provider configuration UI
  - desc: Add frontend profile/settings controls to show Gmail/Gemini/OpenAI/ChatGPT capability states and configure default LLM provider.
  - depends_on: [T-001]
  - files: src/features/profile/*, src/App.tsx, src/types.ts
  - acceptance:
    - Profile screen shows provider capability states
    - User can select a default provider when multiple are available
    - UI handles missing provider/Gmail states without blocking unrelated features
  - evidence:
    - frontend-settings 2026-06-01T20:05:26Z: Added optional frontend contract for capabilities/defaultLlmProvider and Profile UI for Gmail/Gemini/OpenAI/ChatGPT states.
    - frontend-settings 2026-06-01T20:05:26Z: Selector remains disabled until backend reports multiple available providers; endpoint persistence for defaultLlmProvider depends on T-001.
    - frontend-settings 2026-06-01T20:05:26Z: npm run lint passed.
    - frontend-settings 2026-06-01T20:07:54Z: Reconciled Profile UI with T-001 draft contract: `capabilities.llm.providers.*` and `llmSettings.defaultProvider`.
    - frontend-settings 2026-06-01T20:07:54Z: npm run lint passed after contract reconciliation.
  - qa_notes:
    - Blocked by T-001 final status before full QA; frontend is wired to the current draft capability/update contract.

- [ ] T-006 | owner:docs-tests | status:OPEN | title:Flow documentation and verification
  - desc: Update sequence diagram and add or run focused verification for new backend flows, including duplicate detection.
  - depends_on: [T-001, T-002, T-003, T-004, T-005]
  - files: sequence-diagram.md, package.json, relevant tests/docs
  - acceptance:
    - sequence-diagram.md reflects Custom GPT, Gmail, LLM provider, and backend interactions
    - Relevant build/type checks pass or failures are documented
    - npm run duplicates is run after logic changes or a blocker is recorded
  - evidence:
    - docs-tests verification plan 2026-06-01: wait for T-001..T-005 READY_FOR_QA/DONE, then review Custom GPT/session/from-subject/OpenAPI/profile changes, update sequence-diagram.md, run npm run lint, npm run build or targeted build, npm run functions:build if functions touched, and npm run duplicates.
    - blocked: dependencies T-001, T-002, T-003, T-004, T-005 are not complete yet; no final diagram/checks should be claimed until upstream changes stabilize.
  - qa_notes:
