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
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800 flex-1">{item.name}</span>
              <div className="flex gap-2 ml-4">
                {showPortions ? (
                  <>
                    <button
                      onClick={() => onAddItem(item, 'half')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors min-w-[60px]"
                    >
                      Half
                      <div className="text-xs">{item.halfPrice}</div>
                    </button>
                    <button
                      onClick={() => onAddItem(item, 'full')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors min-w-[60px]"
                    >
                      Full
                      <div className="text-xs">{item.fullPrice}</div>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onAddItem(item)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Add ({item.halfPrice})
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuSection;