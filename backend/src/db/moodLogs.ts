import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "../firebase";

export const MOODS_COLLECTION = "moods";

export interface MoodLog {
  uid: string;
  label: string;
  score?: number;
  notes?: string;
  sessionId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function createMoodLog(moodId: string, payload: MoodLog) {
  ensureFirebaseApp();
  const db = getFirestore();
  const ref = db.collection(MOODS_COLLECTION).doc(moodId);

  await ref.set({
    ...payload,
    createdAt: payload.createdAt ?? Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}

export async function listMoodLogsByUser(uid: string, limit = 50) {
  ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db
    .collection(MOODS_COLLECTION)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as MoodLog),
  }));
}

export async function updateMoodLog(
  moodId: string,
  updates: Partial<MoodLog>,
) {
  ensureFirebaseApp();
  const db = getFirestore();
  const ref = db.collection(MOODS_COLLECTION).doc(moodId);

  await ref.update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}
