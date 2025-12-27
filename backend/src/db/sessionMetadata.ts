import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "../firebase";

export const SESSIONS_COLLECTION = "sessions";

export interface SessionMetadata {
  uid: string;
  title?: string;
  moodId?: string;
  model?: string;
  audioPath?: string;
  durationSeconds?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const minimizeSessionMetadata = (
  payload: SessionMetadata | Partial<SessionMetadata>,
): Partial<SessionMetadata> => {
  const minimized: Partial<SessionMetadata> = {
    uid: payload.uid,
    title: payload.title,
    moodId: payload.moodId,
    model: payload.model,
    audioPath: payload.audioPath,
    durationSeconds: payload.durationSeconds,
    createdAt: payload.createdAt,
  };
  return Object.fromEntries(
    Object.entries(minimized).filter(([, value]) => value !== undefined),
  ) as Partial<SessionMetadata>;
};

export async function createSessionMetadata(
  sessionId: string,
  payload: SessionMetadata,
) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const ref = db.collection(SESSIONS_COLLECTION).doc(sessionId);

  await ref.set({
    ...minimizeSessionMetadata(payload),
    createdAt: payload.createdAt ?? Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}

export async function updateSessionMetadata(
  sessionId: string,
  updates: Partial<SessionMetadata>,
) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const ref = db.collection(SESSIONS_COLLECTION).doc(sessionId);

  await ref.update({
    ...minimizeSessionMetadata(updates),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}

export async function getSessionMetadata(sessionId: string) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db
    .collection(SESSIONS_COLLECTION)
    .doc(sessionId)
    .get();

  return snapshot.exists
    ? (minimizeSessionMetadata(snapshot.data() as SessionMetadata) as SessionMetadata)
    : null;
}

export async function listSessionsByUser(uid: string, limit = 100) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db
    .collection(SESSIONS_COLLECTION)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(minimizeSessionMetadata(doc.data() as SessionMetadata) as SessionMetadata),
  }));
}

const deleteSessionDocs = async (refs: FirebaseFirestore.QueryDocumentSnapshot[]) => {
  const db = getFirestore();
  for (let i = 0; i < refs.length; i += 500) {
    const batch = db.batch();
    refs.slice(i, i + 500).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
};

export async function deleteSessionsByUser(uid: string) {
  await ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db.collection(SESSIONS_COLLECTION).where("uid", "==", uid).get();
  await deleteSessionDocs(snapshot.docs);
  return snapshot.size;
}
