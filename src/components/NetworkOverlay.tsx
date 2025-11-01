import React, { useEffect, useState } from 'react';

interface NetworkOverlayProps {
  isOnline: boolean;
  showReconnected: boolean;
  isSlow?: boolean;
}

const NetworkOverlay: React.FC<NetworkOverlayProps> = ({ isOnline, showReconnected, isSlow = false }) => {
  const [showToast, setShowToast] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showReconnected) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowToast(false);
    }
  }, [showReconnected]);

  // Show overlay if offline OR if connection is too slow
  const shouldShowOverlay = !isOnline || isSlow;

  // Don't show anything when online, fast, and not showing reconnected message
  if (!shouldShowOverlay && !showToast) {
    return null;
  }

  return (
    <>
      {/* Offline/Slow Connection Overlay - Freezes the entire UI */}
      {shouldShowOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="mb-6">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center animate-pulse ${
                isSlow ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {isSlow ? (
                  // Slow connection icon
                  <svg 
                    className="w-12 h-12 text-yellow-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                ) : (
                  // Offline icon
                  <svg 
                    className="w-12 h-12 text-red-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
                    />
                  </svg>
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {isSlow ? 'Slow Internet Connection' : 'No Internet Connection'}
            </h2>
            
            <p className="text-gray-600 mb-2">
              {isSlow 
                ? 'Your internet connection is too slow to work properly.'
                : 'Your internet connection has been lost.'
              }
            </p>
            
            <p className="text-gray-600 mb-6 font-semibold">
              The system is frozen to prevent data loss and errors.
            </p>
            
            <div className={`border rounded-lg p-4 mb-4 ${
              isSlow 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                isSlow ? 'text-yellow-800' : 'text-red-800'
              }`}>
                ⚠️ {isSlow 
                  ? 'This screen will remain until your connection speed improves (response time < 4 seconds).'
                  : 'This screen will remain until your internet connection is fully restored.'
                }
              </p>
            </div>
            
            {isSlow && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong><br/>
                  • Move closer to your WiFi router<br/>
                  • Check if others are using bandwidth<br/>
                  • Restart your router<br/>
                  • Switch to mobile data if available
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isSlow ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isSlow ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isSlow ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>{isSlow ? 'Testing connection speed...' : 'Checking connection...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reconnected Toast - Only shows AFTER verified good connection */}
      {isOnline && !isSlow && showToast && (
        <div className="fixed top-4 right-4 z-[9999] animate-slideIn">
          <div className="bg-green-500 text-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Connection Restored! ✓</p>
              <p className="text-sm text-green-100">Fast connection detected</p>
            </div>
          </div>
        </div>
      )}

      {/* Add animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NetworkOverlay;