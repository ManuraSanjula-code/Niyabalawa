import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(false); // Start as offline, check immediately
    const [wasOffline, setWasOffline] = useState(false);
    const lastCheckRef = useRef(0);

    const checkConnectivity = useCallback(async () => {
        const now = Date.now();
        if (now - lastCheckRef.current < 10000) return; // throttle: skip if <10s
        lastCheckRef.current = now;

        try {
            const healthUrl = API_BASE_URL.replace('/api', '') + '/api/health';
            const response = await fetch(healthUrl, {
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

        // Check connectivity immediately on mount
        checkConnectivity();

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