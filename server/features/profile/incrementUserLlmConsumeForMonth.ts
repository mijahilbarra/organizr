import { getUserProfileDocument } from "./getUserProfileDocument";

export async function incrementUserLlmConsumeForMonth(
  userId: string,
  monthKey: string,
  consume: {
    requestCount: number;
    promptTokenCount: number;
    candidateTokenCount: number;
    totalTokenCount: number;
  },
): Promise<void> {
  const firestoreModule = await import("firebase-admin/firestore");
  const profileDocument = await getUserProfileDocument(userId);

  await profileDocument.set({
    llmConsumeByMonth: {
      [monthKey]: {
        requestCount: firestoreModule.FieldValue.increment(consume.requestCount),
        promptTokenCount: firestoreModule.FieldValue.increment(consume.promptTokenCount),
        candidateTokenCount: firestoreModule.FieldValue.increment(consume.candidateTokenCount),
        totalTokenCount: firestoreModule.FieldValue.increment(consume.totalTokenCount),
      },
    },
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
