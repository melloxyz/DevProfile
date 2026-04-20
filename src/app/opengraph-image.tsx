export const alt = "Dev Profile";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/svg+xml";

function buildDisplayName(username: string): string {
  const normalized = username.trim();

  if (normalized.length === 0) {
    return "Developer";
  }

  return normalized.replace(/[-_]/g, " ").replace(/\b\w/g, (match) => {
    return match.toUpperCase();
  });
}

function buildBio(displayName: string): string {
  return `${displayName} cria experiencias digitais focadas em performance, UX e qualidade de codigo.`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function OpenGraphImage(): Response {
  const username =
    process.env.NEXT_PUBLIC_GITHUB_USERNAME?.trim() || "melloxyz";
  const displayName = buildDisplayName(username);
  const bio = buildBio(displayName);
  const statusText = "Disponivel para oportunidades";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(alt)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020c1b"/>
      <stop offset="45%" stop-color="#082f49"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="64" y="64" width="1072" height="502" rx="32" ry="32" fill="rgba(2,6,23,0.42)" stroke="rgba(148,163,184,0.24)"/>

  <text x="112" y="146" fill="#7dd3fc" font-size="26" font-family="Segoe UI, Arial, sans-serif" letter-spacing="6" text-transform="uppercase">DEV PROFILE</text>
  <text x="112" y="246" fill="#f1f5f9" font-size="74" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${escapeXml(displayName)}</text>
  <text x="112" y="300" fill="#93c5fd" font-size="36" font-family="Segoe UI, Arial, sans-serif">@${escapeXml(username)}</text>
  <text x="112" y="356" fill="#e2e8f0" font-size="32" font-family="Segoe UI, Arial, sans-serif">${escapeXml(bio)}</text>

  <text x="112" y="520" fill="#bfdbfe" font-size="26" font-family="Segoe UI, Arial, sans-serif">Status: ${escapeXml(statusText)}</text>
  <text x="1090" y="520" text-anchor="end" fill="#bfdbfe" font-size="26" font-family="Segoe UI, Arial, sans-serif">github.com/${escapeXml(username)}</text>
</svg>`;

  return new Response(svg.trim(), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, immutable, no-transform, max-age=31536000",
    },
  });
}
