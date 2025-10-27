import { useState, useEffect } from 'react';

interface NetworkInfo {
    online: boolean;
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
    downlink: number;
    rtt: number;
    networkName: string;
    ssid: string | null;
    signalStrength: number; // 0-100 percentage
}

const NetworkStatus = () => {
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
        online: navigator.onLine,
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        networkName: 'Unknown',
        ssid: null,
        signalStrength: 0
    });

    // Measure actual signal strength via network performance test
    const measureSignalStrength = async (): Promise<number> => {
        try {
            const startTime = performance.now();

            // Small fetch request to measure actual network response
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                cache: 'no-cache',
                mode: 'no-cors'
            });

            const endTime = performance.now();
            const latency = endTime - startTime;

            // Calculate signal strength based on latency
            // Lower latency = stronger signal
            // 0-50ms = 100% (excellent)
            // 50-100ms = 80% (very good)
            // 100-200ms = 60% (good)
            // 200-400ms = 40% (fair)
            // 400-800ms = 20% (poor)
            // >800ms = 10% (very poor)

            if (latency < 50) return 100;
            if (latency < 100) return 80;
            if (latency < 200) return 60;
            if (latency < 400) return 40;
            if (latency < 800) return 20;
            return 10;
        } catch (error) {
            console.log('Could not measure signal strength:', error);
            return 75; // Default to 75% if measurement fails
        }
    };

    // Try to get WiFi SSID using various methods
    const getWiFiSSID = async (): Promise<string | null> => {
        try {
            // Method 1: Try Network Information API (limited support)
            const connection = (navigator as any).connection ||
                (navigator as any).mozConnection ||
                (navigator as any).webkitConnection;

            if (connection && connection.ssid) {
                return connection.ssid;
            }

            // Method 2: Try to get from network information (experimental)
            if ('NetworkInformation' in window && (window as any).NetworkInformation) {
                const netInfo = await (window as any).NetworkInformation.getWifiNetworks();
                if (netInfo && netInfo.length > 0) {
                    return netInfo[0].ssid;
                }
            }

            // Method 3: Check if geolocation can give us network info
            if ('permissions' in navigator) {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                if (permissionStatus.state === 'granted') {
                    // Some browsers expose network name through geolocation metadata
                    // This is a fallback and rarely works
                }
            }

            return null; // SSID not available through browser APIs
        } catch (error) {
            console.log('Could not get WiFi SSID:', error);
            return null;
        }
    };

    useEffect(() => {
        const updateNetworkInfo = async () => {
            // Get connection info from navigator
            const connection = (navigator as any).connection ||
                (navigator as any).mozConnection ||
                (navigator as any).webkitConnection;

            // Try to get network name
            let networkName = 'Unknown';
            let ssid: string | null = null;

            try {
                // Detect platform
                const userAgent = navigator.userAgent.toLowerCase();
                const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
                const isDesktop = !isMobile;
                const isMacOS = /mac os x/i.test(userAgent);
                const isWindows = /windows/i.test(userAgent);
                const isLinux = /linux/i.test(userAgent) && !isMobile;

                // Check connection type from API
                const connectionType = connection?.type;
                const downlink = connection?.downlink || 0;
                const effectiveType = connection?.effectiveType || 'unknown';

                // Try to get actual WiFi SSID
                ssid = await getWiFiSSID();

                // Primary detection: Check if browser exposes connection type
                if (connectionType === 'wifi') {
                    networkName = ssid || 'WiFi';
                } else if (connectionType === 'ethernet') {
                    networkName = 'Ethernet';
                } else if (connectionType === 'cellular') {
                    networkName = 'Mobile Data';
                } else if (!navigator.onLine) {
                    networkName = 'Offline';
                } else {
                    // Secondary detection: Use heuristics based on platform
                    if (isMacOS && isDesktop) {
                        networkName = ssid || 'WiFi';
                    } else if (isWindows && isDesktop) {
                        networkName = downlink > 50 ? 'Ethernet' : (ssid || 'WiFi');
                    } else if (isLinux && isDesktop) {
                        networkName = downlink > 50 ? 'Ethernet' : (ssid || 'WiFi');
                    } else if (isDesktop) {
                        if (downlink === 0 && effectiveType === 'unknown') {
                            networkName = ssid || 'WiFi';
                        } else if (downlink > 50) {
                            networkName = 'Ethernet';
                        } else {
                            networkName = ssid || 'WiFi';
                        }
                    } else if (isMobile) {
                        if (downlink > 15 || effectiveType === '4g') {
                            networkName = ssid || 'WiFi';
                        } else if (downlink > 0) {
                            networkName = 'Mobile Data';
                        } else {
                            networkName = effectiveType === '4g' ? 'Mobile Data' : (ssid || 'WiFi');
                        }
                    } else {
                        networkName = 'Connected';
                    }
                }
            } catch (error) {
                console.log('Could not detect network name:', error);
                const userAgent = navigator.userAgent.toLowerCase();
                const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
                networkName = navigator.onLine ? (isMobile ? 'Mobile Data' : 'WiFi') : 'Offline';
            }

            // Measure actual signal strength
            const signalStrength = navigator.onLine ? await measureSignalStrength() : 0;

            // Only update state if values actually changed to prevent unnecessary re-renders
            setNetworkInfo(prev => {
                const newInfo = {
                    online: navigator.onLine,
                    effectiveType: connection?.effectiveType || 'unknown',
                    downlink: connection?.downlink || 0,
                    rtt: connection?.rtt || 0,
                    networkName: networkName,
                    ssid: ssid,
                    signalStrength: signalStrength
                };
                
                // Check if anything actually changed
                if (
                    prev.online === newInfo.online &&
                    prev.networkName === newInfo.networkName &&
                    Math.abs(prev.signalStrength - newInfo.signalStrength) < 10 // Ignore small signal changes
                ) {
                    return prev; // No change, prevent re-render
                }
                
                return newInfo;
            });
        };

        // Initial update
        updateNetworkInfo();

        // Listen for online/offline events
        window.addEventListener('online', updateNetworkInfo);
        window.addEventListener('offline', updateNetworkInfo);

        // Listen for connection changes
        const connection = (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        if (connection) {
            connection.addEventListener('change', updateNetworkInfo);
        }

        // Update every 30 seconds to get real-time data (reduced to prevent input disruption)
        const interval = setInterval(updateNetworkInfo, 30000);

        return () => {
            window.removeEventListener('online', updateNetworkInfo);
            window.removeEventListener('offline', updateNetworkInfo);
            if (connection) {
                connection.removeEventListener('change', updateNetworkInfo);
            }
            clearInterval(interval);
        };
    }, []);

    // Calculate signal bars (0-5) from signal strength percentage
    const getSignalBars = (): number => {
        if (!networkInfo.online) return 0;

        const { signalStrength } = networkInfo;

        if (signalStrength >= 80) return 5; // Excellent
        if (signalStrength >= 60) return 4; // Very Good
        if (signalStrength >= 40) return 3; // Good
        if (signalStrength >= 20) return 2; // Fair
        if (signalStrength > 0) return 1;   // Poor
        return 0; // No signal
    };

    const signalBars = getSignalBars();

    // Get display type (show 4G/5G for fast 4g connections)
    const getDisplayType = (): string => {
        if (!networkInfo.online) return 'Offline';

        const { effectiveType, downlink } = networkInfo;

        // If downlink is very high, show as 5G
        if (downlink > 10) return '5G';

        // Map effective type to display
        switch (effectiveType) {
            case '4g': return '4G';
            case '3g': return '3G';
            case '2g': return '2G';
            case 'slow-2g': return '1G';
            default: return '4G'; // Default assumption for good connections
        }
    };

    const displayType = getDisplayType();

    // Color scheme based on connection quality
    const getColorScheme = () => {
        if (!networkInfo.online) {
            return {
                bg: 'bg-red-500/30',
                border: 'border-red-400',
                text: 'text-red-100',
                bars: 'text-red-200'
            };
        }

        if (signalBars >= 4) {
            return {
                bg: 'bg-green-500/30',
                border: 'border-green-400',
                text: 'text-green-100',
                bars: 'text-green-200'
            };
        }

        if (signalBars >= 2) {
            return {
                bg: 'bg-yellow-500/30',
                border: 'border-yellow-400',
                text: 'text-yellow-100',
                bars: 'text-yellow-200'
            };
        }

        return {
            bg: 'bg-orange-500/30',
            border: 'border-orange-400',
            text: 'text-orange-100',
            bars: 'text-orange-200'
        };
    };

    const colors = getColorScheme();

    // Render signal bars
    const renderSignalBars = () => {
        const bars = [];
        for (let i = 1; i <= 5; i++) {
            bars.push(
                <div
                    key={i}
                    className={`w-1 rounded-sm transition-all ${
                        i <= signalBars ? 'bg-current' : 'bg-white/20'
                    }`}
                    style={{ height: `${i * 3 + 3}px` }}
                />
            );
        }
        return bars;
    };

    return (
        <div
            className={`${colors.bg} ${colors.border} border-2 rounded-lg px-2.5 py-1 flex items-center gap-2 shadow-md backdrop-blur-sm`}
            title={`${networkInfo.networkName} | ${displayType} | Signal: ${networkInfo.signalStrength}% | RTT: ${networkInfo.rtt}ms | Downlink: ${networkInfo.downlink}Mbps`}
        >
            {/* Signal Bars */}
            <div className={`flex items-end gap-0.5 ${colors.bars}`}>
                {renderSignalBars()}
            </div>

            {/* Network Name and Type */}
            <div className="flex flex-col items-start">
                <span className={`${colors.text} font-bold text-xs leading-tight`}>
                    {networkInfo.networkName}
                </span>
                <span className={`${colors.text} font-semibold text-[10px] leading-tight opacity-90`}>
                    {displayType} • {networkInfo.signalStrength}%
                </span>
            </div>
        </div>
    );
};

export default NetworkStatus;