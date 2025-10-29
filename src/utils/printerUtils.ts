/**
 * Printer Settings Utility
 * Provides functions to get and manage printer settings and actual printing via Electron
 */

export interface PrinterSettings {
    backKitchenPrinter: string;
    billPrinter: string;
    tokenNumberPrinter: string;
}

export interface PrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options: Record<string, unknown>;
}

/**
 * Get list of available printers from the system (via Electron)
 */
export const getAvailablePrinters = async (): Promise<PrinterInfo[]> => {
    // Check if running in Electron
    if (window.electronAPI) {
        try {
            const printers = await window.electronAPI.getPrinters();
            console.log('✅ Detected printers from system:', printers);
            return printers;
        } catch (error) {
            console.error('Error getting printers from Electron:', error);
            return [];
        }
    }
    
    // Fallback for web/dev mode
    console.warn('⚠️ Not running in Electron mode. Run "npm run dev:electron" to see real system printers.');
    console.warn('Showing mock printer for development purposes only.');
    return [
        {
            name: 'Mock Printer (Not Real)',
            displayName: 'Mock Printer - Run in Electron mode',
            description: 'This is not a real printer. Start app with: npm run dev:electron',
            status: 0,
            isDefault: true,
            options: {}
        }
    ];
};

/**
 * Get the system default printer
 */
export const getDefaultPrinter = async (): Promise<PrinterInfo | null> => {
    if (window.electronAPI) {
        try {
            return await window.electronAPI.getDefaultPrinter();
        } catch (error) {
            console.error('Error getting default printer:', error);
            return null;
        }
    }
    return null;
};

/**
 * Get saved printer settings from localStorage
 */
export const getPrinterSettings = (): PrinterSettings => {
    const savedSettings = localStorage.getItem('printerSettings');
    if (savedSettings) {
        return JSON.parse(savedSettings);
    }
    
    // Return default empty settings if not found
    return {
        backKitchenPrinter: '',
        billPrinter: '',
        tokenNumberPrinter: ''
    };
};

/**
 * Get specific printer by type
 */
export const getPrinter = (type: 'backKitchen' | 'bill' | 'tokenNumber'): string => {
    const settings = getPrinterSettings();
    
    switch (type) {
        case 'backKitchen':
            return settings.backKitchenPrinter || 'Default Printer';
        case 'bill':
            return settings.billPrinter || 'Default Printer';
        case 'tokenNumber':
            return settings.tokenNumberPrinter || 'Default Printer';
        default:
            return 'Default Printer';
    }
};

/**
 * Save printer settings to localStorage
 */
export const savePrinterSettings = (settings: PrinterSettings): void => {
    localStorage.setItem('printerSettings', JSON.stringify(settings));
};

/**
 * Check if printer settings are configured
 */
export const isPrinterConfigured = (): boolean => {
    const settings = getPrinterSettings();
    return !!(
        settings.backKitchenPrinter ||
        settings.billPrinter ||
        settings.tokenNumberPrinter
    );
};

/**
 * Format order data for kitchen printing (72mm thermal printer)
 */
