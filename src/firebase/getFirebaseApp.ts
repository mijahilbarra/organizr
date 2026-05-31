import { getApps, initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getFirebaseConfig } from "./getFirebaseConfig";

export const getFirebaseApp = (): FirebaseApp => {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  return initializeApp(getFirebaseConfig());
};
