import { useState, useEffect } from 'react';
import Cart from './components/Cart';
import EnhancedPendingOrders from './components/PendingOrders';
import EnhancedOrderHistory from './components/OrderHistory';
import AdminPanel from './components/AdminPanel';
import ProductManagement from './components/ProductManagement';
import Settings from './components/Settings';
import RoleSelector, { UserRole } from './components/RoleSelector';
import { useBilling } from './hooks/useBilling';
import { useBackgroundData } from './hooks/useBackgroundData';
import { socketService } from './services/socket';
import { menuApi, refreshApi, orderApi } from './services/api';
import { printTokenNumber, printToBackKitchen, printBill } from './utils/printerUtils';
import type { MenuItem, Order, CartItem } from './types';
import NetworkStatus from "./components/NetworkStatus";
import { useNetworkStatus } from './hooks/useNetworkStatus';
import NetworkOverlay from './components/NetworkOverlay';
import DataLoadingOverlay from './components/DataLoadingOverlay';

function App() {
    const {
        cart,
        tokenNumber,
        total,
        orderType,
        pendingOrders: localPendingOrders,
        addToCart,
        updateQuantity,
        removeFromCart,
        setOrderType,
        pagerNumber,
        setPagerNumber,
        changeRiceType,
        savePendingOrder,
        loadPendingOrder,
        loadOrderForEdit,
        updatePendingOrder,
        completePendingOrder,
        deletePendingOrder
    } = useBilling();

    // Enhanced background data management
    const {
        menuItems,
        orders,
        pendingOrders: backgroundPendingOrders,
        loading,
        progress,
        refreshAllData,
        loadMenuItemsInBackground,
        createOrder,
        updateOrder,
        deleteOrder,
        completeOrder,
        hasPendingOperations
    } = useBackgroundData();

    // Monitor network status
    const { isOnline, wasOffline } = useNetworkStatus();

    // Role-based access control
    const [currentRole, setCurrentRole] = useState<UserRole>('cashier');
    const [showRoleSelector, setShowRoleSelector] = useState(false);

    // Combine local and background pending orders
    const combinedPendingOrders = [...localPendingOrders, ...backgroundPendingOrders];

    // State management - REMOVED all tab/filter states
    const [showPendingOrders, setShowPendingOrders] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showProductManagement, setShowProductManagement] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);
    const [isEditingPending, setIsEditingPending] = useState(false);
    const [currentEditingToken, setCurrentEditingToken] = useState<string | null>(null);
    const [originalOrderItems, setOriginalOrderItems] = useState<CartItem[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add loading states for button actions
    const [isPrintingToken, setIsPrintingToken] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

    // Kitchen filter for set menu
    const [kitchenFilter, setKitchenFilter] = useState<'all' | 'front' | 'back'>('all');

    // Separate menu items by category from background data
    const mainDishes = menuItems.filter((item: MenuItem) => item.category === 'main');
    const filteredMainDishes = mainDishes.filter((item: MenuItem) => 
        kitchenFilter === 'all' || item.kitchen === kitchenFilter
    );
    const riceTypes = menuItems.filter((item: MenuItem) => item.category === 'rice');
    const addons = menuItems.filter((item: MenuItem) => item.category === 'addon');
    const desserts = menuItems.filter((item: MenuItem) =>
        item.category === 'dessert' || item.category === 'drinks'
    );

    // Enhanced clear cart function
    const clearCart = () => {
        if (cart.length > 0) {
            const confirmed = window.confirm('Are you sure you want to cancel this order and clear the cart?');
            if (confirmed) {
                cart.forEach(item => removeFromCart(item.id));
                if (isEditingPending) {
                    setIsEditingPending(false);
                    setCurrentEditingToken(null);
                    setOriginalOrderItems([]);
                }
            }
        }
    };

    // Enhanced refresh function
    const handleRefreshAllData = async () => {
        try {
            setIsRefreshing(true);
            console.log('Refreshing all data using refreshApi...');

            await refreshAllData();

            console.log('Background data refresh completed');

            // Show success notification
            showNotification('✅ Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            showNotification('✗ Failed to refresh data', 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Notification helper
    const showNotification = (message: string, type: 'success' | 'error') => {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn`;
        notification.innerHTML = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    // Initialize socket connection
    useEffect(() => {
        socketService.connect();

        return () => {
            socketService.removeAllListeners();
        };
    }, []);

    // Enhanced order handlers that work during data loading with loading protection
    const handlePrintToken = async () => {
        if (isPrintingToken || isProcessingPayment || isUpdatingOrder) return;

        try {
            setIsPrintingToken(true);
            const result = await savePendingOrder();
            if (result.order && result.savedToBackend) {
                // Notify background data system
                createOrder(result.order);

                printTokenNumber({
                    token: result.order.tokenNumber,
                    tokenNumber: result.order.tokenNumber,
                    orderType: result.order.orderType,
                    orderId: result.order.id,
                    timestamp: new Date().toISOString()
                });

                printToBackKitchen({
                    token: result.order.tokenNumber,
                    tokenNumber: result.order.tokenNumber,
                    items: result.order.items,
                    orderType: result.order.orderType,
                    timestamp: new Date().toISOString()
                });

                showNotification(`Token ${result.order.tokenNumber} printed and saved!`, 'success');
                setIsEditingPending(false);
                setCurrentEditingToken(null);
            } else {
                showNotification('✗ Failed to save order - API unavailable', 'error');
            }
        } catch (error) {
            console.error('Error printing token:', error);
            showNotification('✗ Failed to print token', 'error');
        } finally {
            setIsPrintingToken(false);
        }
    };

    const handlePayNow = async () => {
        if (isProcessingPayment || isPrintingToken || isUpdatingOrder) return;

        try {
            setIsProcessingPayment(true);
            if (isEditingPending && currentEditingToken) {
                const completionSuccess = await completePendingOrder(currentEditingToken);
                if (completionSuccess) {
                    // Notify background data system
                    const completedOrder = await orderApi.getOrderByToken(currentEditingToken);
                    completeOrder(completedOrder);

                    printBill({
                        tokenNumber: currentEditingToken,
                        items: cart,
                        total,
                        orderType,
                        timestamp: new Date().toISOString()
                    });

                    showNotification(`Payment completed for Token ${currentEditingToken}!`, 'success');
                    setIsEditingPending(false);
                    setCurrentEditingToken(null);
                } else {
                    showNotification('✗ Failed to complete payment - API unavailable', 'error');
                }
            } else {
                const result = await savePendingOrder();
                if (result.order && result.savedToBackend) {
                    // Notify background data system
                    createOrder(result.order);

                    printTokenNumber({
                        token: result.order.tokenNumber,
                        tokenNumber: result.order.tokenNumber,
                        orderType: result.order.orderType,
                        orderId: result.order.id,
                        timestamp: new Date().toISOString()
                    });

                    printToBackKitchen({
                        token: result.order.tokenNumber,
                        tokenNumber: result.order.tokenNumber,
                        items: result.order.items,
                        orderType: result.order.orderType,
                        timestamp: new Date().toISOString()
                    });

                    const completionSuccess = await completePendingOrder(result.order.tokenNumber);
                    if (completionSuccess) {
                        // Update background data
                        const completedOrder = await orderApi.getOrderByToken(result.order.tokenNumber);
                        completeOrder(completedOrder);

                        printBill({
                            tokenNumber: result.order.tokenNumber,
                            items: cart,
                            total,
                            orderType,
                            timestamp: new Date().toISOString()
                        });

                        showNotification(`Payment completed for Token ${result.order.tokenNumber}!`, 'success');
                    } else {
                        showNotification('✗ Failed to complete payment - API unavailable', 'error');
                    }
                } else {
                    showNotification('✗ Failed to save order - API unavailable', 'error');
                }
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            showNotification('✗ Failed to process payment', 'error');
        } finally {
            setIsProcessingPayment(false);
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
        loadOrderForEdit(order);
        setOriginalOrderItems([...order.items]);
        setIsEditingPending(true);
        setCurrentEditingToken(order.tokenNumber);
        setShowOrderHistory(false);
        showNotification(`Order ${order.tokenNumber} loaded for editing!`, 'success');
    };

    const handleUpdatePending = async () => {
        if (isUpdatingOrder || isPrintingToken || isProcessingPayment) return;

        try {
            setIsUpdatingOrder(true);
            if (currentEditingToken) {
                const currentCart = cart;
                const removedItems = originalOrderItems.filter(originalItem =>
                    !currentCart.some(cartItem =>
                        cartItem.id === originalItem.id &&
                        cartItem.name === originalItem.name &&
                        cartItem.quantity === originalItem.quantity &&
                        cartItem.riceType === originalItem.riceType
                    )
                );

                const addedItems = currentCart.filter(cartItem =>
                    !originalOrderItems.some(originalItem =>
                        originalItem.id === cartItem.id &&
                        originalItem.name === cartItem.name &&
                        originalItem.quantity === cartItem.quantity &&
                        originalItem.riceType === cartItem.riceType
                    )
                );

                // Check if any back kitchen items were added, removed, or modified
                const backKitchenChanges = [];

                // Check for added back kitchen items
                const addedBackKitchenItems = addedItems.filter(item => item.kitchen === 'back');
                backKitchenChanges.push(...addedBackKitchenItems);

                // Check for removed back kitchen items
                const removedBackKitchenItems = removedItems.filter(item => item.kitchen === 'back');
                backKitchenChanges.push(...removedBackKitchenItems);

                // Check for modified back kitchen items (quantity or rice type changes)
                const modifiedBackKitchenItems = currentCart.filter(cartItem => {
                    if (cartItem.kitchen !== 'back') return false;
                    const originalItem = originalOrderItems.find(orig => 
                        orig.id === cartItem.id && 
                        orig.name === cartItem.name
                    );
                    if (!originalItem) return false;
                    // Check if quantity or rice type changed
                    return originalItem.quantity !== cartItem.quantity || 
                           originalItem.riceType !== cartItem.riceType;
                });
                backKitchenChanges.push(...modifiedBackKitchenItems);

                const hasBackKitchenChanges = backKitchenChanges.length > 0;

                const updateSuccess = await updatePendingOrder(currentEditingToken);
                if (updateSuccess) {
                    const updatedOrder = await orderApi.getOrderByToken(currentEditingToken);
                    updateOrder(updatedOrder);

                    // Only print kitchen order if there are back kitchen changes
                    if (hasBackKitchenChanges) {
                        printToBackKitchen({
                            token: currentEditingToken,
                            tokenNumber: currentEditingToken,
                            items: currentCart,
                            orderType: orderType,
                            timestamp: new Date().toISOString(),
                            isEdited: true,
                            originalItems: originalOrderItems
                        });
                    }

                    let message = `Order ${currentEditingToken} has been updated!\n\n`;
                    if (removedItems.length > 0) {
                        message += '🗑️ REMOVED ITEMS:\n';
                        removedItems.forEach(item => {
                            message += `  ❌ ${item.name} x${item.quantity}\n`;
                        });
                        message += '\n';
                    }
                    if (addedItems.length > 0) {
                        message += '✨ ADDED ITEMS:\n';
                        addedItems.forEach(item => {
                        message += `  ✓ ${item.name} x${item.quantity}\n`;
                    });
                    message += '\n';
                }
                if (removedItems.length === 0 && addedItems.length === 0) {
                    message += 'No items were added or removed.\nQuantities or details may have changed.\n\n';
                }
                
                // Add printing status to message
                if (hasBackKitchenChanges) {
                    message += '🖨️ Printed updated kitchen order for back kitchen changes.\n\n';
                } else {
                    message += 'No back kitchen changes detected - no printing needed.\n\n';
                }

                    showNotification(message.trim(), 'success');
                    
                    // Clear cart and reset editing state after successful update
                    cart.forEach(item => removeFromCart(item.id));
                    setIsEditingPending(false);
                    setCurrentEditingToken(null);
                    setOriginalOrderItems([]);
                } else {
                    showNotification('⚠️ Order updated locally but not printed (API unavailable)', 'error');
                }
            }
        } catch (error) {
            console.error('Error updating order:', error);
            showNotification('✗ Failed to update order', 'error');
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const handleDeletePendingOrder = (token: string) => {
        deletePendingOrder(token);
        // Notify background data system
        deleteOrder(token);
        showNotification(`Order ${token} deleted!`, 'success');
    };

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
                        {/* Role and Status Indicators */}
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-md px-3 py-1 border border-white/30">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-100 font-medium">Role:</span>
                                    <span className="text-sm font-bold text-white capitalize">{currentRole}</span>
                                </div>
                            </div>
                            {(loading.all || hasPendingOperations) && (
                                <div className="bg-yellow-500/20 backdrop-blur-sm rounded-md px-3 py-1 border border-yellow-300/30">
                                    <div className="flex items-center gap-2">
                    <span className="text-xs text-yellow-100 font-medium">
                      {hasPendingOperations ? '🔄 Syncing...' : '📥 Loading...'}
                    </span>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => setShowRoleSelector(true)}
                                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg font-semibold text-xs border border-white/30 transition-all duration-200"
                                title="Change Role"
                                disabled={loading.all}
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
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                disabled={loading.all}
                            >
                                <span>⚙️</span>
                                <span>Settings</span>
                            </button>
                        )}

                        {/* Manager & Admin: Order History Button */}
                        {(currentRole === 'manager' || currentRole === 'admin') && (
                            <button
                                onClick={() => setShowOrderHistory(true)}
                                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                disabled={loading.all}
                            >
                                <span>📊</span>
                                <span>Order History</span>
                            </button>
                        )}

                        {/* Admin Only: Add Product Button */}
                        {currentRole === 'admin' && (
                            <button
                                onClick={() => setShowAdminPanel(true)}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                disabled={loading.all}
                            >
                                <span>➕</span>
                                <span>Add Product</span>
                            </button>
                        )}

                        {/* Admin Only: Product Management Button */}
                        {currentRole === 'admin' && (
                            <button
                                onClick={() => setShowProductManagement(true)}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                disabled={loading.all}
                            >
                                <span>✏️</span>
                                <span>Manage Products</span>
                            </button>
                        )}

                        {/* Cashier & Admin: Pending Orders Button */}
                        {(currentRole === 'cashier' || currentRole === 'admin') && (
                            <button
                                onClick={() => setShowPendingOrders(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                disabled={loading.all}
                            >
                                <span>📋</span>
                                <span>Pending Orders</span>
                                {combinedPendingOrders.length > 0 && (
                                    <span className="bg-white text-orange-600 font-bold px-2 py-0.5 rounded-full text-xs">
                    {combinedPendingOrders.length}
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
                                disabled={isRefreshing || !isOnline || loading.all}
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

            {/* Main Content with Enhanced Loading Overlay */}
            <div className="flex-1 overflow-hidden p-2 pb-0 relative">
                {/* Enhanced Data Loading Overlay */}
                <DataLoadingOverlay
                    loading={loading.all}
                    progress={Math.max(progress.menu, progress.orders, progress.pending)}
                    message={hasPendingOperations ? "Syncing order changes..." : "Loading restaurant data..."}
                />

                <div className="h-full grid grid-cols-12 gap-2">
                    {/* LEFT SECTION - Set Menu (Main Dishes) */}
                    <div className="col-span-4 flex flex-col overflow-hidden">
                        <div className="bg-white rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
                            <div className="bg-gradient-to-r from-green-600 to-green-700 px-3 py-1.5 flex-shrink-0">
                                <h2 className="text-sm font-bold text-white">SET MENU (Rice & Curry)</h2>
                                <p className="text-xs text-green-100">Complete meal with white rice</p>
                                
                                {/* Kitchen Filter Buttons */}
                                <div className="flex gap-1 mt-2">
                                    <button
                                        onClick={() => setKitchenFilter('all')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            kitchenFilter === 'all'
                                                ? 'bg-white text-green-700 shadow-sm'
                                                : 'bg-green-500 text-white hover:bg-green-400'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setKitchenFilter('front')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            kitchenFilter === 'front'
                                                ? 'bg-white text-green-700 shadow-sm'
                                                : 'bg-green-500 text-white hover:bg-green-400'
                                        }`}
                                    >
                                        🍳 Front
                                    </button>
                                    <button
                                        onClick={() => setKitchenFilter('back')}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            kitchenFilter === 'back'
                                                ? 'bg-white text-green-700 shadow-sm'
                                                : 'bg-green-500 text-white hover:bg-green-400'
                                        }`}
                                    >
                                        🔥 Back
                                    </button>
                                </div>
                                
                                {loading.menu && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-full bg-green-800 rounded-full h-1">
                                            <div
                                                className="bg-green-300 h-1 rounded-full transition-all duration-300"
                                                style={{ width: `${progress.menu}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-green-200">{progress.menu}%</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {filteredMainDishes.length === 0 && !loading.menu ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <p className="text-xl mb-2">🍽️</p>
                                            <p className="font-medium">No menu items available</p>
                                            <p className="text-sm mt-1">Check connection or refresh data</p>
                                        </div>
                                    </div>
                                ) : (
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-white border-b border-gray-300">
                                        <tr>
                                            <th className="text-left py-1 px-1.5 font-bold text-gray-700 text-xs">Main Item</th>
                                            <th className="text-center py-1 px-1 font-bold text-blue-600 w-16 text-xs">Half</th>
                                            <th className="text-center py-1 px-1 font-bold text-green-600 w-16 text-xs">Full</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredMainDishes.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                                <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">
                                                    {item.name}
                                                    <span className={`ml-2 text-xs ${item.kitchen === 'front' ? 'text-blue-600' : 'text-orange-600'}`}>
                              {item.kitchen === 'front' ? '🍳' : '🔥'}
                            </span>
                                                </td>
                                                <td className="py-1 px-1 text-center">
                                                    <button
                                                        onClick={() => addToCart(item, 'half')}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                                        disabled={loading.menu}
                                                    >
                                                        {item.halfPrice}
                                                    </button>
                                                </td>
                                                <td className="py-1 px-1 text-center">
                                                    <button
                                                        onClick={() => addToCart(item, 'full')}
                                                        className={`px-2 py-0.5 rounded text-xs font-bold w-full transition-colors ${
                                                            item.fullPrice 
                                                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                        disabled={loading.menu || !item.fullPrice}
                                                    >
                                                        {item.fullPrice || '-'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE SECTION - ALL ITEMS (Add-ons, Desserts, Drinks - NO TABS) */}
                    <div className="col-span-4 flex flex-col overflow-hidden">
                        <div className="bg-white rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
                            {/* Single Header for All Items */}
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1.5 flex-shrink-0">
                                <h2 className="text-sm font-bold text-white">ADD-ONS & EXTRAS</h2>
                                <p className="text-xs text-purple-100">Extra proteins, sides, desserts & drinks</p>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {/* Add-ons Section */}
                                <div className="border-b border-gray-200">
                                    <div className="bg-orange-50 px-3 py-1.5 border-b border-orange-200">
                                        <h3 className="text-xs font-bold text-orange-700 flex items-center gap-1">
                                            <span>🍗</span>
                                            ADD-ONS
                                        </h3>
                                        <p className="text-xs text-orange-600">Extra proteins and sides</p>
                                    </div>
                                    <div className="p-2">
                                        {addons.length === 0 && !loading.menu ? (
                                            <div className="text-center text-gray-400 py-4">
                                                <p className="text-sm">No add-ons available</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-xs">
                                                <tbody>
                                                {addons.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                                                        <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">{item.name}</td>
                                                        <td className="py-1 px-1 text-center w-20">
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                                                disabled={loading.menu}
                                                            >
                                                                +{Number(item.price) || Number(item.halfPrice) || 0}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>

                                {/* Desserts Section */}
                                <div className="border-b border-gray-200">
                                    <div className="bg-pink-50 px-3 py-1.5 border-b border-pink-200">
                                        <h3 className="text-xs font-bold text-pink-700 flex items-center gap-1">
                                            <span>🍰</span>
                                            DESSERTS
                                        </h3>
                                        <p className="text-xs text-pink-600">Sweet treats and cakes</p>
                                    </div>
                                    <div className="p-2">
                                        {desserts.filter(item => item.category === 'dessert').length === 0 && !loading.menu ? (
                                            <div className="text-center text-gray-400 py-4">
                                                <p className="text-sm">No desserts available</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-xs">
                                                <tbody>
                                                {desserts
                                                    .filter(item => item.category === 'dessert')
                                                    .map((item) => (
                                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-pink-50 transition-colors">
                                                            <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">{item.name}</td>
                                                            <td className="py-1 px-1 text-center w-20">
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="bg-pink-500 hover:bg-pink-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                                                    disabled={loading.menu}
                                                                >
                                                                    +{Number(item.price) || Number(item.halfPrice) || 0}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>

                                {/* Drinks Section */}
                                <div>
                                    <div className="bg-blue-50 px-3 py-1.5 border-b border-blue-200">
                                        <h3 className="text-xs font-bold text-blue-700 flex items-center gap-1">
                                            <span>🥤</span>
                                            DRINKS & BEVERAGES
                                        </h3>
                                        <p className="text-xs text-blue-600">Cold and hot beverages</p>
                                    </div>
                                    <div className="p-2">
                                        {desserts.filter(item => item.category === 'drinks').length === 0 && !loading.menu ? (
                                            <div className="text-center text-gray-400 py-4">
                                                <p className="text-sm">No drinks available</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-xs">
                                                <tbody>
                                                {desserts
                                                    .filter(item => item.category === 'drinks')
                                                    .map((item) => (
                                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                                            <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">{item.name}</td>
                                                            <td className="py-1 px-1 text-center w-20">
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                                                    disabled={loading.menu}
                                                                >
                                                                    +{Number(item.price) || Number(item.halfPrice) || 0}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
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
                            isLoading={loading.all || hasPendingOperations}
                            isPrintingToken={isPrintingToken}
                            isProcessingPayment={isProcessingPayment}
                            isUpdatingOrder={isUpdatingOrder}
                            pagerNumber={pagerNumber}
                            onPagerNumberChange={setPagerNumber}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
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
                                disabled={loading.menu}
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

            {/* Enhanced Modals */}
            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
            {showPendingOrders && (
                <EnhancedPendingOrders
                    pendingOrders={combinedPendingOrders}
                    onLoadOrder={handleLoadPendingOrder}
                    onDeleteOrder={handleDeletePendingOrder}
                    onClose={() => setShowPendingOrders(false)}
                    isLoading={loading.pending || loading.all}
                    hasPendingOperations={hasPendingOperations}
                />
            )}
            {showAdminPanel && (
                <AdminPanel
                    onClose={() => setShowAdminPanel(false)}
                    onProductAdded={loadMenuItemsInBackground}
                />
            )}
            {showProductManagement && (
                <ProductManagement
                    onClose={() => setShowProductManagement(false)}
                    onProductUpdated={loadMenuItemsInBackground}
                />
            )}
            {showOrderHistory && (
                <EnhancedOrderHistory
                    onClose={() => setShowOrderHistory(false)}
                    onEditOrder={handleEditOrderFromHistory}
                    isLoading={loading.orders || loading.all}
                    hasPendingOperations={hasPendingOperations}
                    onRefresh={handleRefreshAllData}
                />
            )}
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

            <NetworkOverlay isOnline={isOnline} wasOffline={wasOffline} />
        </div>
    );
}

export default App;