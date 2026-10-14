import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { hasPermission } from "@/server/permissions/catalog";
import { isLookupKind, searchLookups, type LookupKind } from "@/server/services/lookups";

const permission: Partial<Record<LookupKind, string>> = {
  university: "university.read",
  professor: "professor.read",
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  if (!isLookupKind(kind)) return NextResponse.json({ error: "Unknown lookup." }, { status: 400 });
  const required = permission[kind];
  if (required && !hasPermission(session.user.permissions ?? [], required)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const options = await searchLookups(kind, url.searchParams.get("q") ?? "", url.searchParams.get("id") ?? undefined);
  return NextResponse.json({ options }, { headers: { "Cache-Control": "private, no-store" } });
}
