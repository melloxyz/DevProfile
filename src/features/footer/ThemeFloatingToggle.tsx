"use client";

import { useEffect, useState } from "react";

import { useTheme } from "@/hooks/useTheme";

export function ThemeFloatingToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = (resolvedTheme ?? "dark") !== "light";

  return (
    <div className="fixed right-3 top-3 z-40 sm:right-6 sm:top-6">
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        disabled={!mounted}
        className="rounded-full border border-(--border-bright) bg-(--bg-surface) px-3 py-2 text-xs font-medium text-(--text-secondary) shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:border-(--accent) hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Alternar tema"
      >
        {mounted ? (isDark ? "Dark" : "Light") : "Tema"}
      </button>
    </div>
  );
}
