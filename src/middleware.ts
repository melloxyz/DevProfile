import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_ROUTE_SLUG_HEADER,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/lib/admin/constants";
import { verifyAdminSessionToken } from "@/lib/admin/session";

function readTrimmedEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function notFoundResponse(): NextResponse {
  return new NextResponse("Not Found", { status: 404 });
}

async function hasValidSessionCookie(
  request: NextRequest,
  secret: string,
): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const session = await verifyAdminSessionToken({ token, secret });
  return Boolean(session);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const adminSlug = readTrimmedEnv("ADMIN_ROUTE_SLUG");
  const adminSessionSecret = readTrimmedEnv("ADMIN_SESSION_SECRET");

  if (!adminSlug || !adminSessionSecret) {
    return notFoundResponse();
  }

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/admin/")) {
    const slugHeader = request.headers.get(ADMIN_ROUTE_SLUG_HEADER)?.trim();

    if (slugHeader !== adminSlug) {
      return notFoundResponse();
    }

    if (pathname === "/api/admin/auth/login") {
      return NextResponse.next();
    }

    const validSession = await hasValidSessionCookie(
      request,
      adminSessionSecret,
    );

    if (!validSession) {
      return notFoundResponse();
    }

    return NextResponse.next();
  }

  if (
    pathname === `/${adminSlug}/dashboard` ||
    pathname.startsWith(`/${adminSlug}/dashboard/`)
  ) {
    const validSession = await hasValidSessionCookie(
      request,
      adminSessionSecret,
    );

    if (!validSession) {
      return notFoundResponse();
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/:adminSlug/dashboard",
    "/:adminSlug/dashboard/:path*",
  ],
};
