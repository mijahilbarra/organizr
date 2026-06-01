export function getPaginationPages(currentPage: number, totalPages: number): number[] {
  const firstPage = Math.max(1, currentPage - 2);
  const lastPage = Math.min(totalPages, firstPage + 4);
  const adjustedFirstPage = Math.max(1, lastPage - 4);

  return Array.from({ length: lastPage - adjustedFirstPage + 1 }, (_, index) => adjustedFirstPage + index);
}
