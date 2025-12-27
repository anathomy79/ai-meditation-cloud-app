import { getStorage } from "firebase-admin/storage";
import { ensureFirebaseApp } from "../firebase";
import { listChatMessages } from "./chatHistory";
import { deleteMoodLogsByUser, listMoodLogsByUser } from "./moodLogs";
import { deleteSessionsByUser, listSessionsByUser } from "./sessionMetadata";
import { deleteChatHistoryByUser } from "./chatHistory";

export interface UserExportPayload {
  uid: string;
  generatedAt: string;
  moods: Awaited<ReturnType<typeof listMoodLogsByUser>>;
  sessions: Awaited<ReturnType<typeof listSessionsByUser>>;
  chats: Awaited<ReturnType<typeof listChatMessages>>;
}

export async function exportUserData(uid: string): Promise<UserExportPayload> {
  await ensureFirebaseApp();
  const [moods, sessions, chats] = await Promise.all([
    listMoodLogsByUser(uid, 200),
    listSessionsByUser(uid, 200),
    listChatMessages(uid, 200),
  ]);

  return {
    uid,
    generatedAt: new Date().toISOString(),
    moods,
    sessions,
    chats,
  };
}

const deleteStorageFiles = async (paths: string[]) => {
  if (paths.length === 0) {
    return;
  }
  const bucket = getStorage().bucket();
  await Promise.all(
    paths.map(async (path) => {
      const file = bucket.file(path);
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
      }
    }),
  );
};

export async function deleteUserData(uid: string) {
  await ensureFirebaseApp();
  const sessions = await listSessionsByUser(uid, 500);
  const audioPaths = sessions
    .map((session) => session.audioPath)
    .filter((path): path is string => Boolean(path));

  const [moodCount, sessionCount] = await Promise.all([
    deleteMoodLogsByUser(uid),
    deleteSessionsByUser(uid),
  ]);

  await deleteChatHistoryByUser(uid);
  await deleteStorageFiles(audioPaths);

  return {
    uid,
    moodCount,
    sessionCount,
    deletedAt: new Date().toISOString(),
  };
}
