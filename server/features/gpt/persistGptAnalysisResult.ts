import { Request } from "express";
import { createExtractor } from "../extractors/createExtractor";
import { createExtractorSubject } from "../extractors/createExtractorSubject";
import { getExtractorByIdForUser } from "../extractors/getExtractorByIdForUser";
import { normalizeExtractorSubjects } from "../extractors/normalizeExtractorSubjects";
import { updateExtractorById } from "../extractors/updateExtractorById";
import { captureExpressJson } from "./captureExpressJson";
import { createGptExtractorRequest } from "./createGptExtractorRequest";

export async function persistGptAnalysisResult(
  req: Request,
  userId: string,
  analysis: any,
  subject: string,
  emails: any[],
): Promise<{
  created: boolean;
  statusCode: number;
  body: any;
}> {
  const extractorId = String(req.body?.extractorId || "").trim();

  if (!extractorId) {
    const extractorRequest = createGptExtractorRequest(req, analysis, subject, emails);
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

  const savedExtractor = await updateExtractorById(extractorId, userId, (extractor) => {
    const nextExtractor = normalizeExtractorSubjects(extractor);
    nextExtractor.subjects.push(createExtractorSubject(subject, analysis.scriptCode));

    extractor.subjects = nextExtractor.subjects;

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
