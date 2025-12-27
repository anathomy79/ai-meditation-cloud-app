import { getStorage } from "firebase-admin/storage";
import { ensureFirebaseApp } from "../firebase";

export interface UploadAudioOptions {
  contentType?: string;
  cacheControl?: string;
}

export interface UploadAudioResult {
  storagePath: string;
  publicUrl: string;
  size: number;
}

export async function uploadAudioBuffer(
  storagePath: string,
  buffer: Buffer,
  options: UploadAudioOptions = {},
): Promise<UploadAudioResult> {
  ensureFirebaseApp();
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);

  await file.save(buffer, {
    contentType: options.contentType ?? "audio/mpeg",
    metadata: {
      cacheControl: options.cacheControl ?? "private, max-age=3600",
    },
    resumable: false,
  });

  const [metadata] = await file.getMetadata();

  return {
    storagePath,
    publicUrl: `gs://${bucket.name}/${storagePath}`,
    size: Number(metadata.size ?? 0),
  };
}

export async function getSignedAudioUrl(
  storagePath: string,
  expiresInSeconds = 60 * 60,
) {
  ensureFirebaseApp();
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);
  const expires = Date.now() + expiresInSeconds * 1000;

  const [url] = await file.getSignedUrl({
    action: "read",
    expires,
  });

  return url;
}
