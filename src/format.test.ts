import { describe, test, expect } from "bun:test";
import { formatMarkdown, formatJson } from "../src/format.js";
import type { Lifelog } from "../src/client.js";

const makeMockLifelog = (overrides: Partial<Lifelog> = {}): Lifelog => ({
  id: "test-1",
  title: "週次定例ミーティング",
  markdown:
    "## 議題\n\n- プロジェクト進捗確認\n\n> 田中: 今週はAPIの実装が完了しました\n\n> 梶沼: レビューお願いします",
  startTime: "2026-03-20T10:00:00+09:00",
  endTime: "2026-03-20T11:00:00+09:00",
  isStarred: false,
  contents: [
    {
      type: "heading1",
      content: "週次定例ミーティング",
      startTime: "2026-03-20T10:00:00+09:00",
      endTime: "2026-03-20T10:00:00+09:00",
      speakerName: null,
      speakerIdentifier: null,
      children: [],
    },
  ],
  ...overrides,
});

describe("formatMarkdown", () => {
  test("single lifelog renders title, time range, and body", () => {
    const log = makeMockLifelog();
    const result = formatMarkdown([log]);

    expect(result).toContain("# 週次定例ミーティング");
    expect(result).toContain(
      "> 2026-03-20T10:00:00+09:00 - 2026-03-20T11:00:00+09:00"
    );
    expect(result).toContain("## 議題");
    expect(result).toContain("> 田中: 今週はAPIの実装が完了しました");
  });

  test("multiple lifelogs separated by ---", () => {
    const log1 = makeMockLifelog({ id: "test-1", title: "Meeting 1" });
    const log2 = makeMockLifelog({ id: "test-2", title: "Meeting 2" });
    const result = formatMarkdown([log1, log2]);

    expect(result).toContain("# Meeting 1");
    expect(result).toContain("# Meeting 2");
    expect(result).toContain("\n\n---\n\n");
  });

  test("empty array returns empty string", () => {
    const result = formatMarkdown([]);
    expect(result).toBe("");
  });
});

describe("formatJson", () => {
  test("outputs valid JSON array", () => {
    const log = makeMockLifelog();
    const result = formatJson([log]);
    const parsed = JSON.parse(result);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("test-1");
    expect(parsed[0].title).toBe("週次定例ミーティング");
  });

  test("empty array outputs []", () => {
    const result = formatJson([]);
    expect(JSON.parse(result)).toEqual([]);
  });
});
