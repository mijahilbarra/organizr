import { ExtractionRecord } from "../../types";

export function createPendingComputedOperations(operations: ExtractionRecord[]): ExtractionRecord[] {
  return operations.filter((operation) => operation.computedStatus === "pending");
}
