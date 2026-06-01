import { getUsersCollection, UserProfileDocumentRef } from "./getUsersCollection";

export async function getUserProfileDocument(userId: string): Promise<UserProfileDocumentRef> {
  const usersCollection = await getUsersCollection();
  return usersCollection.doc(userId);
}
