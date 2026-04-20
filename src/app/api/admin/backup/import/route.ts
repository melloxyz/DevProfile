import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminMutationAuth } from "@/lib/admin/mutation-auth.server";
import {
  PUBLIC_CONTENT_CACHE_TAG,
  replacePublicContentSnapshot,
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdminMutationAuth(request);

  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return badRequestResponse("Arquivo de backup ausente.");
    }

    try {
      payload = JSON.parse(await file.text()) as unknown;
    } catch {
      return badRequestResponse("Arquivo de backup invalido.");
    }
  } else {
    try {
      const body = (await request.json()) as unknown;

      if (typeof body === "object" && body !== null && "data" in body) {
        payload = (body as Record<string, unknown>).data;
      } else {
        payload = body;
      }
    } catch {
      return badRequestResponse("Payload invalido.");
    }
  }

  let updated;

  try {
    updated = await replacePublicContentSnapshot(payload);
  } catch {
    return badRequestResponse("Conteudo do backup invalido.");
  }

  revalidateTag(PUBLIC_CONTENT_CACHE_TAG);

  return NextResponse.json(
    {
      ok: true,
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
