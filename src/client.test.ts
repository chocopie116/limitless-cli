import { describe, test, expect, mock, beforeEach } from "bun:test";
import { fetchLifelogs } from "../src/client.js";
import type { FetchOptions } from "../src/client.js";

const makeApiResponse = (
  lifelogs: any[],
  nextCursor: string | null = null
) => ({
  data: { lifelogs },
  meta: { lifelogs: { nextCursor, count: lifelogs.length } },
});

const mockLifelog = (id: string) => ({
  id,
  title: `Meeting ${id}`,
  markdown: `## Content ${id}`,
  startTime: "2026-03-20T10:00:00+09:00",
  endTime: "2026-03-20T11:00:00+09:00",
  isStarred: false,
  contents: [],
});

const defaultOpts: FetchOptions = {
  date: "2026-03-20",
  timezone: "Asia/Tokyo",
  direction: "desc",
};

beforeEach(() => {
  // Reset fetch mock before each test
  globalThis.fetch = mock() as any;
});

describe("fetchLifelogs", () => {
  test("single page response (no nextCursor) returns lifelogs", async () => {
    const data = makeApiResponse([mockLifelog("1"), mockLifelog("2")]);
    (globalThis.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify(data), { status: 200 })
    );

    const result = await fetchLifelogs("test-key", defaultOpts);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test("multi-page pagination follows cursor and accumulates all", async () => {
    const page1 = makeApiResponse([mockLifelog("1")], "cursor-abc");
    const page2 = makeApiResponse([mockLifelog("2")], null);

    (globalThis.fetch as any)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(page1), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(page2), { status: 200 })
      );

    const result = await fetchLifelogs("test-key", defaultOpts);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);

    // Verify cursor was passed in second request
    const secondCallUrl = (globalThis.fetch as any).mock.calls[1][0] as string;
    expect(secondCallUrl).toContain("cursor=cursor-abc");
  });

  test("limit is respected and stops fetching", async () => {
    const page1 = makeApiResponse([mockLifelog("1")], "cursor-abc");

    (globalThis.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify(page1), { status: 200 })
    );

    const result = await fetchLifelogs("test-key", {
      ...defaultOpts,
      limit: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    // Should not follow cursor since limit is already met
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test("API error (non-200) throws with status", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    expect(
      fetchLifelogs("bad-key", defaultOpts)
    ).rejects.toThrow("API error 401");
  });

  test("correct query params passed", async () => {
    const data = makeApiResponse([]);
    (globalThis.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify(data), { status: 200 })
    );

    await fetchLifelogs("test-key", {
      date: "2026-03-20",
      start: undefined,
      end: undefined,
      timezone: "Asia/Tokyo",
      direction: "asc",
      isStarred: true,
      limit: 5,
    });

    const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.searchParams.get("date")).toBe("2026-03-20");
    expect(url.searchParams.get("timezone")).toBe("Asia/Tokyo");
    expect(url.searchParams.get("direction")).toBe("asc");
    expect(url.searchParams.get("isStarred")).toBe("true");
    expect(url.searchParams.get("includeMarkdown")).toBe("true");
    expect(url.searchParams.get("includeHeadings")).toBe("true");
    expect(url.searchParams.get("limit")).toBe("5");

    // Verify API key header
    const calledOpts = (globalThis.fetch as any).mock.calls[0][1];
    expect(calledOpts.headers["X-API-Key"]).toBe("test-key");
  });

  test("start/end params are passed and date is omitted", async () => {
    const data = makeApiResponse([]);
    (globalThis.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify(data), { status: 200 })
    );

    await fetchLifelogs("test-key", {
      timezone: "Asia/Tokyo",
      direction: "desc",
      start: "2026-03-19 00:00:00",
      end: "2026-03-20 23:59:59",
    });

    const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.searchParams.get("start")).toBe("2026-03-19 00:00:00");
    expect(url.searchParams.get("end")).toBe("2026-03-20 23:59:59");
    expect(url.searchParams.has("date")).toBe(false);
  });
});
