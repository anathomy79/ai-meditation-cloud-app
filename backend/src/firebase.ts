import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";

export function ensureFirebaseApp() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
    });
  }
}
