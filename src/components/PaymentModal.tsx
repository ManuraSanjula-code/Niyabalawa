import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onConfirmPayment: (amountReceived: number, change: number) => void;
    isProcessing?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    total,
    onConfirmPayment,
    isProcessing = false
}) => {
    const [amountReceived, setAmountReceived] = useState<string>('');
    const [change, setChange] = useState<number>(0);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAmountReceived('');
            setChange(0);
        }
    }, [isOpen]);

    // Calculate change when amount received changes
    useEffect(() => {
        const received = parseFloat(amountReceived) || 0;
        const calculatedChange = Math.max(0, received - total);
        setChange(calculatedChange);
    }, [amountReceived, total]);

    const handleAmountChange = (value: string) => {
        // Allow only numbers and decimal point
        const regex = /^\d*\.?\d*$/;
        if (regex.test(value) || value === '') {
            setAmountReceived(value);
        }
    };

    const handleQuickAmount = (amount: number) => {
        setAmountReceived(amount.toString());
    };

    const handleConfirm = () => {
        const received = parseFloat(amountReceived) || 0;
        if (received >= total) {
            onConfirmPayment(received, change);
        }
    };

    const isValidAmount = parseFloat(amountReceived) >= total;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calculator size={20} />
                        <h2 className="text-lg font-bold">Payment</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                        disabled={isProcessing}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Total Amount Due */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600 mb-1">Total Amount Due</div>
                        <div className="text-2xl font-bold text-gray-900">Rs. {total.toFixed(2)}</div>
                    </div>

                    {/* Amount Received Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount Received (Rs.)
                        </label>
                        <input
                            type="text"
                            value={amountReceived}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-mono"
                            placeholder="0.00"
                            disabled={isProcessing}
                            autoFocus
                        />
                    </div>

                    {/* Quick Amount Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Select
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                Math.ceil(total),
                                Math.ceil(total / 10) * 10,
                                Math.ceil(total / 100) * 100
                            ].map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => handleQuickAmount(amount)}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                    disabled={isProcessing}
                                >
                                    Rs. {amount}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Change Display */}
                    <div className={`rounded-lg p-3 ${change > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div className="text-sm text-gray-600 mb-1">Change</div>
                        <div className={`text-xl font-bold ${change > 0 ? 'text-green-700' : 'text-gray-900'}`}>
                            Rs. {change.toFixed(2)}
                        </div>
                        {change > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                                💰 Return Rs. {change.toFixed(2)} to customer
                            </div>
                        )}
                    </div>

                    {/* Insufficient Amount Warning */}
                    {!isValidAmount && amountReceived !== '' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="text-sm text-red-700">
                                ⚠️ Amount received is less than total. Please enter a valid amount.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValidAmount || isProcessing}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <Calculator size={16} />
                                Confirm Payment
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;