import React, { useState, useEffect } from 'react';
import { X, Printer, Save, RefreshCw, RotateCcw } from 'lucide-react';
import { getAvailablePrinters, testPrint } from '../utils/printerUtils';
import { tokenApi } from '../services/api';

interface SettingsProps {
    onClose: () => void;
}

interface PrinterSettings {
    backKitchenPrinter: string;
    billPrinter: string;
    tokenNumberPrinter: string;
}

interface PrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const [printers, setPrinters] = useState<PrinterInfo[]>([]);
    const [settings, setSettings] = useState<PrinterSettings>({
        backKitchenPrinter: '',
        billPrinter: '',
        tokenNumberPrinter: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [testingPrinter, setTestingPrinter] = useState<string>('');
    const [isResettingToken, setIsResettingToken] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadPrinters = async () => {
        try {
            setIsLoading(true);
            setMessage(null);
            
            console.log('🔍 Loading printers...');
            console.log('Electron API available:', !!window.electronAPI);
            
            // Get real system printers via Electron API
            const systemPrinters = await getAvailablePrinters();
            
            console.log('📥 Received printers:', systemPrinters.length);
            systemPrinters.forEach((p, index) => {
                console.log(`   ${index + 1}. ${p.displayName} ${p.isDefault ? '(Default)' : ''}`);
            });
            
            setPrinters(systemPrinters);
            
            if (systemPrinters.length === 0) {
                setMessage({ 
                    type: 'error', 
                    text: 'No printers found. Please install printers on your system.' 
                });
            } else if (!window.electronAPI) {
                setMessage({ 
                    type: 'error', 
                    text: 'Not running in Electron mode. Run "npm run dev:electron" to see real printers.' 
                });
            }
        } catch (error) {
            console.error('Error loading printers:', error);
            setMessage({ type: 'error', text: 'Failed to load printers' });
        } finally {
            setIsLoading(false);
        }
    };

    const loadSettings = () => {
        const savedSettings = localStorage.getItem('printerSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    };

    useEffect(() => {
        loadPrinters();
        loadSettings();
    }, []);

    const handleSelectChange = (field: keyof PrinterSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
        setMessage(null);
    };

    const handleTestPrint = async (printerName: string, type: string) => {
        if (!printerName) {
            setMessage({ type: 'error', text: `Please select a ${type} printer first` });
            return;
        }

        try {
            setTestingPrinter(printerName);
            const success = await testPrint(printerName);
            
            if (success) {
                setMessage({ 
                    type: 'success', 
                    text: `Test print sent to ${printerName} successfully!` 
                });
            } else {
                setMessage({ 
                    type: 'error', 
                    text: `Failed to print to ${printerName}. Check printer connection.` 
                });
            }
        } catch (error) {
            console.error('Error testing printer:', error);
            setMessage({ 
                type: 'error', 
                text: 'Error testing printer. Make sure Electron is running.' 
            });
        } finally {
            setTestingPrinter('');
        }
    };

    const handleSave = () => {
        try {
            setIsSaving(true);
            
            // Validate that at least one printer is selected
            if (!settings.backKitchenPrinter && !settings.billPrinter && !settings.tokenNumberPrinter) {
                setMessage({ type: 'error', text: 'Please select at least one printer' });
                setIsSaving(false);
                return;
            }

            // Save to localStorage
            localStorage.setItem('printerSettings', JSON.stringify(settings));
            
            setMessage({ type: 'success', text: 'Printer settings saved successfully!' });
            
            // Close modal after a short delay
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRefreshPrinters = () => {
        setMessage({ type: 'success', text: 'Refreshing printer list...' });
        loadPrinters();
    };

    const handleResetToken = async () => {
        // Confirmation dialog
        const confirmReset = window.confirm(
            '⚠️ Are you sure you want to reset the token counter?\n\n' +
            'This will prepare the system for the NEXT DAY.\n' +
            'Tomorrow\'s tokens will start from 1.\n\n' +
            'Today\'s orders will remain unchanged in the database.\n\n' +
            'Do you want to continue?'
        );

        if (!confirmReset) {
            return;
        }

        try {
            setIsResettingToken(true);
            setMessage({ type: 'success', text: 'Resetting token counter for next day...' });
            
            await tokenApi.resetTokenCounter();
            
            setMessage({ 
                type: 'success', 
                text: '✅ Token counter prepared for next day! Tomorrow\'s tokens will start from 1.' 
            });
        } catch (error) {
            console.error('Error resetting token counter:', error);
            setMessage({ 
                type: 'error', 
                text: '❌ Failed to reset token counter. Please try again.' 
            });
        } finally {
            setIsResettingToken(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Printer size={24} />
                        <div>
                            <h2 className="text-xl font-bold">Printer Settings</h2>
                            <p className="text-sm text-blue-100">Configure printers for different tasks</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading printers...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Message Display */}
                            {message && (
                                <div
                                    className={`p-4 rounded-lg ${
                                        message.type === 'success'
                                            ? 'bg-green-50 border border-green-200 text-green-800'
                                            : 'bg-red-50 border border-red-200 text-red-800'
                                    }`}
                                >
                                    <p className="font-medium">{message.text}</p>
                                </div>
                            )}

                            {/* Printer Selection Cards */}
                            <div className="space-y-4">
                                {/* Back Kitchen Token Printer */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                                            <Printer size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg">Back Kitchen Token Printer</h3>
                                            <p className="text-sm text-gray-600">Prints orders for the back kitchen staff</p>
                                        </div>
                                    </div>
                                    <select
                                        value={settings.backKitchenPrinter}
                                        onChange={(e) => handleSelectChange('backKitchenPrinter', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                    >
                                        <option value="">-- Select Printer --</option>
                                        {printers.map((printer, index) => (
                                            <option key={index} value={printer.name}>
                                                {printer.displayName} {printer.isDefault ? '(Default)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {settings.backKitchenPrinter && (
                                        <button
                                            onClick={() => handleTestPrint(settings.backKitchenPrinter, 'back kitchen')}
                                            disabled={testingPrinter === settings.backKitchenPrinter}
                                            className="mt-2 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                                        >
                                            {testingPrinter === settings.backKitchenPrinter ? 'Testing...' : 'Test Print'}
                                        </button>
                                    )}
                                </div>

                                {/* Bill Printer */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                                            <Printer size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg">Bill Printer</h3>
                                            <p className="text-sm text-gray-600">Prints customer bills and receipts</p>
                                        </div>
                                    </div>
                                    <select
                                        value={settings.billPrinter}
                                        onChange={(e) => handleSelectChange('billPrinter', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                    >
                                        <option value="">-- Select Printer --</option>
                                        {printers.map((printer, index) => (
                                            <option key={index} value={printer.name}>
                                                {printer.displayName} {printer.isDefault ? '(Default)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {settings.billPrinter && (
                                        <button
                                            onClick={() => handleTestPrint(settings.billPrinter, 'bill')}
                                            disabled={testingPrinter === settings.billPrinter}
                                            className="mt-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                        >
                                            {testingPrinter === settings.billPrinter ? 'Testing...' : 'Test Print'}
                                        </button>
                                    )}
                                </div>

                                {/* Token Number Printer */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                            <Printer size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg">Token Number Printer</h3>
                                            <p className="text-sm text-gray-600">Prints token numbers for customers</p>
                                        </div>
                                    </div>
                                    <select
                                        value={settings.tokenNumberPrinter}
                                        onChange={(e) => handleSelectChange('tokenNumberPrinter', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="">-- Select Printer --</option>
                                        {printers.map((printer, index) => (
                                            <option key={index} value={printer.name}>
                                                {printer.displayName} {printer.isDefault ? '(Default)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {settings.tokenNumberPrinter && (
                                        <button
                                            onClick={() => handleTestPrint(settings.tokenNumberPrinter, 'token')}
                                            disabled={testingPrinter === settings.tokenNumberPrinter}
                                            className="mt-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                        >
                                            {testingPrinter === settings.tokenNumberPrinter ? 'Testing...' : 'Test Print'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Refresh Printers Button */}
                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleRefreshPrinters}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                                >
                                    <RefreshCw size={16} />
                                    <span>Refresh Printer List</span>
                                </button>
                            </div>

                            {/* Reset Token Counter Button */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                                        <RotateCcw size={18} />
                                        End of Day - Prepare for Next Day
                                    </h4>
                                    <p className="text-sm text-yellow-800 mb-3">
                                        Click this at the end of the day to prepare for tomorrow. 
                                        Tomorrow's token counter will start from 1. 
                                        All today's orders remain safely in the database.
                                    </p>
                                    <button
                                        onClick={handleResetToken}
                                        disabled={isResettingToken}
                                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isResettingToken ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Preparing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <RotateCcw size={16} />
                                                <span>Prepare for Next Day</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Information</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Each printer can be used for different purposes</li>
                                    <li>• You can use the same printer for multiple tasks</li>
                                    <li>• Settings are saved locally on this device</li>
                                    <li>• Make sure printers are installed and connected</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save Settings</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
