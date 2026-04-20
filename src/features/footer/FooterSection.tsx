"use client";

import { useMemo } from "react";

import { DEFAULT_PROFILE } from "@/config/defaults";

export function FooterSection() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="rounded-2xl border border-(--border) bg-(--bg-surface) p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            <a
              href={`https://github.com/${DEFAULT_PROFILE.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-(--accent)"
            >
              @{DEFAULT_PROFILE.username}
            </a>{" "}
            · Dev Profile
          </p>
          <p className="text-xs text-(--text-secondary)">
            {currentYear} · Open source · fork this project
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/melloxyz/dev-profile"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-(--border) px-3 py-2 text-xs text-(--text-secondary) transition-colors hover:border-(--border-bright) hover:text-(--text-primary)"
          >
            Repositorio
          </a>
        </div>
      </div>
    </footer>
  );
}
