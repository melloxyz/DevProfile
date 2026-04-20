import { NextResponse } from "next/server";

import { readPublicContentSnapshotCached } from "@/lib/storage-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const snapshot = await readPublicContentSnapshotCached();

  return NextResponse.json(snapshot, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
