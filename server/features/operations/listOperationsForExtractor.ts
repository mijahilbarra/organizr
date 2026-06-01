import { ExtractionRecord } from "../../types";
import { getOperationsCollection } from "./getOperationsCollection";
import { normalizeFirestoreOperation } from "./normalizeFirestoreOperation";

export async function listOperationsForExtractor(
  extractorId: string,
  userId: string,
  limit = 20,
  page = 1,
  totalCount = 0,
): Promise<{ operations: ExtractionRecord[]; page: number; pageSize: number; totalCount: number; totalPages: number }> {
  const pageSize = Math.max(1, Math.min(20, limit));
  const currentPage = Math.max(1, page);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const offset = (currentPage - 1) * pageSize;
  const operationsCollection = await getOperationsCollection();
  const query = operationsCollection
    .where("extractorId", "==", extractorId)
    .where("userId", "==", userId)
    .orderBy("timestamp", "desc")
    .offset(offset)
    .limit(pageSize);

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, pageSize);
  const operations = docs.map((doc) => normalizeFirestoreOperation(doc.id, doc.data()));

  return { operations, page: currentPage, pageSize, totalCount, totalPages };
}
