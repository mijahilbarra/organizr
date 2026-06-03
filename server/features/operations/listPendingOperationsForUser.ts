import { ExtractionRecord } from "../../types";
import { getOperationsCollection } from "./getOperationsCollection";
import { normalizeFirestoreOperation } from "./normalizeFirestoreOperation";

export async function listPendingOperationsForUser(
  userId: string,
  extractorId?: string,
  limit = 50,
): Promise<ExtractionRecord[]> {
  const operationsCollection = await getOperationsCollection();
  let query = operationsCollection
    .where("userId", "==", userId)
    .where("computedStatus", "==", "pending")
    .orderBy("timestamp", "desc")
    .limit(Math.max(1, Math.min(100, limit)));

  if (extractorId) {
    query = query.where("extractorId", "==", extractorId);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => normalizeFirestoreOperation(doc.id, doc.data()));
}
