import "server-only";

import type { NextRequest } from "next/server";

import {
  ADMIN_CSRF_HEADER,
  ADMIN_ROUTE_SLUG_HEADER,
} from "@/lib/admin/constants";

export function hasValidAdminRouteSlugHeader(
  request: NextRequest,
  expectedSlug: string,
): boolean {
  const slugHeader = request.headers.get(ADMIN_ROUTE_SLUG_HEADER)?.trim();

  return Boolean(slugHeader) && slugHeader === expectedSlug;
}

export function isTrustedMutationOrigin(request: NextRequest): boolean {
  const requestOrigin = request.nextUrl.origin;
  const originHeader = request.headers.get("origin");

  if (originHeader) {
    return originHeader === requestOrigin;
  }

  const refererHeader = request.headers.get("referer");

  if (!refererHeader) {
    return false;
  }

  try {
    return new URL(refererHeader).origin === requestOrigin;
  } catch {
    return false;
  }
}

export function readCsrfTokenHeader(request: NextRequest): string | null {
  const value = request.headers.get(ADMIN_CSRF_HEADER)?.trim();
  return value && value.length > 0 ? value : null;
}
