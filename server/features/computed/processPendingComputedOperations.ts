import { SchemaField } from "../../../src/types";
import { ExtractionRecord, UserProfile } from "../../types";
import { getOperationsCollection } from "../operations/getOperationsCollection";
import { normalizeFirestoreOperation } from "../operations/normalizeFirestoreOperation";
import { createPendingComputedRecord } from "./createPendingComputedRecord";
import { generateComputedFieldValueWithLlm } from "./generateComputedFieldValueWithLlm";
import { getComputedSchemaFields } from "./getComputedSchemaFields";
import { hasUsableComputedValue } from "./hasUsableComputedValue";

interface ProcessPendingComputedOperationsParams {
  profile: UserProfile;
  extractorId: string;
  extractorName: string;
  schemaFields: SchemaField[];
  limit?: number;
}

export async function processPendingComputedOperations({
  profile,
  extractorId,
  extractorName,
  schemaFields,
  limit = 20,
}: ProcessPendingComputedOperationsParams): Promise<ExtractionRecord[]> {
  const operationsCollection = await getOperationsCollection();
  const snapshot = await operationsCollection
    .where("extractorId", "==", extractorId)
    .where("userId", "==", profile.uid)
    .where("computedStatus", "==", "pending")
    .orderBy("timestamp", "desc")
    .limit(Math.max(1, Math.min(50, limit)))
    .get();

  const pendingOperations = snapshot.docs.map((doc) => normalizeFirestoreOperation(doc.id, doc.data()));
  const computedFields = getComputedSchemaFields(schemaFields);
  const completedOperations: ExtractionRecord[] = [];

  for (const operation of pendingOperations) {
    const resolvedOperation = createPendingComputedRecord(schemaFields, operation);

    for (const field of computedFields) {
      if (hasUsableComputedValue(resolvedOperation.extractedData[field.fieldName])) {
        continue;
      }

      const value = await generateComputedFieldValueWithLlm({
        profile,
        extractorName,
        field,
        record: resolvedOperation,
      });

      if (hasUsableComputedValue(value)) {
        resolvedOperation.extractedData[field.fieldName] = value;
      }
    }

    const pendingComputedFields = computedFields
      .filter((field) => !hasUsableComputedValue(resolvedOperation.extractedData[field.fieldName]))
      .map((field) => field.fieldName);

    resolvedOperation.computedStatus = pendingComputedFields.length > 0 ? "pending" : "complete";
    resolvedOperation.pendingComputedFields = pendingComputedFields;

    await (operationsCollection.doc(resolvedOperation.id) as any).set({
      ...resolvedOperation,
      extractorId,
      userId: profile.uid,
    }, { merge: true });

    completedOperations.push(resolvedOperation);
  }

  return completedOperations;
}
