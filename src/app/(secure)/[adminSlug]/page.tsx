import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AdminLoginCard } from "@/features/admin/AdminLoginCard";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSessionToken } from "@/lib/admin/session";
import { serverEnv } from "@/lib/env.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Access - Dev Profile",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminPageProps = {
  params: Promise<{
    adminSlug: string;
  }>;
};

export default async function AdminLoginPage({ params }: AdminPageProps) {
  const { adminSlug } = await params;

  const configuredSlug = serverEnv.ADMIN_ROUTE_SLUG;
  const sessionSecret = serverEnv.ADMIN_SESSION_SECRET;

  if (!configuredSlug || !sessionSecret || adminSlug !== configuredSlug) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const session = await verifyAdminSessionToken({
      token: sessionToken,
      secret: sessionSecret,
    });

    if (session) {
      redirect(`/${configuredSlug}/dashboard`);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <AdminLoginCard adminSlug={configuredSlug} />
    </main>
  );
}
