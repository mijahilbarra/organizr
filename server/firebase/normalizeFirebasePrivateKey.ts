export function normalizeFirebasePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n");
}
