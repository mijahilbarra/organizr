import { getFirebaseAdminApp } from "../../firebase/getFirebaseAdminApp";

export async function verifyFirebaseIdToken(idToken: string): Promise<unknown> {
  const firebaseAdminApp = await getFirebaseAdminApp();
  const firebaseAuthPackage = "firebase-admin/auth";
  const firebaseAuthModule = await import(firebaseAuthPackage);
  const auth = firebaseAuthModule.getAuth(firebaseAdminApp);

  return auth.verifyIdToken(idToken);
}
