import { runExtractorScript } from "./runExtractorScript";

export function executeExtractorScriptForEmails(scriptCode: string, emails: any[]): { success: boolean; results: any[]; errors: string[] } {
  try {
    const results = runExtractorScript(scriptCode, emails);
    const errors = results
      .filter((result) => !result.success)
      .map((result) => `Email ${result.emailId} execution failed: ${result.error}`);

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      results: [],
      errors: [`Script Compilation Error: ${error.message}`],
    };
  }
}
