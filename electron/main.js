// Electron main process for the TravlBok desktop app.
//
// Architecture: the packaged .next/standalone Next.js server (built with
// `output: "standalone"` in next.config.ts) is spawned as a child process
// using Electron's own bundled Node runtime (ELECTRON_RUN_AS_NODE=1), so no
// separate Node.js installation is required on the target machine. Once the
// server answers /api/health, a BrowserWindow is opened against it. This
// preserves every server-side feature (Prisma, Supabase, Auth.js, server
// actions, cron routes, API routes) unchanged — Electron is only a native
// shell around the real production server.
const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");

const HOST = "127.0.0.1";
const PORT = 45123;
const APP_URL = `http://${HOST}:${PORT}`;
const HEALTH_TIMEOUT_MS = 45_000;

let serverProcess = null;
let mainWindow = null;
let quitting = false;

function getStandaloneDir() {
  // Packaged app: bundled via extraResources (see electron-builder.yml) into
  // resources/standalone. Dev/unpacked: read straight from the project's
  // own .next/standalone build output.
  return app.isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(__dirname, "..", ".next", "standalone");
}

function startServer() {
  const standaloneDir = getStandaloneDir();
  const serverEntry = path.join(standaloneDir, "server.js");

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      HOSTNAME: HOST,
    },
    windowsHide: true,
  });

  serverProcess.stdout.on("data", (chunk) => {
    process.stdout.write(`[server] ${chunk}`);
  });
  serverProcess.stderr.on("data", (chunk) => {
    process.stderr.write(`[server] ${chunk}`);
  });
  serverProcess.on("exit", (code, signal) => {
    console.log(`[server] exited (code=${code}, signal=${signal})`);
    serverProcess = null;
    // If the server dies unexpectedly while the app is still open (not
    // during an intentional quit), surface it instead of leaving a blank
    // window with no explanation.
    if (!quitting && mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox(
        "TravlBok server stopped",
        `The embedded application server exited unexpectedly (code ${code}). Please restart TravlBok.`
      );
      app.quit();
    }
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function waitForServerReady(timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(
        { host: HOST, port: PORT, path: "/api/health", timeout: 2000 },
        (res) => {
          res.resume();
          // Any HTTP response (even a 503 from a still-warming DB check)
          // means the server itself is up and listening.
          resolve();
        }
      );
      req.on("error", () => {
        if (Date.now() > deadline) {
          reject(new Error("Timed out waiting for the local server to start."));
          return;
        }
        setTimeout(attempt, 400);
      });
      req.on("timeout", () => req.destroy());
    };
    attempt();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "..", "build-assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Keep the app confined to its own local server; anything targeting an
  // external origin (e.g. an outbound partner link opened with target="_blank")
  // opens in the user's real OS browser instead of a bare Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  try {
    await waitForServerReady(HEALTH_TIMEOUT_MS);
    await mainWindow.loadURL(APP_URL);
  } catch (err) {
    console.error(err);
    dialog.showErrorBox(
      "TravlBok failed to start",
      `The local application server did not respond in time.\n\n${err.message}`
    );
    app.quit();
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    startServer();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    quitting = true;
    stopServer();
  });
}
