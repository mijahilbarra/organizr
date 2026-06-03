import { ExtractionRecord, Extractor } from "../../types";
import { saveNewOperationsForExtractor } from "../operations/saveNewOperationsForExtractor";
import { createRecordsWithPendingComputedStatus } from "./createRecordsWithPendingComputedStatus";

interface SaveNewOperationsWithComputedFieldsParams {
  extractor: Pick<Extractor, "id" | "schemaFields">;
  userId: string;
  records: ExtractionRecord[];
}

export async function saveNewOperationsWithComputedFields({
  extractor,
  userId,
  records,
}: SaveNewOperationsWithComputedFieldsParams): Promise<ExtractionRecord[]> {
  const recordsWithComputedStatus = createRecordsWithPendingComputedStatus(
    extractor.schemaFields,
    records,
  );

  return saveNewOperationsForExtractor(extractor.id, userId, recordsWithComputedStatus);
}
