import { useState, useEffect, useRef, useCallback } from 'react';

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);
    const lastCheckRef = useRef(0);

    const checkConnectivity = useCallback(async () => {
        const now = Date.now();
        if (now - lastCheckRef.current < 10000) return; // throttle: skip if <10s
        lastCheckRef.current = now;

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
    }, []);

    useEffect(() => {
        // Handler for when connection is lost
        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            if (process.env.NODE_ENV === 'development') {
                console.log('🔴 Internet connection lost');
            }
        };

        // Handler for when connection is restored
        const handleOnline = () => {
            setIsOnline(true);
            if (process.env.NODE_ENV === 'development') {
                console.log('🟢 Internet connection restored');
            }

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

        // Check connectivity every 10 minutes (reduced frequency to prevent input disruption)
        const interval = setInterval(checkConnectivity, 600000);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [checkConnectivity, wasOffline]);

    return { isOnline, wasOffline };
};