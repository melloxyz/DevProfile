import "server-only";

import bcrypt from "bcryptjs";

const BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2y$"] as const;

export function normalizeBcryptHash(hashValue: string): string {
  const trimmed = hashValue.trim();
  const unescaped = trimmed.replace(/\\\$/g, "$");

  if (BCRYPT_PREFIXES.some((prefix) => unescaped.startsWith(prefix))) {
    return unescaped;
  }

  if (
    unescaped.startsWith("2a$") ||
    unescaped.startsWith("2b$") ||
    unescaped.startsWith("2y$")
  ) {
    return `$${unescaped}`;
  }

  return unescaped;
}

export function isSupportedBcryptHash(hashValue: string): boolean {
  return BCRYPT_PREFIXES.some((prefix) => hashValue.startsWith(prefix));
}

export async function verifyAdminPassword(params: {
  password: string;
  expectedHash: string;
}): Promise<boolean> {
  const normalizedHash = normalizeBcryptHash(params.expectedHash);

  if (!isSupportedBcryptHash(normalizedHash)) {
    return false;
  }

  try {
    return await bcrypt.compare(params.password, normalizedHash);
  } catch {
    return false;
  }
}
