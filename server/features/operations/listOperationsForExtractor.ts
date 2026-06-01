import { ExtractionRecord } from "../../types";
import { getOperationsCollection } from "./getOperationsCollection";
import { normalizeFirestoreOperation } from "./normalizeFirestoreOperation";

export async function listOperationsForExtractor(
  extractorId: string,
  userId: string,
  limit = 20,
  cursor?: string,
): Promise<{ operations: ExtractionRecord[]; nextCursor: string | null }> {
  const pageSize = Math.max(1, Math.min(20, limit));
  const operationsCollection = await getOperationsCollection();
  let query = operationsCollection
    .where("extractorId", "==", extractorId)
    .where("userId", "==", userId)
    .orderBy("timestamp", "desc");

  if (cursor) {
    query = query.startAfter(cursor);
  }

  const snapshot = await query.limit(pageSize + 1).get();
  const docs = snapshot.docs.slice(0, pageSize);
  const operations = docs.map((doc) => normalizeFirestoreOperation(doc.id, doc.data()));
  const hasNextPage = snapshot.docs.length > pageSize;
  const nextCursor = hasNextPage ? operations[operations.length - 1]?.timestamp || null : null;

  return { operations, nextCursor };
}
