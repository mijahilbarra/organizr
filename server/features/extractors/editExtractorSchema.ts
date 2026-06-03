import { Request, Response } from "express";
import { SchemaField } from "../../../src/types";
import { buildExtractorSchemaEditPrompt } from "./buildExtractorSchemaEditPrompt";
import { loadRequiredUserProfileForRequest } from "../profile/loadRequiredUserProfileForRequest";
import { normalizeComputedSchemaFields } from "../computed/normalizeComputedSchemaFields";
import { getExtractorByIdForUser } from "./getExtractorByIdForUser";
import { updateExtractorById } from "./updateExtractorById";
import { createSchemaEditManualPayload } from "./createSchemaEditManualPayload";
import { createSchemaEditExpectedPayload } from "./createSchemaEditExpectedPayload";
import { createSchemaEditCurrentParsers } from "./createSchemaEditCurrentParsers";
import { createSchemaEditCurrentSamples } from "./createSchemaEditCurrentSamples";
import { createGptActionResponse } from "../gpt/createGptActionResponse";
import { createValidationSample } from "./createValidationSample";
import { createValidatedExtractorSubject } from "./createValidatedExtractorSubject";
import { syncExtractorSamplesWithSubjects } from "./syncExtractorSamplesWithSubjects";

export async function editExtractorSchema(req: Request, res: Response) {
  const { id } = req.params;
  const profileContext = await loadRequiredUserProfileForRequest(req, res);
  if (!profileContext) return;

  const message = String(req.body?.message || "").trim();
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const { profile } = profileContext;
  const analysis = req.body?.analysis && typeof req.body.analysis === "object" ? req.body.analysis : null;
  const subjectEntries = Array.isArray(req.body?.subjects)
    ? req.body.subjects
    : Array.isArray(req.body?.subjectScripts)
      ? req.body.subjectScripts
      : [];

  const debugLogs: string[] = [];
  const addDebugLog = (value: string) => {
    const line = `[Schema Edit] ${value}`;
    debugLogs.push(line);
    console.log(line);
  };

  try {
    addDebugLog("Loading extractor and preparing schema edit context.");
    const currentExtractor = await getExtractorByIdForUser(id, profile.uid);

    if (!currentExtractor) {
      return res.status(404).json(createGptActionResponse(
        "EXTRACTOR_NOT_FOUND",
        "Extractor not found.",
        { extractorId: id, debugLogs },
      ));
    }

    const manualPayload = createSchemaEditManualPayload(req.body, currentExtractor);
    const hasManualSchemaPayload = Array.isArray(manualPayload.schemaFields);
    const hasManualSubjectPayload = Array.isArray(manualPayload.subjects);
    const requestedParserUpdate = Boolean(
      hasManualSubjectPayload,
    );
    const requestedSchemaUpdate = hasManualSchemaPayload;

    if (!message && !hasManualSchemaPayload && !hasManualSubjectPayload) {
      return res.status(400).json(createGptActionResponse(
        "MANUAL_PAYLOAD_REQUIRED",
        "Provide either a schema edit message or a manual payload with schemaFields, subjectScripts, subjects, or analysis.",
        { extractorId: id, debugLogs },
      ));
    }

    if (requestedParserUpdate && !hasManualSchemaPayload) {
      addDebugLog("Rejecting parser-only schema edit because schemaFields are required to avoid orphan fields.");
      return res.status(400).json(createGptActionResponse(
        "MANUAL_PAYLOAD_REQUIRED",
        "When updating subject parser code, send the full schemaFields array in the same request so removed fields can be deleted.",
        {
          extractorId: id,
          debugLogs,
          mode: "needs_manual_payload",
          acceptedPayloadShapes: ["schemaFields", "subjectScripts", "subjects", "analysis"],
        },
      ));
    }

    if (hasManualSchemaPayload || hasManualSubjectPayload) {
      addDebugLog("Using manual schema edit payload supplied by the caller; skipping provider LLM.");
      const normalizedSchemaFields = hasManualSchemaPayload
        ? normalizeComputedSchemaFields(manualPayload.schemaFields as SchemaField[])
        : currentExtractor.schemaFields;
      const nextSubjects = manualPayload.subjects || currentExtractor.subjects;

      if (nextSubjects.length === 0) {
        throw new Error("Manual schema edits require at least one subject with scriptCode.");
      }

      const validatedSubjects = nextSubjects.map((nextSubject) => {
        const matchingEntry = subjectEntries.find((entry: any) => {
          const entryId = String(entry?.subjectId ?? entry?.id ?? "").trim();
          const entrySubject = String(entry?.subject ?? entry?.value ?? "").trim();
          return entryId === nextSubject.id || entrySubject.toLowerCase() === nextSubject.value.toLowerCase();
        });
        const persistedSubject = currentExtractor.subjects.find((entry) => entry.id === nextSubject.id)
          || currentExtractor.subjects.find((entry) => entry.value.toLowerCase() === nextSubject.value.toLowerCase());
        const validationSample = createValidationSample(matchingEntry?.validationSample, nextSubject.value)
          || createValidationSample(persistedSubject?.validationSample, nextSubject.value)
          || createValidationSample(nextSubject.validationSample, nextSubject.value);

        if (!validationSample) {
          addDebugLog(`Rejecting subject parser edit because ${nextSubject.value} is missing validationSample.body.`);
          throw new Error(`Subject "${nextSubject.value}" requires validationSample.body when updating parser code or schema.`);
        }

        return createValidatedExtractorSubject({
          schemaFields: normalizedSchemaFields,
          subject: nextSubject.value,
          scriptCode: nextSubject.scriptCode || "",
          validationSample,
          subjectId: nextSubject.id,
          createdAt: nextSubject.createdAt,
          lastScannedAt: nextSubject.lastScannedAt,
        }).subject;
      });

      if (hasManualSubjectPayload) {
        addDebugLog(`Validated ${validatedSubjects.length} subject parser(s) against the requested schema.`);
      }

      const savedExtractor = await updateExtractorById(id, profile.uid, (extractor) => {
        extractor.explanation = manualPayload.explanation || extractor.explanation;
        extractor.schemaFields = normalizedSchemaFields;
        extractor.subjects = validatedSubjects;
        const syncedSamples = syncExtractorSamplesWithSubjects(extractor);
        extractor.sampleEmails = syncedSamples.sampleEmails;
        extractor.sampleExtractedResults = syncedSamples.sampleExtractedResults;
      });

      if (!savedExtractor) {
        return res.status(404).json(createGptActionResponse(
          "EXTRACTOR_NOT_FOUND",
          "Extractor not found.",
          { extractorId: id, debugLogs },
        ));
      }

      return res.json(createGptActionResponse("READY", "Schema updated.", {
        extractor: savedExtractor,
        extractorId: id,
        assistantMessage: "Schema updated.",
        debugLogs,
        provider: "customgpt",
        mode: "applied_manual_payload",
        appliedChanges: {
          schemaChanged: hasManualSchemaPayload,
          subjectsChanged: hasManualSubjectPayload,
        },
      }));
    }

    const chatText = messages
      .slice(-8)
      .map((entry: any) => `${entry.role === "assistant" ? "Assistant" : "User"}: ${String(entry.content || "")}`)
      .join("\n");
    const prompt = buildExtractorSchemaEditPrompt(currentExtractor, chatText, message);

    addDebugLog("No manual schema payload provided; returning the current extractor and the requested edit text.");
    return res.json(createGptActionResponse(
      "MANUAL_PAYLOAD_REQUIRED",
      "Provide schemaFields to update the stored schema, and include subjectScripts or subjects whenever you also need to update parser code.",
      {
        extractor: currentExtractor,
        extractorId: id,
        assistantMessage: "Provide schemaFields to update the stored schema, and include subjectScripts or subjects whenever you also need to update parser code.",
        requestedEdit: message,
        suggestedSchemaPrompt: prompt,
        currentParsers: createSchemaEditCurrentParsers(currentExtractor),
        currentSamples: createSchemaEditCurrentSamples(currentExtractor),
        expectedPayload: createSchemaEditExpectedPayload(currentExtractor),
        debugLogs,
        provider: "manual",
        mode: "needs_manual_payload",
        acceptedPayloadShapes: ["schemaFields", "subjectScripts", "subjects", "analysis"],
      },
    ));
  } catch (error: any) {
    addDebugLog(`Schema edit failed: ${error.message || "unknown error"}`);
    if (
      typeof error?.message === "string"
      && (
        error.message.includes("requires validationSample.body")
        || error.message.includes("Parser output")
        || error.message.includes("The parser must return")
      )
    ) {
      return res.status(400).json(createGptActionResponse(
        "MANUAL_PAYLOAD_REQUIRED",
        error.message,
        { extractorId: id, debugLogs, mode: "needs_manual_payload" },
      ));
    }
    console.error("Extractor schema edit breakdown:", error);
    return res.status(500).json(createGptActionResponse(
      "EXTRACTOR_EDIT_FAILED",
      error.message || "Failed to edit extractor schema.",
      { extractorId: id, debugLogs },
    ));
  }
}
