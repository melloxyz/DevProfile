import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from "@/lib/admin/constants";
import {
  hasValidAdminRouteSlugHeader,
  isTrustedMutationOrigin,
} from "@/lib/admin/guards.server";
import { getEffectiveAdminPasswordHash } from "@/lib/admin/auth-settings.server";
import { verifyAdminPassword } from "@/lib/admin/password.server";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  readRequestIp,
  registerFailedLoginAttempt,
} from "@/lib/admin/rate-limit.server";
import { createAdminSessionToken } from "@/lib/admin/session";
import { serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginBody = {
  password?: string;
};

function notFoundResponse(): NextResponse {
  return new NextResponse("Not Found", { status: 404 });
}

function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: token,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const adminSlug = serverEnv.ADMIN_ROUTE_SLUG;
  const adminPasswordHash = serverEnv.ADMIN_PASSWORD_HASH;
  const adminSessionSecret = serverEnv.ADMIN_SESSION_SECRET;

  if (!adminSlug || !adminPasswordHash || !adminSessionSecret) {
    return notFoundResponse();
  }

  if (!hasValidAdminRouteSlugHeader(request, adminSlug)) {
    return notFoundResponse();
  }

  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json(
      { error: "Nao autorizado." },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const ip = readRequestIp(request);
  const rateLimit = checkLoginRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Nao autorizado." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    registerFailedLoginAttempt(ip);

    return NextResponse.json(
      { error: "Credenciais invalidas." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (password.length === 0) {
    registerFailedLoginAttempt(ip);

    return NextResponse.json(
      { error: "Credenciais invalidas." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const expectedHash = await getEffectiveAdminPasswordHash(adminPasswordHash);

  const isPasswordValid = await verifyAdminPassword({
    password,
    expectedHash,
  });

  if (!isPasswordValid) {
    registerFailedLoginAttempt(ip);

    return NextResponse.json(
      { error: "Credenciais invalidas." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  clearLoginRateLimit(ip);

  const { token } = await createAdminSessionToken({
    secret: adminSessionSecret,
    ttlSeconds: ADMIN_SESSION_TTL_SECONDS,
  });

  const response = NextResponse.json(
    {
      ok: true,
      redirectTo: `/${adminSlug}/dashboard`,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  setSessionCookie(response, token);

  return response;
}

export function GET(): NextResponse {
  return notFoundResponse();
}
