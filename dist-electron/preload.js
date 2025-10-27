const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 Preload script is running!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI = {
  // Printer operations
  getPrinters: () => {
    console.log('📞 Calling getPrinters from renderer...');
    return ipcRenderer.invoke('get-printers');
  },
  
  getDefaultPrinter: () => {
    console.log('📞 Calling getDefaultPrinter from renderer...');
    return ipcRenderer.invoke('get-default-printer');
  },
  
  printToPrinter: (args) => {
    console.log('📞 Calling printToPrinter from renderer...');
    return ipcRenderer.invoke('print-to-printer', args);
  },
  
  testPrint: (printerName) => {
    console.log('📞 Calling testPrint from renderer...');
    return ipcRenderer.invoke('test-print', printerName);
  },
};

console.log('🔗 Exposing electronAPI to window object...');
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
console.log('✅ electronAPI exposed successfully!');
