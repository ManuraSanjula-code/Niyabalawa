// components/DataLoadingOverlay.tsx
import React from 'react';

interface DataLoadingOverlayProps {
    loading: boolean;
    progress: number;
    message?: string;
}

const DataLoadingOverlay: React.FC<DataLoadingOverlayProps> = ({
                                                                   loading,
                                                                   progress,
                                                                   message = "Loading data..."
                                                               }) => {
    if (!loading) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-[60] flex items-center justify-center">
            {/* Keep the original styling but make it cover full screen */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                <div className="text-center">
                    {/* Animated spinner - original style */}
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>

                    {/* Progress bar - original style */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Message and progress text - original style */}
                    <p className="text-sm font-medium text-gray-700 mb-1">{message}</p>
                    <p className="text-xs text-gray-500">
                        {progress}% complete - Working in background
                    </p>

                    {/* Non-blocking notice - original style */}
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700">
                            💡 You can continue using the app while data loads
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataLoadingOverlay;