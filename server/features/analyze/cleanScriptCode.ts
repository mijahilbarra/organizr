export function cleanScriptCode(code: string): string {
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
