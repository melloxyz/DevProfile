import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/constants";
import {
  hasValidAdminRouteSlugHeader,
  isTrustedMutationOrigin,
  readCsrfTokenHeader,
} from "@/lib/admin/guards.server";
import {
  type AdminSessionPayload,
  verifyAdminSessionToken,
} from "@/lib/admin/session";
import { serverEnv } from "@/lib/env.server";

type MutationAuthResult =
  | {
      ok: true;
      adminSlug: string;
      session: AdminSessionPayload;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function notFoundResponse(): NextResponse {
  return new NextResponse("Not Found", { status: 404 });
}

function unauthorizedResponse(): NextResponse {
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

export async function requireAdminMutationAuth(
  request: NextRequest,
): Promise<MutationAuthResult> {
  const adminSlug = serverEnv.ADMIN_ROUTE_SLUG;
  const adminSessionSecret = serverEnv.ADMIN_SESSION_SECRET;

  if (!adminSlug || !adminSessionSecret) {
    return {
      ok: false,
      response: notFoundResponse(),
    };
  }

  if (!hasValidAdminRouteSlugHeader(request, adminSlug)) {
    return {
      ok: false,
      response: notFoundResponse(),
    };
  }

  if (!isTrustedMutationOrigin(request)) {
    return {
      ok: false,
      response: unauthorizedResponse(),
    };
  }

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return {
      ok: false,
      response: notFoundResponse(),
    };
  }

  const session = await verifyAdminSessionToken({
    token: sessionToken,
    secret: adminSessionSecret,
  });

  if (!session) {
    return {
      ok: false,
      response: notFoundResponse(),
    };
  }

  const csrfToken = readCsrfTokenHeader(request);

  if (!csrfToken || csrfToken !== session.csrfToken) {
    return {
      ok: false,
      response: unauthorizedResponse(),
    };
  }

  return {
    ok: true,
    adminSlug,
    session,
  };
}
