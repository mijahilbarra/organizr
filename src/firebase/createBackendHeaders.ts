interface CreateBackendHeadersOptions {
  firebaseIdToken: string | null;
  gmailAccessToken?: string | null;
  includeJson?: boolean;
}

export const createBackendHeaders = ({
  firebaseIdToken,
  gmailAccessToken,
  includeJson = false,
}: CreateBackendHeadersOptions): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (firebaseIdToken) {
    headers.Authorization = `Bearer ${firebaseIdToken}`;
  }

  if (gmailAccessToken) {
    headers["X-Gmail-Token"] = gmailAccessToken;
  }

  return headers;
};
