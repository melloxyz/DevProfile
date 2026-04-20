"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_CERTIFICATES,
  DEFAULT_EVENTS,
  DEFAULT_PROJECTS,
} from "@/config/defaults";
import { useGitHubData } from "@/hooks/useGitHubData";
import type { Certificate, EventItem, Project, TabId } from "@/types/profile";
import type { AchievementProgress } from "@/types/ui";

type ProfileTabsProps = {
  isLoading: boolean;
  projects?: Project[];
  certificates?: Certificate[];
  events?: EventItem[];
};

const TAB_ITEMS: Array<{ id: TabId; label: string }> = [
  { id: "projects", label: "Projetos" },
  { id: "certificates", label: "Certificados" },
  { id: "events", label: "Eventos" },
  { id: "achievements", label: "Conquistas" },
];

const PAGE_SIZE = 6;

type TabPaginationState = Record<TabId, number>;

type PaginatedResult<T> = {
  totalPages: number;
  currentPage: number;
  items: T[];
};

function paginateItems<T>(items: T[], page: number): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;

  return {
    totalPages,
    currentPage,
    items: items.slice(start, start + PAGE_SIZE),
  };
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border border-dashed border-[color:var(--border-bright)] bg-[color:var(--bg-elevated)] p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
        {description}
      </p>
    </article>
  );
}

