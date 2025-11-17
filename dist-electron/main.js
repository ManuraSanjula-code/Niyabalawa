import { app as u, Menu as k, BrowserWindow as h, ipcMain as m } from "electron";
import g from "path";
import { fileURLToPath as S } from "url";
import { spawn as T } from "child_process";
import { existsSync as w } from "fs";
const $ = S(import.meta.url), y = g.dirname($);
let a = null, p = null;
const D = u.requestSingleInstanceLock();
D ? u.on("second-instance", () => {
  a && (a.isMinimized() && a.restore(), a.focus());
}) : (console.log("⚠️  Another instance is already running. Quitting..."), u.quit());
const R = () => new Promise((n, t) => {
  console.log("🚀 Starting backend server...");
  const s = process.env.VITE_DEV_SERVER_URL !== void 0;
  let e, i, c, d = "";
  if (s)
    e = g.join(y, "..", "backend"), i = process.platform === "win32" ? "npm.cmd" : "npm", c = ["run", "dev"], console.log("📂 Development mode");
  else {
    e = g.join(process.resourcesPath, "backend"), d = g.join(e, "dist", "server.js");
    const o = g.dirname(process.execPath);
    i = g.join(o, "node.exe"), w(i) || (i = "node"), c = [d], console.log("📂 Production mode"), console.log(`📂 Resources path: ${process.resourcesPath}`);
  }
  if (console.log(`📂 Backend path: ${e}`), console.log(`🔧 Command: ${i} ${c.join(" ")}`), console.log(`🔧 CWD: ${e}`), !w(e)) {
    const o = new Error(`Backend path does not exist: ${e}`);
    console.error("❌", o.message), t(o);
    return;
  }
  if (!s && d && !w(d)) {
    const o = new Error(`Backend server file not found: ${d}`);
    console.error("❌", o.message), t(o);
    return;
  }
  p = T(i, c, {
    cwd: e,
    env: {
      ...process.env,
      NODE_ENV: s ? "development" : "production",
      PORT: "3001",
      FRONTEND_URL: "http://localhost:5173"
    },
    stdio: ["ignore", "pipe", "pipe"],
    shell: !1
  });
  let l = !1;
  p.stdout && p.stdout.on("data", (o) => {
    const r = o.toString().trim();
    console.log(`[Backend] ${r}`), (r.includes("Running") || r.includes("listening") || r.includes("PORT")) && (l = !0);
  }), p.stderr && p.stderr.on("data", (o) => {
    const r = o.toString().trim();
    console.error(`[Backend Error] ${r}`), r.toLowerCase().includes("warn") || console.error("Backend encountered an error during startup");
  }), p.on("error", (o) => {
    console.error("❌ Failed to start backend:", o), console.error("Error details:", {
      message: o.message,
      code: o.code,
      path: o.path
    }), t(o);
  }), p.on("exit", (o, r) => {
    console.log(`⚠️  Backend process exited with code ${o} and signal ${r}`), o !== 0 && o !== null && console.error("Backend exited with non-zero code"), p = null;
  });
  const f = setInterval(() => {
    l && (clearInterval(f), console.log("✅ Backend server confirmed running"), n());
  }, 500);
  setTimeout(() => {
    clearInterval(f), l || console.log("⚠️  Backend startup timeout - assuming it started"), n();
  }, 1e4);
}), b = () => {
  p && (console.log("🛑 Stopping backend server..."), p.kill(), p = null);
}, E = () => {
  const n = g.join(y, "preload.js");
  if (console.log("🔧 Creating window with preload:", n), a = new h({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: n,
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), process.env.VITE_DEV_SERVER_URL)
    console.log("📡 Loading dev server:", process.env.VITE_DEV_SERVER_URL), a.loadURL(process.env.VITE_DEV_SERVER_URL), a.webContents.openDevTools();
  else {
    const t = g.join(y, "../dist/index.html");
    console.log("📄 Loading file:", t), a.loadFile(t);
  }
  a.on("closed", () => {
    a = null;
  });
};
u.whenReady().then(async () => {
  console.log("🎬 Electron app is ready"), k.setApplicationMenu(null);
  try {
    await R();
  } catch (n) {
    console.error("Failed to start backend server:", n);
  }
  E(), u.on("activate", () => {
    h.getAllWindows().length === 0 && E();
  });
});
u.on("window-all-closed", () => {
  b(), process.platform !== "darwin" && u.quit();
});
u.on("before-quit", () => {
  b();
});
m.handle("get-printers", async () => {
  try {
    const n = a == null ? void 0 : a.webContents;
    if (!n)
      throw console.error("❌ No active window found"), new Error("No active window");
    console.log("🔍 Attempting to get printers...");
    let t;
    try {
      t = await n.getPrintersAsync();
    } catch {
      console.log("getPrintersAsync not available, trying getPrinters..."), t = n.getPrinters();
    }
    console.log("✅ Found printers:", t.length), t.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.displayName || e.name} ${e.isDefault ? "(Default)" : ""}`);
    });
    const s = t.map((e) => ({
      name: e.name,
      displayName: e.displayName || e.name,
      description: e.description || "",
      status: e.status || 0,
      isDefault: e.isDefault || !1,
      options: e.options || {}
    }));
    return console.log("📤 Returning", s.length, "printers to renderer"), s;
  } catch (n) {
    return console.error("❌ Error getting printers:", n), [];
  }
});
m.handle("print-to-printer", async (n, t) => new Promise((s) => {
  (async () => {
    let e = null;
    try {
      const { printerName: i, content: c, type: d } = t;
      if (console.log(`🖨️ Starting print job for ${d} to printer: ${i}`), !a)
        throw new Error("No active window");
      e = new h({
        show: !1,
        webPreferences: {
          contextIsolation: !0,
          nodeIntegration: !1,
          offscreen: !0
          // Enable offscreen rendering for better compatibility
        }
      });
      let l = !1;
      e.on("close", (r) => {
        l || (console.log("⚠️ Print window close prevented - print job still in progress"), r.preventDefault());
      });
      const f = C(c, d);
      console.log(`📄 Loading HTML content (${f.length} bytes)`), await e.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(f)}`), await e.webContents.executeJavaScript("document.readyState"), console.log("📄 Document ready state checked"), await new Promise((r) => {
        e.webContents.once("did-finish-load", () => {
          console.log("✅ Page finished loading"), setTimeout(r, 1e3);
        }), setTimeout(r, 3e3);
      }), console.log("🎨 Page fully loaded and rendered, preparing to print...");
      const o = {
        silent: !0,
        // Don't show print dialog
        printBackground: !0,
        color: !1,
        // Thermal printers are usually monochrome
        deviceName: i,
        margins: {
          marginType: "none"
        },
        pageSize: {
          width: d === "token" ? 72e3 : 68e3,
          // micrometers (72mm or 68mm)
          height: 297e3
          // A4 height, will auto-trim
        },
        landscape: !1,
        scaleFactor: 100
      };
      console.log("⚙️ Print options:", o);
      try {
        console.log("📤 Sending to printer..."), console.log(`⏰ Print start time: ${(/* @__PURE__ */ new Date()).toISOString()}`), await new Promise((r, P) => {
          e.webContents.print(o, (x, v) => {
            x ? (console.log("✅ Print callback returned success"), r()) : (console.error(`❌ Print callback returned failure: ${v}`), P(new Error(v || "Print failed")));
          });
        }), console.log("✅ Print command executed successfully"), console.log(`⏰ Print end time: ${(/* @__PURE__ */ new Date()).toISOString()}`), console.log("⏳ Waiting for print spooler to process job..."), await new Promise((r) => setTimeout(r, 3e3)), l = !0, e.close(), e = null, console.log(`✅ Print job completed for ${d}`), s({ success: !0, message: "Print job sent successfully" });
      } catch (r) {
        throw console.error("❌ Print execution error:", r), r;
      }
    } catch (i) {
      if (console.error("❌ Error in print-to-printer handler:", i), e)
        try {
          e.destroy();
        } catch (c) {
          console.error("Error destroying print window:", c);
        }
      s({
        success: !1,
        message: i instanceof Error ? i.message : "Unknown printing error"
      });
    }
  })();
}));
m.handle("get-default-printer", async () => {
  try {
    const n = a == null ? void 0 : a.webContents;
    if (!n)
      throw new Error("No active window");
    const s = n.getPrinters().find((e) => e.isDefault);
    return s ? {
      name: s.name,
      displayName: s.displayName || s.name,
      description: s.description || ""
    } : null;
  } catch (n) {
    return console.error("Error getting default printer:", n), null;
  }
});
m.handle("test-print", async (n, t) => new Promise((s) => {
  (async () => {
    let e = null;
    try {
      if (console.log(`🧪 Starting test print to: ${t}`), !a)
        throw new Error("No active window");
      e = new h({
        show: !1,
        webPreferences: {
          contextIsolation: !0,
          nodeIntegration: !1,
          offscreen: !0
        }
      });
      let i = !1;
      e.on("close", (l) => {
        i || l.preventDefault();
      });
      const c = `
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
                <p>Printer: ${t}</p>
                <p>Date: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
                <p>Status: SUCCESS</p>
                <p>===========================</p>
                <p>If you can read this,</p>
                <p>printer is working!</p>
              </div>
            </body>
          </html>
        `;
      await e.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(c)}`), await e.webContents.executeJavaScript("document.readyState"), await new Promise((l) => {
        e.webContents.once("did-finish-load", () => {
          setTimeout(l, 1e3);
        }), setTimeout(l, 3e3);
      });
      const d = {
        silent: !0,
        printBackground: !0,
        color: !1,
        deviceName: t,
        margins: {
          marginType: "none"
        },
        pageSize: {
          width: 72e3,
          // 72mm
          height: 297e3
        },
        landscape: !1,
        scaleFactor: 100
      };
      console.log("📤 Sending test print..."), await new Promise((l, f) => {
        e.webContents.print(d, (o, r) => {
          o ? (console.log("✅ Test print callback returned success"), l()) : (console.error(`❌ Test print callback returned failure: ${r}`), f(new Error(r || "Test print failed")));
        });
      }), console.log("✅ Test print command sent"), console.log("⏳ Waiting for print spooler..."), await new Promise((l) => setTimeout(l, 3e3)), i = !0, e.close(), e = null, console.log("✅ Test print completed"), s({ success: !0, message: "Test print sent successfully" });
    } catch (i) {
      if (console.error("❌ Error test printing:", i), e)
        try {
          e.destroy();
        } catch (c) {
          console.error("Error destroying test print window:", c);
        }
      s({
        success: !1,
        message: i instanceof Error ? i.message : "Unknown error"
      });
    }
  })();
}));
m.handle("measure-signal", async () => {
  const n = performance.now();
  try {
    await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      cache: "no-cache",
      mode: "no-cors"
    });
  } catch (s) {
    return process.env.NODE_ENV === "development" && console.log("Signal measurement failed:", s), 10;
  }
  const t = performance.now() - n;
  return t < 50 ? 100 : t < 100 ? 80 : t < 200 ? 60 : t < 400 ? 40 : t < 800 ? 20 : 10;
});
function C(n, t) {
  const s = `
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
  let e = "";
  return t === "kitchen" ? e = '<div class="header">KITCHEN ORDER</div>' : t === "bill" ? e = '<div class="header">CUSTOMER BILL</div>' : t === "token" && (e = '<div class="header">TOKEN NUMBER</div>'), `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${s}
      </head>
      <body>
        ${e}
        <div class="content">
          ${n}
        </div>
        <div class="footer">
          ${(/* @__PURE__ */ new Date()).toLocaleString()}
        </div>
      </body>
    </html>
  `;
}
