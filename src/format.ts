import type { Lifelog } from "./client.js";

export function formatMarkdown(lifelogs: Lifelog[]): string {
  return lifelogs
    .map((log) => {
      const start = log.startTime;
      const end = log.endTime;
      const header = `# ${log.title}\n\n> ${start} - ${end}`;
      const body = log.markdown || "";
      return `${header}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

export function formatJson(lifelogs: Lifelog[]): string {
  return JSON.stringify(lifelogs, null, 2);
}
