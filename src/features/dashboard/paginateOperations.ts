import type { ExtractionRecord, ExtractorOperationsPage } from "../../types";

export const paginateOperations = (
  operations: ExtractionRecord[],
  pageNumber: number,
  pageSize = 20,
): ExtractorOperationsPage => {
  const totalCount = operations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, pageNumber), totalPages);
  const offset = (page - 1) * pageSize;

  return {
    operations: operations.slice(offset, offset + pageSize),
    page,
    pageSize,
    totalCount,
    totalPages,
  };
};
