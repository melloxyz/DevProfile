import Image from "next/image";

import { DEFAULT_PROFILE } from "@/config/defaults";
import type { ProfileData, StatusColor } from "@/types/profile";

type HeaderHeroProps = {
  isLoading: boolean;
  profile?: ProfileData;
};

const STATUS_BADGE_STYLE: Record<StatusColor, string> = {
  green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  yellow: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  blue: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  red: "border-rose-400/30 bg-rose-500/10 text-rose-300",
};

const STATUS_DOT_STYLE: Record<StatusColor, string> = {
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  blue: "bg-sky-400",
  red: "bg-rose-400",
};

function HeaderHeroSkeleton() {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 sm:p-6">
      <div className="h-32 animate-pulse rounded-xl bg-[color:var(--bg-elevated)] sm:h-40" />
      <div className="mt-4 flex items-start gap-4">
        <div className="h-20 w-20 animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] sm:h-24 sm:w-24" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-5 w-40 animate-pulse rounded bg-[color:var(--bg-elevated)]" />
          <div className="h-3 w-24 animate-pulse rounded bg-[color:var(--bg-elevated)]" />
          <div className="h-4 w-full animate-pulse rounded bg-[color:var(--bg-elevated)]" />
        </div>
      </div>
    </section>
  );
}

export function HeaderHero({ isLoading, profile }: HeaderHeroProps) {
  if (isLoading) {
    return <HeaderHeroSkeleton />;
  }

  const resolvedProfile = profile ?? DEFAULT_PROFILE;
  const avatarUrl = `https://github.com/${resolvedProfile.username}.png?size=320`;

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] sm:p-6">
      <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
        <span>Dev Profile</span>
        <span className="h-px flex-1 bg-[color:var(--border)]" />
        <span>{resolvedProfile.username}</span>
      </div>

      <div className="relative h-32 overflow-hidden rounded-2xl border border-[color:var(--border)] sm:h-40">
        {resolvedProfile.bannerUrl ? (
          <Image
            src={resolvedProfile.bannerUrl}
            alt="Banner do perfil"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 960px"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.28),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.12),transparent_32%),linear-gradient(145deg,#0f172a_0%,#111113_52%,#18181b_100%)]" />
            <div className="absolute -right-10 bottom-0 h-28 w-28 rounded-full border border-[color:var(--border-bright)] bg-[color:var(--accent-dim)]" />
            <div className="absolute right-20 top-8 h-12 w-12 rounded-full border border-[color:var(--border-bright)] bg-[color:var(--accent-dim)]" />
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-22 w-22 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] sm:h-26 sm:w-26">
          <Image
            src={avatarUrl}
            alt={`Avatar de ${resolvedProfile.displayName}`}
            fill
            className="object-cover"
            sizes="104px"
            priority
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                {resolvedProfile.displayName}
              </h1>
              <p className="font-[family-name:var(--font-geist-mono)] text-sm text-[color:var(--text-secondary)]">
                @{resolvedProfile.username}
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE_STYLE[resolvedProfile.statusColor]}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${STATUS_DOT_STYLE[resolvedProfile.statusColor]}`}
              />
              {resolvedProfile.statusText}
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)] sm:text-base">
            {resolvedProfile.bio}
          </p>
        </div>
      </div>
    </section>
  );
}
