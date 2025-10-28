// components/PendingOrders.tsx
import React, { useState } from 'react';
import { Search, Clock, Edit, DollarSign, Trash2, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { PendingOrder } from '../types';

interface PendingOrdersProps {
    pendingOrders: PendingOrder[];
    onLoadOrder: (tokenNumber: string) => void;
    onDeleteOrder: (tokenNumber: string) => void;
    onClose: () => void;
    isLoading?: boolean;
    hasPendingOperations?: boolean;
}

const PendingOrders: React.FC<PendingOrdersProps> = ({
                                                                         pendingOrders,
                                                                         onLoadOrder,
                                                                         onDeleteOrder,
                                                                         onClose,
                                                                         isLoading = false,
                                                                         hasPendingOperations = false
                                                                     }) => {
    const [searchToken, setSearchToken] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const filteredOrders = pendingOrders.filter(order =>
        order.tokenNumber.toLowerCase().includes(searchToken.toLowerCase())
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentOrders = filteredOrders.slice(startIndex, endIndex);

    // Reset to first page when search changes
    const handleSearchChange = (value: string) => {
        setSearchToken(value);
        setCurrentPage(1);
    };

    const handleLoadOrder = (tokenNumber: string) => {
        if (!isLoading) {
            onLoadOrder(tokenNumber);
            onClose();
        }
    };

    const handleDeleteOrder = (tokenNumber: string) => {
        if (!isLoading && confirm(`Are you sure you want to delete order ${tokenNumber}? This action cannot be undone.`)) {
            onDeleteOrder(tokenNumber);
            if (currentOrders.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        }
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="text-white" size={24} />
                            <div>
                                <h2 className="text-xl font-bold text-white">Pending Orders</h2>
                                <div className="flex items-center gap-2">
                                    <p className="text-purple-100 text-sm">
                                        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
                                    </p>
                                    {(isLoading || hasPendingOperations) && (
                                        <div className="flex items-center gap-1">
                                            <Loader className="text-purple-200 animate-spin" size={14} />
                                            <span className="text-purple-200 text-xs">
                                                {hasPendingOperations ? 'Syncing...' : 'Loading...'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg px-3 py-1 transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            ✕ Close
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by token number..."
                            value={searchToken}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:opacity-50"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Pending Orders List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading && currentOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                            <Loader className="animate-spin mb-3" size={48} />
                            <p className="text-center font-medium">Loading pending orders...</p>
                            <p className="text-sm text-gray-400 mt-1">Please wait while we fetch your data</p>
                        </div>
                    ) : currentOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                            <Clock size={48} className="mb-3 opacity-50" />
                            <p className="text-center font-medium">
                                {searchToken ? 'No orders found' : 'No pending orders'}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {searchToken ? 'Try a different token number' : 'Dine-in orders will appear here'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {currentOrders.map((order) => (
                                <div
                                    key={order.tokenNumber}
                                    className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-full text-sm border border-purple-300">
                                                    {order.tokenNumber}
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                    order.orderType === 'dine-in'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {order.orderType === 'dine-in' ? '🍽️ Dine In' : '📦 Take Away'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1">Total</p>
                                            <p className="text-xl font-bold text-gray-800">Rs. {order.total.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Order Items Preview */}
                                    <div className="bg-white rounded border border-gray-200 p-2 mb-3">
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Items ({order.items.length}):</p>
                                        <div className="space-y-1 max-h-24 overflow-y-auto">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-gray-700">
                                                    <span>
                                                        {item.quantity}x {item.name}
                                                        {item.portion && <span className="text-blue-600 font-semibold ml-1">({item.portion})</span>}
                                                    </span>
                                                    <span className="font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleLoadOrder(order.tokenNumber)}
                                            disabled={isLoading}
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader className="animate-spin" size={16} /> : <Edit size={16} />}
                                            {isLoading ? 'Loading...' : 'Edit Order'}
                                        </button>
                                        <button
                                            onClick={() => handleLoadOrder(order.tokenNumber)}
                                            disabled={isLoading}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader className="animate-spin" size={16} /> : <DollarSign size={16} />}
                                            {isLoading ? 'Processing...' : 'Pay Now'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOrder(order.tokenNumber)}
                                            disabled={isLoading}
                                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Delete Order"
                                        >
                                            {isLoading ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {filteredOrders.length > 0 && totalPages > 1 && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
                                {hasPendingOperations && (
                                    <span className="ml-2 text-purple-600 text-xs">• Syncing changes...</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1 || isLoading}
                                    className={`p-2 rounded-lg transition-colors ${
                                        currentPage === 1 || isLoading
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-100'
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
                                                        ? 'bg-purple-600 text-white'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingOrders;