import { Request, Response } from "express";
import { Type } from "@google/genai";
import { loadRequiredUserProfileForRequest } from "../profile/loadRequiredUserProfileForRequest";
import { createLlmProviderErrorResponse } from "../llm/createLlmProviderErrorResponse";
import { generateResolvedLlmJsonContent } from "../llm/generateResolvedLlmJsonContent";
import { isLlmProviderError } from "../llm/isLlmProviderError";
import { cleanScriptCode } from "./cleanScriptCode";
import { createSchemaFieldResponseSchema } from "./createSchemaFieldResponseSchema";
import { evaluateExtractionResults } from "./evaluateExtractionResults";
import { executeExtractorScriptForEmails } from "./executeExtractorScriptForEmails";
import { formatEmailSamples } from "./formatEmailSamples";
import { normalizeComputedSchemaFields } from "../computed/normalizeComputedSchemaFields";

/**
 * Analyzes sample emails using the Gemini 3.5 Flash model under schema-structured generation
 * to recommend fields and draft a standard RegExp parser.
 */
export async function analyzeEmails(req: Request, res: Response) {
  const profileContext = await loadRequiredUserProfileForRequest(req, res);
  if (!profileContext) return;

  const { emails } = req.body;
  const { profile } = profileContext;
  const debugLogs: string[] = [];
  const addDebugLog = (message: string) => {
    const line = `[LLM Schema] ${message}`;
    debugLogs.push(line);
    console.log(line);
  };

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "A list of sample emails is required for analysis." });
  }

  try {
    addDebugLog(`Preparing ${emails.length} selected email sample${emails.length === 1 ? "" : "s"} for schema discovery.`);

    const emailSamplesText = formatEmailSamples(emails, "SAMPLE EMAIL");

    const prompt = `
You are an expert system designed to analyze email payloads and propose clean data extraction schemas and script parsers.
Examine the following ${emails.length} Gmail email samples that share a search criteria. Identify the repeating patterns, common values, metadata, and structured fields inside these emails.

Provide:
1. The detected category or type of these emails.
2. An explanation of what structured information resides here.
3. A robust dataset fields schema proposal (with camelCase naming, types, and descriptions).
4. A highly robust, self-contained JavaScript script (\`extractData(body, subject, sender)\`) using native strings and RegExp patterns to safely extract these fields. Make sure it parses safely, avoids crash if certain parts are missing, and handles different formatting gracefully.
5. Simulation results for the provided sample emails.

Email samples to analyze:
${emailSamplesText}
`;

    addDebugLog("Sending first schema discovery request to the configured LLM provider.");
    const response = await generateResolvedLlmJsonContent(
      profile,
      req.body?.provider,
      prompt,
      {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description: "Brief analysis of the common layout structure, variable parts, and fields found in these emails."
            },
            schemaFields: {
              type: Type.ARRAY,
              description: "Extracted database fields schema recommendations",
              items: createSchemaFieldResponseSchema()
            },
            scriptCode: {
              type: Type.STRING,
              description: "A complete self-contained executable Javascript string containing the function \`extractData(body, subject, sender)\`. Must return an object whose keys are exactly the specified schema fieldNames."
            },
            sampleExtractedResults: {
              type: Type.ARRAY,
              description: "The extracted JSON output simulated for each of the provided sample emails",
              items: {
                type: Type.OBJECT,
                properties: {
                  emailId: { type: Type.STRING },
                  extractedData: {
                    type: Type.STRING,
                    description: "JSON stringified equivalent of key-value extracted values."
                  }
                },
                required: ["emailId", "extractedData"]
              }
            }
          },
          required: ["explanation", "schemaFields", "scriptCode", "sampleExtractedResults"]
      },
      addDebugLog,
    );

    addDebugLog(`Resolved analysis provider: ${response.providerLabel}.`);
    const text = response.text || "{}";
    let resultObj = JSON.parse(text);
    resultObj.schemaFields = normalizeComputedSchemaFields(resultObj.schemaFields || []);
    addDebugLog(`Gemini returned initial schema with ${resultObj.schemaFields?.length || 0} field${resultObj.schemaFields?.length === 1 ? "" : "s"}.`);

    // Dynamic Self-Debugging correction loop (max 2 refinements)
    let currentResult = resultObj;
    let loopCount = 0;
    const maxLoops = 2;

    while (loopCount < maxLoops) {
      const scriptCode = cleanScriptCode(currentResult.scriptCode);
      const execution = executeExtractorScriptForEmails(scriptCode, emails);
      const evalReport = evaluateExtractionResults(execution.results, currentResult.schemaFields);

      addDebugLog(`Validation pass ${loopCount + 1}: ${evalReport.nullMatches} empty value${evalReport.nullMatches === 1 ? "" : "s"} across ${evalReport.totalOpportunities} field checks; ${execution.errors.length} execution error${execution.errors.length === 1 ? "" : "s"}.`);

      if (evalReport.nullMatches === 0 && execution.success) {
        addDebugLog("Validation passed without empty fields. Keeping the generated parser.");
        currentResult.sampleExtractedResults = execution.results.map(res => ({
          emailId: res.emailId,
          extractedData: JSON.stringify(res.extractedData)
        }));
        break;
      }

      loopCount++;
      addDebugLog(`Starting refinement bounce ${loopCount}: sending failed matches and parser feedback back to Gemini.`);

      const refinementPrompt = `
You are an expert self-correcting assistant designed to rewrite, repair, and harden regular expressions in JavaScript.
We evaluated your generated \`extractData(body, subject, sender)\` routine against the real-world sample emails, and discovered that some patterns/regexes did not match (returned null/empty) or threw errors.

=== YOUR PREVIOUS GENERATED SCRIPT ===
${scriptCode}

=== EMAIL PAYLOADS TO ANALYZE ===
${emailSamplesText}

=== ACTUAL EXTRACTION RESULTS & DISCREPANCIES ===
${evalReport.feedback}
${execution.errors.length > 0 ? "Execution crash details:\n" + execution.errors.join("\n") : ""}

=== DIRECTIVE FOR SCRIPT HARDENING ===
Please rewrite the \`extractData(body, subject, sender)\` function. Modify your RegExp patterns to be highly resilient:
1. Don't use overly rigid string templates or absolute word sequences. Make spaces optional using \`\\s*\`, use lazy matching \`(.*?)\` instead of rigid greediness, and use case-insensitive matching (\`/i\`).
2. Make sure you match variations with accents (e.g., "realizo", "realizó", "confirmó", "confirmacion", "confirmación", "comercio", "operación") by using character classes like \`realiz[o\u00f3]\` or simple alternate words.
3. Spanish bank transaction emails often format:
   - Card types or numbers: "Amex *1234", "Amex 1234", "Tarjeta Visa", etc. Make sure \`cardNumberMatch\` handles multiple cases.
   - Commerces: "Consumo en: [Merchant]", "Compra en [Merchant]", "Comercio: [Merchant]", etc.
   - Amounts: "Monto: S/ 102.50", "Monto: US$ 5.00", "Importe: $1,200", "S/.50.00". Ensure that any thousand-separator commas \`,\` are deleted cleanly before using \`parseFloat\` so that it evaluates to a proper number, and preserve the currency symbol (e.g. S/., S/, $, USD) in a currency field.
   - Dates and Times: "Fecha: [Date]", "Hora: [Time]".
4. If a field cannot be matched on the body, check if it can be extracted from the \`subject\` or \`sender\` (e.g. Card type Amex/Visa might be in the Subject, like "Consumo Tarjeta Amex").
5. Return a complete, self-contained executable Javascript function \`extractData(body, subject, sender)\`.

Deliver a fully repaired schema and updated scriptCode that passes all sample tests with perfect non-null matches. Keep the JSON schema exact.
`;

      try {
        const refineResponse = await generateResolvedLlmJsonContent(
          profile,
          req.body?.provider,
          refinementPrompt,
          {
              type: Type.OBJECT,
              properties: {
                explanation: { type: Type.STRING },
                schemaFields: {
                  type: Type.ARRAY,
                  items: createSchemaFieldResponseSchema()
                },
                scriptCode: { type: Type.STRING, description: "Fully corrected regular-expression parsing function extractData(body, subject, sender)" },
                sampleExtractedResults: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      emailId: { type: Type.STRING },
                      extractedData: { type: Type.STRING }
                    },
                    required: ["emailId", "extractedData"]
                  }
                }
              },
              required: ["explanation", "schemaFields", "scriptCode", "sampleExtractedResults"]
          },
          addDebugLog,
        );

        const refinedText = refineResponse.text || "{}";
        const refinedObj = JSON.parse(refinedText);
        refinedObj.schemaFields = normalizeComputedSchemaFields(refinedObj.schemaFields || []);

        const verifyCleanCode = cleanScriptCode(refinedObj.scriptCode);
        const verifyExecution = executeExtractorScriptForEmails(verifyCleanCode, emails);
        const verifyReport = evaluateExtractionResults(verifyExecution.results, refinedObj.schemaFields);

        addDebugLog(`Refinement bounce ${loopCount} finished: empty values changed from ${evalReport.nullMatches} to ${verifyReport.nullMatches}.`);

        currentResult = refinedObj;

        if (verifyReport.nullMatches < evalReport.nullMatches || verifyReport.nullMatches === 0) {
          addDebugLog("Improvement detected. Retaining the corrected schema/parser version.");
          if (verifyExecution.success) {
            currentResult.sampleExtractedResults = verifyExecution.results.map(res => ({
              emailId: res.emailId,
              extractedData: JSON.stringify(res.extractedData)
            }));
          }
        } else {
          addDebugLog("No measurable improvement detected, but retaining Gemini's latest parser candidate for review.");
        }
      } catch (refineError) {
        addDebugLog(`Refinement bounce ${loopCount} failed; returning the latest usable schema candidate.`);
        console.error(`[Self-Debug Tool] Refinement step failed:`, refineError);
        break;
      }
    }

    currentResult.debugLogs = debugLogs;
    currentResult.provider = response.provider;
    res.json(currentResult);
  } catch (err: any) {
    console.error("LLM analytical indexing breakdown:", err);
    if (isLlmProviderError(err)) {
      return res.status(err.status).json({ ...createLlmProviderErrorResponse(err), debugLogs });
    }

    res.status(500).json({ error: err.message || "Something went wrong in the Gemini analysis process." });
  }
}
