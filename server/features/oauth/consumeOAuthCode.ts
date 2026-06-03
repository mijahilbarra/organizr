import { getOAuthCodesCollection } from "./getOAuthCodesCollection";

export async function consumeOAuthCode(code: string, clientId: string, redirectUri: string) {
  const collection = await getOAuthCodesCollection();
  const documentRef = collection.doc(code);
  const snapshot = await documentRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  const expiresAt = data?.expiresAt ? new Date(data.expiresAt).getTime() : 0;

  if (data?.usedAt || data?.clientId !== clientId || data?.redirectUri !== redirectUri || expiresAt < Date.now()) {
    return null;
  }

  await documentRef.update({ usedAt: new Date().toISOString() });

  return {
    firebaseIdToken: data.firebaseIdToken as string,
    uid: data.uid as string,
    scope: data.scope as string,
  };
}
