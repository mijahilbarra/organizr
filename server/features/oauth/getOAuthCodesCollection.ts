import { getFirestoreDb } from "../../firebase/getFirestoreDb";

export async function getOAuthCodesCollection() {
  const db = await getFirestoreDb();
  return (db as any).collection(process.env.FIRESTORE_OAUTH_CODES_COLLECTION || "oauthCodes");
}
