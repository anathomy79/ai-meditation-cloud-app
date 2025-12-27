import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();
const cache = new Map<string, string>();

const buildSecretVersionName = (secretName: string, projectId?: string): string => {
  if (secretName.includes("/versions/")) {
    return secretName;
  }
  if (secretName.startsWith("projects/")) {
    return `${secretName}/versions/latest`;
  }
  if (!projectId) {
    throw new Error(
      `Secret name ${secretName} is missing a project id. Provide GCP_PROJECT_ID or use a full resource name.`,
    );
  }
  return `projects/${projectId}/secrets/${secretName}/versions/latest`;
};

export const resolveSecretValue = async (
  value: string | undefined,
  secretName: string | undefined,
  projectId?: string,
): Promise<string | undefined> => {
  if (value) {
    return value;
  }
  if (!secretName) {
    return undefined;
  }
  const versionName = buildSecretVersionName(secretName, projectId);
  if (cache.has(versionName)) {
    return cache.get(versionName);
  }
  const [version] = await client.accessSecretVersion({ name: versionName });
  const secretValue = version.payload?.data?.toString();
  if (secretValue) {
    cache.set(versionName, secretValue);
  }
  return secretValue;
};
