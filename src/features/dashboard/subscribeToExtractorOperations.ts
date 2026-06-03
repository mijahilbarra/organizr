import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import type { DocumentData, QuerySnapshot, Unsubscribe } from "firebase/firestore";
import { getOperationsCollection } from "./getOperationsCollection";
import { normalizeFirestoreOperation } from "./normalizeFirestoreOperation";

interface SubscribeToExtractorOperationsParams {
  extractorId: string;
  userId: string;
  onSnapshotData: (snapshot: QuerySnapshot<DocumentData>, operations: ReturnType<typeof normalizeFirestoreOperation>[]) => void;
  onError: (error: Error) => void;
}

export const subscribeToExtractorOperations = ({
  extractorId,
  userId,
  onSnapshotData,
  onError,
}: SubscribeToExtractorOperationsParams): Unsubscribe => {
  const operationsQuery = query(
    getOperationsCollection(),
    where("extractorId", "==", extractorId),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
  );

  return onSnapshot(
    operationsQuery,
    (snapshot) => {
      onSnapshotData(
        snapshot,
        snapshot.docs.map((doc) => normalizeFirestoreOperation(doc.id, doc.data())),
      );
    },
    onError,
  );
};
