import { NextRequest, NextResponse } from "next/server";

import { requireAdminMutationAuth } from "@/lib/admin/mutation-auth.server";
import { readPublicContentSnapshot } from "@/lib/storage-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdminMutationAuth(request);

  if (!auth.ok) {
    return auth.response;
  }

  const snapshot = await readPublicContentSnapshot();

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dev-profile-backup.json"',
      "Cache-Control": "no-store",
    },
  });
}
