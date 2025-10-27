import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { existsSync } from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
let backendProcess = null;
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log("⚠️  Another instance is already running. Quitting...");
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
const startBackendServer = () => {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting backend server...");
    const isDev = process.env.VITE_DEV_SERVER_URL !== void 0;
    let backendPath;
    let nodeCommand;
    let args;
    let serverPath = "";
    if (isDev) {
      backendPath = path.join(__dirname, "..", "backend");
      nodeCommand = process.platform === "win32" ? "npm.cmd" : "npm";
      args = ["run", "dev"];
      console.log(`📂 Development mode`);
    } else {
      backendPath = path.join(process.resourcesPath, "backend");
      serverPath = path.join(backendPath, "dist", "server.js");
      const electronDir = path.dirname(process.execPath);
      nodeCommand = path.join(electronDir, "node.exe");
      if (!existsSync(nodeCommand)) {
        nodeCommand = "node";
      }
      args = [serverPath];
      console.log(`📂 Production mode`);
      console.log(`📂 Resources path: ${process.resourcesPath}`);
    }
    console.log(`📂 Backend path: ${backendPath}`);
    console.log(`🔧 Command: ${nodeCommand} ${args.join(" ")}`);
    console.log(`🔧 CWD: ${backendPath}`);
    if (!existsSync(backendPath)) {
      const error = new Error(`Backend path does not exist: ${backendPath}`);
      console.error("❌", error.message);
      reject(error);
      return;
    }
    if (!isDev && serverPath && !existsSync(serverPath)) {
      const error = new Error(`Backend server file not found: ${serverPath}`);
      console.error("❌", error.message);
      reject(error);
      return;
    }
    backendProcess = spawn(nodeCommand, args, {
      cwd: backendPath,
      env: {
        ...process.env,
        NODE_ENV: isDev ? "development" : "production",
        PORT: "3001",
        FRONTEND_URL: isDev ? "http://localhost:5173" : "http://localhost:5173"
      },
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });
    let backendStarted = false;
    if (backendProcess.stdout) {
      backendProcess.stdout.on("data", (data) => {
        const output = data.toString().trim();
        console.log(`[Backend] ${output}`);
        if (output.includes("Running") || output.includes("listening") || output.includes("PORT")) {
          backendStarted = true;
        }
      });
    }
    if (backendProcess.stderr) {
      backendProcess.stderr.on("data", (data) => {
        const error = data.toString().trim();
        console.error(`[Backend Error] ${error}`);
        if (!error.toLowerCase().includes("warn")) {
          console.error("Backend encountered an error during startup");
        }
      });
    }
    backendProcess.on("error", (error) => {
      console.error("❌ Failed to start backend:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        path: error.path
      });
      reject(error);
    });
    backendProcess.on("exit", (code, signal) => {
      console.log(`⚠️  Backend process exited with code ${code} and signal ${signal}`);
      if (code !== 0 && code !== null) {
        console.error("Backend exited with non-zero code");
      }
      backendProcess = null;
    });
    const checkInterval = setInterval(() => {
      if (backendStarted) {
        clearInterval(checkInterval);
        console.log("✅ Backend server confirmed running");
        resolve();
      }
    }, 500);
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!backendStarted) {
        console.log("⚠️  Backend startup timeout - assuming it started");
      }
      resolve();
    }, 1e4);
  });
};
const stopBackendServer = () => {
  if (backendProcess) {
    console.log("🛑 Stopping backend server...");
    backendProcess.kill();
    backendProcess = null;
  }
};
const createWindow = () => {
  const preloadPath = path.join(__dirname, "preload.js");
  console.log("🔧 Creating window with preload:", preloadPath);
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log("📡 Loading dev server:", process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    console.log("📄 Loading file:", indexPath);
    mainWindow.loadFile(indexPath);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};
app.whenReady().then(async () => {
  console.log("🎬 Electron app is ready");
  try {
    await startBackendServer();
  } catch (error) {
    console.error("Failed to start backend server:", error);
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  stopBackendServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  stopBackendServer();
});
ipcMain.handle("get-printers", async () => {
  try {
    const contents = mainWindow == null ? void 0 : mainWindow.webContents;
    if (!contents) {
      console.error("❌ No active window found");
      throw new Error("No active window");
    }
    console.log("🔍 Attempting to get printers...");
    let printers;
    try {
      printers = await contents.getPrintersAsync();
    } catch {
      console.log("getPrintersAsync not available, trying getPrinters...");
      printers = contents.getPrinters();
    }
    console.log("✅ Found printers:", printers.length);
    printers.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.displayName || p.name} ${p.isDefault ? "(Default)" : ""}`);
    });
    const result = printers.map((printer) => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description || "",
      status: printer.status || 0,
      isDefault: printer.isDefault || false,
      options: printer.options || {}
    }));
    console.log("📤 Returning", result.length, "printers to renderer");
    return result;
  } catch (error) {
    console.error("❌ Error getting printers:", error);
    return [];
  }
});
ipcMain.handle("print-to-printer", async (_event, args) => {
  try {
    const { printerName, content, type } = args;
    if (!mainWindow) {
      throw new Error("No active window");
    }
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    const html = generatePrintHTML(content, type);
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const printOptions = {
      silent: true,
      // Don't show print dialog
      printBackground: true,
      deviceName: printerName,
      margins: {
        marginType: "none"
      }
    };
    await printWindow.webContents.print(printOptions);
    setTimeout(() => {
      printWindow.close();
    }, 500);
    return { success: true, message: "Print job sent successfully" };
  } catch (error) {
    console.error("Error printing:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
});
ipcMain.handle("get-default-printer", async () => {
  try {
    const contents = mainWindow == null ? void 0 : mainWindow.webContents;
    if (!contents) {
      throw new Error("No active window");
    }
    const printers = contents.getPrinters();
    const defaultPrinter = printers.find((p) => p.isDefault);
    return defaultPrinter ? {
      name: defaultPrinter.name,
      displayName: defaultPrinter.displayName || defaultPrinter.name,
      description: defaultPrinter.description || ""
    } : null;
  } catch (error) {
    console.error("Error getting default printer:", error);
    return null;
  }
});
ipcMain.handle("test-print", async (_event, printerName) => {
  try {
    if (!mainWindow) {
      throw new Error("No active window");
    }
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    const testHTML = `
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
            <p>Printer: ${printerName}</p>
            <p>Date: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
            <p>Status: SUCCESS</p>
          </div>
        </body>
      </html>
    `;
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(testHTML)}`);
    const printOptions = {
      silent: true,
      printBackground: true,
      deviceName: printerName,
      margins: {
        marginType: "none"
      }
    };
    await printWindow.webContents.print(printOptions);
    setTimeout(() => {
      printWindow.close();
    }, 500);
    return { success: true, message: "Test print sent successfully" };
  } catch (error) {
    console.error("Error test printing:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
});
function generatePrintHTML(content, type) {
  const styles = `
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
  let header = "";
  if (type === "kitchen") {
    header = '<div class="header">KITCHEN ORDER</div>';
  } else if (type === "bill") {
    header = '<div class="header">CUSTOMER BILL</div>';
  } else if (type === "token") {
    header = '<div class="header">TOKEN NUMBER</div>';
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${styles}
      </head>
      <body>
        ${header}
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          ${(/* @__PURE__ */ new Date()).toLocaleString()}
        </div>
      </body>
    </html>
  `;
}
