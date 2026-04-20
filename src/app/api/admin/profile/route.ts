import bcrypt from "bcryptjs";
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

const BCRYPT_SALT_ROUNDS = 12;

const PROFILE_LIMITS = {
  displayName: 48,
  username: 32,
  bio: 240,
  statusText: 80,
  bannerUrl: 240,
  adminPassword: 128,
} as const;

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

  if (displayName && displayName.length > PROFILE_LIMITS.displayName) {
    return badRequestResponse("Display Name excede o limite de caracteres.");
  }

  if (username && username.length > PROFILE_LIMITS.username) {
    return badRequestResponse("Username excede o limite de caracteres.");
  }

  if (bio && bio.length > PROFILE_LIMITS.bio) {
    return badRequestResponse("Bio excede o limite de caracteres.");
  }

  if (statusText && statusText.length > PROFILE_LIMITS.statusText) {
    return badRequestResponse("Status Text excede o limite de caracteres.");
  }

  if (bannerUrl && bannerUrl.length > PROFILE_LIMITS.bannerUrl) {
    return badRequestResponse("Banner URL excede o limite de caracteres.");
  }

  if (adminPassword && adminPassword.length > PROFILE_LIMITS.adminPassword) {
    return badRequestResponse("Senha excede o limite de caracteres.");
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
    const hash = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);
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
