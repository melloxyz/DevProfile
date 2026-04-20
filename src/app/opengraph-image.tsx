import { ImageResponse } from "next/og";

export const alt = "Dev Profile";
export const dynamic = "force-dynamic";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

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

export default function OpenGraphImage() {
  const username =
    process.env.NEXT_PUBLIC_GITHUB_USERNAME?.trim() || "melloxyz";
  const displayName = buildDisplayName(username);
  const bio = buildBio(displayName);
  const statusText = "Disponivel para oportunidades";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "64px",
        background:
          "linear-gradient(135deg, rgb(2, 12, 27) 0%, rgb(8, 47, 73) 45%, rgb(15, 23, 42) 100%)",
        color: "rgb(241, 245, 249)",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          border: "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius: "32px",
          padding: "48px",
          background: "rgba(2, 6, 23, 0.42)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 26,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgb(125, 211, 252)",
            }}
          >
            Dev Profile
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 74,
              lineHeight: 1.05,
              fontWeight: 800,
            }}
          >
            {displayName}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 36,
              color: "rgb(147, 197, 253)",
            }}
          >
            @{username}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 32,
              maxWidth: "88%",
              color: "rgb(226, 232, 240)",
            }}
          >
            {bio}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "rgb(191, 219, 254)",
          }}
        >
          <span>Status: {statusText}</span>
          <span>github.com/{username}</span>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
