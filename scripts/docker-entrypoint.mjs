#!/usr/bin/env node
/**
 * Coolify/Docker entrypoint.
 * Content migrations run inside Next via instrumentation.ts when server.js boots.
 * This wrapper exists so the container command stays explicit and can be extended
 * (e.g. wait-for-volume) without mounting over /app.
 */
import { spawn } from "node:child_process";
import path from "node:path";

const serverJs = path.join(process.cwd(), "server.js");
const child = spawn(process.execPath, [serverJs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
