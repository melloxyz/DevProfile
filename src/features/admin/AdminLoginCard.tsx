"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ADMIN_ROUTE_SLUG_HEADER } from "@/lib/admin/constants";

type AdminLoginCardProps = {
  adminSlug: string;
};

type LoginResponse = {
  ok?: boolean;
  error?: string;
  redirectTo?: string;
};

export function AdminLoginCard({ adminSlug }: AdminLoginCardProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_ROUTE_SLUG_HEADER]: adminSlug,
        },
        body: JSON.stringify({ password }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        if (response.status === 429) {
          setErrorMessage("Muitas tentativas. Aguarde alguns minutos.");
        } else {
          setErrorMessage(payload.error ?? "Credenciais invalidas.");
        }
        return;
      }

      const redirectTo = payload.redirectTo ?? `/${adminSlug}/dashboard`;
      router.push(redirectTo);
      router.refresh();
    } catch {
      setErrorMessage("Nao foi possivel concluir o login agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-(--border-bright) bg-(--bg-elevated) p-5 sm:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-[-0.02em]">
          Admin Access
        </h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Esta area e protegida por rota oculta, sessao server-side e validacoes
          de seguranca.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm" htmlFor="admin-password">
          Senha
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-(--border) bg-(--bg-primary) px-3 py-2 text-sm outline-none transition focus:border-(--accent)"
          placeholder="Digite a senha do painel"
        />

        {errorMessage ? (
          <p className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full border border-(--accent) bg-(--accent-dim) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--accent) transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Validando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}
