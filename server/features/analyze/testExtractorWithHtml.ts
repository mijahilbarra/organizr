import { Request, Response } from "express";
import { SchemaField } from "../../../src/types";
import { compileExtractorScript } from "./compileExtractorScript";
import { validateComputedStatusForSchemaOutput } from "../computed/validateComputedStatusForSchemaOutput";

export function testExtractorWithHtml(req: Request, res: Response) {
  const { scriptCode, html, subject = "", from = "", schemaFields } = req.body;

  if (!scriptCode || typeof scriptCode !== "string") {
    return res.status(400).json({ error: "Script code is required." });
  }

  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "HTML content is required." });
  }

  try {
    const extractFn = compileExtractorScript(scriptCode);
    const output = extractFn(html, String(subject), String(from));

    if (Array.isArray(schemaFields)) {
      if (!output || typeof output !== "object" || Array.isArray(output)) {
        return res.status(400).json({
          success: false,
          error: "Parser output must be an object when schemaFields are provided.",
        });
      }

      const computedStatusValidation = validateComputedStatusForSchemaOutput(
        schemaFields as SchemaField[],
        output,
      );

      if (computedStatusValidation.ok === false) {
        return res.status(400).json({
          success: false,
          error: computedStatusValidation.message,
          output,
        });
      }
    }

    return res.json({
      success: true,
      output,
    });
  } catch (error: any) {
    console.error("HTML script test failed:", error);
    return res.status(450).json({
      success: false,
      error: error.message || "Script execution failed.",
    });
  }
}
