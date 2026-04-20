import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import {
  hasValidAdminRouteSlugHeader,
  isTrustedMutationOrigin,
  readCsrfTokenHeader,
} from "@/lib/admin/guards.server";
import { verifyAdminSessionToken } from "@/lib/admin/session";
import { serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFoundResponse(): NextResponse {
  return new NextResponse("Not Found", { status: 404 });
}

function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const adminSlug = serverEnv.ADMIN_ROUTE_SLUG;
  const adminSessionSecret = serverEnv.ADMIN_SESSION_SECRET;

  if (!adminSlug || !adminSessionSecret) {
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

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return notFoundResponse();
  }

  const session = await verifyAdminSessionToken({
    token: sessionToken,
    secret: adminSessionSecret,
  });

  if (!session) {
    return notFoundResponse();
  }

  const csrfToken = readCsrfTokenHeader(request);

  if (!csrfToken || csrfToken !== session.csrfToken) {
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

  const response = NextResponse.json(
    {
      ok: true,
      redirectTo: `/${adminSlug}`,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  clearSessionCookie(response);

  return response;
}

export function GET(): NextResponse {
  return notFoundResponse();
}
