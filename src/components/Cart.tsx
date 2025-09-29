import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  tokenNumber: string;
  total: number;
}

const Cart: React.FC<CartProps> = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  tokenNumber, 
  total 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
        Products
      </h2>
      
      <div className="flex-1 overflow-y-auto mb-4">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items added yet</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    {item.portion && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                        {item.portion}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-600 flex items-center justify-center transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {item.price} × {item.quantity}
                    </div>
                    <div className="font-bold text-gray-800">
                      {item.price * item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Token Number</div>
            <div className="text-2xl font-bold text-blue-600">{tokenNumber}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-gray-800 mb-2">
            Total: Rs. {total.toFixed(2)}
          </div>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;