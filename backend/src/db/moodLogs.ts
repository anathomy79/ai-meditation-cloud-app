import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "../firebase";

export const MOODS_COLLECTION = "moods";

export interface MoodLog {
  uid: string;
  label: string;
  score?: number;
  sessionId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const minimizeMoodLog = (payload: MoodLog | Partial<MoodLog>): Partial<MoodLog> => {
  const minimized: Partial<MoodLog> = {
    uid: payload.uid,
    label: payload.label,
    score: payload.score,
    sessionId: payload.sessionId,
    createdAt: payload.createdAt,
  };
  return Object.fromEntries(
    Object.entries(minimized).filter(([, value]) => value !== undefined),
  ) as Partial<MoodLog>;
};

export async function createMoodLog(moodId: string, payload: MoodLog) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const ref = db.collection(MOODS_COLLECTION).doc(moodId);

  await ref.set({
    ...minimizeMoodLog(payload),
    createdAt: payload.createdAt ?? Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}

export async function listMoodLogsByUser(uid: string, limit = 50) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db
    .collection(MOODS_COLLECTION)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(minimizeMoodLog(doc.data() as MoodLog) as MoodLog),
  }));
}

export async function updateMoodLog(
  moodId: string,
  updates: Partial<MoodLog>,
) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const ref = db.collection(MOODS_COLLECTION).doc(moodId);

  await ref.update({
    ...minimizeMoodLog(updates),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}

const deleteMoodDocs = async (refs: FirebaseFirestore.QueryDocumentSnapshot[]) => {
  const db = getFirestore();
  for (let i = 0; i < refs.length; i += 500) {
    const batch = db.batch();
    refs.slice(i, i + 500).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
};

export async function deleteMoodLogsByUser(uid: string) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db.collection(MOODS_COLLECTION).where("uid", "==", uid).get();
  await deleteMoodDocs(snapshot.docs);
  return snapshot.size;
}
