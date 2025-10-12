import React, { useState } from 'react';
import { Plus, Save, X, Utensils, IceCream, Wine } from 'lucide-react';
import { menuApi } from '../services/api';
import type { MenuItem } from '../types';

interface AdminPanelProps {
    onClose: () => void;
    onProductAdded: () => void;
}

// Fixed: Added 'dessert' and 'drinks' to ProductCategory
type ProductCategory = 'main' | 'rice' | 'addon' | 'dessert' | 'drinks';
type ProductType = 'set-menu' | 'addons' | 'desserts' | 'drinks';

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onProductAdded }) => {
    const [activeTab, setActiveTab] = useState<ProductType>('set-menu');
    const [formData, setFormData] = useState({
        name: '',
        halfPrice: '',
        fullPrice: '',
        category: 'main' as ProductCategory,
        kitchen: 'front' as 'front' | 'back'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Fixed: Properly set default category based on active tab
    const handleTabChange = (tab: ProductType) => {
        setActiveTab(tab);

        let defaultCategory: ProductCategory = 'addon';
        if (tab === 'set-menu') {
            defaultCategory = 'main';
        } else if (tab === 'desserts') {
            defaultCategory = 'dessert';
        } else if (tab === 'drinks') {
            defaultCategory = 'drinks';
        }

        setFormData({
            name: '',
            halfPrice: '',
            fullPrice: '',
            category: defaultCategory,
            kitchen: 'front'
        });
        setMessage(null);
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Please enter a product name' });
            return false;
        }

        const halfPrice = parseFloat(formData.halfPrice);
        const fullPrice = parseFloat(formData.fullPrice);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const newProduct: Omit<MenuItem, 'id'> = {
                name: formData.name.trim(),
                halfPrice: parseFloat(formData.halfPrice),
                fullPrice: parseFloat(formData.fullPrice),
                category: formData.category,
                kitchen: formData.kitchen
            };

            await menuApi.createMenuItem(newProduct);

            setMessage({
                type: 'success',
                text: `✅ ${formData.name} added successfully!`
            });

            // Reset form with appropriate default category
            let defaultCategory: ProductCategory = 'addon';
            if (activeTab === 'set-menu') {
                defaultCategory = 'main';
            } else if (activeTab === 'desserts') {
                defaultCategory = 'dessert';
            } else if (activeTab === 'drinks') {
                defaultCategory = 'drinks';
            }

            setFormData({
                name: '',
                halfPrice: '',
                fullPrice: '',
                category: defaultCategory,
                kitchen: 'front'
            });

            onProductAdded();

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error adding product:', error);
            setMessage({
                type: 'error',
                text: '❌ Failed to add product. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryIcon = (type: ProductType) => {
        switch (type) {
            case 'set-menu': return <Utensils size={16} />;
            case 'addons': return <Plus size={16} />;
            case 'desserts': return <IceCream size={16} />;
            case 'drinks': return <Wine size={16} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                        <p className="text-purple-100 text-sm">Add Products to Menu</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-purple-800 rounded-full p-2 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50 px-4">
                    {(['set-menu', 'addons', 'desserts', 'drinks'] as ProductType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all ${
                                activeTab === tab
                                    ? 'border-b-2 border-purple-600 text-purple-600'
                                    : 'text-gray-600 hover:text-purple-600'
                            }`}
                        >
                            {getCategoryIcon(tab)}
                            <span className="capitalize">{tab.replace('-', ' ')}</span>
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Product Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={`Enter ${activeTab} name`}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="halfPrice" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Half Price (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    id="halfPrice"
                                    name="halfPrice"
                                    value={formData.halfPrice}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label htmlFor="fullPrice" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Price (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    id="fullPrice"
                                    name="fullPrice"
                                    value={formData.fullPrice}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={isSubmitting}
                            >
                                {activeTab === 'set-menu' ? (
                                    <>
                                        <option value="main">Main Dish (Set Menu)</option>
                                        <option value="rice">Rice</option>
                                    </>
                                ) : activeTab === 'addons' ? (
                                    <option value="addon">Addon/Side</option>
                                ) : activeTab === 'desserts' ? (
                                    <option value="dessert">Dessert</option>
                                ) : (
                                    <option value="drinks">Drinks</option>
                                )}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {activeTab === 'set-menu'
                                    ? 'Main dishes appear in set menu, rice types as rice options'
                                    : activeTab === 'addons'
                                        ? 'This item will appear in the ADD-ONS tab (sides, extras, papadum, etc.)'
                                        : activeTab === 'desserts'
                                            ? 'This item will appear in the DESSERTS section'
                                            : 'This item will appear in the DRINKS section'
                                }
                            </p>
                        </div>

                        {/* Kitchen */}
                        <div>
                            <label htmlFor="kitchen" className="block text-sm font-semibold text-gray-700 mb-2">
                                Kitchen Station *
                            </label>
                            <select
                                id="kitchen"
                                name="kitchen"
                                value={formData.kitchen}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={isSubmitting}
                            >
                                <option value="front">Front Kitchen</option>
                                <option value="back">Back Kitchen</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Select which kitchen prepares this item
                            </p>
                        </div>

                        {/* Message */}
                        {message && (
                            <div
                                className={`p-4 rounded-lg ${
                                    message.type === 'success'
                                        ? 'bg-green-50 text-green-800 border border-green-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                            >
                                {message.text}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                                    isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Add Product
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;