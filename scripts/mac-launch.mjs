import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);

let child;
let stopped = false;

function stop() {
  stopped = true;
  child?.kill("SIGTERM");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

function run(command, args) {
  return new Promise((resolve, reject) => {
    child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(stopped ? 0 : code ?? 1));
  });
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 5173;
      probe.close(() => resolve(port));
    });
  });
}

try {
  if (!existsSync("node_modules/vinext/dist/cli.js")) {
    console.log("初回セットアップ中です。必要な部品をダウンロードします。");
    const installStatus = await run("npm", ["run", "install:ci"]);
    if (installStatus !== 0) throw new Error("セットアップに失敗しました。");
  }

  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/`;
  console.log(`\nYouTubeリサーチツールを起動しています。\n${url}\n終了するときは Control+C を押してください。\n`);

  let exited = false;
  const server = run(process.execPath, [
    "node_modules/vinext/dist/cli.js",
    "dev",
    "--port",
    String(port),
    "--hostname",
    "127.0.0.1",
  ]).finally(() => {
    exited = true;
  });

  for (let i = 0; i < 90 && !exited && !stopped; i += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        spawn("/usr/bin/open", [url], { stdio: "ignore" });
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  process.exitCode = Number(await server);
} catch (error) {
  console.error(error instanceof Error ? error.message : "起動に失敗しました。");
  process.exitCode = 1;
}
