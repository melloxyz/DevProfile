"use client";

import { useEffect, useState } from "react";

import { FooterSection } from "@/features/footer/FooterSection";
import { ThemeFloatingToggle } from "@/features/footer/ThemeFloatingToggle";
import { HeaderHero } from "@/features/header/HeaderHero";
import { GitHubInsights } from "@/features/metrics/GitHubInsights";
import { QuickLinks } from "@/features/quick-links/QuickLinks";
import { ProfileTabs } from "@/features/tabs/ProfileTabs";
import type { PublicContentSnapshot } from "@/types/profile";

type HomePageClientProps = {
  initialSnapshot: PublicContentSnapshot;
};

export function HomePageClient({ initialSnapshot }: HomePageClientProps) {
  const [snapshot, setSnapshot] =
    useState<PublicContentSnapshot>(initialSnapshot);

  useEffect(() => {
    let disposed = false;

    async function refreshContent() {
      try {
        const response = await fetch("/api/public/content", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as PublicContentSnapshot;

        if (!disposed) {
          setSnapshot(payload);
        }
      } catch {
        // Keep server-rendered snapshot when client refresh fails.
      }
    }

    refreshContent();

    return () => {
      disposed = true;
    };
  }, []);

  const isLoading = false;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeFloatingToggle />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(14,165,233,0.09),transparent_32%)]" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <HeaderHero isLoading={isLoading} profile={snapshot.profile} />
        <QuickLinks isLoading={isLoading} links={snapshot.quickLinks} />
        <ProfileTabs
          isLoading={isLoading}
          projects={snapshot.projects}
          certificates={snapshot.certificates}
          events={snapshot.events}
        />
        <GitHubInsights />
        <FooterSection />
      </main>
    </div>
  );
}
