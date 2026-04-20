"use client";

import { useEffect, useState } from "react";

import type { AchievementProgress } from "@/types/ui";

type AchievementsGridProps = {
  achievements: AchievementProgress[];
};

const STORAGE_KEY = "dev-profile-unlocked-achievements";

function readStoredUnlocks(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const [recentUnlockIds, setRecentUnlockIds] = useState<string[]>([]);

  useEffect(() => {
    const previouslyUnlocked = readStoredUnlocks();
    const nowUnlocked = achievements
      .filter((achievement) => achievement.unlocked)
      .map((achievement) => achievement.id);

    const recent = nowUnlocked.filter(
      (achievementId) => !previouslyUnlocked.includes(achievementId),
    );

    setRecentUnlockIds(recent);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nowUnlocked));
  }, [achievements]);

  return (
    <section className="rounded-2xl border border-(--border-bright) bg-(--bg-elevated) p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Conquistas</h2>
        <span className="rounded-full border border-(--border) bg-(--bg-primary) px-2.5 py-1 text-xs text-(--text-secondary)">
          {achievements.filter((achievement) => achievement.unlocked).length}/{" "}
          {achievements.length} desbloqueadas
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => {
          const isRecent = recentUnlockIds.includes(achievement.id);

          return (
            <article
              key={achievement.id}
              title={`${achievement.description} (${achievement.progressLabel})`}
              className={[
                "rounded-xl border p-4 transition",
                achievement.unlocked
                  ? "border-sky-400/35 bg-sky-500/10"
                  : "border-(--border) bg-(--bg-primary) opacity-60 grayscale",
                isRecent ? "animate-pulse" : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{achievement.name}</h3>
                <span
                  className={[
                    "rounded-full border px-2 py-0.5 text-[11px]",
                    achievement.unlocked
                      ? "border-sky-400/45 bg-sky-500/15 text-sky-100"
                      : "border-(--border) text-(--text-muted)",
                  ].join(" ")}
                >
                  {achievement.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              <p className="mt-2 text-xs text-(--text-secondary)">
                {achievement.description}
              </p>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-(--text-muted)">
                  <span>Progresso</span>
                  <span>{achievement.progressLabel}</span>
                </div>
                <div className="h-2 rounded-full bg-(--bg-primary)">
                  <div
                    className="h-2 rounded-full bg-sky-400"
                    style={{
                      width: `${Math.min(
                        (achievement.current /
                          Math.max(achievement.target, 1)) *
                          100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
