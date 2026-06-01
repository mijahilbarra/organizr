export const pushExtractorDetailRoute = (extractorId: string) => {
  window.history.pushState(null, "", `/extractors/${encodeURIComponent(extractorId)}`);
};
