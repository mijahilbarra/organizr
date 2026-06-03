export function createGptActionUrl(path: string): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const normalizedAppUrl = appUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedAppUrl}${normalizedPath}`;
}
