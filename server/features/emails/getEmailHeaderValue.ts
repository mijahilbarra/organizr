export function getEmailHeaderValue(headers: any[], name: string, fallback: string): string {
  return headers.find((header: any) => header.name.toLowerCase() === name.toLowerCase())?.value || fallback;
}
