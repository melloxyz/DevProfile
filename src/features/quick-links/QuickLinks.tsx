"use client";

import { useMemo } from "react";

import { DEFAULT_LINKS } from "@/config/defaults";
import type { QuickLink } from "@/types/profile";

type QuickLinksProps = {
  isLoading: boolean;
  links?: QuickLink[];
};

function QuickLinkItem({ link }: { link: QuickLink }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-3 transition-colors hover:border-[color:var(--border-bright)]">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-[color:var(--accent-dim)] font-[family-name:var(--font-geist-mono)] text-xs font-semibold text-[color:var(--accent)]">
        {link.iconText}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{link.label}</p>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--accent)]"
        >
          {link.url}
        </a>
      </div>
    </li>
  );
}

function QuickLinksSkeleton() {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 sm:p-6">
      <div className="mb-4 h-4 w-36 animate-pulse rounded bg-[color:var(--bg-elevated)]" />
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li
            key={`quick-link-skeleton-${index}`}
            className="h-14 animate-pulse rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)]"
          />
        ))}
      </ul>
    </section>
  );
}

export function QuickLinks({
  isLoading,
  links: providedLinks,
}: QuickLinksProps) {
  const links = useMemo(() => providedLinks ?? DEFAULT_LINKS, [providedLinks]);

  if (isLoading) {
    return <QuickLinksSkeleton />;
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-[color:var(--text-muted)]">
          Quick Links
        </h2>
        <span className="h-px flex-1 bg-[color:var(--border)]" />
      </div>

      <p className="mb-4 text-sm text-[color:var(--text-secondary)]">
        A ordem dos links e definida no painel admin.
      </p>

      <ul className="space-y-3">
        {links.map((link) => (
          <QuickLinkItem key={link.id} link={link} />
        ))}
      </ul>
    </section>
  );
}
