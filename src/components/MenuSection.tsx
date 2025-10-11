import React from 'react';
import { MenuItem } from '../types';

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  onAddItem: (item: MenuItem, portion?: 'half' | 'full') => void;
  showPortions?: boolean;
  className?: string;
}

const MenuSection: React.FC<MenuSectionProps> = ({
  title,
  items,
  onAddItem,
  showPortions = true,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col h-full">
                <div className="flex-1 mb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 text-base group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    {item.kitchen === 'back' && (
                      <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full border border-purple-300 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Back Kitchen
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {showPortions && (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Half:</span>
                          <span className="font-bold text-blue-600">Rs. {item.halfPrice}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Full:</span>
                          <span className="font-bold text-green-600">Rs. {item.fullPrice}</span>
                        </div>
                      </>
                    )}
                    {!showPortions && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-bold text-orange-600">Rs. {item.halfPrice}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {showPortions ? (
                    <>
                      <button
                        onClick={() => onAddItem(item, 'half')}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        + Half
                      </button>
                      <button
                        onClick={() => onAddItem(item, 'full')}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        + Full
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onAddItem(item)}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      + Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuSection;