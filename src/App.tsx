import { useState, useEffect } from 'react';
import Cart from './components/Cart';
import PendingOrders from './components/PendingOrders';
import AdminPanel from './components/AdminPanel';
import { useBilling } from './hooks/useBilling';
import { socketService } from './services/socket';
import { menuApi } from './services/api';
import type { MenuItem } from './types';

function App() {
  const {
    cart,
    tokenNumber,
    total,
    orderType,
    pendingOrders,
    addToCart,
    updateQuantity,
    removeFromCart,
    setOrderType,
    changeRiceType,
    savePendingOrder,
    loadPendingOrder,
    updatePendingOrder,
    completePendingOrder,
    deletePendingOrder
  } = useBilling();

  const [activeTab, setActiveTab] = useState<'addons' | 'desserts'>('addons');
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isEditingPending, setIsEditingPending] = useState(false);
  const [currentEditingToken, setCurrentEditingToken] = useState<string | null>(null);
  
  // Load menu items from backend
  const [mainDishes, setMainDishes] = useState<MenuItem[]>([]);
  const [riceTypes, setRiceTypes] = useState<MenuItem[]>([]);
  const [addons, setAddons] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load menu items from backend on component mount
  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const allMenuItems = await menuApi.getAllMenuItems();
      
      // Separate items by category
      const mains = allMenuItems.filter((item: MenuItem) => item.category === 'main');
      const rice = allMenuItems.filter((item: MenuItem) => item.category === 'rice');
      const addonsItems = allMenuItems.filter((item: MenuItem) => item.category === 'addon');
      
      setMainDishes(mains);
      setRiceTypes(rice);
      setAddons(addonsItems);
    } catch (error) {
      console.error('Error loading menu items:', error);
      // Fallback to local data if backend fails
      const { mainDishes: localMains, riceTypes: localRice, addons: localAddons } = await import('./data/menuData');
      setMainDishes(localMains);
      setRiceTypes(localRice);
      setAddons(localAddons);
    } finally {
      setLoading(false);
    }
  };

  // Initialize socket connection on component mount
  useEffect(() => {
    socketService.connect();

    // Subscribe to real-time events
    socketService.onNewOrder((order) => {
      console.log('New order received:', order);
    });

    socketService.onOrderUpdate((order) => {
      console.log('Order updated:', order);
    });

    socketService.onOrderComplete((data) => {
      console.log('Order completed:', data);
    });

    return () => {
      // Clean up socket listeners on unmount
      socketService.removeAllListeners();
    };
  }, []);

  const handlePrintToken = async () => {
    const order = await savePendingOrder();
    if (order) {
      alert(`Token ${order.tokenNumber} printed!\n\nThis order is saved as pending.\nCustomer can pay later using this token.`);
      setIsEditingPending(false);
      setCurrentEditingToken(null);
    }
  };

  const handlePayNow = async () => {
    if (isEditingPending && currentEditingToken) {
      await completePendingOrder(currentEditingToken);
      alert(`Payment completed for Token ${currentEditingToken}!\n\nOrder has been finalized.`);
      setIsEditingPending(false);
      setCurrentEditingToken(null);
    } else {
      const order = await savePendingOrder(); // Save and get token
      if (order) {
        await completePendingOrder(order.tokenNumber); // Then immediately complete it
        alert(`Payment completed!\n\nToken: ${order.tokenNumber}\nTotal: Rs. ${total.toFixed(2)}`);
      }
    }
  };

  const handleLoadPendingOrder = (token: string) => {
    const order = loadPendingOrder(token);
    if (order) {
      setIsEditingPending(true);
      setCurrentEditingToken(token);
    }
  };

  const handleUpdatePending = async () => {
    if (currentEditingToken) {
      await updatePendingOrder(currentEditingToken);
      alert(`Order ${currentEditingToken} has been updated!`);
      // Reset editing state and clear cart
      setIsEditingPending(false);
      setCurrentEditingToken(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md px-3 py-1 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-white">Niyabalawa Restaurant</h1>
            <p className="text-blue-100 text-xs">Set Menu Order System</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Admin Panel Button */}
            <button
              onClick={() => setShowAdminPanel(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <span>➕</span>
              <span>Add Product</span>
            </button>

            {/* Pending Orders Button */}
            <button
              onClick={() => setShowPendingOrders(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <span>📋</span>
              <span>Pending Orders</span>
              {pendingOrders.length > 0 && (
                <span className="bg-white text-orange-600 font-bold px-2 py-0.5 rounded-full text-xs">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            
            {/* Token Display */}
            <div className="bg-white/20 backdrop-blur-sm rounded-md px-3 py-1 border border-white/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-100 font-medium">Token:</span>
                <span className="text-xl font-bold text-white">{tokenNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 overflow-hidden p-2 pb-0">
        <div className="h-full grid grid-cols-12 gap-2">
          {/* LEFT SECTION - Set Menu (Main Dishes with Rice) */}
          <div className="col-span-4 flex flex-col overflow-hidden">
            <div className="bg-white rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-3 py-1.5 flex-shrink-0">
                <h2 className="text-sm font-bold text-white">SET MENU (Rice & Curry)</h2>
                <p className="text-xs text-green-100">Complete meal with white rice</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-gray-300">
                    <tr>
                      <th className="text-left py-1 px-1.5 font-bold text-gray-700 text-xs">Main Item</th>
                      <th className="text-center py-1 px-1 font-bold text-blue-600 w-16 text-xs">Half</th>
                      <th className="text-center py-1 px-1 font-bold text-green-600 w-16 text-xs">Full</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainDishes.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">{item.name}</td>
                        <td className="py-1 px-1 text-center">
                          <button
                            onClick={() => addToCart(item, 'half')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                          >
                            {item.halfPrice}
                          </button>
                        </td>
                        <td className="py-1 px-1 text-center">
                          <button
                            onClick={() => addToCart(item, 'full')}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                          >
                            {item.fullPrice}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION - Add-ons & Desserts/Drinks with Tabs */}
          <div className="col-span-4 flex flex-col overflow-hidden">
            <div className="bg-white rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
              {/* Tab Headers - Like Book Pages */}
              <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('addons')}
                  className={`flex-1 py-2 px-3 font-bold text-xs transition-all duration-200 relative ${
                    activeTab === 'addons'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    clipPath: activeTab === 'addons' ? 'none' : 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)',
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>🍗</span>
                    <span>EXTRA ITEMS</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('desserts')}
                  className={`flex-1 py-2 px-3 font-bold text-xs transition-all duration-200 relative ${
                    activeTab === 'desserts'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    clipPath: activeTab === 'desserts' ? 'none' : 'polygon(5% 0, 100% 0, 100% 100%, 0% 100%)',
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>🍰</span>
                    <span>ALL EXTRAS</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {/* Add-ons Tab */}
                {activeTab === 'addons' && (
                  <div className="h-full flex flex-col animate-fadeIn">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-3 py-1 flex-shrink-0">
                      <p className="text-xs text-orange-100">Extra proteins, sides & add-ons to enhance your meal</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white border-b border-gray-300 z-10">
                          <tr>
                            <th className="text-left py-1 px-1.5 font-bold text-gray-700 text-xs">Item</th>
                            <th className="text-center py-1 px-1 font-bold text-orange-600 w-20 text-xs">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {addons.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                              <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">{item.name}</td>
                              <td className="py-1 px-1 text-center">
                                <button
                                  onClick={() => addToCart(item)}
                                  className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                >
                                  +{item.halfPrice}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Desserts/Drinks Tab */}
                {activeTab === 'desserts' && (
                  <div className="h-full flex flex-col animate-fadeIn">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1 flex-shrink-0">
                      <p className="text-xs text-purple-100">All extras - proteins, sides, desserts & beverages</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                      {addons.length > 0 ? (
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-white border-b border-gray-300 z-10">
                            <tr>
                              <th className="text-left py-1 px-1.5 font-bold text-gray-700 text-xs">Item</th>
                              <th className="text-center py-1 px-1 font-bold text-purple-600 w-20 text-xs">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addons.map((item) => (
                              <tr key={item.id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                                <td className="py-1 px-1.5 font-medium text-gray-800 text-xs">{item.name}</td>
                                <td className="py-1 px-1 text-center">
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full transition-colors"
                                  >
                                    +{item.halfPrice}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center py-8 px-4">
                            <div className="text-4xl mb-3">🍰🥤</div>
                            <p className="text-sm font-semibold text-gray-600 mb-1">No items yet</p>
                            <p className="text-xs text-gray-500">Use "Add Product" to add desserts, drinks & sides</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
            />
          </div>
        </div>
      </div>

      {/* BOTTOM - Rice Type Selector (Changes Base Rice) */}
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

      {/* Pending Orders Modal */}
      {showPendingOrders && (
        <PendingOrders
          pendingOrders={pendingOrders}
          onLoadOrder={handleLoadPendingOrder}
          onDeleteOrder={deletePendingOrder}
          onClose={() => setShowPendingOrders(false)}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onProductAdded={loadMenuItems}
        />
      )}
    </div>
  );
}

export default App;