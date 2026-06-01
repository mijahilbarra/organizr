export async function getFirestoreServerTimestamp(): Promise<unknown> {
  const firestorePackage = "firebase-admin/firestore";
  const firestoreModule = await import(firestorePackage);

  return firestoreModule.FieldValue.serverTimestamp();
}
