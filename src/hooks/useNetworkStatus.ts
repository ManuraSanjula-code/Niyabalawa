import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        // Handler for when connection is lost
        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            console.log('🔴 Internet connection lost');
        };

        // Handler for when connection is restored
        const handleOnline = () => {
            setIsOnline(true);
            console.log('🟢 Internet connection restored');

            // Show notification when connection is restored
            if (wasOffline) {
                setTimeout(() => {
                    setWasOffline(false);
                }, 3000); // Keep the "reconnected" message for 3 seconds
            }
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Optional: Additional connectivity check using fetch (more reliable)
        const checkConnectivity = async () => {
            try {
                const response = await fetch('/api/health', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                const newStatus = response.ok;
                // Only update state if status actually changed to prevent unnecessary re-renders
                setIsOnline(prev => prev === newStatus ? prev : newStatus);
            } catch {
                // Only update to offline if currently showing online
                setIsOnline(prev => prev ? false : prev);
            }
        };

        // Check connectivity every 30 seconds (reduced frequency to prevent input disruption)
        const interval = setInterval(checkConnectivity, 30000);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [wasOffline]);

    return { isOnline, wasOffline };
};