"use client";

import { useGitHubData } from "@/hooks/useGitHubData";

export function AdminGitHubModeCard() {
  const query = useGitHubData({ enabled: true });

  const isLimited = query.data?.metrics.isLimited ?? false;

  return (
    <article className="rounded-xl border border-(--border) bg-(--bg-primary) p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">
        GitHub API Mode
      </p>

      {query.isPending ? (
        <p className="mt-2 text-sm text-(--text-secondary)">
          Verificando modo...
        </p>
      ) : query.isError ? (
        <p className="mt-2 text-sm text-rose-200">
          Nao foi possivel ler o modo.
        </p>
      ) : (
        <>
          <span
            className={[
              "mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs",
              isLimited
                ? "border-amber-300/35 bg-amber-500/15 text-amber-100"
                : "border-emerald-300/35 bg-emerald-500/15 text-emerald-100",
            ].join(" ")}
          >
            {isLimited ? "Modo limitado" : "Modo token"}
          </span>
          <p className="mt-2 text-xs text-(--text-secondary)">
            Visivel apenas no painel admin.
          </p>
        </>
      )}
    </article>
  );
}
