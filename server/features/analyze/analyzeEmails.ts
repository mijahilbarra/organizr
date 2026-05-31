import { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { runExtractorScript } from "./runExtractorScript";

/**
 * Strips code markdown wrapper blocks is returned within JSON string fields
 */
function cleanScriptCode(code: string): string {
  if (!code) return "";
  let clean = code.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```[a-zA-Z]*\n/, "");
    if (clean.endsWith("```")) {
      clean = clean.slice(0, -3);
    }
  }
  return clean.trim();
}

/**
 * Executes a proposed extractData script locally against actual emails
 */
function executeScript(scriptCode: string, emails: any[]): { success: boolean; results: any[]; errors: string[] } {
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

/**
 * Checks which schema-proposed fields were evaluated as null or empty in sample runs
 */
function evaluateExtractionResults(results: any[], schemaFields: any[]) {
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
        details.push(`  ❌ Field "${field.fieldName}" is NULL or EMPTY in this email. Review the content headers/body and adjust your regex patterns to be more tolerant of variations.`);
      } else {
        details.push(`  ✅ Field "${field.fieldName}" matched successfully: "${val}"`);
      }
    });
  });

  return {
    totalOpportunities,
    nullMatches,
    feedback: details.join("\n"),
  };
}

/**
 * Analyzes sample emails using the Gemini 3.5 Flash model under schema-structured generation
 * to recommend fields, draft standard RegExp parsers, and generate alternative Gemini SDK code.
 */
export async function analyzeEmails(req: Request, res: Response) {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "A list of sample emails is required for analysis." });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'organizr',
        }
      }
    });

    const emailSamplesText = emails.map((mail: any, idx: number) => {
      return `
=== SAMPLE EMAIL #${idx + 1} ===
ID: ${mail.id}
From: ${mail.from}
Subject: ${mail.subject}
Date: ${mail.date}
Snippet: ${mail.snippet}
Body content:
${mail.body ? mail.body.substring(0, 4000) : mail.snippet}
=============================
`;
    }).join("\n\n");

    const prompt = `
You are an expert system designed to analyze email payloads and propose clean data extraction schemas and script parsers.
Examine the following ${emails.length} Gmail email samples that share a search criteria. Identify the repeating patterns, common values, metadata, and structured fields inside these emails.

Provide:
1. The detected category or type of these emails.
2. An explanation of what structured information resides here.
3. A robust dataset fields schema proposal (with camelCase naming, types, and descriptions).
4. A highly robust, self-contained JavaScript script (\`extractData(body, subject, sender)\`) using native strings and RegExp patterns to safely extract these fields. Make sure it parses safely, avoids crash if certain parts are missing, and handles different formatting gracefully.
5. An alternative script showing how to extract this data using Gemini AI's structured JSON outputs (with GoogleGenAI SDK in JS/TS).
6. Simulation results for the provided sample emails.

Email samples to analyze:
${emailSamplesText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedType: {
              type: Type.STRING,
              description: "The category/type of email detected (e.g., invoices, flight tickets, newsletter, support alert, registration)."
            },
            explanation: {
              type: Type.STRING,
              description: "Brief analysis of the common layout structure, variable parts, and fields found in these emails."
            },
            schemaFields: {
              type: Type.ARRAY,
              description: "Extracted database fields schema recommendations",
              items: {
                type: Type.OBJECT,
                properties: {
                  fieldName: { type: Type.STRING, description: "camelCase name of the variable" },
                  fieldType: { type: Type.STRING, description: "Data model Type (e.g., string, number, boolean, array)" },
                  description: { type: Type.STRING, description: "Descriptive explanation of the field" },
                  exampleValue: { type: Type.STRING, description: "Real value parsed from these samples" }
                },
                required: ["fieldName", "fieldType", "description", "exampleValue"]
              }
            },
            scriptCode: {
              type: Type.STRING,
              description: "A complete self-contained executable Javascript string containing the function \`extractData(body, subject, sender)\`. Must return an object whose keys are exactly the specified schema fieldNames."
            },
            aiScriptCode: {
              type: Type.STRING,
              description: "A JavaScript code block demonstrating how to parse these same emails using Gemini AI and GoogleGenAI SDK."
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
          required: ["detectedType", "explanation", "schemaFields", "scriptCode", "aiScriptCode", "sampleExtractedResults"]
        }
      }
    });

    const text = response.text || "{}";
    let resultObj = JSON.parse(text);

    // Dynamic Self-Debugging correction loop (max 2 refinements)
    let currentResult = resultObj;
    let loopCount = 0;
    const maxLoops = 2;

    while (loopCount < maxLoops) {
      const scriptCode = cleanScriptCode(currentResult.scriptCode);
      const execution = executeScript(scriptCode, emails);
      const evalReport = evaluateExtractionResults(execution.results, currentResult.schemaFields);

      console.log(`[Self-Debug Tool] Loop ${loopCount + 1}: Null/empty field count: ${evalReport.nullMatches} across ${evalReport.totalOpportunities} field opportunities.`);

      if (evalReport.nullMatches === 0 && execution.success) {
        console.log(`[Self-Debug Tool] Absolute match achieved! All regex scripts validated flawlessly.`);
        currentResult.sampleExtractedResults = execution.results.map(res => ({
          emailId: res.emailId,
          extractedData: JSON.stringify(res.extractedData)
        }));
        break;
      }

      loopCount++;
      console.log(`[Self-Debug Tool] Initiating code correction loop ${loopCount}...`);

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
        const refineResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: refinementPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedType: { type: Type.STRING },
                explanation: { type: Type.STRING },
                schemaFields: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      fieldName: { type: Type.STRING },
                      fieldType: { type: Type.STRING },
                      description: { type: Type.STRING },
                      exampleValue: { type: Type.STRING }
                    },
                    required: ["fieldName", "fieldType", "description", "exampleValue"]
                  }
                },
                scriptCode: { type: Type.STRING, description: "Fully corrected regular-expression parsing function extractData(body, subject, sender)" },
                aiScriptCode: { type: Type.STRING },
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
              required: ["detectedType", "explanation", "schemaFields", "scriptCode", "aiScriptCode", "sampleExtractedResults"]
            }
          }
        });

        const refinedText = refineResponse.text || "{}";
        const refinedObj = JSON.parse(refinedText);

        const verifyCleanCode = cleanScriptCode(refinedObj.scriptCode);
        const verifyExecution = executeScript(verifyCleanCode, emails);
        const verifyReport = evaluateExtractionResults(verifyExecution.results, refinedObj.schemaFields);

        console.log(`[Self-Debug Tool] Cycle ${loopCount} done. Null fields reduced from ${evalReport.nullMatches} to ${verifyReport.nullMatches}`);

        currentResult = refinedObj;

        if (verifyReport.nullMatches < evalReport.nullMatches || verifyReport.nullMatches === 0) {
          console.log(`[Self-Debug Tool] Improvement detected. Retaining corrected code version.`);
          if (verifyExecution.success) {
            currentResult.sampleExtractedResults = verifyExecution.results.map(res => ({
              emailId: res.emailId,
              extractedData: JSON.stringify(res.extractedData)
            }));
          }
        }
      } catch (refineError) {
        console.error(`[Self-Debug Tool] Refinement step failed:`, refineError);
        break;
      }
    }

    res.json(currentResult);
  } catch (err: any) {
    console.error("Gemini analytical indexing breakdown:", err);
    res.status(500).json({ error: err.message || "Something went wrong in the Gemini analysis process." });
  }
}
