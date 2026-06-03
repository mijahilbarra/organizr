export function createOAuthActionUrl(path: string) {
  const appUrl = process.env.APP_URL || "https://api-45fybwj2xq-uc.a.run.app";
  const normalizedAppUrl = appUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedAppUrl}${normalizedPath}`;
}
