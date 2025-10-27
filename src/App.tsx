import { useState, useEffect } from 'react';
import Cart from './components/Cart';
import PendingOrders from './components/PendingOrders';
import AdminPanel from './components/AdminPanel';
import ProductManagement from './components/ProductManagement';
import Settings from './components/Settings';
import OrderHistory from './components/OrderHistory';
import RoleSelector, { UserRole } from './components/RoleSelector';
import { useBilling } from './hooks/useBilling';
import { socketService } from './services/socket';
import { menuApi, refreshApi } from './services/api';
import { printTokenNumber, printToBackKitchen, printBill } from './utils/printerUtils';
import type { MenuItem, Order, CartItem } from './types';
import NetworkStatus from "./components/NetworkStatus.tsx";
import { useNetworkStatus } from './hooks/useNetworkStatus';
import NetworkOverlay from './components/NetworkOverlay';

function App() {
    const {
        cart,
        tokenNumber,
        total,
        orderType,
        pendingOrders,
        addToCart,
        updateQuantity,
        removeFromCart,
        setOrderType,
        changeRiceType,
        savePendingOrder,
        loadPendingOrder,
        loadOrderForEdit,
        updatePendingOrder,
        completePendingOrder,
        deletePendingOrder
    } = useBilling();

    // Monitor network status in real-time
    const { isOnline, wasOffline } = useNetworkStatus();

    // Role-based access control
    const [currentRole, setCurrentRole] = useState<UserRole>('cashier');
    const [showRoleSelector, setShowRoleSelector] = useState(false);

    // Function to clear/cancel cart
    const clearCart = () => {
        if (cart.length > 0) {
            const confirmed = window.confirm('Are you sure you want to cancel this order and clear the cart?');
            if (confirmed) {
                // Clear all items from cart
                cart.forEach(item => removeFromCart(item.id));
                // Reset editing state if applicable
                if (isEditingPending) {
                    setIsEditingPending(false);
                    setCurrentEditingToken(null);
                    setOriginalOrderItems([]);
                }
            }
        }
    };

    const [activeTab, setActiveTab] = useState<'addons' | 'desserts'>('addons');
    const [kitchenFilter, setKitchenFilter] = useState<'all' | 'front' | 'back'>('all');
    const [showPendingOrders, setShowPendingOrders] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showProductManagement, setShowProductManagement] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);
    const [isEditingPending, setIsEditingPending] = useState(false);
    const [currentEditingToken, setCurrentEditingToken] = useState<string | null>(null);
    const [originalOrderItems, setOriginalOrderItems] = useState<CartItem[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load menu items from backend
    const [mainDishes, setMainDishes] = useState<MenuItem[]>([]);
    const [riceTypes, setRiceTypes] = useState<MenuItem[]>([]);
    const [addons, setAddons] = useState<MenuItem[]>([]);
    const [desserts, setDesserts] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load menu items from backend on component mount
    useEffect(() => {
        loadMenuItems();
    }, []);

    const loadMenuItems = async () => {
        try {
            setLoading(true);
            const allMenuItems = await menuApi.getAllMenuItems();

            // Separate items by category
            const mains = allMenuItems.filter((item: MenuItem) => item.category === 'main');
            const rice = allMenuItems.filter((item: MenuItem) => item.category === 'rice');

            // Filter by actual category from database
            const addonItems = allMenuItems.filter((item: MenuItem) => item.category === 'addon');
            const dessertItems = allMenuItems.filter((item: MenuItem) =>
                item.category === 'dessert' || item.category === 'drinks'
            );

            setMainDishes(mains);
            setRiceTypes(rice);
            setAddons(addonItems);
            setDesserts(dessertItems);
        } catch (error) {
            console.error('Error loading menu items:', error);
            // Fallback to local data if backend fails
            const { mainDishes: localMains, riceTypes: localRice, addons: localAddons } = await import('./data/menuData');
            setMainDishes(localMains);
            setRiceTypes(localRice);
            setAddons(localAddons);
            setDesserts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshAllData = async () => {
        try {
            setIsRefreshing(true);
            console.log('Refreshing all data...');

            // Use the new refresh API
            const refreshedData = await refreshApi.refreshAllData();

            // Update menu items
            const mains = refreshedData.menuItems.filter((item: MenuItem) => item.category === 'main');
            const rice = refreshedData.menuItems.filter((item: MenuItem) => item.category === 'rice');
            const addonItems = refreshedData.menuItems.filter((item: MenuItem) => item.category === 'addon');
            const dessertItems = refreshedData.menuItems.filter((item: MenuItem) =>
                item.category === 'dessert' || item.category === 'drinks'
            );

            setMainDishes(mains);
            setRiceTypes(rice);
            setAddons(addonItems);
            setDesserts(dessertItems);

            // Optionally update pending orders if you have a state for them
            // setPendingOrders(refreshedData.pendingOrders);

            console.log('Data refreshed successfully!');

            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn';
            notification.innerHTML = '✓ Data refreshed successfully!';
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);

        } catch (error) {
            console.error('Error refreshing data:', error);

            // Show error notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn';
            notification.innerHTML = '✗ Failed to refresh data';
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        } finally {
            setIsRefreshing(false);
        }
    };


    // Initialize socket connection on component mount
    useEffect(() => {
        socketService.connect();

        // Subscribe to real-time events
        socketService.onNewOrder((order) => {
            console.log('New order received:', order);
        });

        socketService.onOrderUpdate((order) => {
            console.log('Order updated:', order);
        });

        socketService.onOrderComplete((data) => {
            console.log('Order completed:', data);
        });

        return () => {
            // Clean up socket listeners on unmount
            socketService.removeAllListeners();
        };
    }, []);

    const handlePrintToken = async () => {
        const order = await savePendingOrder();
        if (order) {

            // Print token number using configured printer

            /*printTokenNumber({
                token: order.tokenNumber,
                tokenNumber: order.tokenNumber,
                orderType: order.orderType,
                orderId: order.id,
                timestamp: new Date().toISOString()
            });*/

            // Print kitchen order for back kitchen
            printToBackKitchen({
                token: order.tokenNumber,
                tokenNumber: order.tokenNumber,
                items: order.items,
                orderType: order.orderType,
                timestamp: new Date().toISOString()
            });

            alert(`Token ${order.tokenNumber} printed!\n\nThis order is saved as pending.\nCustomer can pay later using this token.\n\n✓ Token printed\n✓ Kitchen order printed`);
            setIsEditingPending(false);
            setCurrentEditingToken(null);
        }
    };

    const handlePayNow = async () => {
        if (isEditingPending && currentEditingToken) {
            await completePendingOrder(currentEditingToken);

            // Print bill using configured printer
            printBill({
                tokenNumber: currentEditingToken,
                items: cart,
                total,
                orderType,
                timestamp: new Date().toISOString()
            });

            alert(`Payment completed for Token ${currentEditingToken}!\n\nOrder has been finalized.`);
            setIsEditingPending(false);
            setCurrentEditingToken(null);
        } else {
            const order = await savePendingOrder(); // Save and get token
            if (order) {
                // Print token number for customer
                printTokenNumber({
                    token: order.tokenNumber,
                    tokenNumber: order.tokenNumber,
                    orderType: order.orderType,
                    orderId: order.id,
                    timestamp: new Date().toISOString()
                });

                // Print kitchen order for back kitchen
                printToBackKitchen({
                    token: order.tokenNumber,
                    tokenNumber: order.tokenNumber,
                    items: order.items,
                    orderType: order.orderType,
                    timestamp: new Date().toISOString()
                });

                await completePendingOrder(order.tokenNumber); // Then immediately complete it

                // Print bill using configured printer
                printBill({
                    tokenNumber: order.tokenNumber,
                    items: cart,
                    total,
                    orderType,
                    timestamp: new Date().toISOString()
                });

                alert(`Payment completed!\n\nToken: ${order.tokenNumber}\nTotal: Rs. ${total.toFixed(2)}\n\n✓ Token printed\n✓ Kitchen order printed\n✓ Bill printed`);
            }
        }
    };

    const handleLoadPendingOrder = (token: string) => {
        const order = loadPendingOrder(token);
        if (order) {
            setIsEditingPending(true);
            setCurrentEditingToken(token);
        }
    };

    const handleEditOrderFromHistory = (order: Order) => {
        // Load order into cart for editing using the new function
        loadOrderForEdit(order);

        // Store original items to track what was removed
        setOriginalOrderItems([...order.items]);

        // Set editing mode
        setIsEditingPending(true);
        setCurrentEditingToken(order.tokenNumber);

        // Close order history modal
        setShowOrderHistory(false);

        // Show notification
        alert(`Order ${order.tokenNumber} loaded for editing!\n\nCurrent items have been loaded into the cart.\nYou can now add or remove items.\nClick "Update Order" when done.`);
    };

    const handleUpdatePending = async () => {
        if (currentEditingToken) {
            // Find removed items
            const currentCart = cart;
            const removedItems = originalOrderItems.filter(originalItem =>
                !currentCart.some(cartItem =>
                    cartItem.id === originalItem.id &&
                    cartItem.name === originalItem.name &&
                    cartItem.quantity === originalItem.quantity &&
                    cartItem.riceType === originalItem.riceType
                )
            );

            // Find added items
            const addedItems = currentCart.filter(cartItem =>
                !originalOrderItems.some(originalItem =>
                    originalItem.id === cartItem.id &&
                    originalItem.name === cartItem.name &&
                    originalItem.quantity === cartItem.quantity &&
                    originalItem.riceType === cartItem.riceType
                )
            );

            await updatePendingOrder(currentEditingToken);

            // Print updated token number
            printTokenNumber({
                token: currentEditingToken,
                tokenNumber: currentEditingToken,
                orderType: orderType,
                timestamp: new Date().toISOString()
            });

            // Print updated kitchen order
            printToBackKitchen({
                token: currentEditingToken,
                tokenNumber: currentEditingToken,
                items: currentCart,
                orderType: orderType,
                timestamp: new Date().toISOString(),
                isEdited: true,
                originalItems: originalOrderItems
            });

            // Print updated bill with edit history
            printBill({
                tokenNumber: currentEditingToken,
                items: currentCart,
                total,
                orderType,
                timestamp: new Date().toISOString(),
                isEdited: true,
                originalItems: originalOrderItems
            });

            // Build detailed update message
            let message = `Order ${currentEditingToken} has been updated!\n\n`;

            if (removedItems.length > 0) {
                message += '🗑️ REMOVED ITEMS:\n';
                removedItems.forEach(item => {
                    message += `  ❌ ${item.name}${item.riceType ? ` (${item.riceType})` : ''} x${item.quantity}\n`;
                });
                message += '\n';
            }

            if (addedItems.length > 0) {
                message += '✨ ADDED ITEMS:\n';
                addedItems.forEach(item => {
                    message += `  ✓ ${item.name}${item.riceType ? ` (${item.riceType})` : ''} x${item.quantity}\n`;
                });
                message += '\n';
            }

            if (removedItems.length === 0 && addedItems.length === 0) {
                message += 'No items were added or removed.\nQuantities or details may have changed.\n\n';
            }

            message += '📄 Printing:\n';
            message += '  ✓ Updated Token\n';
            message += '  ✓ Updated Kitchen Order\n';
            message += '  ✓ Updated Bill with Edit History';

            alert(message);

            // Reset editing state and clear cart
            setIsEditingPending(false);
            setCurrentEditingToken(null);
            setOriginalOrderItems([]);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading menu items...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md px-3 py-1 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-sm font-bold text-white">Niyabalawa Restaurant</h1>
                            <p className="text-blue-100 text-xs">Set Menu Order System</p>
                        </div>
                        {/* Role Indicator and Selector */}
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-md px-3 py-1 border border-white/30">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-100 font-medium">Role:</span>
                                    <span className="text-sm font-bold text-white capitalize">{currentRole}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowRoleSelector(true)}
                                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg font-semibold text-xs border border-white/30 transition-all duration-200"
                                title="Change Role"
                            >
                                🔄 Switch Role
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Manager & Admin: Settings Button */}
                        {(currentRole === 'manager' || currentRole === 'admin') && (
                            <button
                                onClick={() => setShowSettings(true)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <span>⚙️</span>
                                <span>Settings</span>
                            </button>
                        )}

                        {/* Manager & Admin: Order History Button */}
                        {(currentRole === 'manager' || currentRole === 'admin') && (
                            <button
                                onClick={() => setShowOrderHistory(true)}
                                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <span>📊</span>
                                <span>Order History</span>
                            </button>
                        )}

                        {/* Admin Only: Add Product Button */}
                        {currentRole === 'admin' && (
                            <button
                                onClick={() => setShowAdminPanel(true)}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <span>➕</span>
                                <span>Add Product</span>
                            </button>
                        )}

                        {/* Admin Only: Product Management Button */}
                        {currentRole === 'admin' && (
                            <button
                                onClick={() => setShowProductManagement(true)}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <span>✏️</span>
                                <span>Manage Products</span>
                            </button>
                        )}

                        {/* Cashier & Admin: Pending Orders Button */}
                        {(currentRole === 'cashier' || currentRole === 'admin') && (
                            <button
                                onClick={() => setShowPendingOrders(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <span>📋</span>
                                <span>Pending Orders</span>
                                {pendingOrders.length > 0 && (
                                    <span className="bg-white text-orange-600 font-bold px-2 py-0.5 rounded-full text-xs">
                  {pendingOrders.length}
                </span>
                                )}
                            </button>
                        )}

                        {/* Token Display - All Roles */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-md px-3 py-1 border border-white/30">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-100 font-medium">Token:</span>
                                <span className="text-xl font-bold text-white">{tokenNumber}</span>
                            </div>
                        </div>
                        
                        {/* Manager & Admin: Refresh Button */}
                        {(currentRole === 'manager' || currentRole === 'admin') && (
                            <button
                                onClick={handleRefreshAllData}
                                disabled={isRefreshing || !isOnline}
                                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold text-sm shadow-md transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Refresh all data from server"
                            >
                                <svg
                                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                        )}

                        <NetworkStatus />
                    </div>
                </div>
            </header>

            {/* Main Content - 3 Column Layout */}
            <div className="flex-1 overflow-hidden p-2 pb-0">
                <div className="h-full grid grid-cols-12 gap-2">
                    {/* LEFT SECTION - Set Menu (Main Dishes with Rice) */}
                    <div className="col-span-4 flex flex-col overflow-hidden">
                        <div className="bg-white rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
                            <div className="bg-gradient-to-r from-green-600 to-green-700 px-3 py-1.5 flex-shrink-0">
                                <h2 className="text-sm font-bold text-white">SET MENU (Rice & Curry)</h2>
                                <p className="text-xs text-green-100">Complete meal with white rice</p>
                            </div>

                            {/* Kitchen Filter */}
                            <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200">
                                <button
                                    onClick={() => setKitchenFilter('all')}
                                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded transition-all ${
                                        kitchenFilter === 'all'
                                            ? 'bg-green-600 text-white shadow'
                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setKitchenFilter('front')}
                                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded transition-all ${
                                        kitchenFilter === 'front'
                                            ? 'bg-blue-600 text-white shadow'
                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    🍳 Front
                                </button>
                                <button
                                    onClick={() => setKitchenFilter('back')}
                                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded transition-all ${
                                        kitchenFilter === 'back'
                                            ? 'bg-orange-600 text-white shadow'
                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    🔥 Back
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-white border-b border-gray-300">
                                    <tr>
                                        <th className="text-left py-1 px-1.5 font-bold text-gray-700 text-xs">Main Item</th>
                                        <th className="text-center py-1 px-1 font-bold text-blue-600 w-16 text-xs">Half</th>
                                        <th className="text-center py-1 px-1 font-bold text-green-600 w-16 text-xs">Full</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {mainDishes
                                        .filter(item => kitchenFilter === 'all' || item.kitchen === kitchenFilter)
                                        .map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                            <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">
                                                {item.name}
                                                {kitchenFilter === 'all' && (
                                                    <span className={`ml-1 text-xs ${item.kitchen === 'front' ? 'text-blue-600' : 'text-orange-600'}`}>
                                                        {item.kitchen === 'front' ? '🍳' : '🔥'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-1 px-1 text-center">
                                                <button
                                                    onClick={() => addToCart(item, 'half')}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                                >
                                                    {item.halfPrice}
                                                </button>
                                            </td>
                                            <td className="py-1 px-1 text-center">
                                                <button
                                                    onClick={() => addToCart(item, 'full')}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                                >
                                                    {item.fullPrice}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE SECTION - Add-ons & Desserts/Drinks with Tabs */}
                    <div className="col-span-4 flex flex-col overflow-hidden">
                        <div className="bg-white rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
                            {/* Tab Headers - Like Book Pages */}
                            <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
                                <button
                                    onClick={() => setActiveTab('addons')}
                                    className={`flex-1 py-2 px-3 font-bold text-xs transition-all duration-200 relative ${
                                        activeTab === 'addons'
                                            ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    style={{
                                        clipPath: activeTab === 'addons' ? 'none' : 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)',
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span>🍗</span>
                                        <span>ADD-ONS</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('desserts')}
                                    className={`flex-1 py-2 px-3 font-bold text-xs transition-all duration-200 relative ${
                                        activeTab === 'desserts'
                                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    style={{
                                        clipPath: activeTab === 'desserts' ? 'none' : 'polygon(5% 0, 100% 0, 100% 100%, 0% 100%)',
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span>🍰</span>
                                        <span>DESSERT / DRINKS</span>
                                    </div>
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-hidden">
                                {/* Add-ons Tab */}
                                {activeTab === 'addons' && (
                                    <div className="h-full flex flex-col animate-fadeIn">
                                        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-3 py-1 flex-shrink-0">
                                            <p className="text-xs text-orange-100">Extra proteins, sides & add-ons to enhance your meal</p>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-2">
                                            <table className="w-full text-xs">
                                                <thead className="sticky top-0 bg-white border-b border-gray-300 z-10">
                                                <tr>
                                                    <th className="text-left py-1 px-1.5 font-bold text-gray-700 text-xs">Item</th>
                                                    <th className="text-center py-1 px-1 font-bold text-orange-600 w-20 text-xs">Price</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {addons.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                                                        <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">{item.name}</td>
                                                        <td className="py-1 px-1 text-center">
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                                            >
                                                                +{Number(item.price) || Number(item.halfPrice) || 0}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Desserts/Drinks Tab */}
                                {activeTab === 'desserts' && (
                                    <div className="h-full flex flex-col animate-fadeIn">
                                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1 flex-shrink-0">
                                            <p className="text-xs text-purple-100">Sweet treats and refreshing beverages</p>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-2">
                                            {desserts.length > 0 ? (
                                                <table className="w-full text-xs">
                                                    <thead className="sticky top-0 bg-white border-b border-gray-300 z-10">
                                                    <tr>
                                                        <th className="text-left py-1 px-1.5 font-bold text-gray-700 text-xs">Item</th>
                                                        <th className="text-center py-1 px-1 font-bold text-purple-600 w-20 text-xs">Price</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {desserts.map((item) => (
                                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                                                            <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">{item.name}</td>
                                                            <td className="py-1 px-1 text-center">
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                                                >
                                                                    +{Number(item.price) || Number(item.halfPrice) || 0}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="text-center py-8 px-4">
                                                        <div className="text-4xl mb-3">🍰🥤</div>
                                                        <p className="text-sm font-semibold text-gray-600 mb-1">No desserts or drinks yet</p>
                                                        <p className="text-xs text-gray-500">Use "Add Product" to add desserts and drinks</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SECTION - Order Summary / Token / Products */}
                    <div className="col-span-4 flex flex-col overflow-hidden">
                        <Cart
                            items={cart}
                            onUpdateQuantity={updateQuantity}
                            onRemoveItem={removeFromCart}
                            total={total}
                            orderType={orderType}
                            onOrderTypeChange={setOrderType}
                            onPrintToken={handlePrintToken}
                            onPayNow={handlePayNow}
                            tokenNumber={currentEditingToken || undefined}
                            isEditingPending={isEditingPending}
                            onUpdatePending={handleUpdatePending}
                            riceTypes={riceTypes}
                            onChangeRiceType={changeRiceType}
                            onCancel={clearCart}
                        />
                    </div>
                </div>
            </div>

            {/* BOTTOM - Rice Type Selector (Changes Base Rice) */}
            <footer className="bg-white border-t-2 border-gray-300 shadow-2xl px-3 py-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                        <div className="text-xs font-semibold text-gray-600 uppercase">Change Rice:</div>
                        <div className="text-xs text-gray-500 italic">(Default: White)</div>
                    </div>
                    <div className="flex gap-2 flex-1 overflow-x-auto">
                        {riceTypes.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="group bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg px-4 py-1.5 shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
                            >
                                <div className="text-center">
                                    <div className="font-bold text-xs">{item.name}</div>
                                    <div className="text-xs opacity-90">+{item.halfPrice}/=</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Settings Modal */}
            {showSettings && (
                <Settings
                    onClose={() => setShowSettings(false)}
                />
            )}

            {/* Pending Orders Modal */}
            {showPendingOrders && (
                <PendingOrders
                    pendingOrders={pendingOrders}
                    onLoadOrder={handleLoadPendingOrder}
                    onDeleteOrder={deletePendingOrder}
                    onClose={() => setShowPendingOrders(false)}
                />
            )}

            {/* Admin Panel Modal */}
            {showAdminPanel && (
                <AdminPanel
                    onClose={() => setShowAdminPanel(false)}
                    onProductAdded={loadMenuItems}
                />
            )}

            {/* Product Management Modal */}
            {showProductManagement && (
                <ProductManagement
                    onClose={() => setShowProductManagement(false)}
                    onProductUpdated={loadMenuItems}
                />
            )}

            {/* Order History Modal */}
            {showOrderHistory && (
                <OrderHistory
                    onClose={() => setShowOrderHistory(false)}
                    onEditOrder={handleEditOrderFromHistory}
                />
            )}

            {/* Role Selector Modal */}
            {showRoleSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowRoleSelector(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowRoleSelector(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="p-6">
                            <RoleSelector
                                currentRole={currentRole}
                                onRoleChange={(role) => {
                                    setCurrentRole(role);
                                    setShowRoleSelector(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Network Status Overlay - Freezes UI when offline */}
            <NetworkOverlay isOnline={isOnline} wasOffline={wasOffline} />
        </div>
    );
}

export default App;