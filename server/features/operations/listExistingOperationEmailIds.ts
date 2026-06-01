import { createOperationDocumentId } from "./createOperationDocumentId";
import { getOperationsCollection } from "./getOperationsCollection";

export async function listExistingOperationEmailIds(extractorId: string, emailIds: string[]): Promise<Set<string>> {
  const operationsCollection = await getOperationsCollection();
  const existingEmailIds = new Set<string>();

  await Promise.all(emailIds.map(async (emailId) => {
    const snapshot = await operationsCollection.doc(createOperationDocumentId(extractorId, emailId)).get();
    if (snapshot.exists) {
      existingEmailIds.add(emailId);
    }
  }));

  return existingEmailIds;
}
