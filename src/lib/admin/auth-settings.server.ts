import "server-only";

import {
  isSupportedBcryptHash,
  normalizeBcryptHash,
} from "@/lib/admin/password.server";
import {
  ADMIN_AUTH_SETTINGS_KV_KEY,
  readKvJson,
  writeKvJson,
} from "@/lib/kv-store.server";

type AdminAuthSettings = {
  passwordHash?: string;
};

async function readAuthSettings(): Promise<AdminAuthSettings> {
  try {
    const parsed = await readKvJson<unknown>(ADMIN_AUTH_SETTINGS_KV_KEY);

    if (typeof parsed === "object" && parsed !== null) {
      const candidate = parsed as Partial<AdminAuthSettings>;

      return {
        passwordHash:
          typeof candidate.passwordHash === "string"
            ? candidate.passwordHash.trim()
            : undefined,
      };
    }

    return {};
  } catch {
    return {};
  }
}

export async function getEffectiveAdminPasswordHash(
  envPasswordHash: string,
): Promise<string> {
  const settings = await readAuthSettings();
  const normalizedEnvHash = normalizeBcryptHash(envPasswordHash);

  if (settings.passwordHash && settings.passwordHash.length > 0) {
    const normalizedCustomHash = normalizeBcryptHash(settings.passwordHash);

    if (isSupportedBcryptHash(normalizedCustomHash)) {
      return normalizedCustomHash;
    }
  }

  return normalizedEnvHash;
}

export async function setCustomAdminPasswordHash(hash: string): Promise<void> {
  const payload: AdminAuthSettings = {
    passwordHash: hash.trim(),
  };

  await writeKvJson(ADMIN_AUTH_SETTINGS_KV_KEY, payload);
}
