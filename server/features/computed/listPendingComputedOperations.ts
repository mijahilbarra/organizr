import { getOperationsCollection } from "../operations/getOperationsCollection";
import { normalizeFirestoreOperation } from "../operations/normalizeFirestoreOperation";

export async function listPendingComputedOperations(extractorId: string, userId: string) {
  const operationsCollection = await getOperationsCollection();
  const snapshot = await operationsCollection
    .where("extractorId", "==", extractorId)
    .where("userId", "==", userId)
    .where("computedStatus", "==", "pending")
    .orderBy("timestamp", "desc")
    .get();

  return snapshot.docs.map((doc) => normalizeFirestoreOperation(doc.id, doc.data()));
}
