import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirebaseApp } from "./getFirebaseApp";

export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
};
