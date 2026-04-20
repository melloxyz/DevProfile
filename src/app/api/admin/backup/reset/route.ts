import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminMutationAuth } from "@/lib/admin/mutation-auth.server";
import {
  PUBLIC_CONTENT_CACHE_TAG,
  resetPublicContentSnapshot,
} from "@/lib/storage-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResetBody = {
  confirm?: string;
};

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

  let body: ResetBody;

  try {
    body = (await request.json()) as ResetBody;
  } catch {
    return badRequestResponse("Payload invalido.");
  }

  if (body.confirm !== "RESET") {
    return badRequestResponse("Confirmacao invalida para reset.");
  }

  const updated = await resetPublicContentSnapshot();
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
