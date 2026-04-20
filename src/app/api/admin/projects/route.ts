import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminMutationAuth } from "@/lib/admin/mutation-auth.server";
import {
  PUBLIC_CONTENT_CACHE_TAG,
  parseProjectsInput,
  readPublicContentSnapshot,
  updatePublicContentSnapshot,
} from "@/lib/storage-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function pickItemsPayload(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input;
  }

  if (typeof input === "object" && input !== null && "items" in input) {
    return (input as Record<string, unknown>).items;
  }

  return input;
}

export async function GET(): Promise<NextResponse> {
  const snapshot = await readPublicContentSnapshot();

  return NextResponse.json(snapshot.projects, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdminMutationAuth(request);

  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequestResponse("Payload invalido.");
  }

  const items = parseProjectsInput(pickItemsPayload(body));

  if (!items) {
    return badRequestResponse("Lista de projetos invalida.");
  }

  const updated = await updatePublicContentSnapshot((current) => ({
    ...current,
    projects: items,
  }));

  revalidateTag(PUBLIC_CONTENT_CACHE_TAG);

  return NextResponse.json(
    {
      ok: true,
      projects: updated.projects,
      updatedAt: updated.updatedAt,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
