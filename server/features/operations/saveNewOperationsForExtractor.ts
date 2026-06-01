import { getExtractorsCollection } from "../extractors/getExtractorsCollection";
import { ExtractionRecord } from "../../types";
import { getOperationsCollection } from "./getOperationsCollection";

export async function saveNewOperationsForExtractor(
  extractorId: string,
  userId: string,
  records: ExtractionRecord[],
): Promise<ExtractionRecord[]> {
  const operationsCollection = await getOperationsCollection();
  const createdRecords: ExtractionRecord[] = [];

  for (const record of records) {
    try {
      await operationsCollection.doc(record.id).create({
        ...record,
        extractorId,
        userId,
      });
      createdRecords.push(record);
    } catch (error: any) {
      if (error?.code !== 6 && error?.code !== "already-exists") {
        throw error;
      }
    }
  }

  if (createdRecords.length > 0) {
    const firestoreModule = await import("firebase-admin/firestore");
    const extractorsCollection = await getExtractorsCollection();
    await extractorsCollection.doc(extractorId).set({
      operationCount: firestoreModule.FieldValue.increment(createdRecords.length),
    }, { merge: true });
  }

  return createdRecords;
}
