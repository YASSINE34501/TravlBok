// Prepares .next/standalone for Electron packaging. Run after `next build`.
//
// Next's `output: "standalone"` build traces only the JS/node_modules files
// actually required at runtime — it deliberately does NOT copy `public/` or
// `.next/static/` alongside `server.js` (see Dockerfile at repo root for the
// same requirement in the Docker build). This script replicates that copy
// step, then bundles a runtime `.env` next to server.js so the packaged app
// works standalone with no separate configuration step.
//
// SECURITY: this bakes the repo's real `.env` (live Supabase DB credentials,
// AUTH_SECRET, etc.) into the standalone output, which electron-builder then
// packages into the installer. That's an explicit, approved choice for this
// internal-only build — see ELECTRON.md. Never publish/share the resulting
// installer outside the trusted team.
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

// Fixed local address the Electron main process binds the embedded server
// to (electron/main.js). Kept in sync here so the runtime .env's AUTH_URL /
// NEXT_PUBLIC_APP_URL match where the server actually listens.
const ELECTRON_APP_URL = "http://127.0.0.1:45123";

function fail(message) {
  console.error(`[prepare-electron] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(standaloneDir)) {
  fail('.next/standalone not found — run "npm run build:next" first.');
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[prepare-electron] skipping missing source: ${src}`);
    return;
  }
  fs.cpSync(src, dest, { recursive: true });
}

copyDir(path.join(root, "public"), path.join(standaloneDir, "public"));
copyDir(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));

const envSrcPath = path.join(root, ".env");
if (!fs.existsSync(envSrcPath)) {
  fail(".env not found at repo root — the packaged app needs it bundled (see ELECTRON.md).");
}

const envLines = fs.readFileSync(envSrcPath, "utf8").split(/\r?\n/);
const overrides = {
  AUTH_URL: ELECTRON_APP_URL,
  NEXT_PUBLIC_APP_URL: ELECTRON_APP_URL,
};
const seenKeys = new Set();

const outLines = envLines.map((line) => {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
  if (!match) return line;
  const key = match[1];
  if (key in overrides) {
    seenKeys.add(key);
    return `${key}="${overrides[key]}"`;
  }
  return line;
});

for (const [key, value] of Object.entries(overrides)) {
  if (!seenKeys.has(key)) {
    outLines.push(`${key}="${value}"`);
  }
}

outLines.push(
  "",
  "# --- overridden for the Electron desktop build by scripts/prepare-electron.js ---",
  "# AUTH_URL / NEXT_PUBLIC_APP_URL point at the embedded local server (electron/main.js)."
);

fs.writeFileSync(path.join(standaloneDir, ".env"), outLines.join("\n"));

console.log("[prepare-electron] Bundled public/, .next/static/, and a runtime .env into .next/standalone.");
console.log(`[prepare-electron] AUTH_URL / NEXT_PUBLIC_APP_URL set to ${ELECTRON_APP_URL} for the packaged app.`);