const formatKitchenOrder = (orderData: unknown): string => {
    if (!orderData || typeof orderData !== 'object') return 'No order data';
    
    const order = orderData as Record<string, unknown>;
    const tokenNum = order.token || order.tokenNumber || 'N/A';
    const orderTypeText = order.orderType || 'Dine In';
    const timestamp = new Date().toLocaleTimeString();
    const isEdited = order.isEdited as boolean;
    const originalItems = order.originalItems as unknown[] | undefined;
    
    // 72mm width - optimized for thermal printers
    let content = `<div style="width: 72mm; font-size: 12px; font-family: 'Courier New', monospace; padding: 2mm;">`;
    
    // Header
    content += `<div style="text-align: center; margin-bottom: 8px;">`;
    content += `<div style="font-size: 16px; font-weight: bold; letter-spacing: 2px;">KITCHEN ORDER</div>`;
    if (isEdited) {
        content += `<div style="font-size: 10px; margin-top: 2px; font-weight: bold;">*** ORDER EDITED ***</div>`;
    }
    content += `</div>`;
    
    content += `<div style="border-bottom: 3px double #000; margin: 5px 0;"></div>`;
    
    // Token Number - Large and centered
    content += `<div style="text-align: center; margin: 10px 0; padding: 8px; background: #000; color: #fff;">`;
    content += `<div style="font-size: 12px; margin-bottom: 3px;">TOKEN NUMBER</div>`;
    content += `<div style="font-size: 36px; font-weight: bold; letter-spacing: 3px;">${tokenNum}</div>`;
    content += `</div>`;
    
    // Order Info
    content += `<div style="margin: 8px 0;">`;
    content += `<div style="display: flex; justify-content: space-between; font-size: 11px;">`;
    content += `<span><strong>Type:</strong> ${orderTypeText}</span>`;
    content += `<span><strong>Time:</strong> ${timestamp}</span>`;
    content += `</div>`;
    content += `</div>`;
    
    content += `<div style="border-bottom: 2px solid #000; margin: 5px 0;"></div>`;
    
    // Show removed items if order was edited
    if (isEdited && originalItems && Array.isArray(originalItems)) {
        const currentItems = order.items as unknown[];
        if (Array.isArray(currentItems)) {
            const removedItems = originalItems.filter(origItem => {
                const oItem = origItem as Record<string, unknown>;
                // Only include back kitchen items
                if (oItem.kitchen !== 'back') return false;
                
                return !currentItems.some(currItem => {
                    const cItem = currItem as Record<string, unknown>;
                    return cItem.id === oItem.id && 
                           cItem.name === oItem.name &&
                           cItem.quantity === oItem.quantity &&
                           cItem.riceType === oItem.riceType;
                });
            });

            if (removedItems.length > 0) {
                content += `<div style="margin: 6px 0;">`;
                content += `<div style="font-weight: bold; margin-bottom: 3px; font-size: 12px;">REMOVED ITEMS:</div>`;
                removedItems.forEach((item: unknown) => {
                    const itemObj = item as Record<string, unknown>;
                    const quantity = Number(itemObj.quantity) || 1;
                    
                    content += `<div style="margin: 4px 0; padding: 4px; text-decoration: line-through;">`;
                    content += `<div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">`;
                    content += `<span>${itemObj.name || 'Unknown Item'}</span>`;
                    content += `<span>x${quantity}</span>`;
                    content += `</div>`;
                    if (itemObj.riceType) {
                        content += `<div style="font-size: 11px; margin-top: 2px; padding-left: 4px;">`;
                        content += `→ Rice: <strong>${itemObj.riceType}</strong>`;
                        content += `</div>`;
                    }
                    content += `</div>`;
                });
                content += `</div>`;
                content += `<div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>`;
            }
        }
    }
    
    // Items
    content += `<div style="margin: 8px 0;">`;
    content += `<div style="font-weight: bold; margin-bottom: 5px; font-size: 13px;">ITEMS:</div>`;
    
    if (order.items && Array.isArray(order.items)) {
        const currentItems = order.items as unknown[];
        
        // Filter to show ONLY back kitchen items
        const backKitchenItems = currentItems.filter(item => {
            const itemObj = item as Record<string, unknown>;
            return itemObj.kitchen === 'back';
        });
        
        const addedItems = isEdited && originalItems && Array.isArray(originalItems) 
            ? backKitchenItems.filter(currItem => {
                const cItem = currItem as Record<string, unknown>;
                return !originalItems.some(origItem => {
                    const oItem = origItem as Record<string, unknown>;
                    return oItem.id === cItem.id && 
                           oItem.name === cItem.name &&
                           oItem.quantity === cItem.quantity &&
                           oItem.riceType === cItem.riceType;
                });
            })
            : [];

        backKitchenItems.forEach((item: unknown, index: number) => {
            const itemObj = item as Record<string, unknown>;
            const quantity = Number(itemObj.quantity) || 1;
            
            const isNewItem = addedItems.some(added => {
                const aItem = added as Record<string, unknown>;
                return aItem.id === itemObj.id && 
                       aItem.name === itemObj.name &&
                       aItem.quantity === itemObj.quantity &&
                       aItem.riceType === itemObj.riceType;
            });
            
            content += `<div style="margin: 6px 0; padding: 4px; background: ${index % 2 === 0 ? '#f5f5f5' : '#fff'};">`;
            if (isNewItem) {
                content += `<div style="font-size: 10px; font-weight: bold;">✓ NEW ITEM</div>`;
            }
            content += `<div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">`;
            content += `<span>${itemObj.name || 'Unknown Item'}</span>`;
            content += `<span>x${quantity}</span>`;
            content += `</div>`;
            
            // Rice type if available
            if (itemObj.riceType) {
                content += `<div style="font-size: 11px; margin-top: 2px; padding-left: 4px;">`;
                content += `→ Rice: <strong>${itemObj.riceType}</strong>`;
                content += `</div>`;
            }
            
            // Special notes if available
            if (itemObj.notes) {
                content += `<div style="font-size: 10px; margin-top: 2px; padding-left: 4px; font-style: italic;">`;
                content += `Note: ${itemObj.notes}`;
                content += `</div>`;
            }
            
            content += `</div>`;
        });
    }
    
    content += `</div>`;
    
    // Order notes
    if (order.notes) {
        content += `<div style="border-top: 1px dashed #000; margin: 8px 0; padding-top: 5px;">`;
        content += `<div style="font-weight: bold; font-size: 11px;">ORDER NOTES:</div>`;
        content += `<div style="font-size: 11px; margin-top: 3px;">${order.notes}</div>`;
        content += `</div>`;
    }
    
    content += `<div style="border-top: 3px double #000; margin: 10px 0;"></div>`;
    
    content += `</div>`;
    
    return content;
};

