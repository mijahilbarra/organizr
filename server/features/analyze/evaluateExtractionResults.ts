export function evaluateExtractionResults(results: any[], schemaFields: any[]) {
  let totalOpportunities = 0;
  let nullMatches = 0;
  const details: string[] = [];

  results.forEach((res, idx) => {
    if (!res.success) {
      details.push(`[Email #${idx + 1}] Exec failed: ${res.error}`);
      return;
    }

    const data = res.extractedData || {};
    details.push(`[Email #${idx + 1}] Parsed output: ${JSON.stringify(data)}`);
    schemaFields.forEach((field: any) => {
      totalOpportunities++;
      const val = data[field.fieldName];
      if (val === null || val === undefined || val === "") {
        nullMatches++;
        details.push(`  Field "${field.fieldName}" is NULL or EMPTY in this email. Review the content headers/body and adjust your regex patterns to be more tolerant of variations.`);
      } else {
        details.push(`  Field "${field.fieldName}" matched successfully: "${val}"`);
      }
    });
  });

  return {
    totalOpportunities,
    nullMatches,
    feedback: details.join("\n"),
  };
}
