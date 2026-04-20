"use client";

import { useGitHubData } from "@/hooks/useGitHubData";

import { ContributionGraph } from "./ContributionGraph";
import { LanguageBar } from "./LanguageBar";
import { StatCards } from "./StatCards";
import { StreakCounter } from "./StreakCounter";

function MetricsSkeleton() {
  return (
    <section className="rounded-2xl border border-(--border-bright) bg-(--bg-elevated) p-5 md:p-6">
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-(--bg-primary)" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`stat-skeleton-${index}`}
            className="h-24 animate-pulse rounded-xl border border-(--border) bg-(--bg-primary)"
          />
        ))}
      </div>
      <div className="mt-4 space-y-4">
        <div className="h-[230px] animate-pulse rounded-xl border border-(--border) bg-(--bg-primary)" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-[130px] animate-pulse rounded-xl border border-(--border) bg-(--bg-primary)" />
          <div className="h-[130px] animate-pulse rounded-xl border border-(--border) bg-(--bg-primary)" />
        </div>
      </div>
    </section>
  );
}

export function GitHubInsights() {
  const query = useGitHubData({ enabled: true });

  if (query.isPending) {
    return <MetricsSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <section className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-5 text-sm text-rose-100 md:p-6">
        <h2 className="text-base font-semibold">
          Nao foi possivel carregar as metricas
        </h2>
        <p className="mt-2 text-rose-100/85">
          Verifique as variaveis de ambiente e tente novamente.
        </p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="mt-4 rounded-full border border-rose-300/35 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition hover:border-rose-200/70"
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  const { metrics, hasGraphData } = query.data;

  return (
    <section className="rounded-2xl border border-(--border-bright) bg-(--bg-elevated) p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">
          Metricas GitHub
        </h2>
        <span className="text-xs text-(--text-secondary)">
          Atualizado em{" "}
          {new Date(metrics.lastUpdated).toLocaleString("pt-BR", {
            hour12: false,
          })}
        </span>
      </div>

      <StatCards metrics={metrics} />

      <div className="mt-4 space-y-4">
        <ContributionGraph
          calendar={metrics.contributionCalendar}
          hasGraphData={hasGraphData}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <LanguageBar languages={metrics.languages} />
          <StreakCounter
            streak={metrics.streak}
            calendar={metrics.contributionCalendar}
          />
        </div>
      </div>
    </section>
  );
}
