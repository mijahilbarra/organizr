import { Request, Response } from "express";
import { SchemaField } from "../../../src/types";
import { buildExtractorSchemaEditPrompt } from "./buildExtractorSchemaEditPrompt";
import { loadRequiredUserProfileForRequest } from "../profile/loadRequiredUserProfileForRequest";
import { normalizeComputedSchemaFields } from "../computed/normalizeComputedSchemaFields";
import { getExtractorByIdForUser } from "./getExtractorByIdForUser";
import { updateExtractorById } from "./updateExtractorById";
import { createSchemaEditManualPayload } from "./createSchemaEditManualPayload";
import { createGptActionResponse } from "../gpt/createGptActionResponse";
import { validateSchemaAgainstSample } from "./validateSchemaAgainstSample";

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

    if (requestedSchemaUpdate && !requestedParserUpdate) {
      addDebugLog("Rejecting schema-only edit because parser code is required to avoid obsolete parser/schema mismatches.");
      return res.status(400).json(createGptActionResponse(
        "MANUAL_PAYLOAD_REQUIRED",
        "When updating schemaFields, send subjectScripts or subjects with parser code in the same request so schema and parser stay aligned.",
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

      if (hasManualSubjectPayload) {
        const validationEntry = subjectEntries.find((entry: any) => {
          const subjectValue = String(entry?.subject ?? entry?.value ?? "").trim();
          const scriptCode = String(entry?.scriptCode || "").trim();
          return subjectValue && scriptCode;
        });
        const validationSample = validationEntry?.validationSample && typeof validationEntry.validationSample === "object"
          ? validationEntry.validationSample
          : null;

        if (!validationSample || typeof validationSample.body !== "string" || !validationSample.body.trim()) {
          addDebugLog("Rejecting subject parser edit because validationSample.body is required per subject entry.");
          return res.status(400).json(createGptActionResponse(
            "MANUAL_PAYLOAD_REQUIRED",
            "Each subjectScripts/subjects entry must include validationSample.body when updating parser code.",
            {
              extractorId: id,
              debugLogs,
              mode: "needs_manual_payload",
            },
          ));
        }

        const validationScriptCode = nextSubjects[0]?.scriptCode || "";
        const validationResult = validateSchemaAgainstSample(normalizedSchemaFields, validationScriptCode, {
          body: String(validationSample.body || ""),
          subject: typeof validationSample.subject === "string" ? validationSample.subject : "",
          from: typeof validationSample.from === "string" ? validationSample.from : "",
        });

        if (!validationResult.ok) {
          addDebugLog(`Rejecting schema edit because validation sample did not match schema: ${validationResult.message}`);
          return res.status(400).json(createGptActionResponse(
            "MANUAL_PAYLOAD_REQUIRED",
            validationResult.message || "The parser output did not match the schemaFields.",
            {
              extractorId: id,
              debugLogs,
              mode: "needs_manual_payload",
              validationOutput: validationResult.output || null,
            },
          ));
        }
      }

      const savedExtractor = await updateExtractorById(id, profile.uid, (extractor) => {
        extractor.explanation = manualPayload.explanation || extractor.explanation;
        extractor.schemaFields = normalizedSchemaFields;
        extractor.subjects = nextSubjects;
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
      "Provide schemaFields plus subjectScripts or subjects in the request body to apply the edit without a provider.",
      {
        extractor: currentExtractor,
        extractorId: id,
        assistantMessage: "Provide schemaFields plus subjectScripts or subjects in the request body to apply the edit without a provider.",
        requestedEdit: message,
        suggestedSchemaPrompt: prompt,
        debugLogs,
        provider: "manual",
        mode: "needs_manual_payload",
        acceptedPayloadShapes: ["schemaFields", "subjectScripts", "subjects", "analysis"],
      },
    ));
  } catch (error: any) {
    addDebugLog(`Schema edit failed: ${error.message || "unknown error"}`);
    console.error("Extractor schema edit breakdown:", error);
    return res.status(500).json(createGptActionResponse(
      "EXTRACTOR_EDIT_FAILED",
      error.message || "Failed to edit extractor schema.",
      { extractorId: id, debugLogs },
    ));
  }
}
