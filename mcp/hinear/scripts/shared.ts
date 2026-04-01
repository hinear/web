import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(scriptDirectory, "../../..");

export const MCP_ENV_FILE = path.resolve(REPO_ROOT, "mcp/hinear/.env.local");

export const ROOT_ENV_FILE = path.resolve(REPO_ROOT, ".env.local");

export function readEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return new Map<string, string>();
  }

  const content = fs.readFileSync(filePath, "utf8");
  const entries = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      if (index === -1) {
        return null;
      }

      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      return [key, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));

  return new Map(entries);
}

export function writeEnvFile(filePath: string, entries: Map<string, string>) {
  const sorted = [...entries.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const body = sorted.map(([key, value]) => `${key}=${value}`).join("\n");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${body}\n`, "utf8");
}
