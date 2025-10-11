import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem, MenuItem } from '../types';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  total: number;
  orderType?: 'dine-in' | 'take-away';
  onOrderTypeChange?: (type: 'dine-in' | 'take-away') => void;
  onPrintToken?: () => void;
  onPayNow?: () => void;
  tokenNumber?: string;
  isEditingPending?: boolean;
  onUpdatePending?: () => void;
  riceTypes?: MenuItem[];
  onChangeRiceType?: (cartItemId: string, riceName: string, ricePrice: number) => void;
}

const Cart: React.FC<CartProps> = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  total,
  orderType = 'dine-in',
  onOrderTypeChange,
  onPrintToken,
  onPayNow,
  tokenNumber,
  isEditingPending = false,
  onUpdatePending,
  riceTypes = [],
  onChangeRiceType
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 flex-shrink-0">
        <h2 className="text-sm font-bold text-white">PRODUCTS</h2>
        <p className="text-xs text-blue-100">Order Summary</p>
      </div>
      
      {/* Order Type Selection */}
      {onOrderTypeChange && (
        <div className="px-2 pt-2 flex-shrink-0">
          <div className="flex gap-1.5">
            <button
              onClick={() => onOrderTypeChange('dine-in')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                orderType === 'dine-in'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🍽️ Dine In
            </button>
            <button
              onClick={() => onOrderTypeChange('take-away')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                orderType === 'take-away'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Take Away
            </button>
          </div>
        </div>
      )}
      
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-center font-medium text-xs">No items ordered</p>
            <p className="text-xs text-gray-400 mt-0.5">Select items from menu</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1 min-w-0 pr-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-gray-900 text-xs">{item.quantity}x</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-xs leading-tight">
                          {item.name}
                        </h3>
                        {item.portion && (
                          <span className="inline-block text-xs font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded mt-0.5">
                            {item.portion.toUpperCase()}
                          </span>
                        )}
                        {/* Rice type selector for set menu items */}
                        {item.category === 'main' && item.riceType && onChangeRiceType && (
                          <div className="mt-1.5">
                            <select
                              value={item.riceType}
                              onChange={(e) => {
                                const selectedRice = riceTypes.find(r => r.name === e.target.value);
                                const whiteRice = riceTypes.find(r => r.name === 'White Rice');
                                if (selectedRice && whiteRice) {
                                  // Calculate additional price (difference from White Rice base price)
                                  const additionalPrice = selectedRice.halfPrice - whiteRice.halfPrice;
                                  onChangeRiceType(item.id, selectedRice.name, Math.max(0, additionalPrice));
                                }
                              }}
                              className="w-full text-xs border border-amber-300 rounded px-1.5 py-0.5 bg-amber-50 text-amber-900 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer hover:bg-amber-100 transition-colors"
                            >
                              {riceTypes.map((rice) => {
                                const whiteRice = riceTypes.find(r => r.name === 'White Rice');
                                const extraCost = whiteRice ? rice.halfPrice - whiteRice.halfPrice : 0;
                                return (
                                  <option key={rice.id} value={rice.name}>
                                    🍚 {rice.name} {extraCost > 0 ? `(+Rs.${extraCost})` : '(Default)'}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-gray-900 text-xs">
                      Rs. {(item.price + (item.ricePrice || 0)) * item.quantity}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{item.price + (item.ricePrice || 0)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                  <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded p-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-5 h-5 rounded bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors font-bold text-xs"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-6 text-center font-bold text-gray-900 text-xs">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-5 h-5 rounded bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors font-bold text-xs"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-white hover:bg-red-500 px-1.5 py-0.5 rounded transition-all duration-200 text-xs font-semibold"
                    title="Remove item"
                  >
                    <Trash2 size={12} className="inline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Total and Actions */}
      <div className="border-t-2 border-gray-200 bg-gray-50 px-2 py-2 flex-shrink-0">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase">Total</span>
            <span className="text-lg font-bold">Rs. {total.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Different buttons based on order type and edit mode */}
        {isEditingPending ? (
          <div className="space-y-1.5">
            <button 
              onClick={onUpdatePending}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-400 disabled:to-gray-400"
              disabled={items.length === 0}
            >
              💾 UPDATE ORDER
            </button>
            <button 
              onClick={onPayNow}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-400 disabled:to-gray-400"
              disabled={items.length === 0}
            >
              � PAY NOW
            </button>
          </div>
        ) : orderType === 'dine-in' ? (
          <button 
            onClick={onPrintToken}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2 px-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-400 disabled:to-gray-400"
            disabled={items.length === 0}
          >
            🎫 PRINT TOKEN (Dine In)
          </button>
        ) : (
          <button 
            onClick={onPayNow}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-400 disabled:to-gray-400"
            disabled={items.length === 0}
          >
            💰 PAY NOW (Take Away)
          </button>
        )}
        
        {/* Show token number if editing pending order */}
        {isEditingPending && tokenNumber && (
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-600">Editing Token: <span className="font-bold text-purple-600">{tokenNumber}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;