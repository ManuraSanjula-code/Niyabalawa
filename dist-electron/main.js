import { app as p, Menu as b, BrowserWindow as f, ipcMain as m } from "electron";
import d from "path";
import { fileURLToPath as x } from "url";
import { spawn as k } from "child_process";
import { existsSync as h } from "fs";
const R = x(import.meta.url), w = d.dirname(R);
let s = null, i = null;
const P = p.requestSingleInstanceLock();
P ? p.on("second-instance", () => {
  s && (s.isMinimized() && s.restore(), s.focus());
}) : (console.log("⚠️  Another instance is already running. Quitting..."), p.quit());
const D = () => new Promise((o, n) => {
  console.log("🚀 Starting backend server...");
  const e = process.env.VITE_DEV_SERVER_URL !== void 0;
  let t, a, l, g = "";
  if (e)
    t = d.join(w, "..", "backend"), a = process.platform === "win32" ? "npm.cmd" : "npm", l = ["run", "dev"], console.log("📂 Development mode");
  else {
    t = d.join(process.resourcesPath, "backend"), g = d.join(t, "dist", "server.js");
    const r = d.dirname(process.execPath);
    a = d.join(r, "node.exe"), h(a) || (a = "node"), l = [g], console.log("📂 Production mode"), console.log(`📂 Resources path: ${process.resourcesPath}`);
  }
  if (console.log(`📂 Backend path: ${t}`), console.log(`🔧 Command: ${a} ${l.join(" ")}`), console.log(`🔧 CWD: ${t}`), !h(t)) {
    const r = new Error(`Backend path does not exist: ${t}`);
    console.error("❌", r.message), n(r);
    return;
  }
  if (!e && g && !h(g)) {
    const r = new Error(`Backend server file not found: ${g}`);
    console.error("❌", r.message), n(r);
    return;
  }
  i = k(a, l, {
    cwd: t,
    env: {
      ...process.env,
      NODE_ENV: e ? "development" : "production",
      PORT: "3001",
      FRONTEND_URL: "http://localhost:5173"
    },
    stdio: ["ignore", "pipe", "pipe"],
    shell: !1
  });
  let u = !1;
  i.stdout && i.stdout.on("data", (r) => {
    const c = r.toString().trim();
    console.log(`[Backend] ${c}`), (c.includes("Running") || c.includes("listening") || c.includes("PORT")) && (u = !0);
  }), i.stderr && i.stderr.on("data", (r) => {
    const c = r.toString().trim();
    console.error(`[Backend Error] ${c}`), c.toLowerCase().includes("warn") || console.error("Backend encountered an error during startup");
  }), i.on("error", (r) => {
    console.error("❌ Failed to start backend:", r), console.error("Error details:", {
      message: r.message,
      code: r.code,
      path: r.path
    }), n(r);
  }), i.on("exit", (r, c) => {
    console.log(`⚠️  Backend process exited with code ${r} and signal ${c}`), r !== 0 && r !== null && console.error("Backend exited with non-zero code"), i = null;
  });
  const v = setInterval(() => {
    u && (clearInterval(v), console.log("✅ Backend server confirmed running"), o());
  }, 500);
  setTimeout(() => {
    clearInterval(v), u || console.log("⚠️  Backend startup timeout - assuming it started"), o();
  }, 1e4);
}), y = () => {
  i && (console.log("🛑 Stopping backend server..."), i.kill(), i = null);
}, E = () => {
  const o = d.join(w, "preload.js");
  if (console.log("🔧 Creating window with preload:", o), s = new f({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: o,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), process.env.VITE_DEV_SERVER_URL)
    console.log("📡 Loading dev server:", process.env.VITE_DEV_SERVER_URL), s.loadURL(process.env.VITE_DEV_SERVER_URL), s.webContents.openDevTools();
  else {
    const n = d.join(w, "../dist/index.html");
    console.log("📄 Loading file:", n), s.loadFile(n);
  }
  s.on("closed", () => {
    s = null;
  });
};
p.whenReady().then(async () => {
  console.log("🎬 Electron app is ready"), b.setApplicationMenu(null);
  try {
    await D();
  } catch (o) {
    console.error("Failed to start backend server:", o);
  }
  E(), p.on("activate", () => {
    f.getAllWindows().length === 0 && E();
  });
});
p.on("window-all-closed", () => {
  y(), process.platform !== "darwin" && p.quit();
});
p.on("before-quit", () => {
  y();
});
m.handle("get-printers", async () => {
  try {
    const o = s == null ? void 0 : s.webContents;
    if (!o)
      throw console.error("❌ No active window found"), new Error("No active window");
    console.log("🔍 Attempting to get printers...");
    let n;
    try {
      n = await o.getPrintersAsync();
    } catch {
      console.log("getPrintersAsync not available, trying getPrinters..."), n = o.getPrinters();
    }
    console.log("✅ Found printers:", n.length), n.forEach((t, a) => {
      console.log(`   ${a + 1}. ${t.displayName || t.name} ${t.isDefault ? "(Default)" : ""}`);
    });
    const e = n.map((t) => ({
      name: t.name,
      displayName: t.displayName || t.name,
      description: t.description || "",
      status: t.status || 0,
      isDefault: t.isDefault || !1,
      options: t.options || {}
    }));
    return console.log("📤 Returning", e.length, "printers to renderer"), e;
  } catch (o) {
    return console.error("❌ Error getting printers:", o), [];
  }
});
m.handle("print-to-printer", async (o, n) => {
  try {
    const { printerName: e, content: t, type: a } = n;
    if (!s)
      throw new Error("No active window");
    const l = new f({
      show: !1,
      webPreferences: {
        contextIsolation: !0,
        nodeIntegration: !1
      }
    }), g = T(t, a);
    await l.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(g)}`);
    const u = {
      silent: !0,
      // Don't show print dialog
      printBackground: !0,
      deviceName: e,
      margins: {
        marginType: "none"
      }
    };
    return await l.webContents.print(u), setTimeout(() => {
      l.close();
    }, 500), { success: !0, message: "Print job sent successfully" };
  } catch (e) {
    return console.error("Error printing:", e), {
      success: !1,
      message: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
m.handle("get-default-printer", async () => {
  try {
    const o = s == null ? void 0 : s.webContents;
    if (!o)
      throw new Error("No active window");
    const e = o.getPrinters().find((t) => t.isDefault);
    return e ? {
      name: e.name,
      displayName: e.displayName || e.name,
      description: e.description || ""
    } : null;
  } catch (o) {
    return console.error("Error getting default printer:", o), null;
  }
});
m.handle("test-print", async (o, n) => {
  try {
    if (!s)
      throw new Error("No active window");
    const e = new f({
      show: !1,
      webPreferences: {
        contextIsolation: !0,
        nodeIntegration: !1
      }
    }), t = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
            }
            .test-print {
              text-align: center;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              font-size: 14px;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="test-print">
            <h1>Test Print</h1>
            <p>Printer: ${n}</p>
            <p>Date: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
            <p>Status: SUCCESS</p>
          </div>
        </body>
      </html>
    `;
    await e.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(t)}`);
    const a = {
      silent: !0,
      printBackground: !0,
      deviceName: n,
      margins: {
        marginType: "none"
      }
    };
    return await e.webContents.print(a), setTimeout(() => {
      e.close();
    }, 500), { success: !0, message: "Test print sent successfully" };
  } catch (e) {
    return console.error("Error test printing:", e), {
      success: !1,
      message: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
m.handle("measure-signal", async () => {
  const o = performance.now();
  try {
    await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      cache: "no-cache",
      mode: "no-cors"
    });
  } catch (e) {
    return process.env.NODE_ENV === "development" && console.log("Signal measurement failed:", e), 10;
  }
  const n = performance.now() - o;
  return n < 50 ? 100 : n < 100 ? 80 : n < 200 ? 60 : n < 400 ? 40 : n < 800 ? 20 : 10;
});
function T(o, n) {
  const e = `
    <style>
      body {
        font-family: 'Courier New', monospace;
        margin: 0;
        padding: 10px;
        font-size: 12px;
      }
      .header {
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 10px;
        border-bottom: 2px dashed #000;
        padding-bottom: 5px;
      }
      .content {
        margin: 10px 0;
      }
      .footer {
        text-align: center;
        margin-top: 10px;
        border-top: 2px dashed #000;
        padding-top: 5px;
        font-size: 10px;
      }
      .token {
        text-align: center;
        font-size: 48px;
        font-weight: bold;
        margin: 20px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      td {
        padding: 3px 0;
      }
    </style>
  `;
  let t = "";
  return n === "kitchen" ? t = '<div class="header">KITCHEN ORDER</div>' : n === "bill" ? t = '<div class="header">CUSTOMER BILL</div>' : n === "token" && (t = '<div class="header">TOKEN NUMBER</div>'), `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${e}
      </head>
      <body>
        ${t}
        <div class="content">
          ${o}
        </div>
        <div class="footer">
          ${(/* @__PURE__ */ new Date()).toLocaleString()}
        </div>
      </body>
    </html>
  `;
}
