export type AdminSessionPayload = {
  sub: "admin";
  csrfToken: string;
  issuedAt: number;
  expiresAt: number;
};

const textEncoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array | null {
  try {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  } catch {
    return null;
  }
}

async function createHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(
  payloadBase64Url: string,
  secret: string,
): Promise<string> {
  const key = await createHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payloadBase64Url),
  );

  return toBase64Url(new Uint8Array(signature));
}

export function createCsrfToken(): string {
  const random = crypto.getRandomValues(new Uint8Array(24));
  return toBase64Url(random);
}

export async function createAdminSessionToken(params: {
  secret: string;
  ttlSeconds: number;
}): Promise<{
  token: string;
  payload: AdminSessionPayload;
}> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + params.ttlSeconds;

  const payload: AdminSessionPayload = {
    sub: "admin",
    csrfToken: createCsrfToken(),
    issuedAt,
    expiresAt,
  };

  const payloadBase64Url = toBase64Url(
    textEncoder.encode(JSON.stringify(payload)),
  );
  const signature = await signPayload(payloadBase64Url, params.secret);

  return {
    token: `${payloadBase64Url}.${signature}`,
    payload,
  };
}

function parsePayload(payloadBase64Url: string): AdminSessionPayload | null {
  const payloadBytes = fromBase64Url(payloadBase64Url);

  if (!payloadBytes) {
    return null;
  }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes),
    ) as Partial<AdminSessionPayload>;

    if (
      payload.sub !== "admin" ||
      typeof payload.csrfToken !== "string" ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      sub: "admin",
      csrfToken: payload.csrfToken,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function verifyAdminSessionToken(params: {
  token: string;
  secret: string;
}): Promise<AdminSessionPayload | null> {
  const [payloadBase64Url, signatureBase64Url] = params.token.split(".");

  if (!payloadBase64Url || !signatureBase64Url) {
    return null;
  }

  const key = await createHmacKey(params.secret);
  const signatureBytes = fromBase64Url(signatureBase64Url);

  if (!signatureBytes) {
    return null;
  }

  const signatureBuffer = new Uint8Array(signatureBytes.byteLength);
  signatureBuffer.set(signatureBytes);

  const signatureValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBuffer,
    textEncoder.encode(payloadBase64Url),
  );

  if (!signatureValid) {
    return null;
  }

  const payload = parsePayload(payloadBase64Url);

  if (!payload) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.expiresAt <= now) {
    return null;
  }

  return payload;
}
