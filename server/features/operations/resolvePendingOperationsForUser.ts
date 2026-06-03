import { ExtractionRecord, Extractor, UserProfile } from "../../types";
import { getExtractorsCollection } from "../extractors/getExtractorsCollection";
import { normalizeFirestoreExtractor } from "../extractors/normalizeFirestoreExtractor";
import { listPendingOperationsForUser } from "./listPendingOperationsForUser";
import { resolvePendingOperationsForExtractor } from "./resolvePendingOperationsForExtractor";

export async function resolvePendingOperationsForUser(profile: UserProfile, extractorId?: string): Promise<ExtractionRecord[]> {
  const pendingOperations = await listPendingOperationsForUser(profile.uid, extractorId);
  if (pendingOperations.length === 0) return [];

  const byExtractorId = new Map<string, ExtractionRecord[]>();
  for (const record of pendingOperations) {
    const current = byExtractorId.get((record as any).extractorId || "") || [];
    current.push(record);
    byExtractorId.set((record as any).extractorId || "", current);
  }

  const extractorsCollection = await getExtractorsCollection();
  const resolved: ExtractionRecord[] = [];

  for (const [pendingExtractorId, records] of byExtractorId.entries()) {
    if (!pendingExtractorId) continue;
    const snapshot = await extractorsCollection.doc(pendingExtractorId).get();
    if (!snapshot.exists) continue;
    const extractor = normalizeFirestoreExtractor(pendingExtractorId, snapshot.data()) as Extractor;
    if (extractor.userId !== profile.uid) continue;
    resolved.push(...await resolvePendingOperationsForExtractor({ profile, extractor, operations: records }));
  }

  return resolved;
}
