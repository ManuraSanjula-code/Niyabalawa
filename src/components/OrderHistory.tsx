// components/OrderHistory.tsx
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader, RefreshCw } from 'lucide-react';
import { orderApi } from '../services/api';
import type { Order, CartItem } from '../types';

interface OrderHistoryProps {
    onClose: () => void;
    onEditOrder?: (order: Order) => void;
    isLoading?: boolean;
    hasPendingOperations?: boolean;
    onRefresh?: () => void;
}

const OrderHistory = ({ onClose, onEditOrder, isLoading = false, hasPendingOperations = false, onRefresh }: OrderHistoryProps) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
    const [searchToken, setSearchToken] = useState('');
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const loadOrders = useCallback(async (showRefreshLoader = false) => {
        if (showRefreshLoader) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            // Only load today's orders for Order History using India (Asia/Kolkata) timezone
            // Use en-CA locale to get YYYY-MM-DD format from toLocaleDateString
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD in India timezone
            let todaysOrders = await orderApi.getOrdersByDate(today);

            // Apply status filter client-side if set
            if (filter !== 'all') {
                todaysOrders = todaysOrders.filter(o => o.status === filter);
            }

            setOrders(todaysOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        loadOrders();
        setCurrentPage(1);
    }, [loadOrders]);

    const handleRefresh = () => {
        if (!refreshing && onRefresh) {
            onRefresh();
        }
        loadOrders(true);
    };

    const filteredOrders = orders.filter(order =>
        searchToken === '' || order.tokenNumber.toLowerCase().includes(searchToken.toLowerCase())
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentOrders = filteredOrders.slice(startIndex, endIndex);

    const handleSearchChange = (value: string) => {
        setSearchToken(value);
        setCurrentPage(1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const toggleOrderExpanded = (orderId: string) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleEditOrder = (order: Order) => {
        if (onEditOrder && !isLoading) {
            onEditOrder(order);
            onClose();
        }
    };

    const getRemovedItems = (originalItems: CartItem[], currentItems: CartItem[]) => {
        return originalItems.filter(originalItem => {
            const found = currentItems.find(item =>
                item.id === originalItem.id &&
                item.name === originalItem.name &&
                item.quantity === originalItem.quantity &&
                item.riceType === originalItem.riceType
            );
            return !found;
        });
    };

    const getAddedItems = (originalItems: CartItem[], currentItems: CartItem[]) => {
        return currentItems.filter(currentItem => {
            const found = originalItems.find(item =>
                item.id === currentItem.id &&
                item.name === currentItem.name &&
                item.quantity === currentItem.quantity &&
                item.riceType === currentItem.riceType
            );
            return !found;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">📋 Order History</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-gray-600">
                                        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
                                    </p>
                                    {(isLoading || hasPendingOperations || refreshing) && (
                                        <div className="flex items-center gap-1">
                                            <Loader className="text-blue-600 animate-spin" size={14} />
                                            <span className="text-blue-600 text-xs">
                                                {refreshing ? 'Refreshing...' : hasPendingOperations ? 'Syncing...' : 'Loading...'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing || isLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold disabled:opacity-50"
                                disabled={isLoading}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex gap-2">
                            {(['all', 'pending', 'paid', 'cancelled'] as Array<'all' | 'pending' | 'paid' | 'cancelled'>).map((filterType) => (
                                <button
                                    key={filterType}
                                    onClick={() => setFilter(filterType)}
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize disabled:opacity-50 ${
                                        filter === filterType
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {filterType}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by token number..."
                                value={searchToken}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {(loading || refreshing) && currentOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Loader className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    {refreshing ? 'Refreshing orders...' : 'Loading orders...'}
                                </p>
                            </div>
                        </div>
                    ) : currentOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center text-gray-500">
                                <p className="text-xl mb-2">📭</p>
                                <p className="font-medium">No orders found</p>
                                <p className="text-sm mt-1">
                                    {searchToken ? 'Try a different search term' : 'Orders will appear here once created'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {currentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-xl font-bold text-gray-800">
                                                    Token: {order.tokenNumber}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                                                        order.status
                                                    )}`}
                                                >
                                                    {order.status.toUpperCase()}
                                                </span>
                                                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                                                    {order.orderType === 'dine-in' ? '🍽️ Dine In' : '🥡 Take Away'}
                                                </span>
                                                {order.isEdited && (
                                                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                                                        ✏️ EDITED
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' })}
                                                    {order.updatedAt && order.isEdited && (
                                                        <span className="ml-2 text-orange-600">
                                                            (Updated: {new Date(order.updatedAt).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' })})
                                                        </span>
                                                    )}
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col gap-2">
                                            <p className="text-2xl font-bold text-blue-600">
                                                Rs. {order.total.toFixed(2)}
                                            </p>
                                            {(order.status === 'pending' || order.status === 'paid') && onEditOrder && (
                                                <button
                                                    onClick={() => handleEditOrder(order)}
                                                    disabled={isLoading}
                                                    className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {isLoading ? <Loader className="animate-spin" size={14} /> : null}
                                                    Edit Order
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-gray-700">Items:</p>
                                            {order.isEdited && order.originalItems && (
                                                <button
                                                    onClick={() => toggleOrderExpanded(order.id || '')}
                                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    {expandedOrders.has(order.id || '') ? '▼ Hide Edit History' : '▶ Show Edit History'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Show edit history if expanded */}
                                        {order.isEdited && order.originalItems && expandedOrders.has(order.id || '') && (
                                            <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                <p className="text-xs font-semibold text-orange-800 mb-2">📝 ORIGINAL ORDER (Before Edit):</p>
                                                <div className="space-y-1">
                                                    {getRemovedItems(order.originalItems, order.items).map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-between text-sm text-red-600 line-through opacity-75"
                                                        >
                                                            <span>
                                                                ❌ {item.name}
                                                            </span>
                                                            <span>
                                                                x{item.quantity} = Rs. {((item.price + (item.ricePrice || 0)) * item.quantity).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Current items */}
                                        <div className="space-y-1">
                                            {order.items.map((item, index) => {
                                                const isNewItem = order.isEdited && order.originalItems &&
                                                    getAddedItems(order.originalItems, order.items).some(addedItem =>
                                                        addedItem.id === item.id &&
                                                        addedItem.name === item.name &&
                                                        addedItem.quantity === item.quantity &&
                                                        addedItem.riceType === item.riceType
                                                    );

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex justify-between text-sm ${
                                                            isNewItem ? 'text-green-700 font-semibold bg-green-50 p-2 rounded' : 'text-gray-600'
                                                        }`}
                                                    >
                                                        <span>
                                                            {isNewItem && '✨ NEW: '}
                                                            {item.name}
                                                        </span>
                                                        <span>
                                                            x{item.quantity} = Rs. {((item.price + (item.ricePrice || 0)) * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Pagination */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    {filteredOrders.length > 0 && totalPages > 1 ? (
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
                                {hasPendingOperations && (
                                    <span className="ml-2 text-blue-600 text-xs">• Syncing changes...</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1 || isLoading}
                                    className={`p-2 rounded-lg transition-colors ${
                                        currentPage === 1 || isLoading
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        const showPage =
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1);

                                        const showEllipsis =
                                            (page === 2 && currentPage > 3) ||
                                            (page === totalPages - 1 && currentPage < totalPages - 2);

                                        if (showEllipsis) {
                                            return <span key={page} className="px-2 text-gray-400">...</span>;
                                        }

                                        if (!showPage) {
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                disabled={isLoading}
                                                className={`min-w-[36px] px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                    currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-600 hover:bg-gray-200'
                                                } disabled:opacity-50`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages || isLoading}
                                    className={`p-2 rounded-lg transition-colors ${
                                        currentPage === totalPages || isLoading
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600 mb-3">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderHistory;