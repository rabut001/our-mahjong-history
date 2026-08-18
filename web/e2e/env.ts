import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function applyEnvFile(path: string) {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = line.slice(0, separator);
    let value = line.slice(separator + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export const e2eEmail = () => process.env.E2E_EMAIL ?? "e2e@example.com";
export const e2ePassword = () =>
  process.env.E2E_PASSWORD ?? "password-e2e-1234";
export const e2eDisplayName = () => process.env.E2E_DISPLAY_NAME ?? "佐藤";
export const e2eCommunityName = () =>
  process.env.E2E_COMMUNITY_NAME ?? "金曜麻雀";

export function loadE2eEnv() {
  applyEnvFile(resolve(process.cwd(), ".env.local"));
  process.env.E2E_EMAIL ??= e2eEmail();
  process.env.E2E_PASSWORD ??= e2ePassword();
  process.env.E2E_DISPLAY_NAME ??= e2eDisplayName();
  process.env.E2E_COMMUNITY_NAME ??= e2eCommunityName();
}
