import "server-only";

import * as argon2 from "argon2";

function normalizeArgon2Hash(hashValue: string): string {
  const trimmed = hashValue.trim();
  const unescaped = trimmed.replace(/\\\$/g, "$");

  if (unescaped.startsWith("$argon2id$")) {
    return unescaped;
  }

  if (unescaped.startsWith("argon2id$")) {
    return `$${unescaped}`;
  }

  if (unescaped.startsWith("v=19$m=")) {
    return `$argon2id$${unescaped}`;
  }

  return unescaped;
}

export async function verifyAdminPassword(params: {
  password: string;
  expectedHash: string;
}): Promise<boolean> {
  const normalizedHash = normalizeArgon2Hash(params.expectedHash);

  if (!normalizedHash.startsWith("$argon2id$")) {
    return false;
  }

  try {
    return await argon2.verify(normalizedHash, params.password);
  } catch {
    return false;
  }
}
