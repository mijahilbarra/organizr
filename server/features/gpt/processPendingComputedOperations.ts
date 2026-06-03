import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { loadExtractorContextById } from "../extractors/loadExtractorContextById";
import { loadUserProfileForRequest } from "../profile/loadUserProfileForRequest";
import { createUserCapabilities } from "../profile/createUserCapabilities";
import { processPendingComputedOperations as processPendingComputedOperationsForExtractor } from "../computed/processPendingComputedOperations";
import { createGptActionResponse } from "./createGptActionResponse";
import { getOperationsCollection } from "../operations/getOperationsCollection";
import { normalizeFirestoreOperation } from "../operations/normalizeFirestoreOperation";
import { getComputedSchemaFields } from "../computed/getComputedSchemaFields";
import { hasUsableComputedValue } from "../computed/hasUsableComputedValue";

export async function processPendingComputedOperations(req: Request, res: Response) {
  const { extractorId } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const loaded = await loadUserProfileForRequest(req);
    if (!loaded?.profile) {
      return res.status(401).json(createGptActionResponse("AUTH_REQUIRED", "Authenticate before processing pending computed fields.", {}));
    }

    const extractorContext = await loadExtractorContextById(extractorId, firebaseUser.uid);
    if (!extractorContext) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Extractor not found.", {
        extractorId,
        mode: "extractor-scope",
      }));
    }

    const limit = Number(req.body?.limit || req.query.limit || 20);
    const manualUpdates = Array.isArray(req.body?.updates) ? req.body.updates : [];
    const processingParams = {
      profile: loaded.profile,
      extractorId,
      extractorName: extractorContext.extractor.name,
      schemaFields: extractorContext.extractor.schemaFields,
      limit,
    };

    if (manualUpdates.length > 0) {
      const operationsCollection = await getOperationsCollection();
      const computedFields = getComputedSchemaFields(extractorContext.extractor.schemaFields);
      const pendingSnapshot = await operationsCollection
        .where("extractorId", "==", extractorId)
        .where("userId", "==", firebaseUser.uid)
        .where("computedStatus", "==", "pending")
        .orderBy("timestamp", "desc")
        .limit(Math.max(1, Math.min(50, limit)))
        .get();

      const pendingById = new Map(
        pendingSnapshot.docs.map((doc) => {
          const normalized = normalizeFirestoreOperation(doc.id, doc.data());
          return [normalized.id, normalized];
        }),
      );

      const appliedUpdates = [];
      for (const update of manualUpdates) {
        const operationId = String(update?.operationId || update?.id || "").trim();
        const extractedData = update?.extractedData && typeof update.extractedData === "object" ? update.extractedData : null;
        if (!operationId || !extractedData) {
          continue;
        }

        const current = pendingById.get(operationId);
        if (!current) {
          continue;
        }

        const resolvedOperation = {
          ...current,
          extractedData: {
            ...current.extractedData,
            ...extractedData,
          },
        };

        const pendingComputedFields = computedFields
          .filter((field) => !hasUsableComputedValue(resolvedOperation.extractedData[field.fieldName]))
          .map((field) => field.fieldName);

        resolvedOperation.computedStatus = pendingComputedFields.length > 0 ? "pending" as const : "complete" as const;
        resolvedOperation.pendingComputedFields = pendingComputedFields;

        await (operationsCollection.doc(operationId) as any).set({
          ...resolvedOperation,
          extractorId,
          userId: firebaseUser.uid,
        }, { merge: true });

        appliedUpdates.push(resolvedOperation);
      }

      return res.json(createGptActionResponse("READY", "Manual computed updates applied.", {
        extractorId,
        mode: "manual-updates",
        processedCount: appliedUpdates.length,
        remainingPendingCount: appliedUpdates.filter((operation) => operation.computedStatus === "pending").length,
        operations: appliedUpdates,
      }));
    }

    if (!createUserCapabilities(loaded.profile).llm.hasAnyProvider) {
      const pendingOperations = await processPendingComputedOperationsForExtractor(processingParams);

      return res.json(createGptActionResponse("PENDING_MANUAL_COMPLETION", "No LLM provider is active. Use the pending operations as input and send manual updates back when ready.", {
        extractorId,
        mode: "manual-completion-required",
        pendingCount: pendingOperations.length,
        operations: pendingOperations,
      }));
    }

    const processedOperations = await processPendingComputedOperationsForExtractor(processingParams);

    return res.json(createGptActionResponse("READY", "Pending computed operations processed.", {
      extractorId,
      mode: "llm-processing",
      processedCount: processedOperations.length,
      operations: processedOperations,
    }));
  } catch (error: any) {
    console.error("Process pending computed operations breakdown:", error);
    return res.status(500).json(createGptActionResponse("UNEXPECTED_ERROR", error.message || "Failed to process pending computed operations.", {
      extractorId,
      mode: "llm-processing",
    }));
  }
}
