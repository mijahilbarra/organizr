import { getFirebaseConfig } from "./getFirebaseConfig";

export const hasFirebaseConfig = (): boolean => {
  try {
    getFirebaseConfig();
    return true;
  } catch {
    return false;
  }
};
