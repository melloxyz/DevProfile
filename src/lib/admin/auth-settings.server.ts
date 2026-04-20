import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIRECTORY = path.join(process.cwd(), ".data");
const AUTH_SETTINGS_FILE_PATH = path.join(
  DATA_DIRECTORY,
  "admin-auth-settings.json",
);

type AdminAuthSettings = {
  passwordHash?: string;
};

async function readAuthSettings(): Promise<AdminAuthSettings> {
  try {
    const content = await fs.readFile(AUTH_SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(content) as unknown;

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

  if (settings.passwordHash && settings.passwordHash.length > 0) {
    return settings.passwordHash;
  }

  return envPasswordHash;
}

export async function setCustomAdminPasswordHash(hash: string): Promise<void> {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  const payload: AdminAuthSettings = {
    passwordHash: hash.trim(),
  };

  await fs.writeFile(
    AUTH_SETTINGS_FILE_PATH,
    JSON.stringify(payload, null, 2),
    "utf-8",
  );
}
