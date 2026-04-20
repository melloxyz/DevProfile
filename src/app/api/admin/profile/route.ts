import * as argon2 from "argon2";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { setCustomAdminPasswordHash } from "@/lib/admin/auth-settings.server";
import { requireAdminMutationAuth } from "@/lib/admin/mutation-auth.server";
import {
  PUBLIC_CONTENT_CACHE_TAG,
  updatePublicContentSnapshot,
  readPublicContentSnapshot,
} from "@/lib/storage-server";
import type { StatusColor } from "@/types/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfilePatchBody = {
  displayName?: string;
  username?: string;
  bio?: string;
  statusText?: string;
  statusColor?: StatusColor;
  bannerUrl?: string | null;
  adminPassword?: string;
};

function notFoundResponse(): NextResponse {
  return new NextResponse("Not Found", { status: 404 });
}

function badRequestResponse(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 400,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readStatusColor(value: unknown): StatusColor | undefined {
  if (
    value === "green" ||
    value === "yellow" ||
    value === "blue" ||
    value === "red"
  ) {
    return value;
  }

  return undefined;
}

export async function GET(): Promise<NextResponse> {
  const snapshot = await readPublicContentSnapshot();

  return NextResponse.json(snapshot.profile, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdminMutationAuth(request);

  if (!auth.ok) {
    return auth.response;
  }

  let body: ProfilePatchBody;

  try {
    body = (await request.json()) as ProfilePatchBody;
  } catch {
    return badRequestResponse("Payload invalido.");
  }

  const displayName = readString(body.displayName);
  const username = readString(body.username);
  const bio = readString(body.bio);
  const statusText = readString(body.statusText);
  const statusColor = readStatusColor(body.statusColor);

  const bannerUrl =
    body.bannerUrl === null
      ? null
      : typeof body.bannerUrl === "string"
        ? body.bannerUrl.trim() || null
        : undefined;

  const adminPassword = readString(body.adminPassword);

  if (
    (body.displayName !== undefined && !displayName) ||
    (body.username !== undefined && !username) ||
    (body.bio !== undefined && !bio) ||
    (body.statusText !== undefined && !statusText) ||
    (body.statusColor !== undefined && !statusColor)
  ) {
    return badRequestResponse("Campos de perfil invalidos.");
  }

  if (adminPassword && adminPassword.length < 8) {
    return badRequestResponse("A nova senha deve ter ao menos 8 caracteres.");
  }

  const updated = await updatePublicContentSnapshot((current) => ({
    ...current,
    profile: {
      ...current.profile,
      ...(displayName ? { displayName } : {}),
      ...(username ? { username: username.replace(/^@/, "") } : {}),
      ...(bio ? { bio } : {}),
      ...(statusText ? { statusText } : {}),
      ...(statusColor ? { statusColor } : {}),
      ...(bannerUrl !== undefined ? { bannerUrl } : {}),
    },
  }));

  if (adminPassword) {
    const hash = await argon2.hash(adminPassword, { type: argon2.argon2id });
    await setCustomAdminPasswordHash(hash);
  }

  revalidateTag(PUBLIC_CONTENT_CACHE_TAG);

  return NextResponse.json(
    {
      ok: true,
      profile: updated.profile,
      updatedAt: updated.updatedAt,
      passwordUpdated: Boolean(adminPassword),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export function POST(): NextResponse {
  return notFoundResponse();
}
