import type { ContributionCalendar, GitHubStreak } from "@/types/github";

type StreakCounterProps = {
  streak: GitHubStreak;
  calendar: ContributionCalendar;
};

function dayHeatColor(contributionCount: number): string {
  if (contributionCount <= 0) {
    return "var(--bg-primary)";
  }

  if (contributionCount === 1) {
    return "rgba(14, 165, 233, 0.24)";
  }

  if (contributionCount === 2) {
    return "rgba(14, 165, 233, 0.44)";
  }

  return "rgba(14, 165, 233, 0.80)";
}

export function StreakCounter({ streak, calendar }: StreakCounterProps) {
  const recentDays = calendar.weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-21);

  return (
    <article className="min-w-0 rounded-xl border border-(--border) bg-(--bg-elevated) p-4">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
          Streak Counter
        </h3>
        <span className="h-px flex-1 bg-(--border)" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-(--border) bg-(--bg-primary) p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">
            Atual
          </p>
          <p className="mt-1 text-xl font-semibold sm:text-2xl">
            {streak.current.toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="rounded-lg border border-(--border) bg-(--bg-primary) p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-(--text-muted)">
            Maximo
          </p>
          <p className="mt-1 text-xl font-semibold sm:text-2xl">
            {streak.max.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs text-(--text-secondary)">
          Intensidade dos ultimos 21 dias
        </p>
        <div className="grid grid-cols-7 gap-1">
          {recentDays.map((day) => (
            <div
              key={day.date}
              className="h-3 rounded-[3px] border border-black/10"
              style={{
                backgroundColor: dayHeatColor(day.contributionCount),
              }}
              title={`${new Date(`${day.date}T00:00:00Z`).toLocaleDateString(
                "pt-BR",
                {
                  timeZone: "UTC",
                },
              )}: ${day.contributionCount} contribuicoes`}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
