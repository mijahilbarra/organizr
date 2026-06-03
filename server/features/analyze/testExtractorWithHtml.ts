import { Request, Response } from "express";
import { compileExtractorScript } from "./compileExtractorScript";

export function testExtractorWithHtml(req: Request, res: Response) {
  const { scriptCode, html, subject = "", from = "" } = req.body;

  if (!scriptCode || typeof scriptCode !== "string") {
    return res.status(400).json({ error: "Script code is required." });
  }

  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "HTML content is required." });
  }

  try {
    const extractFn = compileExtractorScript(scriptCode);
    const output = extractFn(html, String(subject), String(from));

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
