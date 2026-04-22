import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const sdkPort = Number.parseInt(process.env.MINI_WASM_SDK_PORT || "", 10);
const port = Number.isFinite(sdkPort) && sdkPort > 0 ? sdkPort : 8000;

const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function miniRuntimePlugin() {
  const runtimeDir = path.resolve(process.cwd(), "runtime");

  function applyHeaders(res: any, filePath: string) {
    res.setHeader("Content-Type", mimeForRuntimeFile(filePath));
    for (const [key, value] of Object.entries(isolationHeaders)) {
      res.setHeader(key, value);
    }
  }

  function serveRuntimeFile(url: string, res: any): boolean {
    const relativePath = decodeURIComponent(url.replace(/^\/runtime\/?/, ""));
    if (!relativePath || relativePath.includes("\0")) return false;

    const filePath = path.resolve(runtimeDir, relativePath);
    if (!filePath.startsWith(`${runtimeDir}${path.sep}`) && filePath !== runtimeDir) {
      return false;
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return false;
    }

    applyHeaders(res, filePath);
    res.statusCode = 200;
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  return {
    name: "mini-runtime-static",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const url = req.url || "";
        if (!url.startsWith("/runtime/")) {
          next();
          return;
        }
        if (!serveRuntimeFile(url.split("?")[0] || url, res)) {
          next();
        }
      });
    },
    writeBundle(options: any) {
      const outDir = path.resolve(process.cwd(), options.dir || "dist");
      copyRuntimeRecursive(runtimeDir, path.join(outDir, "runtime"));
    },
  };
}

function copyRuntimeRecursive(sourceDir: string, destinationDir: string) {
  if (!fs.existsSync(sourceDir)) return;
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const destination = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      copyRuntimeRecursive(source, destination);
      continue;
    }
    fs.copyFileSync(source, destination);
  }
}

function mimeForRuntimeFile(filePath: string): string {
  if (filePath.endsWith(".js")) return "text/javascript";
  if (filePath.endsWith(".wasm")) return "application/wasm";
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".data")) return "application/octet-stream";
  if (filePath.endsWith(".br")) return "application/octet-stream";
  return "application/octet-stream";
}

export default defineConfig({
  plugins: [miniRuntimePlugin()],
  server: {
    host: "127.0.0.1",
    port,
    headers: isolationHeaders,
  },
  preview: {
    host: "127.0.0.1",
    port,
    headers: isolationHeaders,
  },
  build: {
    target: "esnext",
  },
});
