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
  const q = url.searchParams.get("q") ?? "";
  const id = url.searchParams.get("id") ?? undefined;
  const options = await searchLookups(kind, q, id);
  const cacheable = kind === "country" && !id && q.trim().length === 0;
  return NextResponse.json(
    { options },
    { headers: { "Cache-Control": cacheable ? "private, max-age=60, stale-while-revalidate=300" : "private, max-age=15, stale-while-revalidate=60" } },
  );
}
