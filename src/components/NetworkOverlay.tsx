import React from 'react';

interface NetworkOverlayProps {
    isOnline: boolean;
    wasOffline: boolean;
}

const NetworkOverlay: React.FC<NetworkOverlayProps> = ({ isOnline, wasOffline }) => {
    if (isOnline && !wasOffline) {
        return null; // Don't show anything when online normally
    }

    return (
        <>
            {/* Offline Overlay - Freezes the entire UI */}
            {!isOnline && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center animate-pulse">
                        <div className="mb-6">
                            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
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
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            No Internet Connection
                        </h2>

                        <p className="text-gray-600 mb-4">
                            Your internet connection has been lost. The system is temporarily frozen to prevent data loss.
                        </p>

                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            <span>Waiting for connection...</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Reconnected Toast - Shows briefly when connection is restored */}
            {isOnline && wasOffline && (
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
                            <p className="font-semibold">Connection Restored!</p>
                            <p className="text-sm text-green-100">You're back online</p>
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