/**
 * Format bill data for receipt printing (72mm thermal printer)
 */
const formatBill = (billData: unknown): string => {
    if (!billData || typeof billData !== 'object') return 'No bill data';
    
    const bill = billData as Record<string, unknown>;
    const tokenNum = bill.tokenNumber || bill.token || 'N/A';
    const orderTypeText = bill.orderType || 'Dine In';
    const timestamp = bill.timestamp ? new Date(bill.timestamp as string).toLocaleString() : new Date().toLocaleString();
    const isEdited = bill.isEdited as boolean;
    const originalItems = bill.originalItems as unknown[] | undefined;
    
    // 72mm width (~32 characters at 12pt) - optimized for thermal printers
    let content = `<div style="width: 72mm; font-size: 11px; font-family: 'Courier New', monospace; padding: 2mm;">`;
    
    // Header
    content += `<div style="text-align: center; margin-bottom: 8px;">`;
    content += `<div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">NIYABALAWA</div>`;
    content += `<div style="font-size: 13px; font-weight: bold;">RESTAURANT</div>`;
    content += `<div style="font-size: 9px; margin-top: 2px;">Customer Bill Receipt</div>`;
    if (isEdited) {
        content += `<div style="font-size: 9px; margin-top: 2px; color: #ff6600; font-weight: bold;">*** ORDER EDITED ***</div>`;
    }
    content += `</div>`;
    
    content += `<div style="border-bottom: 2px solid #000; margin: 5px 0;"></div>`;
    
    // Token Number - Large and prominent
    content += `<div style="text-align: center; margin: 8px 0; padding: 6px; border: 2px solid #000;">`;
    content += `<div style="font-size: 10px; margin-bottom: 2px;">TOKEN NUMBER</div>`;
    content += `<div style="font-size: 28px; font-weight: bold; letter-spacing: 2px;">${tokenNum}</div>`;
    content += `</div>`;
    
    // Order Info
    content += `<div style="margin: 8px 0; font-size: 10px;">`;
    content += `<div style="display: flex; justify-content: space-between;"><span><strong>Type:</strong></span><span>${orderTypeText}</span></div>`;
    content += `<div style="font-size: 9px; margin-top: 2px;">${timestamp}</div>`;
    content += `</div>`;
    
    content += `<div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>`;
    
    // Items
    let calculatedTotal = 0;
    if (bill.items && Array.isArray(bill.items)) {
        const currentItems = bill.items as unknown[];
        const addedItems = isEdited && originalItems && Array.isArray(originalItems) 
            ? currentItems.filter(currItem => {
                const cItem = currItem as Record<string, unknown>;
                return !originalItems.some(origItem => {
                    const oItem = origItem as Record<string, unknown>;
                    return oItem.id === cItem.id && 
                           oItem.name === cItem.name &&
                           oItem.quantity === cItem.quantity &&
                           oItem.riceType === cItem.riceType;
                });
            })
            : [];

        bill.items.forEach((item: unknown) => {
            const itemObj = item as Record<string, unknown>;
            const price = Number(itemObj.price) || 0;
            const quantity = Number(itemObj.quantity) || 1;
            const itemTotal = price * quantity;
            calculatedTotal += itemTotal;
            
            const isNewItem = addedItems.some(added => {
                const aItem = added as Record<string, unknown>;
                return aItem.id === itemObj.id && 
                       aItem.name === itemObj.name &&
                       aItem.quantity === itemObj.quantity &&
                       aItem.riceType === itemObj.riceType;
            });
            
            // Item name and quantity
            content += `<div style="margin: 4px 0; ${isNewItem ? 'background: #f0f0f0; padding: 3px;' : ''}">`;
            if (isNewItem) {
                content += `<div style="font-size: 8px; font-weight: bold; color: #00aa00;">✓ NEW ITEM</div>`;
            }
            content += `<div style="display: flex; justify-content: space-between;">`;
            content += `<span style="font-weight: bold;">${itemObj.name || 'Unknown'}</span>`;
            content += `<span>x${quantity}</span>`;
            content += `</div>`;
            
            // Rice type on new line if available
            if (itemObj.riceType) {
                content += `<div style="font-size: 9px; color: #666; padding-left: 4px;">Rice: ${itemObj.riceType}</div>`;
            }
            
            // Price and total
            content += `<div style="display: flex; justify-content: space-between; font-size: 10px; padding-left: 8px;">`;
            content += `<span>@ Rs. ${price.toFixed(2)}</span>`;
            content += `<span style="font-weight: bold;">Rs. ${itemTotal.toFixed(2)}</span>`;
            content += `</div>`;
            content += `</div>`;
        });
    }
    
    content += `<div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>`;
    
    // Total
    const finalTotal = bill.total ? Number(bill.total) : calculatedTotal;
    content += `<div style="margin: 8px 0;">`;
    content += `<div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">`;
    content += `<span>TOTAL:</span>`;
    content += `<span>Rs. ${finalTotal.toFixed(2)}</span>`;
    content += `</div>`;
    content += `</div>`;
    
    content += `<div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>`;
    
    // Footer
    content += `<div style="text-align: center; margin-top: 10px; font-size: 10px;">`;
    content += `<div style="font-weight: bold;">Thank You!</div>`;
    content += `<div style="margin-top: 3px;">Please Come Again</div>`;
    content += `</div>`;
    
    content += `</div>`;
    
    return content;
};

