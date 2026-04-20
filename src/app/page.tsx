import type { Metadata } from "next";

import { HomePageClient } from "@/features/home/HomePageClient";
import { readPublicContentSnapshotCached } from "@/lib/storage-server";

const FALLBACK_DESCRIPTION =
  "Perfil publico, portfolio e links de desenvolvedor em uma unica pagina.";

function buildDescription(input: string): string {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return FALLBACK_DESCRIPTION;
  }

  if (trimmed.length <= 180) {
    return trimmed;
  }

  return `${trimmed.slice(0, 177)}...`;
}

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await readPublicContentSnapshotCached();
  const { displayName, username, bio } = snapshot.profile;
  const title = `${displayName} (@${username})`;
  const description = buildDescription(bio);

  return {
    title,
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "profile",
      locale: "pt_BR",
      url: "/",
      title,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `Dev Profile de ${displayName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function HomePage() {
  const snapshot = await readPublicContentSnapshotCached();

  return <HomePageClient initialSnapshot={snapshot} />;
}
