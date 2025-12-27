import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "../firebase";

export const SESSIONS_COLLECTION = "sessions";

export interface SessionMetadata {
  uid: string;
  title?: string;
  moodId?: string;
  model?: string;
  transcript?: string;
  audioPath?: string;
  durationSeconds?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function createSessionMetadata(
  sessionId: string,
  payload: SessionMetadata,
) {
  ensureFirebaseApp();
  const db = getFirestore();
  const ref = db.collection(SESSIONS_COLLECTION).doc(sessionId);

  await ref.set({
    ...payload,
    createdAt: payload.createdAt ?? Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}

export async function updateSessionMetadata(
  sessionId: string,
  updates: Partial<SessionMetadata>,
) {
  ensureFirebaseApp();
  const db = getFirestore();
  const ref = db.collection(SESSIONS_COLLECTION).doc(sessionId);

  await ref.update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}

export async function getSessionMetadata(sessionId: string) {
  ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db
    .collection(SESSIONS_COLLECTION)
    .doc(sessionId)
    .get();

  return snapshot.exists ? (snapshot.data() as SessionMetadata) : null;
}
