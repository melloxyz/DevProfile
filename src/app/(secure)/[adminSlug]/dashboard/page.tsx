import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AdminContentManager } from "@/features/admin/AdminContentManager";
import { AdminLogoutButton } from "@/features/admin/AdminLogoutButton";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSessionToken } from "@/lib/admin/session";
import { serverEnv } from "@/lib/env.server";
import { readPublicContentSnapshot } from "@/lib/storage-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard - Dev Profile",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminDashboardPageProps = {
  params: Promise<{
    adminSlug: string;
  }>;
};

export default async function AdminDashboardPage({
  params,
}: AdminDashboardPageProps) {
  const { adminSlug } = await params;

  const configuredSlug = serverEnv.ADMIN_ROUTE_SLUG;
  const sessionSecret = serverEnv.ADMIN_SESSION_SECRET;

  if (!configuredSlug || !sessionSecret || adminSlug !== configuredSlug) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    notFound();
  }

  const session = await verifyAdminSessionToken({
    token: sessionToken,
    secret: sessionSecret,
  });

  if (!session) {
    notFound();
  }

  const snapshot = await readPublicContentSnapshot();

  const expiresAt = new Date(session.expiresAt * 1000).toLocaleString("pt-BR", {
    hour12: false,
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-(--border-bright) bg-(--bg-elevated) p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold tracking-[-0.02em]">
            Admin Dashboard
          </h1>
          <span className="rounded-full border border-emerald-300/35 bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-100">
            Sessao ativa
          </span>
        </div>

        <p className="text-sm text-(--text-secondary)">
          Rota oculta validada por slug server-side. Sessao HttpOnly com
          expiração em {expiresAt}.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border border-(--border) bg-(--bg-primary) p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">
              Fase 4
            </p>
            <p className="mt-2 text-sm">
              CRUD de perfil e colecoes administrativas
            </p>
          </article>

          <article className="rounded-xl border border-(--border) bg-(--bg-primary) p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">
              Segurança
            </p>
            <p className="mt-2 text-sm">
              Origin/Referer + CSRF aplicado nas rotas de mutacao.
            </p>
          </article>

          <article className="rounded-xl border border-(--border) bg-(--bg-primary) p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-(--text-muted)">
              Cache
            </p>
            <p className="mt-2 text-sm">
              Pronto para invalidacao server-side nas proximas fases.
            </p>
          </article>
        </div>

        <div className="mt-6">
          <AdminLogoutButton
            adminSlug={configuredSlug}
            csrfToken={session.csrfToken}
          />
        </div>

        <AdminContentManager
          adminSlug={configuredSlug}
          csrfToken={session.csrfToken}
          initialSnapshot={snapshot}
        />
      </section>
    </main>
  );
}
