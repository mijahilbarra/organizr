import { DatabaseSchema } from "../types";
import { getDefaultDb } from "./getDefaultDb";
import { getFirestoreDbDocument } from "./getFirestoreDbDocument";
import { normalizeDbSchema } from "./normalizeDbSchema";

/**
 * Reads the server data schema repository.
 * If the Firestore document doesn't exist, it creates a new database initialized with an empty array of extractors.
 */
export async function readDb(): Promise<DatabaseSchema> {
  try {
    const dbDocument = await getFirestoreDbDocument();
    const snapshot = await dbDocument.get();

    if (!snapshot.exists) {
      const defaultDb = getDefaultDb();
      await dbDocument.set(defaultDb, { merge: true });
      return defaultDb;
    }

    return normalizeDbSchema(snapshot.data());
  } catch (error) {
    console.error("Database reading breakdown:", error);
    return getDefaultDb();
  }
}
