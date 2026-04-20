"use client";

import { FormEvent, useState } from "react";

import {
  ADMIN_CSRF_HEADER,
  ADMIN_ROUTE_SLUG_HEADER,
} from "@/lib/admin/constants";
import type {
  ProfileData,
  PublicContentSnapshot,
  StatusColor,
} from "@/types/profile";

type AdminContentManagerProps = {
  adminSlug: string;
  csrfToken: string;
  initialSnapshot: PublicContentSnapshot;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const STATUS_OPTIONS: StatusColor[] = ["green", "yellow", "blue", "red"];

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function NoticeBox({ notice }: { notice: Notice | null }) {
  if (!notice) {
    return null;
  }

  const classes =
    notice.type === "success"
      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
      : "border-rose-400/35 bg-rose-500/10 text-rose-100";

  return (
    <p className={`rounded-lg border px-3 py-2 text-xs ${classes}`}>
      {notice.message}
    </p>
  );
}

export function AdminContentManager({
  adminSlug,
  csrfToken,
  initialSnapshot,
}: AdminContentManagerProps) {
  const [profileForm, setProfileForm] = useState<
    ProfileData & {
      adminPassword: string;
    }
  >({
    ...initialSnapshot.profile,
    adminPassword: "",
  });

  const [quickLinksJson, setQuickLinksJson] = useState(
    toPrettyJson(initialSnapshot.quickLinks),
  );
  const [projectsJson, setProjectsJson] = useState(
    toPrettyJson(initialSnapshot.projects),
  );
  const [certificatesJson, setCertificatesJson] = useState(
    toPrettyJson(initialSnapshot.certificates),
  );
  const [eventsJson, setEventsJson] = useState(
    toPrettyJson(initialSnapshot.events),
  );

  const [profileNotice, setProfileNotice] = useState<Notice | null>(null);
  const [quickLinksNotice, setQuickLinksNotice] = useState<Notice | null>(null);
  const [projectsNotice, setProjectsNotice] = useState<Notice | null>(null);
  const [certificatesNotice, setCertificatesNotice] = useState<Notice | null>(
    null,
  );
  const [eventsNotice, setEventsNotice] = useState<Notice | null>(null);
  const [backupNotice, setBackupNotice] = useState<Notice | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingQuickLinks, setIsSavingQuickLinks] = useState(false);
  const [isSavingProjects, setIsSavingProjects] = useState(false);
  const [isSavingCertificates, setIsSavingCertificates] = useState(false);
  const [isSavingEvents, setIsSavingEvents] = useState(false);
  const [isBackupBusy, setIsBackupBusy] = useState(false);

  const [backupFile, setBackupFile] = useState<File | null>(null);

  async function fetchJson<T>(
    input: RequestInfo | URL,
    init: RequestInit,
  ): Promise<T> {
    const headers = new Headers(init.headers ?? {});

    headers.set(ADMIN_ROUTE_SLUG_HEADER, adminSlug);
    headers.set(ADMIN_CSRF_HEADER, csrfToken);

    const response = await fetch(input, {
      ...init,
      headers,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Falha na requisicao.");
    }

    return payload as T;
  }

  async function reloadSnapshot(): Promise<void> {
    const response = await fetch("/api/public/content", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Falha ao recarregar o snapshot publico.");
    }

    const payload = (await response.json()) as PublicContentSnapshot;

    setProfileForm({
      ...payload.profile,
      adminPassword: "",
    });
    setQuickLinksJson(toPrettyJson(payload.quickLinks));
    setProjectsJson(toPrettyJson(payload.projects));
    setCertificatesJson(toPrettyJson(payload.certificates));
    setEventsJson(toPrettyJson(payload.events));
  }

  async function handleSaveProfile(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setIsSavingProfile(true);
    setProfileNotice(null);

    try {
      await fetchJson("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: profileForm.displayName,
          username: profileForm.username,
          bio: profileForm.bio,
          statusText: profileForm.statusText,
          statusColor: profileForm.statusColor,
          bannerUrl: profileForm.bannerUrl?.trim()
            ? profileForm.bannerUrl
            : null,
          adminPassword: profileForm.adminPassword || undefined,
        }),
      });

      await reloadSnapshot();

      setProfileNotice({
        type: "success",
        message: "Perfil atualizado com sucesso.",
      });
    } catch (error) {
      setProfileNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Falha ao salvar perfil.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function saveCollection(
    endpoint: string,
    jsonText: string,
    setNotice: (notice: Notice | null) => void,
  ): Promise<void> {
    setNotice(null);

    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setNotice({
        type: "error",
        message: "JSON invalido para esta secao.",
      });
      return;
    }

    try {
      await fetchJson(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      await reloadSnapshot();

      setNotice({
        type: "success",
        message: "Colecao atualizada com sucesso.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Falha ao atualizar colecao.",
      });
    }
  }

  async function handleExportBackup(): Promise<void> {
    setIsBackupBusy(true);
    setBackupNotice(null);

    try {
      const response = await fetch("/api/admin/backup/export", {
        method: "POST",
        headers: {
          [ADMIN_ROUTE_SLUG_HEADER]: adminSlug,
          [ADMIN_CSRF_HEADER]: csrfToken,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Falha ao exportar backup.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "dev-profile-backup.json";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setBackupNotice({
        type: "success",
        message: "Backup exportado com sucesso.",
      });
    } catch (error) {
      setBackupNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Falha ao exportar backup.",
      });
    } finally {
      setIsBackupBusy(false);
    }
  }

  async function handleImportBackup(): Promise<void> {
    if (!backupFile) {
      setBackupNotice({
        type: "error",
        message: "Selecione um arquivo JSON para importar.",
      });
      return;
    }

    setIsBackupBusy(true);
    setBackupNotice(null);

    try {
      const formData = new FormData();
      formData.append("file", backupFile);

      const response = await fetch("/api/admin/backup/import", {
        method: "POST",
        headers: {
          [ADMIN_ROUTE_SLUG_HEADER]: adminSlug,
          [ADMIN_CSRF_HEADER]: csrfToken,
        },
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Falha ao importar backup.");
      }

      await reloadSnapshot();

      setBackupFile(null);
      setBackupNotice({
        type: "success",
        message: "Backup importado com sucesso.",
      });
    } catch (error) {
      setBackupNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Falha ao importar backup.",
      });
    } finally {
      setIsBackupBusy(false);
    }
  }

  async function handleResetBackup(): Promise<void> {
    const typedConfirmation = window.prompt(
      "Digite RESET para confirmar o reset dos dados.",
    );

    if (typedConfirmation !== "RESET") {
      setBackupNotice({
        type: "error",
        message: "Reset cancelado: confirmacao invalida.",
      });
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja resetar para os valores padrao?",
    );

    if (!confirmed) {
      setBackupNotice({
        type: "error",
        message: "Reset cancelado pelo usuario.",
      });
      return;
    }

    setIsBackupBusy(true);
    setBackupNotice(null);

    try {
      await fetchJson("/api/admin/backup/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirm: "RESET" }),
      });

      await reloadSnapshot();

      setBackupNotice({
        type: "success",
        message: "Dados resetados para o padrao.",
      });
    } catch (error) {
      setBackupNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Falha ao resetar dados.",
      });
    } finally {
      setIsBackupBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border border-(--border) bg-(--bg-primary) p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
            Edicao de Perfil
          </h2>
          <p className="mt-1 text-xs text-(--text-secondary)">
            Atualize nome, bio, status, banner e opcionalmente a senha do admin.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs">
              <span>Display Name</span>
              <input
                value={profileForm.displayName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm outline-none focus:border-(--accent)"
              />
            </label>

            <label className="grid gap-1 text-xs">
              <span>Username</span>
              <input
                value={profileForm.username}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm outline-none focus:border-(--accent)"
              />
            </label>
          </div>

          <label className="grid gap-1 text-xs">
            <span>Bio</span>
            <textarea
              value={profileForm.bio}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
              rows={3}
              className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm outline-none focus:border-(--accent)"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs">
              <span>Status Text</span>
              <input
                value={profileForm.statusText}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    statusText: event.target.value,
                  }))
                }
                className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm outline-none focus:border-(--accent)"
              />
            </label>

            <label className="grid gap-1 text-xs">
              <span>Status Color</span>
              <select
                value={profileForm.statusColor}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    statusColor: event.target.value as StatusColor,
                  }))
                }
                className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm outline-none focus:border-(--accent)"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-xs">
            <span>Banner URL</span>
            <input
              value={profileForm.bannerUrl ?? ""}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  bannerUrl: event.target.value,
                }))
              }
              placeholder="https://..."
              className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm outline-none focus:border-(--accent)"
            />
          </label>

          <label className="grid gap-1 text-xs">
            <span>Nova Senha Admin (opcional)</span>
            <input
              type="password"
              value={profileForm.adminPassword}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  adminPassword: event.target.value,
                }))
              }
              autoComplete="new-password"
              className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2 text-sm outline-none focus:border-(--accent)"
            />
          </label>

          <NoticeBox notice={profileNotice} />

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-fit rounded-full border border-(--accent) bg-(--accent-dim) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProfile ? "Salvando..." : "Salvar perfil"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-(--border) bg-(--bg-primary) p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
          Quick Links (JSON)
        </h2>
        <p className="mt-1 text-xs text-(--text-secondary)">
          Edite a lista em JSON. A ordem do array define a ordem de exibicao.
        </p>

        <textarea
          value={quickLinksJson}
          onChange={(event) => setQuickLinksJson(event.target.value)}
          rows={10}
          className="mt-3 w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 font-[family-name:var(--font-geist-mono)] text-xs outline-none focus:border-(--accent)"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              setIsSavingQuickLinks(true);
              await saveCollection(
                "/api/admin/quick-links",
                quickLinksJson,
                setQuickLinksNotice,
              );
              setIsSavingQuickLinks(false);
            }}
            disabled={isSavingQuickLinks}
            className="rounded-full border border-(--accent) bg-(--accent-dim) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingQuickLinks ? "Salvando..." : "Salvar quick links"}
          </button>

          <NoticeBox notice={quickLinksNotice} />
        </div>
      </section>

      <section className="rounded-2xl border border-(--border) bg-(--bg-primary) p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
          Projetos (JSON)
        </h2>
        <p className="mt-1 text-xs text-(--text-secondary)">
          A vitrine publica de projetos agora prioriza repositorios publicos da
          API do GitHub (mais recente para mais antigo). Este JSON fica como
          fallback manual.
        </p>
        <textarea
          value={projectsJson}
          onChange={(event) => setProjectsJson(event.target.value)}
          rows={12}
          className="mt-3 w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 font-[family-name:var(--font-geist-mono)] text-xs outline-none focus:border-(--accent)"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              setIsSavingProjects(true);
              await saveCollection(
                "/api/admin/projects",
                projectsJson,
                setProjectsNotice,
              );
              setIsSavingProjects(false);
            }}
            disabled={isSavingProjects}
            className="rounded-full border border-(--accent) bg-(--accent-dim) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProjects ? "Salvando..." : "Salvar projetos"}
          </button>

          <NoticeBox notice={projectsNotice} />
        </div>
      </section>

      <section className="rounded-2xl border border-(--border) bg-(--bg-primary) p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
          Certificados (JSON)
        </h2>
        <p className="mt-1 text-xs text-(--text-secondary)">
          Campos obrigatorios: titulo, instituicao, emitido_em,
          codigo_credencial, url_validador.
        </p>
        <textarea
          value={certificatesJson}
          onChange={(event) => setCertificatesJson(event.target.value)}
          rows={12}
          className="mt-3 w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 font-[family-name:var(--font-geist-mono)] text-xs outline-none focus:border-(--accent)"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              setIsSavingCertificates(true);
              await saveCollection(
                "/api/admin/certificates",
                certificatesJson,
                setCertificatesNotice,
              );
              setIsSavingCertificates(false);
            }}
            disabled={isSavingCertificates}
            className="rounded-full border border-(--accent) bg-(--accent-dim) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingCertificates ? "Salvando..." : "Salvar certificados"}
          </button>

          <NoticeBox notice={certificatesNotice} />
        </div>
      </section>

      <section className="rounded-2xl border border-(--border) bg-(--bg-primary) p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
          Eventos (JSON)
        </h2>
        <p className="mt-1 text-xs text-(--text-secondary)">
          Campos obrigatorios: titulo, instituicao, emitido_em,
          codigo_credencial, url_validador.
        </p>
        <textarea
          value={eventsJson}
          onChange={(event) => setEventsJson(event.target.value)}
          rows={12}
          className="mt-3 w-full rounded-xl border border-(--border) bg-(--bg-elevated) px-3 py-2 font-[family-name:var(--font-geist-mono)] text-xs outline-none focus:border-(--accent)"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              setIsSavingEvents(true);
              await saveCollection(
                "/api/admin/events",
                eventsJson,
                setEventsNotice,
              );
              setIsSavingEvents(false);
            }}
            disabled={isSavingEvents}
            className="rounded-full border border-(--accent) bg-(--accent-dim) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingEvents ? "Salvando..." : "Salvar eventos"}
          </button>

          <NoticeBox notice={eventsNotice} />
        </div>
      </section>

      <section className="rounded-2xl border border-(--border-bright) bg-(--bg-elevated) p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
          Backup / Import / Reset
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isBackupBusy}
            className="rounded-full border border-(--border) bg-(--bg-primary) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-60"
          >
            Exportar dados
          </button>

          <input
            type="file"
            accept="application/json"
            onChange={(event) => setBackupFile(event.target.files?.[0] ?? null)}
            className="max-w-full text-xs"
          />

          <button
            type="button"
            onClick={handleImportBackup}
            disabled={isBackupBusy}
            className="rounded-full border border-(--border) bg-(--bg-primary) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-60"
          >
            Importar dados
          </button>

          <button
            type="button"
            onClick={handleResetBackup}
            disabled={isBackupBusy}
            className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resetar para padrao
          </button>
        </div>

        <div className="mt-3">
          <NoticeBox notice={backupNotice} />
        </div>
      </section>
    </div>
  );
}
