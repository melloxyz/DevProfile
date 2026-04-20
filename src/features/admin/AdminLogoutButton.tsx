"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ADMIN_CSRF_HEADER,
  ADMIN_ROUTE_SLUG_HEADER,
} from "@/lib/admin/constants";

type AdminLogoutButtonProps = {
  adminSlug: string;
  csrfToken: string;
};

type LogoutResponse = {
  ok?: boolean;
  error?: string;
  redirectTo?: string;
};

export function AdminLogoutButton({
  adminSlug,
  csrfToken,
}: AdminLogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogout() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: {
          [ADMIN_ROUTE_SLUG_HEADER]: adminSlug,
          [ADMIN_CSRF_HEADER]: csrfToken,
        },
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as LogoutResponse;

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Nao foi possivel encerrar a sessao.");
        return;
      }

      const redirectTo = payload.redirectTo ?? `/${adminSlug}`;
      router.push(redirectTo);
      router.refresh();
    } catch {
      setErrorMessage("Nao foi possivel encerrar a sessao.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSubmitting}
        className="rounded-full border border-(--border) bg-(--bg-primary) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--text-secondary) transition hover:border-(--border-bright) hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saindo..." : "Logout"}
      </button>

      {errorMessage ? (
        <p className="text-xs text-rose-200">{errorMessage}</p>
      ) : null}
    </div>
  );
}
