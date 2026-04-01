import { spawn } from "node:child_process";
import process from "node:process";
import { MCP_ENV_FILE, REPO_ROOT, readEnvFile } from "./shared.js";

const envFromFile = Object.fromEntries(readEnvFile(MCP_ENV_FILE));
const env = {
  ...process.env,
  ...envFromFile,
};

const child = spawn("pnpm", ["--filter", "@hinear/mcp", "dev"], {
  cwd: REPO_ROOT,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
