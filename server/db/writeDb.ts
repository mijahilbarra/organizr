import { DatabaseSchema } from "../types";
import { getFirestoreDbDocument } from "./getFirestoreDbDocument";

/**
 * Writes the specified schema updates back to Firestore.
 */
export async function writeDb(db: DatabaseSchema): Promise<boolean> {
  try {
    const dbDocument = await getFirestoreDbDocument();
    await dbDocument.set(
      {
        ...db,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return true;
  } catch (error) {
    console.error("Database writing breakdown:", error);
    return false;
  }
}
