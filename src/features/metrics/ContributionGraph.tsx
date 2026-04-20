import type { ContributionCalendar } from "@/types/github";

type ContributionGraphProps = {
  calendar: ContributionCalendar;
  hasGraphData: boolean;
};

function getCellColor(count: number): string {
  if (count <= 0) {
    return "var(--bg-elevated)";
  }

  if (count === 1) {
    return "rgba(14, 165, 233, 0.24)";
  }

  if (count === 2) {
    return "rgba(14, 165, 233, 0.40)";
  }

  if (count === 3) {
    return "rgba(14, 165, 233, 0.58)";
  }

  return "rgba(14, 165, 233, 0.82)";
}

export function ContributionGraph({
  calendar,
  hasGraphData,
}: ContributionGraphProps) {
  const weeks = calendar.weeks.slice(-52);

  const monthMarkers = new Map<number, string>();
  let previousMonth = "";

  weeks.forEach((week, index) => {
    const month = new Date(`${week.firstDay}T00:00:00Z`).toLocaleString(
      "pt-BR",
      {
        month: "short",
        timeZone: "UTC",
      },
    );

    if (index === 0 || month !== previousMonth) {
      monthMarkers.set(index, month.replace(".", ""));
      previousMonth = month;
    }
  });

  const cells = weeks.flatMap((week) => week.contributionDays);

  return (
    <article className="rounded-xl border border-(--border) bg-(--bg-elevated) p-4">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
          Contribution Graph
        </h3>
        <span className="h-px flex-1 bg-(--border)" />
      </div>

      {!hasGraphData ? (
        <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Modo limitado ativo: o heatmap usa fallback visual sem dados completos
          do GraphQL.
        </p>
      ) : null}

      <div className="flex gap-3">
        <div className="grid grid-rows-7 gap-1 pt-[20px] text-[10px] text-(--text-muted)">
          <span />
          <span>Seg</span>
          <span />
          <span>Qua</span>
          <span />
          <span>Sex</span>
          <span />
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="grid min-w-[780px] grid-cols-[repeat(52,minmax(0,1fr))] gap-1 pb-2 text-[10px] text-(--text-muted)">
            {Array.from({ length: 52 }).map((_, index) => (
              <span key={`month-marker-${index}`}>
                {monthMarkers.get(index) ?? ""}
              </span>
            ))}
          </div>

          <div className="grid min-w-[780px] grid-flow-col grid-rows-7 gap-1">
            {cells.map((day, index) => {
              const dateLabel = new Date(
                `${day.date}T00:00:00Z`,
              ).toLocaleDateString("pt-BR", {
                timeZone: "UTC",
              });

              return (
                <div
                  key={`${day.date}-${index}`}
                  className="h-[10px] w-[10px] rounded-[2px] border border-black/15"
                  style={{
                    backgroundColor: getCellColor(day.contributionCount),
                  }}
                  title={`${dateLabel}: ${day.contributionCount} contribuicoes`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
