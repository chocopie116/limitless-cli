import { describe, test, expect } from "bun:test";

const CLI_PATH = new URL("../src/index.ts", import.meta.url).pathname;

async function runCli(
  args: string[],
  env: Record<string, string | undefined> = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

describe("CLI integration", () => {
  test("--help shows help text", async () => {
    const { stdout, exitCode } = await runCli(["--help"], {
      LIMITLESS_API_KEY: "test-key",
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("limitless-cli");
    expect(stdout).toContain("Fetch Limitless lifelogs");
  });

  test("lifelogs --help shows lifelogs options", async () => {
    const { stdout, exitCode } = await runCli(["lifelogs", "--help"], {
      LIMITLESS_API_KEY: "test-key",
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("--date");
    expect(stdout).toContain("--json");
    expect(stdout).toContain("--limit");
    expect(stdout).toContain("--starred");
    expect(stdout).toContain("--tz");
    expect(stdout).toContain("--asc");
  });

  test("no LIMITLESS_API_KEY exits with error", async () => {
    const { stderr, exitCode } = await runCli(["lifelogs", "--limit", "1"], {
      LIMITLESS_API_KEY: undefined,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("LIMITLESS_API_KEY");
  });

  test("--version shows version", async () => {
    const { stdout, exitCode } = await runCli(["--version"], {
      LIMITLESS_API_KEY: "test-key",
    });

    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe("0.1.0");
  });
});