/**
 * Format token number for token printing (72mm thermal printer)
 */
const formatToken = (tokenData: unknown): string => {
    if (!tokenData || typeof tokenData !== 'object') {
        return `<div style="width: 72mm; text-align: center; padding: 2mm;"><div style="font-size: 48px; font-weight: bold;">N/A</div></div>`;
    }
    
    const token = tokenData as Record<string, unknown>;
    const tokenNumber = token.token || token.tokenNumber || 'N/A';
    const orderTypeText = token.orderType || 'Dine In';
    const timestamp = new Date().toLocaleTimeString();
    
    // 72mm width - optimized for thermal printers
    let content = `<div style="width: 72mm; font-family: 'Arial', sans-serif; padding: 3mm; text-align: center;">`;
    
    // Header
    content += `<div style="margin-bottom: 10px;">`;
    content += `<div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">NIYABALAWA</div>`;
    content += `<div style="font-size: 12px;">TOKEN NUMBER</div>`;
    content += `</div>`;
    
    content += `<div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>`;
    
    // Large Token Number
    content += `<div style="margin: 15px 0;">`;
    content += `<div style="font-size: 72px; font-weight: bold; line-height: 1; letter-spacing: 3px;">${tokenNumber}</div>`;
    content += `</div>`;
    
    content += `<div style="border-bottom: 2px solid #000; margin: 8px 0;"></div>`;
    
    // Order details
    content += `<div style="margin: 10px 0; font-size: 12px;">`;
    content += `<div style="font-weight: bold; margin-bottom: 3px;">${orderTypeText}</div>`;
    content += `<div style="font-size: 11px;">${timestamp}</div>`;
    if (token.orderId || token.id) {
        content += `<div style="font-size: 10px; margin-top: 3px; color: #666;">Order #${token.orderId || token.id}</div>`;
    }
    content += `</div>`;
    
    content += `<div style="border-top: 1px dashed #000; margin: 8px 0; padding-top: 8px;">`;
    content += `<div style="font-size: 10px;">Please wait for your order</div>`;
    content += `</div>`;
    
    content += `</div>`;
    
    return content;
};

