import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getCurrentUser, assertPermission } from "@/server/auth/current-user";
import { Scholarship, University, Professor, Opportunity } from "@/models";
import { ready } from "@/server/services/query";

const models = {
  scholarships: Scholarship,
  universities: University,
  professors: Professor,
  opportunities: Opportunity,
} as const;

export async function GET(request: Request, context: { params: Promise<{ entity: string }> }) {
  const user = await getCurrentUser();
  assertPermission(user, "export.run");
  const { entity } = await context.params;
  const model = models[entity as keyof typeof models];
  if (!model) return NextResponse.json({ error: "Unknown export." }, { status: 404 });
  await ready();
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean);
  const filter: Record<string, unknown> = { archivedAt: null };
  if (ids?.length) filter._id = { $in: ids };
  const rows = await model.find(filter).limit(100_000).lean();
  const csv = Papa.unparse(rows.map((row) => JSON.parse(JSON.stringify(row)) as Record<string, unknown>));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}.csv"`,
    },
  });
}
