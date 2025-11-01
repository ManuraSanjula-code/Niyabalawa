import { useState, useEffect, useRef } from 'react';

export const useNetworkStatus = () => {
  // Start with false (offline) until we verify connection - don't trust navigator.onLine
  const [isOnline, setIsOnline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef<boolean>(false);
  const lastKnownStateRef = useRef<{ online: boolean; slow: boolean }>({ online: false, slow: false });
  const verificationPromiseRef = useRef<Promise<{ online: boolean; slow: boolean; responseTime: number }> | null>(null);
  const hasBeenVerifiedRef = useRef<boolean>(false); // Track if we've completed at least one verification

  // Thresholds for connection quality
  // 4 seconds threshold: If a simple request takes >4s, connection is too slow for functional use
  // This catches connections that can barely communicate but are too slow to prevent errors/data loss
  const SLOW_THRESHOLD = 4000; // 4 seconds - connection too slow to be functional
  const TIMEOUT_THRESHOLD = 8000; // 8 seconds - connection considered offline

  useEffect(() => {
    // Verify actual internet connectivity and measure speed
    // Tests against reliable endpoints to detect truly slow connections
    const verifyConnectivity = async (): Promise<{ online: boolean; slow: boolean; responseTime: number }> => {
      // If a check is already in progress, wait for it instead of starting a new one
      if (isCheckingRef.current && verificationPromiseRef.current) {
        return verificationPromiseRef.current;
      }
      
      // Create new verification promise
      const verificationPromise = (async (): Promise<{ online: boolean; slow: boolean; responseTime: number }> => {
        isCheckingRef.current = true;
        const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_THRESHOLD);

        // Test connectivity - prioritize backend health endpoint, then fallback to public endpoints
        // This tests actual functional connectivity for the app
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        // Construct health endpoint URL
        const baseUrl = API_BASE_URL.endsWith('/api') 
          ? API_BASE_URL.replace('/api', '') 
          : API_BASE_URL.replace(/\/api\/?$/, '');
        const healthUrl = `${baseUrl}/api/health`;
        
        const testUrls = [
          healthUrl, // Backend health check (most relevant)
          `https://www.google.com/favicon.ico?t=${Date.now()}`, // Fallback 1
          `https://www.cloudflare.com/favicon.ico?t=${Date.now()}`, // Fallback 2
        ];

        let responseTime = 0;
        let success = false;

        for (const testUrl of testUrls) {
          const fetchStart = Date.now();
          try {
            const response = await fetch(testUrl, {
              method: 'HEAD',
              cache: 'no-store',
              signal: controller.signal,
              // Try with CORS first for accurate timing
            });
            const fetchEnd = Date.now();
            
            // Check if request succeeded
            if (response.ok || response.status >= 200) {
              responseTime = fetchEnd - fetchStart;
              success = true;
              break; // Success, no need to try other URLs
            }
          } catch (err: any) {
            // If CORS error, try with no-cors mode as fallback for public endpoints
            if (testUrl.includes('google.com') || testUrl.includes('cloudflare.com')) {
              try {
                const noCorsStart = Date.now();
                await fetch(testUrl, {
                  method: 'HEAD',
                  mode: 'no-cors',
                  cache: 'no-store',
                  signal: controller.signal,
                });
                const noCorsEnd = Date.now();
                responseTime = noCorsEnd - noCorsStart;
                success = true;
                break;
              } catch (noCorsErr) {
                // Continue to next URL
                continue;
              }
            } else {
              // Backend endpoint failed, try next
              continue;
            }
          }
        }

        clearTimeout(timeoutId);
        isCheckingRef.current = false;
        verificationPromiseRef.current = null;

        if (!success) {
          // All URLs failed
          responseTime = Date.now() - startTime;
          console.log(`🔴 Connection failed after ${responseTime}ms - all test endpoints failed`);
          return { online: false, slow: false, responseTime };
        }
        
        // Connection is online but too slow to be functional if it takes more than SLOW_THRESHOLD
        // 4+ seconds means the connection can barely communicate - too slow to prevent errors/data loss
        if (responseTime > SLOW_THRESHOLD) {
          console.log(`🟡 Slow connection detected: ${responseTime}ms (threshold: ${SLOW_THRESHOLD}ms)`);
          return { online: true, slow: true, responseTime };
        }
        
        // Connection is good and functional
        console.log(`🟢 Good connection: ${responseTime}ms`);
        return { online: true, slow: false, responseTime };
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        isCheckingRef.current = false;
        verificationPromiseRef.current = null;
        
        // If timeout or error, connection is offline or too slow (exceeded timeout)
        if (responseTime >= TIMEOUT_THRESHOLD || (error instanceof Error && error.name === 'AbortError')) {
          console.log(`🔴 Connection timeout after ${responseTime}ms (considered offline)`);
        } else {
          console.log(`🔴 Connection failed after ${responseTime}ms:`, error);
        }
        return { online: false, slow: false, responseTime };
      }
      })();

      verificationPromiseRef.current = verificationPromise;
      return verificationPromise;
    };

    // Handler for when browser detects offline
    // This is safe to trust - if browser says offline, we should freeze IMMEDIATELY
    const handleOffline = () => {
      console.log('🔴 Browser detected: Internet connection lost - FREEZING IMMEDIATELY');
      lastKnownStateRef.current = { online: false, slow: false };
      setIsOnline(false);
      setIsSlow(false);
      setShowReconnected(false); // Always hide reconnected message when going offline
      
      // Clear reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // Verify in background (don't wait) to confirm offline status
      verifyConnectivity().then(result => {
        console.log('🔴 Verification after offline event confirms:', result.online ? 'online' : 'offline');
        if (!result.online) {
          // Confirmed offline - state is already correct
          lastKnownStateRef.current = { online: false, slow: false };
          setIsOnline(false);
          setIsSlow(false);
        }
        // If verification says online, periodic check will catch it
      });
    };

    // Handler for when browser detects online
    // CRITICAL: Don't trust browser - verify before unfreezing
    const handleOnline = async () => {
      console.log('🟡 Browser detected: Connection restored, verifying BEFORE unfreezing...');
      
      // DO NOT update state yet - keep overlay frozen until verification succeeds
      // The overlay will remain visible because isOnline is still false
      
      const result = await verifyConnectivity();
      
      // Get previous state BEFORE updating (only meaningful if we've been verified before)
      const wasOfflineOrSlow = hasBeenVerifiedRef.current && (!lastKnownStateRef.current.online || lastKnownStateRef.current.slow);
      
      // Only update state after verification completes
      if (result.online) {
        hasBeenVerifiedRef.current = true;
        
        if (result.slow) {
          console.log('🟡 Verified: Connection restored but SLOW - keeping overlay frozen');
          lastKnownStateRef.current = { online: true, slow: true };
          setIsOnline(true); // Still online, but slow
          setIsSlow(true);
          setShowReconnected(false); // Never show success for slow connection
        } else {
          console.log('🟢 Verified: Connection restored and FAST - unfreezing now');
          lastKnownStateRef.current = { online: true, slow: false };
          setIsOnline(true);
          setIsSlow(false);
          
          // Only show reconnected message if:
          // 1. We've been verified before (not initial load)
          // 2. We were ACTUALLY offline/slow before
          // This prevents false positives on initial load
          if (wasOfflineOrSlow) {
            setShowReconnected(true);
            
            // Clear any existing timer
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
            }
            
            // Auto-hide after 3 seconds
            reconnectTimerRef.current = setTimeout(() => {
              setShowReconnected(false);
              reconnectTimerRef.current = null;
            }, 3000);
          }
        }
      } else {
        hasBeenVerifiedRef.current = true;
        console.log('🔴 Verification failed: Still offline - keeping overlay frozen');
        lastKnownStateRef.current = { online: false, slow: false };
        setIsOnline(false);
        setIsSlow(false);
        setShowReconnected(false);
      }
    };

    // Continuous connectivity check
    // This runs every 3 seconds to continuously monitor connection
    const checkConnectivity = async () => {
      // Skip if browser says offline - trust that immediately
      if (!navigator.onLine) {
        const wasOnline = lastKnownStateRef.current.online && !lastKnownStateRef.current.slow;
        if (wasOnline) {
          console.log('🔴 Periodic check: Browser reports offline - freezing overlay');
        }
        lastKnownStateRef.current = { online: false, slow: false };
        setIsOnline(false);
        setIsSlow(false);
        setShowReconnected(false);
        
        // Clear reconnect timer
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        return;
      }
      
      const result = await verifyConnectivity();
      
      // Get previous state BEFORE updating (only meaningful if we've been verified before)
      const prevState = lastKnownStateRef.current;
      const wasOfflineOrSlow = hasBeenVerifiedRef.current && (!prevState.online || prevState.slow);
      
      // Update states based on verified connectivity check result
      if (result.online) {
        hasBeenVerifiedRef.current = true;
        
        if (result.slow) {
          console.log(`🟡 Periodic check: Connection SLOW (${result.responseTime}ms) - keeping overlay frozen`);
          lastKnownStateRef.current = { online: true, slow: true };
          setIsOnline(true);
          setIsSlow(true);
          // Never show reconnected message for slow connection
          setShowReconnected(false);
        } else {
          // Connection is good and fast
          lastKnownStateRef.current = { online: true, slow: false };
          setIsOnline(true);
          setIsSlow(false);
          
          // Only show reconnected message if:
          // 1. We've been verified before (not initial load)
          // 2. We were ACTUALLY offline/slow before (not just initial state)
          // 3. We don't already have a timer running (to prevent resetting)
          // This prevents false positives
          if (wasOfflineOrSlow && !reconnectTimerRef.current) {
            console.log(`🟢 Periodic check: Connection restored and FAST (${result.responseTime}ms) - was offline/slow`);
            setShowReconnected(true);
            
            reconnectTimerRef.current = setTimeout(() => {
              setShowReconnected(false);
              reconnectTimerRef.current = null;
            }, 3000);
          }
        }
      } else {
        hasBeenVerifiedRef.current = true;
        console.log(`🔴 Periodic check: Connection lost (${result.responseTime}ms) - freezing overlay`);
        lastKnownStateRef.current = { online: false, slow: false };
        setIsOnline(false);
        setIsSlow(false);
        setShowReconnected(false);
        
        // Clear reconnect timer if connection is lost
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connectivity every 3 seconds
    checkIntervalRef.current = setInterval(checkConnectivity, 3000);

    // Initial check - this will verify and set initial state
    // Don't trust navigator.onLine, verify first before setting isOnline to true
    checkConnectivity();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []); // Empty dependency array - effect only runs once on mount

  return { isOnline, showReconnected, isSlow };
};