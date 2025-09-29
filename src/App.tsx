import React from 'react';
import { ShoppingCart } from 'lucide-react';
import MenuSection from './components/MenuSection';
import Cart from './components/Cart';
import { useBilling } from './hooks/useBilling';
import { mainDishes, riceTypes, addons } from './data/menuData';

function App() {
  const {
    cart,
    tokenNumber,
    total,
    addToCart,
    updateQuantity,
    removeFromCart
  } = useBilling();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-800">Restaurant Billing System</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Left Side - Menu Items */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
            {/* Main Dishes and Add-ons side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <MenuSection
                title="Main Dishes"
                items={mainDishes}
                onAddItem={addToCart}
                showPortions={true}
                className="h-fit"
              />
              
              <MenuSection
                title="Add-ons"
                items={addons}
                onAddItem={addToCart}
                showPortions={false}
                className="h-fit"
              />
            </div>
            
            {/* Rice Types at the bottom */}
            <div className="mt-auto">
              <MenuSection
                title="Rice Types"
                items={riceTypes}
                onAddItem={addToCart}
                showPortions={false}
              />
            </div>
          </div>

          {/* Right Side - Cart */}
          <div className="lg:col-span-1">
            <Cart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              tokenNumber={tokenNumber}
              total={total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;