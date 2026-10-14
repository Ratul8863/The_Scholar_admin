import { firstParam, pageNumber, pageSize } from "@/lib/utils";

export type SearchParams = Record<string, string | string[] | undefined>;

export type ListQuery = {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  dir: "asc" | "desc";
  filters: Record<string, string>;
};

const reserved = new Set(["q", "page", "pageSize", "sort", "dir"]);

export function parseListQuery(params: SearchParams, allowedSorts: string[], defaultSort = "updatedAt"): ListQuery {
  const sort = firstParam(params.sort) ?? defaultSort;
  const dir = firstParam(params.dir) === "asc" ? "asc" : "desc";
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (reserved.has(key)) continue;
    const text = firstParam(value);
    if (text) filters[key] = text;
  }
  return {
    q: firstParam(params.q)?.trim() ?? "",
    page: pageNumber(firstParam(params.page)),
    pageSize: pageSize(firstParam(params.pageSize)),
    sort: allowedSorts.includes(sort) ? sort : defaultSort,
    dir,
    filters,
  };
}
