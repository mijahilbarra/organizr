type ExtractDataFunction = (body: string, subject: string, sender: string) => Record<string, any>;

export function compileExtractorScript(scriptCode: string): ExtractDataFunction {
  const wrapperCode = `
    ${scriptCode}
    if (typeof extractData !== 'function') {
      throw new Error("Function 'extractData' has not been defined in the script. Ensure your function has the signature 'extractData(body, subject, sender)'.");
    }
    return extractData;
  `;

  const executor = new Function(wrapperCode);
  return executor() as ExtractDataFunction;
}
