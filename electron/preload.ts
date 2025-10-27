import { contextBridge, ipcRenderer } from 'electron';

console.log('🚀 Preload script is running!');

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
  options: Record<string, unknown>;
}

export interface PrintResult {
  success: boolean;
  message: string;
}

export interface PrintArgs {
  printerName: string;
  content: string;
  type: 'kitchen' | 'bill' | 'token';
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI = {
  // Printer operations
  getPrinters: (): Promise<PrinterInfo[]> => {
    console.log('📞 Calling getPrinters from renderer...');
    return ipcRenderer.invoke('get-printers');
  },
  
  getDefaultPrinter: (): Promise<PrinterInfo | null> => {
    console.log('📞 Calling getDefaultPrinter from renderer...');
    return ipcRenderer.invoke('get-default-printer');
  },
  
  printToPrinter: (args: PrintArgs): Promise<PrintResult> => {
    console.log('📞 Calling printToPrinter from renderer...');
    return ipcRenderer.invoke('print-to-printer', args);
  },
  
  testPrint: (printerName: string): Promise<PrintResult> => {
    console.log('📞 Calling testPrint from renderer...');
    return ipcRenderer.invoke('test-print', printerName);
  },
};

console.log('🔗 Exposing electronAPI to window object...');
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
console.log('✅ electronAPI exposed successfully!');

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getPrinters: () => Promise<PrinterInfo[]>;
      getDefaultPrinter: () => Promise<PrinterInfo | null>;
      printToPrinter: (args: PrintArgs) => Promise<PrintResult>;
      testPrint: (printerName: string) => Promise<PrintResult>;
    };
  }
}
