import { describe, expect, it } from "vitest";
import { slicePage } from "@/lib/query";

describe("slicePage", () => {
  it("treats an extra fetched row as a next page instead of counting the collection", () => {
    const first = slicePage([1, 2, 3], 1, 2);
    expect(first.rows).toEqual([1, 2]);
    expect(first.hasMore).toBe(true);
    expect(first.pages).toBe(2);

    const last = slicePage([3], 2, 2);
    expect(last.rows).toEqual([3]);
    expect(last.hasMore).toBe(false);
    expect(last.pages).toBe(2);
  });
});
