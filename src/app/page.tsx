"use client";

import { useEffect, useState } from "react";

import { FooterSection } from "@/features/footer/FooterSection";
import { HeaderHero } from "@/features/header/HeaderHero";
import { QuickLinks } from "@/features/quick-links/QuickLinks";
import { ProfileTabs } from "@/features/tabs/ProfileTabs";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 850);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(14,165,233,0.09),transparent_32%)]" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <HeaderHero isLoading={isLoading} />
        <QuickLinks isLoading={isLoading} />
        <ProfileTabs isLoading={isLoading} />
        <FooterSection />
      </main>
    </div>
  );
}
