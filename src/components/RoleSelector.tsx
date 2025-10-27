import React, { useState } from 'react';

export type UserRole = 'cashier' | 'manager' | 'admin';

interface RoleSelectorProps {
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange }) => {
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);

    // Default admin PIN (in production, this should be configurable and stored securely)
    const ADMIN_PIN = '1234';

    const roles: { value: UserRole; label: string; icon: string; color: string }[] = [
        { value: 'cashier', label: 'Cashier', icon: '💰', color: 'bg-blue-500 hover:bg-blue-600' },
        { value: 'manager', label: 'Manager', icon: '📊', color: 'bg-green-500 hover:bg-green-600' },
        { value: 'admin', label: 'Admin', icon: '👨‍💼', color: 'bg-purple-500 hover:bg-purple-600' }
    ];

    const handleRoleClick = (role: UserRole) => {
        if (role === 'admin') {
            setShowPinDialog(true);
            setPin('');
            setPinError(false);
        } else {
            onRoleChange(role);
        }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) {
            onRoleChange('admin');
            setShowPinDialog(false);
            setPin('');
            setPinError(false);
        } else {
            setPinError(true);
            setPin('');
        }
    };

    const handlePinCancel = () => {
        setShowPinDialog(false);
        setPin('');
        setPinError(false);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Select Your Role</h2>
                <p className="text-sm text-gray-600 mb-6 text-center">
                    Choose your role to access the appropriate features
                </p>
                <div className="grid grid-cols-3 gap-4">
                    {roles.map((role) => (
                        <button
                            key={role.value}
                            onClick={() => handleRoleClick(role.value)}
                            className={`${
                                currentRole === role.value
                                    ? 'ring-4 ring-offset-2 ring-blue-400 scale-105'
                                    : 'hover:scale-105'
                            } ${role.color} text-white p-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg`}
                        >
                            <div className="text-4xl mb-2">{role.icon}</div>
                            <div className="font-bold text-lg">{role.label}</div>
                            {currentRole === role.value && (
                                <div className="mt-2 text-xs bg-white text-gray-800 rounded-full px-3 py-1">
                                    ✓ Active
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">Role Permissions:</h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                        {currentRole === 'cashier' && (
                            <>
                                <li>✓ Take orders and process payments</li>
                                <li>✓ View pending orders</li>
                                <li>✓ Print receipts and tokens</li>
                            </>
                        )}
                        {currentRole === 'manager' && (
                            <>
                                <li>✓ View order history</li>
                                <li>✓ Refresh data from server</li>
                                <li>✓ Configure printer settings</li>
                                <li>✓ Monitor all orders</li>
                            </>
                        )}
                        {currentRole === 'admin' && (
                            <>
                                <li>✓ Full system access</li>
                                <li>✓ Manage products and menu</li>
                                <li>✓ Add/Edit/Delete items</li>
                                <li>✓ All manager and cashier features</li>
                            </>
                        )}
                    </ul>
                </div>
            </div>

            {/* PIN Dialog for Admin Access */}
            {showPinDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-3">🔒</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Admin Access Required</h3>
                            <p className="text-sm text-gray-600">
                                Please enter the admin PIN to continue
                            </p>
                        </div>

                        <form onSubmit={handlePinSubmit}>
                            <div className="mb-6">
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className={`w-full px-4 py-3 text-center text-2xl tracking-widest border-2 rounded-lg focus:outline-none focus:ring-2 ${
                                        pinError
                                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                            : 'border-gray-300 focus:ring-purple-500'
                                    }`}
                                    placeholder="••••"
                                    maxLength={4}
                                    autoFocus
                                />
                                {pinError && (
                                    <p className="text-red-500 text-sm mt-2 text-center">
                                        ❌ Incorrect PIN. Please try again.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handlePinCancel}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
                                >
                                    Unlock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default RoleSelector;
