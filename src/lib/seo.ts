const LOCAL_SITE_ORIGIN = "http://localhost:3000";

function normalizeCandidateUrl(rawValue: string): string | null {
  const trimmed = rawValue.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export function getSiteOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = normalizeCandidateUrl(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return LOCAL_SITE_ORIGIN;
}

export function toAbsoluteUrl(pathname: string): string {
  const base = `${getSiteOrigin()}/`;
  return new URL(pathname, base).toString();
}
