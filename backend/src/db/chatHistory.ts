import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "../firebase";

export const CHATS_COLLECTION = "chats";
export const CHAT_MESSAGES_SUBCOLLECTION = "messages";

export interface ChatMessage {
  uid: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  sessionId?: string;
}

export async function appendChatMessage(
  uid: string,
  messageId: string,
  payload: ChatMessage,
) {
  ensureFirebaseApp();
  const db = getFirestore();
  const ref = db
    .collection(CHATS_COLLECTION)
    .doc(uid)
    .collection(CHAT_MESSAGES_SUBCOLLECTION)
    .doc(messageId);

  await ref.set({
    ...payload,
    createdAt: payload.createdAt ?? Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref;
}

export async function listChatMessages(uid: string, limit = 100) {
  ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db
    .collection(CHATS_COLLECTION)
    .doc(uid)
    .collection(CHAT_MESSAGES_SUBCOLLECTION)
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as ChatMessage),
  }));
}
