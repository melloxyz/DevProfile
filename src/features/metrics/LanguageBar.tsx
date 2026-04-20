import type { GitHubLanguageStat } from "@/types/github";

type LanguageBarProps = {
  languages: GitHubLanguageStat[];
};

export function LanguageBar({ languages }: LanguageBarProps) {
  return (
    <article className="min-w-0 rounded-xl border border-(--border) bg-(--bg-elevated) p-4">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
          Language Bar
        </h3>
        <span className="h-px flex-1 bg-(--border)" />
      </div>

      {languages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-(--border-bright) px-3 py-3 text-sm text-(--text-secondary)">
          Nenhuma linguagem identificada nos repositorios analisados.
        </p>
      ) : (
        <div className="space-y-3">
          {languages.map((language) => (
            <div key={language.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span
                  className="max-w-[70%] truncate font-medium"
                  title={language.name}
                >
                  {language.name}
                </span>
                <span className="text-(--text-secondary)">
                  {language.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-(--bg-primary)">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.max(language.percentage, 1)}%`,
                    backgroundColor: language.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
