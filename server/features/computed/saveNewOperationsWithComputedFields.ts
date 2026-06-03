import { ExtractionRecord, Extractor } from "../../types";
import { getUserProfileById } from "../profile/getUserProfileById";
import { saveNewOperationsForExtractor } from "../operations/saveNewOperationsForExtractor";
import { resolveComputedFieldsForRecords } from "./resolveComputedFieldsForRecords";

interface SaveNewOperationsWithComputedFieldsParams {
  extractor: Pick<Extractor, "id" | "name" | "schemaFields">;
  userId: string;
  records: ExtractionRecord[];
}

export async function saveNewOperationsWithComputedFields({
  extractor,
  userId,
  records,
}: SaveNewOperationsWithComputedFieldsParams): Promise<ExtractionRecord[]> {
  const profile = await getUserProfileById(userId);

  if (!profile) {
    return saveNewOperationsForExtractor(extractor.id, userId, records);
  }

  const resolvedRecords = await resolveComputedFieldsForRecords({
    profile,
    extractorName: extractor.name,
    schemaFields: extractor.schemaFields,
    records,
  });

  return saveNewOperationsForExtractor(extractor.id, userId, resolvedRecords);
}
