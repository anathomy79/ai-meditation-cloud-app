import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { config } from "./config";
import { resolveSecretValue } from "./config/secrets";

export async function ensureFirebaseApp() {
  if (getApps().length > 0) {
    return;
  }

  const serviceAccountJson = await resolveSecretValue(
    config.firebase.serviceAccountJson,
    config.firebase.serviceAccountSecret,
    config.gcp.projectId || config.firebase.projectId,
  );

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: config.firebase.projectId || serviceAccount.project_id,
      storageBucket: config.firebase.storageBucket,
    });
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: config.firebase.projectId || undefined,
    storageBucket: config.firebase.storageBucket,
  });
}
