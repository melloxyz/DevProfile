import type { GitHubMetrics } from "@/types/github";

type StatCardsProps = {
  metrics: GitHubMetrics;
};

type CardItem = {
  label: string;
  value: string;
  helper: string;
};

export function StatCards({ metrics }: StatCardsProps) {
  const cards: CardItem[] = [
    {
      label: "Commits (12 meses)",
      value: metrics.commitTotalLastYear.toLocaleString("pt-BR"),
      helper: "Baseado no contribution calendar",
    },
    {
      label: "PRs",
      value: `${metrics.pullRequests.open.toLocaleString("pt-BR")} / ${metrics.pullRequests.merged.toLocaleString("pt-BR")}`,
      helper: "Abertas / Merged",
    },
    {
      label: "Stars totais",
      value: metrics.starsTotal.toLocaleString("pt-BR"),
      helper: "Soma de stargazers em repositorios",
    },
    {
      label: "Repos publicos",
      value: metrics.user.public_repos.toLocaleString("pt-BR"),
      helper: "Fonte: GitHub REST users/{username}",
    },
    {
      label: "Followers",
      value: metrics.user.followers.toLocaleString("pt-BR"),
      helper: "Seguidores atuais",
    },
    {
      label: "Linguagem principal",
      value: metrics.mainLanguage,
      helper: "Por frequencia de uso em repos",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-xl border border-(--border) bg-(--bg-elevated) p-4"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
            {card.value}
          </p>
          <p className="mt-1 text-xs text-(--text-secondary)">{card.helper}</p>
        </article>
      ))}
    </section>
  );
}
