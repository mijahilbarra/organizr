import { SchemaField } from "../../../src/types";
import { ExtractionRecord, Extractor, UserProfile } from "../../types";
import { createOperationDocumentId } from "./createOperationDocumentId";
import { getOperationsCollection } from "./getOperationsCollection";
import { normalizeFirestoreOperation } from "./normalizeFirestoreOperation";
import { resolveComputedFieldsForRecords } from "../computed/resolveComputedFieldsForRecords";

export async function resolvePendingOperationsForExtractor({
  profile,
  extractor,
  operations,
}: {
  profile: UserProfile;
  extractor: Extractor;
  operations: ExtractionRecord[];
}): Promise<ExtractionRecord[]> {
  if (operations.length === 0) return [];

  const resolved = await resolveComputedFieldsForRecords({
    profile,
    extractorName: extractor.name,
    schemaFields: extractor.schemaFields,
    records: operations,
  });

  const operationsCollection = await getOperationsCollection();
  const updates: ExtractionRecord[] = [];

  for (const record of resolved) {
    await operationsCollection.doc(createOperationDocumentId(extractor.id, record.emailId)).set({
      ...record,
      extractorId: extractor.id,
      userId: profile.uid,
    }, { merge: true });
    updates.push(normalizeFirestoreOperation(record.id, record));
  }

  return updates;
}
