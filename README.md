# limitless-cli

Minimal Unix-style CLI for [Limitless](https://limitless.ai) lifelogs. Like `cat` for your Limitless data.

## Install

```bash
bun install
```

## Setup

```bash
export LIMITLESS_API_KEY="your-api-key"
```

## Usage

```bash
# Today's lifelogs (markdown)
limitless-cli

# Specific date
limitless-cli lifelogs --date 2026-03-20

# JSON output
limitless-cli --json

# Starred only, limit 5
limitless-cli --starred --limit 5

# Time range
limitless-cli --start "2026-03-20 09:00:00" --end "2026-03-20 12:00:00"

# Ascending order
limitless-cli --asc
```

## Compose with pipes

```bash
# Search
limitless-cli | grep "meeting"

# Process with jq
limitless-cli --json | jq '.[].title'

# Save to file
limitless-cli --date 2026-03-20 > notes.md

# Send to Claude
limitless-cli | claude "summarize this"
```

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--date <YYYY-MM-DD>` | today | Target date |
| `--start <datetime>` | — | Start time |
| `--end <datetime>` | — | End time |
| `--json` | false | JSON output |
| `--starred` | false | Starred only |
| `--limit <n>` | all | Max entries |
| `--tz <timezone>` | `Asia/Tokyo` | Timezone |
| `--asc` | false | Ascending order |
| `--help` | | Show help |
| `--version` | | Show version |