/**
 * Print to back kitchen using Electron API
 * Only prints if there are back kitchen items
 */
export const printToBackKitchen = async (orderData: unknown): Promise<boolean> => {
    if (!orderData || typeof orderData !== 'object') {
        console.log('No order data provided to back kitchen print');
        return false;
    }
    
    const order = orderData as Record<string, unknown>;
    const items = order.items as unknown[] | undefined;
    
    // Check if there are any back kitchen items
    if (!items || !Array.isArray(items)) {
        console.log('No items in order for back kitchen');
        return false;
    }
    
    const backKitchenItems = items.filter(item => {
        const itemObj = item as Record<string, unknown>;
        return itemObj.kitchen === 'back';
    });
    
    if (backKitchenItems.length === 0) {
        console.log('No back kitchen items in order, skipping back kitchen print');
        return true; // Return true because this is not an error
    }
    
    const printer = getPrinter('backKitchen');
    console.log(`Printing ${backKitchenItems.length} back kitchen items to: ${printer}`, orderData);
    
    if (window.electronAPI) {
        try {
            const content = formatKitchenOrder(orderData);
            const result = await window.electronAPI.printToPrinter({
                printerName: printer,
                content,
                type: 'kitchen'
            });
            
            if (result.success) {
                console.log('Kitchen order printed successfully');
                return true;
            } else {
                console.error('Failed to print kitchen order:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error printing to kitchen:', error);
            return false;
        }
    } else {
        console.warn('Electron API not available, printing to console');
        return false;
    }
};

/**
 * Print bill/receipt using Electron API
 */
export const printBill = async (billData: unknown): Promise<boolean> => {
    const printer = getPrinter('bill');
    console.log(`Printing Bill to: ${printer}`, billData);
    
    if (window.electronAPI) {
        try {
            const content = formatBill(billData);
            const result = await window.electronAPI.printToPrinter({
                printerName: printer,
                content,
                type: 'bill'
            });
            
            if (result.success) {
                console.log('Bill printed successfully');
                return true;
            } else {
                console.error('Failed to print bill:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error printing bill:', error);
            return false;
        }
    } else {
        console.warn('Electron API not available, printing to console');
        return false;
    }
};

/**
 * Print token number using Electron API
 */
export const printTokenNumber = async (tokenData: unknown): Promise<boolean> => {
    const printer = getPrinter('tokenNumber');
    console.log(`Printing Token to: ${printer}`, tokenData);
    
    if (window.electronAPI) {
        try {
            const content = formatToken(tokenData);
            const result = await window.electronAPI.printToPrinter({
                printerName: printer,
                content,
                type: 'token'
            });
            
            if (result.success) {
                console.log('Token printed successfully');
                return true;
            } else {
                console.error('Failed to print token:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error printing token:', error);
            return false;
        }
    } else {
        console.warn('Electron API not available, printing to console');
        return false;
    }
};

/**
 * Test print to a specific printer
 */
export const testPrint = async (printerName: string): Promise<boolean> => {
    if (window.electronAPI) {
        try {
            const result = await window.electronAPI.testPrint(printerName);
            return result.success;
        } catch (error) {
            console.error('Error test printing:', error);
            return false;
        }
    }
    return false;
};
