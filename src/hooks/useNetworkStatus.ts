import { useState, useEffect, useRef } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef<boolean>(false);

  // Thresholds for connection quality
  // 4 seconds threshold: If a simple request takes >4s, connection is too slow for functional use
  // This catches connections that can barely communicate but are too slow to prevent errors/data loss
  const SLOW_THRESHOLD = 4000; // 4 seconds - connection too slow to be functional
  const TIMEOUT_THRESHOLD = 8000; // 8 seconds - connection considered offline

  useEffect(() => {
    // Verify actual internet connectivity and measure speed
    // Tests against reliable endpoints to detect truly slow connections
    const verifyConnectivity = async (): Promise<{ online: boolean; slow: boolean; responseTime: number }> => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        // Return current state values - these will be retrieved from state when needed
        return { online: navigator.onLine, slow: false, responseTime: 0 };
      }
      
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
        
        // If timeout or error, connection is offline or too slow (exceeded timeout)
        if (responseTime >= TIMEOUT_THRESHOLD || (error instanceof Error && error.name === 'AbortError')) {
          console.log(`🔴 Connection timeout after ${responseTime}ms (considered offline)`);
        } else {
          console.log(`🔴 Connection failed after ${responseTime}ms:`, error);
        }
        return { online: false, slow: false, responseTime };
      }
    };

    // Handler for when browser detects offline
    const handleOffline = () => {
      console.log('🔴 Browser detected: Internet connection lost');
      setIsOnline(false);
      setIsSlow(false);
      setShowReconnected(false);
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    // Handler for when browser detects online
    const handleOnline = async () => {
      console.log('🟡 Browser detected: Connection restored, verifying speed...');
      
      const result = await verifyConnectivity();
      
      if (result.online) {
        if (result.slow) {
          console.log('🟡 Verified: Connection restored but SLOW');
          setIsOnline(true);
          setIsSlow(true);
          setShowReconnected(false); // Don't show success for slow connection
        } else {
          console.log('🟢 Verified: Connection restored and FAST');
          setIsOnline(true);
          setIsSlow(false);
          setShowReconnected(true);
          
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
          }
          
          reconnectTimerRef.current = setTimeout(() => {
            setShowReconnected(false);
            reconnectTimerRef.current = null;
          }, 3000);
        }
      } else {
        console.log('🔴 Verification failed: Still offline');
        setIsOnline(false);
        setIsSlow(false);
      }
    };

    // Continuous connectivity check
    const checkConnectivity = async () => {
      const result = await verifyConnectivity();
      
      // Always update states based on connectivity check result
      if (result.online) {
        if (result.slow) {
          console.log(`🟡 Periodic check: Connection SLOW (${result.responseTime}ms)`);
          setIsOnline(true);
          setIsSlow(true);
          setShowReconnected(false);
        } else {
          // Check if we need to show reconnected toast (transition from offline/slow to fast)
          setIsOnline((prevOnline) => {
            setIsSlow((prevSlow) => {
              const wasSlowOrOffline = !prevOnline || prevSlow;
              
              if (wasSlowOrOffline) {
                console.log(`🟢 Periodic check: Connection restored and FAST (${result.responseTime}ms)`);
                setShowReconnected(true);
                
                if (reconnectTimerRef.current) {
                  clearTimeout(reconnectTimerRef.current);
                }
                
                reconnectTimerRef.current = setTimeout(() => {
                  setShowReconnected(false);
                  reconnectTimerRef.current = null;
                }, 3000);
              }
              
              return false; // Set slow to false
            });
            return true; // Set online to true
          });
        }
      } else {
        console.log(`🔴 Periodic check: Connection lost (${result.responseTime}ms)`);
        setIsOnline(false);
        setIsSlow(false);
        setShowReconnected(false);
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connectivity every 3 seconds
    checkIntervalRef.current = setInterval(checkConnectivity, 3000);

    // Initial check
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