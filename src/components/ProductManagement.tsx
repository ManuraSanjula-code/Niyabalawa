import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Save, Search } from 'lucide-react';
import { menuApi } from '../services/api';
import type { MenuItem } from '../types';

interface ProductManagementProps {
    onClose: () => void;
    onProductUpdated: () => void;
}

type CategoryFilter = 'all' | 'main' | 'rice' | 'addon' | 'dessert' | 'drinks';

const ProductManagement: React.FC<ProductManagementProps> = ({ onClose, onProductUpdated }) => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadMenuItems();
    }, []);

    useEffect(() => {
        filterItems();
    }, [searchTerm, categoryFilter, menuItems]);

    const loadMenuItems = async () => {
        try {
            setLoading(true);
            const items = await menuApi.getAllMenuItems();
            setMenuItems(items);
        } catch (error) {
            console.error('Error loading menu items:', error);
            setMessage({ type: 'error', text: 'Failed to load menu items' });
        } finally {
            setLoading(false);
        }
    };

    const filterItems = () => {
        let filtered = menuItems;

        // Filter by category
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredItems(filtered);
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem({ ...item });
        setMessage(null);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setMessage(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!editingItem) return;
        const { name, value } = e.target;
        setEditingItem(prev => prev ? { ...prev, [name]: value } : null);
    };

    const validateForm = (): boolean => {
        if (!editingItem) return false;

        if (!editingItem.name.trim()) {
            setMessage({ type: 'error', text: 'Please enter a product name' });
            return false;
        }

        const halfPrice = parseFloat(editingItem.halfPrice.toString());
        const fullPrice = parseFloat(editingItem.fullPrice.toString());

        if (isNaN(halfPrice) || halfPrice <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid half price' });
            return false;
        }

        if (isNaN(fullPrice) || fullPrice <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid full price' });
            return false;
        }

        if (fullPrice < halfPrice) {
            setMessage({ type: 'error', text: 'Full price cannot be less than half price' });
            return false;
        }

        return true;
    };

    const handleUpdate = async () => {
        if (!editingItem || !validateForm()) return;

        setIsSubmitting(true);
        setMessage(null);

        try {
            await menuApi.updateMenuItem(editingItem.id, {
                name: editingItem.name.trim(),
                halfPrice: parseFloat(editingItem.halfPrice.toString()),
                fullPrice: parseFloat(editingItem.fullPrice.toString()),
                category: editingItem.category,
                kitchen: editingItem.kitchen
            });

            setMessage({
                type: 'success',
                text: `✅ ${editingItem.name} updated successfully!`
            });

            await loadMenuItems();
            onProductUpdated();

            setTimeout(() => {
                setEditingItem(null);
                setMessage(null);
            }, 2000);
        } catch (error) {
            console.error('Error updating product:', error);
            setMessage({
                type: 'error',
                text: '❌ Failed to update product. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item: MenuItem) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${item.name}"?\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await menuApi.deleteMenuItem(item.id);
            setMessage({
                type: 'success',
                text: `✅ ${item.name} deleted successfully!`
            });

            await loadMenuItems();
            onProductUpdated();

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting product:', error);
            setMessage({
                type: 'error',
                text: '❌ Failed to delete product. Please try again.'
            });
        }
    };

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'main': return 'bg-green-100 text-green-800';
            case 'rice': return 'bg-amber-100 text-amber-800';
            case 'addon': return 'bg-orange-100 text-orange-800';
            case 'dessert': return 'bg-pink-100 text-pink-800';
            case 'drinks': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'main': return '🍛';
            case 'rice': return '🍚';
            case 'addon': return '🍗';
            case 'dessert': return '🍰';
            case 'drinks': return '🥤';
            default: return '📦';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Product Management</h2>
                        <p className="text-blue-100 text-sm">View, Edit & Delete Menu Items</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="sm:w-48">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="main">Main Dishes</option>
                                <option value="rice">Rice</option>
                                <option value="addon">Add-ons</option>
                                <option value="dessert">Desserts</option>
                                <option value="drinks">Drinks</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mx-6 mt-4 p-3 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                <p className="text-gray-600">Loading menu items...</p>
                            </div>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-lg font-semibold text-gray-600 mb-2">No items found</p>
                                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    {editingItem?.id === item.id ? (
                                        /* Edit Mode */
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-gray-800">Edit Product</h3>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Product Name */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Product Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={editingItem.name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>

                                                {/* Half Price */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Half Price (Rs.) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="halfPrice"
                                                        value={editingItem.halfPrice}
                                                        onChange={handleInputChange}
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>

                                                {/* Full Price */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Full Price (Rs.) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="fullPrice"
                                                        value={editingItem.fullPrice}
                                                        onChange={handleInputChange}
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>

                                                {/* Category */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Category *
                                                    </label>
                                                    <select
                                                        name="category"
                                                        value={editingItem.category}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        disabled={isSubmitting}
                                                    >
                                                        <option value="main">Main Dish</option>
                                                        <option value="rice">Rice</option>
                                                        <option value="addon">Add-on</option>
                                                        <option value="dessert">Dessert</option>
                                                        <option value="drinks">Drinks</option>
                                                    </select>
                                                </div>

                                                {/* Kitchen */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Kitchen Station *
                                                    </label>
                                                    <select
                                                        name="kitchen"
                                                        value={editingItem.kitchen}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        disabled={isSubmitting}
                                                    >
                                                        <option value="front">Front Kitchen</option>
                                                        <option value="back">Back Kitchen</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    onClick={handleUpdate}
                                                    disabled={isSubmitting}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all ${
                                                        isSubmitting
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                                                    }`}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save size={18} />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSubmitting}
                                                    className="px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                ID: {item.id}
                              </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryBadgeColor(item.category)}`}>
                                {item.category}
                              </span>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                {item.kitchen === 'front' ? 'Front Kitchen' : 'Back Kitchen'}
                              </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Half:</span>
                                                        <span className="ml-2 font-bold text-blue-600">Rs. {item.halfPrice}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Full:</span>
                                                        <span className="ml-2 font-bold text-green-600">Rs. {item.fullPrice}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{filteredItems.length}</span> of{' '}
                        <span className="font-semibold">{menuItems.length}</span> items
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductManagement;