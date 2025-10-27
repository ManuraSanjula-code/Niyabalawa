import React from 'react';

export type UserRole = 'cashier' | 'manager' | 'admin';

interface RoleSelectorProps {
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange }) => {
    const roles: { value: UserRole; label: string; icon: string; color: string }[] = [
        { value: 'cashier', label: 'Cashier', icon: '💰', color: 'bg-blue-500 hover:bg-blue-600' },
        { value: 'manager', label: 'Manager', icon: '📊', color: 'bg-green-500 hover:bg-green-600' },
        { value: 'admin', label: 'Admin', icon: '👨‍💼', color: 'bg-purple-500 hover:bg-purple-600' }
    ];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Select Your Role</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
                Choose your role to access the appropriate features
            </p>
            <div className="grid grid-cols-3 gap-4">
                {roles.map((role) => (
                    <button
                        key={role.value}
                        onClick={() => onRoleChange(role.value)}
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
    );
};

export default RoleSelector;
