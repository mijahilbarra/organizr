import { Request } from "express";
import { ValidationSample } from "../../../src/types";
import { createExtractor } from "../extractors/createExtractor";
import { getExtractorByIdForUser } from "../extractors/getExtractorByIdForUser";
import { createValidatedExtractorSubject } from "../extractors/createValidatedExtractorSubject";
import { normalizeExtractorSubjects } from "../extractors/normalizeExtractorSubjects";
import { syncExtractorSamplesWithSubjects } from "../extractors/syncExtractorSamplesWithSubjects";
import { updateExtractorById } from "../extractors/updateExtractorById";
import { captureExpressJson } from "./captureExpressJson";
import { createGptExtractorRequest } from "./createGptExtractorRequest";

export async function persistGptAnalysisResult(
  req: Request,
  userId: string,
  analysis: any,
  subject: string,
  emails: any[],
  validationSample?: ValidationSample | null,
): Promise<{
  created: boolean;
  statusCode: number;
  body: any;
}> {
  const extractorId = String(req.body?.extractorId || "").trim();

  if (!extractorId) {
    const extractorRequest = createGptExtractorRequest(req, analysis, subject, emails, validationSample);
    const created = await captureExpressJson(createExtractor, extractorRequest);

    return {
      created: true,
      statusCode: created.statusCode,
      body: created.body,
    };
  }

  const currentExtractor = await getExtractorByIdForUser(extractorId, userId);

  if (!currentExtractor) {
    return {
      created: false,
      statusCode: 404,
      body: { error: "Extractor not found." },
    };
  }

  const normalizedExtractor = normalizeExtractorSubjects(currentExtractor);
  const alreadyRegistered = normalizedExtractor.subjects.some(
    (registeredSubject) => registeredSubject.value.toLowerCase() === subject.toLowerCase(),
  );

  if (alreadyRegistered) {
    return {
      created: false,
      statusCode: 409,
      body: { error: "Subject already exists on this extractor." },
    };
  }

  if (!validationSample) {
    return {
      created: false,
      statusCode: 400,
      body: { error: `Subject "${subject}" requires a Gmail sample body for parser validation.` },
    };
  }

  const savedExtractor = await updateExtractorById(extractorId, userId, (extractor) => {
    const nextExtractor = normalizeExtractorSubjects(extractor);
    const validatedSubject = createValidatedExtractorSubject({
      schemaFields: extractor.schemaFields,
      subject,
      scriptCode: analysis.scriptCode,
      validationSample,
    }).subject;

    nextExtractor.subjects.push(validatedSubject);

    extractor.subjects = nextExtractor.subjects;
    const syncedSamples = syncExtractorSamplesWithSubjects(extractor);
    extractor.sampleEmails = syncedSamples.sampleEmails;
    extractor.sampleExtractedResults = syncedSamples.sampleExtractedResults;

    if (!extractor.query) {
      extractor.query = subject;
    }
  });

  if (!savedExtractor) {
    return {
      created: false,
      statusCode: 404,
      body: { error: "Extractor not found." },
    };
  }

  return {
    created: false,
    statusCode: 200,
    body: {
      extractor: savedExtractor,
      message: "Subject registered and attached to the extractor.",
    },
  };
}
