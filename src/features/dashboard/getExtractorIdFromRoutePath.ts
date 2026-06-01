export const getExtractorIdFromRoutePath = (pathname: string) => {
  const match = pathname.match(/^\/extractors\/([^/]+)$/);
  if (!match || match[1] === "create") return null;

  return decodeURIComponent(match[1]);
};
