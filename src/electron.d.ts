/// <reference types="vite/client" />

// Electron API types
interface ElectronAPI {
  getPrinters: () => Promise<PrinterInfo[]>;
  getDefaultPrinter: () => Promise<PrinterInfo | null>;
  printToPrinter: (args: PrintArgs) => Promise<PrintResult>;
  testPrint: (printerName: string) => Promise<PrintResult>;
}

interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
  options: Record<string, unknown>;
}

interface PrintResult {
  success: boolean;
  message: string;
}

interface PrintArgs {
  printerName: string;
  content: string;
  type: 'kitchen' | 'bill' | 'token';
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
