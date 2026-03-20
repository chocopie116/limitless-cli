const BASE_URL = "https://api.limitless.ai";
const PER_PAGE = 10;

export interface LifelogContent {
  type: string;
  content: string;
  startTime: string;
  endTime: string;
  speakerName: string | null;
  speakerIdentifier: string | null;
  children: LifelogContent[];
}

export interface Lifelog {
  id: string;
  title: string;
  markdown: string;
  startTime: string;
  endTime: string;
  isStarred: boolean;
  contents: LifelogContent[];
}

interface ApiResponse {
  data: { lifelogs: Lifelog[] };
  meta: { lifelogs: { nextCursor?: string; count: number } };
}

export interface FetchOptions {
  date?: string;
  start?: string;
  end?: string;
  timezone: string;
  limit?: number;
  direction: "asc" | "desc";
  isStarred?: boolean;
}

export async function fetchLifelogs(
  apiKey: string,
  opts: FetchOptions
): Promise<Lifelog[]> {
  const all: Lifelog[] = [];
  let cursor: string | undefined;
  const remaining = opts.limit ?? Infinity;

  while (all.length < remaining) {
    const batchLimit = Math.min(PER_PAGE, remaining - all.length);
    const params = new URLSearchParams();

    if (opts.date) params.set("date", opts.date);
    if (opts.start) params.set("start", opts.start);
    if (opts.end) params.set("end", opts.end);
    params.set("timezone", opts.timezone);
    params.set("limit", String(batchLimit));
    params.set("direction", opts.direction);
    params.set("includeMarkdown", "true");
    params.set("includeHeadings", "true");
    if (opts.isStarred) params.set("isStarred", "true");
    if (cursor) params.set("cursor", cursor);

    const url = `${BASE_URL}/v1/lifelogs?${params}`;
    const res = await fetch(url, {
      headers: { "X-API-Key": apiKey },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as ApiResponse;
    all.push(...json.data.lifelogs);

    cursor = json.meta.lifelogs.nextCursor;
    if (!cursor || json.data.lifelogs.length === 0) break;
  }

  return opts.limit ? all.slice(0, opts.limit) : all;
}
