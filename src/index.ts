#!/usr/bin/env bun
import { Command } from "commander";
import { fetchLifelogs } from "./client.js";
import { formatMarkdown, formatJson } from "./format.js";

const VERSION = "0.1.0";

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getApiKey(): string {
  const key = process.env.LIMITLESS_API_KEY;
  if (!key) {
    process.stderr.write(
      "Error: LIMITLESS_API_KEY environment variable is not set.\n"
    );
    process.exit(1);
  }
  return key;
}

async function run(opts: {
  date?: string;
  start?: string;
  end?: string;
  json?: boolean;
  starred?: boolean;
  limit?: string;
  tz: string;
  asc?: boolean;
}) {
  const apiKey = getApiKey();

  const lifelogs = await fetchLifelogs(apiKey, {
    date: opts.start ? undefined : (opts.date ?? today()),
    start: opts.start,
    end: opts.end,
    timezone: opts.tz,
    limit: opts.limit ? parseInt(opts.limit, 10) : undefined,
    direction: opts.asc ? "asc" : "desc",
    isStarred: opts.starred || undefined,
  });

  const output = opts.json
    ? formatJson(lifelogs)
    : formatMarkdown(lifelogs);

  process.stdout.write(output + "\n");
}

const program = new Command();

program
  .name("limitless-cli")
  .version(VERSION)
  .description("Fetch Limitless lifelogs to stdout");

const lifelogs = new Command("lifelogs")
  .description("Fetch lifelogs (default command)")
  .option("--date <date>", "Target date (YYYY-MM-DD)")
  .option("--start <datetime>", "Start time (YYYY-MM-DD HH:mm:SS)")
  .option("--end <datetime>", "End time (YYYY-MM-DD HH:mm:SS)")
  .option("--json", "Output as JSON", false)
  .option("--starred", "Starred only", false)
  .option("--limit <n>", "Max entries")
  .option("--tz <timezone>", "Timezone", "Asia/Tokyo")
  .option("--asc", "Ascending order", false)
  .action(run);

program.addCommand(lifelogs, { isDefault: true });

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
