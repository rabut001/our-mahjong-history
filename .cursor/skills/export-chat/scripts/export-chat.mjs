#!/usr/bin/env node
/**
 * Cursor agent transcript (JSONL) to chat-exports Markdown.
 * Format matches existing chat-exports/<session>/transcript.md.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const USAGE = `Usage:
  node export-chat.mjs --slug <kebab-slug> [--jsonl <path>] [--latest] [--repo <dir>] [--force]

  --slug     Folder suffix (required). Example: mahjong-group-naming
  --jsonl    Source JSONL. Default: newest file under the transcripts dir
  --latest   Same as omitting --jsonl
  --repo     Repository root (default: cwd, or /workspace if it has AGENTS.md)
  --force    Overwrite an existing export directory
`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { force: false, latest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--force") args.force = true;
    else if (token === "--latest") args.latest = true;
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--jsonl") args.jsonl = argv[++i];
    else if (token === "--repo") args.repo = argv[++i];
    else if (token === "--help" || token === "-h") {
      process.stdout.write(USAGE);
      process.exit(0);
    } else fail(`Unknown argument: ${token}\n${USAGE}`);
  }
  return args;
}

function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function findRepoRoot(explicit) {
  if (explicit) return path.resolve(explicit);
  const cwd = process.cwd();
  if (exists(path.join(cwd, "AGENTS.md"))) return cwd;
  if (exists("/workspace/AGENTS.md")) return "/workspace";
  return cwd;
}

function walkJsonl(dir, acc = []) {
  if (!exists(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkJsonl(full, acc);
    else if (name.endsWith(".jsonl")) acc.push({ full, mtime: stat.mtimeMs });
  }
  return acc;
}

function transcriptsCandidates() {
  const home = os.homedir();
  const list = [
    process.env.CURSOR_TRANSCRIPTS_DIR,
    "/root/.cursor/projects/workspace/agent-transcripts",
    path.join(home, ".cursor/projects/workspace/agent-transcripts"),
  ].filter(Boolean);
  const projects = path.join(home, ".cursor/projects");
  if (exists(projects)) {
    for (const name of fs.readdirSync(projects)) {
      list.push(path.join(projects, name, "agent-transcripts"));
    }
  }
  return [...new Set(list.filter((dir) => exists(dir)))];
}

function resolveJsonl(explicit) {
  if (explicit) {
    const full = path.resolve(explicit);
    if (!exists(full)) fail(`JSONL not found: ${full}`);
    return full;
  }
  const files = transcriptsCandidates().flatMap((dir) => walkJsonl(dir));
  if (files.length === 0) {
    fail("No agent transcript JSONL found. Pass --jsonl <path>.");
  }
  files.sort((a, b) => b.mtime - a.mtime);
  return files[0].full;
}

function sessionIdFromJsonl(jsonlPath) {
  const base = path.basename(jsonlPath, ".jsonl");
  if (/^[0-9a-f-]{36}$/i.test(base)) return base;
  const parent = path.basename(path.dirname(jsonlPath));
  if (/^[0-9a-f-]{36}$/i.test(parent)) return parent;
  return base;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatJstNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

const MONTHS = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function folderStampFromTimestamp(timestamp) {
  const match = timestamp?.match(
    /\w+, (\w+) (\d+), (\d+), (\d+):(\d+)\s*(AM|PM)/i,
  );
  if (!match) {
    const now = formatJstNow().replace(/[: ]/g, "-").slice(0, 16);
    return now.replace(/^(....-..-..)-(.*)$/, "$1_$2");
  }
  const [, monthName, day, year, hourRaw, minute, ampm] = match;
  let hour = Number(hourRaw);
  if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  const month = MONTHS[monthName.slice(0, 3)];
  return `${year}-${pad(month)}-${pad(day)}_${pad(hour)}-${pad(minute)}`;
}

function extractUser(text) {
  const ts = text.match(/<timestamp>([\s\S]*?)<\/timestamp>/);
  const query = text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
  let body = query ? query[1] : text;
  if (!query && ts) {
    body = text.replace(/<timestamp>[\s\S]*?<\/timestamp>\s*/, "");
  }
  return {
    timestamp: ts ? ts[1].trim() : null,
    body: body.replace(/\s+$/, "").replace(/^\s+/, ""),
  };
}

function toolJson(input) {
  return JSON.stringify(input ?? {}, null, 2);
}

function renderAssistant(content) {
  const parts = Array.isArray(content) ? content : [{ type: "text", text: String(content ?? "") }];
  const chunks = [];
  for (const part of parts) {
    if (part.type === "text" && part.text) chunks.push(part.text);
    else if (part.type === "tool_use") {
      chunks.push(`**[tool: ${part.name}]**\n\n\`\`\`json\n${toolJson(part.input)}\n\`\`\``);
    }
  }
  return chunks.join("\n\n");
}

function parseRecords(raw) {
  const records = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (parsed.type === "turn_ended") continue;
    records.push(parsed);
  }
  return records;
}

function toMarkdown({ jsonlPath, sessionId, exportedAt, records }) {
  const lines = [
    "# Cursor チャットエクスポート（生ログ）",
    "",
    "> 個人保管用のアーカイブ。プロジェクト開発の参照用ドキュメントではありません。",
    "",
    `- **セッション ID**: \`${sessionId}\``,
    `- **エクスポート日時**: ${exportedAt}`,
    `- **元ファイル**: \`${jsonlPath}\``,
    "",
    "---",
    "",
  ];

  let index = 0;
  let firstTimestamp = null;

  for (const record of records) {
    const role = record.role;
    const content = record.message?.content;
    if (role === "user") {
      const textParts = (Array.isArray(content) ? content : [{ text: content }])
        .filter((part) => part?.text)
        .map((part) => part.text)
        .join("\n");
      const { timestamp, body } = extractUser(textParts);
      if (timestamp && !firstTimestamp) firstTimestamp = timestamp;
      if (!body) continue;
      index += 1;
      lines.push(`## ${index}. ユーザー`);
      lines.push("");
      if (timestamp) {
        lines.push(`**${timestamp}**`);
        lines.push("");
      }
      lines.push(body);
      lines.push("");
      lines.push("---");
      lines.push("");
    } else if (role === "assistant") {
      const body = renderAssistant(content);
      if (!body) continue;
      index += 1;
      lines.push(`## ${index}. アシスタント`);
      lines.push("");
      lines.push(body);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return { markdown: `${lines.join("\n").replace(/\n+$/, "")}\n`, firstTimestamp };
}

function assertSlug(slug) {
  if (!slug) fail(`--slug is required.\n${USAGE}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(`--slug must be kebab-case (got ${slug})`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  assertSlug(args.slug);
  const repo = findRepoRoot(args.repo);
  const jsonlPath = resolveJsonl(args.jsonl);
  const sessionId = sessionIdFromJsonl(jsonlPath);
  const raw = fs.readFileSync(jsonlPath, "utf8");
  const records = parseRecords(raw);
  if (records.length === 0) fail(`No messages in ${jsonlPath}`);

  const exportedAt = formatJstNow();
  const { markdown, firstTimestamp } = toMarkdown({
    jsonlPath,
    sessionId,
    exportedAt,
    records,
  });
  const stamp = folderStampFromTimestamp(firstTimestamp);
  const folderName = `${stamp}-${args.slug}-session`;
  const outDir = path.join(repo, "chat-exports", folderName);
  const outFile = path.join(outDir, "transcript.md");

  if (exists(outDir) && !args.force) {
    fail(`Already exists: ${outDir}\nPass --force to overwrite.`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, markdown);
  process.stdout.write(`${outFile}\n`);
}

main();
