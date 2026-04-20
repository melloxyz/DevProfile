import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_ROUTE_SLUG_HEADER,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/lib/admin/constants";
import { verifyAdminSessionToken } from "@/lib/admin/session";

const ADMIN_X_ROBOTS_TAG =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

function readTrimmedEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function notFoundResponse(): NextResponse {
  return new NextResponse("Not Found", { status: 404 });
}

function withAdminNoIndexHeader(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", ADMIN_X_ROBOTS_TAG);
  return response;
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
  const pathname = request.nextUrl.pathname;

  if (!adminSlug) {
    if (pathname.startsWith("/api/admin/")) {
      return notFoundResponse();
    }

    return NextResponse.next();
  }

  if (!adminSessionSecret) {
    if (
      pathname.startsWith("/api/admin/") ||
      pathname === `/${adminSlug}` ||
      pathname === `/${adminSlug}/dashboard` ||
      pathname.startsWith(`/${adminSlug}/dashboard/`)
    ) {
      return notFoundResponse();
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    const slugHeader = request.headers.get(ADMIN_ROUTE_SLUG_HEADER)?.trim();

    if (slugHeader !== adminSlug) {
      return notFoundResponse();
    }

    if (pathname === "/api/admin/auth/login") {
      return withAdminNoIndexHeader(NextResponse.next());
    }

    const validSession = await hasValidSessionCookie(
      request,
      adminSessionSecret,
    );

    if (!validSession) {
      return notFoundResponse();
    }

    return withAdminNoIndexHeader(NextResponse.next());
  }

  if (pathname === `/${adminSlug}`) {
    return withAdminNoIndexHeader(NextResponse.next());
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

    return withAdminNoIndexHeader(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/:adminSlug",
    "/:adminSlug/dashboard",
    "/:adminSlug/dashboard/:path*",
  ],
};
