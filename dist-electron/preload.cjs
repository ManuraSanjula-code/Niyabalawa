"use strict";
const electron = require("electron");
console.log("🚀 Preload script is running!");
const electronAPI = {
  // Printer operations
  getPrinters: () => {
    console.log("📞 Calling getPrinters from renderer...");
    return electron.ipcRenderer.invoke("get-printers");
  },
  getDefaultPrinter: () => {
    console.log("📞 Calling getDefaultPrinter from renderer...");
    return electron.ipcRenderer.invoke("get-default-printer");
  },
  printToPrinter: (args) => {
    console.log("📞 Calling printToPrinter from renderer...");
    return electron.ipcRenderer.invoke("print-to-printer", args);
  },
  testPrint: (printerName) => {
    console.log("📞 Calling testPrint from renderer...");
    return electron.ipcRenderer.invoke("test-print", printerName);
  }
};
console.log("🔗 Exposing electronAPI to window object...");
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
console.log("✅ electronAPI exposed successfully!");
.log("📞 Calling testPrint from renderer...");
        return ipcRenderer.invoke("test-print", printerName);
      }
    };
    console.log("🔗 Exposing electronAPI to window object...");
    contextBridge.exposeInMainWorld("electronAPI", electronAPI);
    console.log("✅ electronAPI exposed successfully!");
  }
});
export default require_preload();