function TabsSkeleton() {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 sm:p-6">
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`tab-button-skeleton-${index}`}
            className="h-9 w-24 animate-pulse rounded-lg bg-[color:var(--bg-elevated)]"
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`tab-card-skeleton-${index}`}
            className="h-28 animate-pulse rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)]"
          />
        ))}
      </div>
    </section>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-md border border-[color:var(--border)] px-2 py-1 transition-colors hover:border-[color:var(--border-bright)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Anterior
      </button>

      <span>
        Pagina {currentPage} de {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-md border border-[color:var(--border)] px-2 py-1 transition-colors hover:border-[color:var(--border-bright)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Proxima
      </button>
    </div>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: AchievementProgress;
}) {
  return (
    <article
      key={achievement.id}
      title={`${achievement.description} (${achievement.progressLabel})`}
      className={[
        "rounded-xl border p-4 transition",
        achievement.unlocked
          ? "border-sky-400/35 bg-sky-500/10"
          : "border-[color:var(--border)] bg-[color:var(--bg-elevated)] opacity-70",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{achievement.name}</h3>
        <span
          className={[
            "rounded-full border px-2 py-0.5 text-[11px]",
            achievement.unlocked
              ? "border-sky-400/45 bg-sky-500/15 text-sky-100"
              : "border-[color:var(--border)] text-[color:var(--text-muted)]",
          ].join(" ")}
        >
          {achievement.unlocked ? "Unlocked" : "Locked"}
        </span>
      </div>

      <p className="mt-2 text-xs text-[color:var(--text-secondary)]">
        {achievement.description}
      </p>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-[color:var(--text-muted)]">
          <span>Progresso</span>
          <span>{achievement.progressLabel}</span>
        </div>
        <div className="h-2 rounded-full bg-[color:var(--bg-primary)]">
          <div
            className="h-2 rounded-full bg-sky-400"
            style={{
              width: `${Math.min(
                (achievement.current / Math.max(achievement.target, 1)) * 100,
                100,
              )}%`,
            }}
          />
        </div>
      </div>
    </article>
  );
}

export function ProfileTabs({
  isLoading,
  projects,
  certificates,
  events,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("projects");
  const [pagination, setPagination] = useState<TabPaginationState>({
    projects: 1,
    certificates: 1,
    events: 1,
    achievements: 1,
  });

  const githubQuery = useGitHubData({ enabled: !isLoading });

  const githubProjects = useMemo<Project[]>(() => {
    const repos = githubQuery.data?.metrics.repos ?? [];

    return repos
      .filter((repo) => !repo.private)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .map((repo) => ({
        id: String(repo.id),
        name: repo.name,
        description:
          repo.description?.trim() || "Repositorio publico sem descricao.",
        stack: repo.language ? [repo.language] : [],
        repoUrl: repo.html_url,
        demoUrl: repo.homepage || undefined,
      }));
  }, [githubQuery.data?.metrics.repos]);

  const projectItems =
    githubProjects.length > 0 ? githubProjects : (projects ?? DEFAULT_PROJECTS);
  const certificateItems = certificates ?? DEFAULT_CERTIFICATES;
  const eventItems = events ?? DEFAULT_EVENTS;
  const achievementItems = githubQuery.data?.achievements ?? [];

  function updatePage(tab: TabId, page: number) {
    setPagination((current) => ({
      ...current,
      [tab]: page,
    }));
  }

  if (isLoading) {
    return <TabsSkeleton />;
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-[color:var(--text-muted)]">
          Conteudo
        </h2>
        <span className="h-px flex-1 bg-[color:var(--border)]" />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:inline-flex sm:grid-cols-none">
        {TAB_ITEMS.map((tab) => {
          const active = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-[color:var(--accent)] bg-[color:var(--accent-dim)] text-[color:var(--text-primary)]"
                  : "border-[color:var(--border)] bg-[color:var(--bg-elevated)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-bright)]"
              }`}
              aria-pressed={active}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div key={activeTab} className="mt-4 animate-[panelIn_220ms_ease-out]">
        {activeTab === "projects" && (
          <>
            {projectItems.length > 0 ? (
              (() => {
                const paginated = paginateItems(
                  projectItems,
                  pagination.projects,
                );

                return (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {paginated.items.map((project) => (
                        <article
                          key={project.id}
                          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4 transition-transform hover:-translate-y-0.5"
                        >
                          <h3 className="text-sm font-semibold">
                            {project.name}
                          </h3>
                          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                            {project.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {project.stack.length > 0 ? (
                              project.stack.map((tech) => (
                                <span
                                  key={`${project.id}-${tech}`}
                                  className="rounded-md border border-[color:var(--border)] px-2 py-1 text-xs text-[color:var(--text-secondary)]"
                                >
                                  {tech}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-md border border-[color:var(--border)] px-2 py-1 text-xs text-[color:var(--text-secondary)]">
                                Sem linguagem principal
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-3 text-xs">
                            <a
                              href={project.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-(--accent) hover:underline"
                            >
                              Repositorio
                            </a>
                            {project.demoUrl ? (
                              <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-(--text-secondary) hover:underline"
                              >
                                Demo
                              </a>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={paginated.currentPage}
                      totalPages={paginated.totalPages}
                      onPageChange={(page) => updatePage("projects", page)}
                    />
                  </>
                );
              })()
            ) : githubQuery.isPending ? (
              <EmptyPanel
                title="Carregando projetos"
                description="Buscando repositorios publicos na API do GitHub."
              />
            ) : (
              <EmptyPanel
                title="Nenhum projeto publico encontrado"
                description="A aba de projetos agora carrega repositorios publicos diretamente da API do GitHub."
              />
            )}
          </>
        )}

        {activeTab === "certificates" && (
          <>
            {certificateItems.length > 0 ? (
              (() => {
                const paginated = paginateItems(
                  certificateItems,
                  pagination.certificates,
                );

                return (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {paginated.items.map((certificate) => (
                        <article
                          key={`${certificate.codigo_credencial}-${certificate.titulo}`}
                          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4"
                        >
                          <h3 className="text-sm font-semibold">
                            {certificate.titulo}
                          </h3>
                          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                            {certificate.instituicao} • {certificate.emitido_em}
                          </p>
                          <p className="mt-2 break-all text-xs text-[color:var(--text-secondary)]">
                            Credencial: {certificate.codigo_credencial}
                          </p>
                          <a
                            href={certificate.url_validador}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex text-xs text-(--accent) hover:underline"
                          >
                            Validar certificado
                          </a>
                        </article>
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={paginated.currentPage}
                      totalPages={paginated.totalPages}
                      onPageChange={(page) => updatePage("certificates", page)}
                    />
                  </>
                );
              })()
            ) : (
              <EmptyPanel
                title="Nenhum certificado cadastrado"
                description="Esta aba ja esta pronta com transicao e estrutura para receber conteudo."
              />
            )}
          </>
        )}

        {activeTab === "events" && (
          <>
            {eventItems.length > 0 ? (
              (() => {
                const paginated = paginateItems(eventItems, pagination.events);

                return (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {paginated.items.map((eventItem) => (
                        <article
                          key={`${eventItem.codigo_credencial}-${eventItem.titulo}`}
                          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4"
                        >
                          <h3 className="text-sm font-semibold">
                            {eventItem.titulo}
                          </h3>
                          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                            {eventItem.instituicao} • {eventItem.emitido_em}
                          </p>
                          <p className="mt-2 break-all text-xs text-[color:var(--text-secondary)]">
                            Credencial: {eventItem.codigo_credencial}
                          </p>
                          <a
                            href={eventItem.url_validador}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex text-xs text-(--accent) hover:underline"
                          >
                            Validar evento
                          </a>
                        </article>
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={paginated.currentPage}
                      totalPages={paginated.totalPages}
                      onPageChange={(page) => updatePage("events", page)}
                    />
                  </>
                );
              })()
            ) : (
              <EmptyPanel
                title="Nenhum evento publicado"
                description="A estrutura de cards esta pronta para dados reais assim que forem adicionados."
              />
            )}
          </>
        )}

        {activeTab === "achievements" && (
          <>
            {achievementItems.length > 0 ? (
              (() => {
                const paginated = paginateItems(
                  achievementItems,
                  pagination.achievements,
                );

                return (
                  <>
                    <div className="mb-3 text-xs text-[color:var(--text-secondary)]">
                      {
                        achievementItems.filter(
                          (achievement) => achievement.unlocked,
                        ).length
                      }
                      /{achievementItems.length} desbloqueadas
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {paginated.items.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                        />
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={paginated.currentPage}
                      totalPages={paginated.totalPages}
                      onPageChange={(page) => updatePage("achievements", page)}
                    />
                  </>
                );
              })()
            ) : githubQuery.isPending ? (
              <EmptyPanel
                title="Carregando conquistas"
                description="As conquistas serao exibidas quando as metricas GitHub forem carregadas."
              />
            ) : (
              <EmptyPanel
                title="Conquistas indisponiveis"
                description="Nao foi possivel obter os dados de progresso das conquistas agora."
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
