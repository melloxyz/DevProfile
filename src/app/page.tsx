"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_CERTIFICATES,
  DEFAULT_EVENTS,
  DEFAULT_LINKS,
  DEFAULT_PROFILE,
  DEFAULT_PROJECTS,
} from "@/config/defaults";
import { FooterSection } from "@/features/footer/FooterSection";
import { ThemeFloatingToggle } from "@/features/footer/ThemeFloatingToggle";
import { HeaderHero } from "@/features/header/HeaderHero";
import { GitHubInsights } from "@/features/metrics/GitHubInsights";
import { QuickLinks } from "@/features/quick-links/QuickLinks";
import { ProfileTabs } from "@/features/tabs/ProfileTabs";
import type { PublicContentSnapshot } from "@/types/profile";

const FALLBACK_SNAPSHOT: PublicContentSnapshot = {
  profile: DEFAULT_PROFILE,
  quickLinks: DEFAULT_LINKS,
  projects: DEFAULT_PROJECTS,
  certificates: DEFAULT_CERTIFICATES,
  events: DEFAULT_EVENTS,
  updatedAt: "",
};

export default function Home() {
  const [isDelayComplete, setIsDelayComplete] = useState(false);
  const [snapshot, setSnapshot] = useState<PublicContentSnapshot | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsDelayComplete(true);
    }, 850);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    async function loadContent() {
      try {
        const response = await fetch("/api/public/content", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!disposed) {
            setSnapshot(FALLBACK_SNAPSHOT);
          }
          return;
        }

        const payload = (await response.json()) as PublicContentSnapshot;

        if (!disposed) {
          setSnapshot(payload);
        }
      } catch {
        if (!disposed) {
          setSnapshot(FALLBACK_SNAPSHOT);
        }
      }
    }

    loadContent();

    return () => {
      disposed = true;
    };
  }, []);

  const resolvedSnapshot = snapshot ?? FALLBACK_SNAPSHOT;
  const isLoading = !isDelayComplete || !snapshot;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeFloatingToggle />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(14,165,233,0.09),transparent_32%)]" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <HeaderHero isLoading={isLoading} profile={resolvedSnapshot.profile} />
        <QuickLinks isLoading={isLoading} links={resolvedSnapshot.quickLinks} />
        <ProfileTabs
          isLoading={isLoading}
          projects={resolvedSnapshot.projects}
          certificates={resolvedSnapshot.certificates}
          events={resolvedSnapshot.events}
        />
        <GitHubInsights />
        <FooterSection />
      </main>
    </div>
  );
}
