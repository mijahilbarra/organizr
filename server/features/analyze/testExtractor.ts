import { Request, Response } from "express";
import { runExtractorScript } from "./runExtractorScript";

/**
 * Sandboxes and tests a JavaScript extractor script against sample emails.
 * Validates that the "extractData" function exists and executes without crashing, returning simulated extraction records.
 */
export function testExtractor(req: Request, res: Response) {
  const { scriptCode, emails } = req.body;

  if (!scriptCode || typeof scriptCode !== "string") {
    return res.status(400).json({ error: "Script code is required." });
  }

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ error: "Sample emails list is required." });
  }

  try {
    const results = runExtractorScript(scriptCode, emails).map((result) => ({
      ...result,
      extractedData: JSON.stringify(
        result.success
          ? result.extractedData
          : { error: result.error || "Exception occurring during extraction execution." },
      ),
    }));

    res.json({ results });
  } catch (error: any) {
    console.error("Test execution handler error:", error);
    res.status(450).json({ error: `Script Compilation/Sizing Error: ${error.message}` });
  }
}
