// hooks/useBackgroundData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socket';
import { menuApi, orderApi, refreshApi } from '../services/api';
import type { MenuItem, Order, PendingOrder, CartItem } from '../types';

interface BackgroundDataState {
    menuItems: MenuItem[];
    orders: Order[];
    pendingOrders: PendingOrder[];
    loading: {
        menu: boolean;
        orders: boolean;
        pending: boolean;
        all: boolean;
    };
    progress: {
        menu: number;
        orders: number;
        pending: number;
    };
    lastUpdated: Date | null;
    errors: {
        menu: string | null;
        orders: string | null;
        pending: string | null;
    };
}

// Queue for order operations during loading
interface OrderOperation {
    type: 'create' | 'update' | 'delete' | 'complete';
    data: any;
    timestamp: number;
}

export const useBackgroundData = () => {
    const [data, setData] = useState<BackgroundDataState>({
        menuItems: [],
        orders: [],
        pendingOrders: [],
        loading: {
            menu: false,
            orders: false,
            pending: false,
            all: false,
        },
        progress: {
            menu: 0,
            orders: 0,
            pending: 0,
        },
        lastUpdated: null,
        errors: {
            menu: null,
            orders: null,
            pending: null,
        },
    });

    // Refs for queue and temporary storage
    const orderOperationsQueue = useRef<OrderOperation[]>([]);
    const temporaryOrders = useRef<Map<string, Order>>(new Map());
    const temporaryPendingOrders = useRef<Map<string, PendingOrder>>(new Map());
    const isProcessingQueue = useRef(false);

    // Add operation to queue
    const queueOrderOperation = useCallback((operation: OrderOperation) => {
        orderOperationsQueue.current.push(operation);
        processOperationQueue();
    }, []);

    // Process the operation queue
    const processOperationQueue = useCallback(async () => {
        if (isProcessingQueue.current || orderOperationsQueue.current.length === 0) {
            return;
        }

        isProcessingQueue.current = true;

        while (orderOperationsQueue.current.length > 0) {
            const operation = orderOperationsQueue.current.shift();
            if (!operation) continue;

            try {
                switch (operation.type) {
                    case 'create':
                        // Add to temporary storage immediately for UI responsiveness
                        const newOrder = operation.data as Order;
                        temporaryOrders.current.set(newOrder.tokenNumber, newOrder);
                        if (newOrder.status === 'pending') {
                            temporaryPendingOrders.current.set(newOrder.tokenNumber, newOrder as PendingOrder);
                        }
                        break;

                    case 'update':
                        const updatedOrder = operation.data as Order;
                        temporaryOrders.current.set(updatedOrder.tokenNumber, updatedOrder);
                        if (updatedOrder.status === 'pending') {
                            temporaryPendingOrders.current.set(updatedOrder.tokenNumber, updatedOrder as PendingOrder);
                        } else {
                            temporaryPendingOrders.current.delete(updatedOrder.tokenNumber);
                        }
                        break;

                    case 'delete':
                        const tokenToDelete = operation.data.token;
                        temporaryOrders.current.delete(tokenToDelete);
                        temporaryPendingOrders.current.delete(tokenToDelete);
                        break;

                    case 'complete':
                        const completedOrder = operation.data.order;
                        temporaryOrders.current.set(completedOrder.tokenNumber, completedOrder);
                        temporaryPendingOrders.current.delete(completedOrder.tokenNumber);
                        break;
                }
            } catch (error) {
                console.error('Error processing operation:', error);
            }
        }

        isProcessingQueue.current = false;

        // Update UI with temporary data
        updateUIWithTemporaryData();
    }, []);

    const updateUIWithTemporaryData = useCallback(() => {
        const tempOrders = Array.from(temporaryOrders.current.values());
        const tempPendingOrders = Array.from(temporaryPendingOrders.current.values());

        setData(prev => ({
            ...prev,
            orders: [...prev.orders, ...tempOrders],
            pendingOrders: [...prev.pendingOrders, ...tempPendingOrders],
            lastUpdated: new Date(),
        }));
    }, []);

    // Incremental updates for better performance
    const updateMenuIncrementally = useCallback((newItems: MenuItem[]) => {
        setData(prev => ({
            ...prev,
            menuItems: newItems,
            lastUpdated: new Date(),
            errors: { ...prev.errors, menu: null },
        }));
    }, []);

    const updateOrdersIncrementally = useCallback((newOrders: Order[]) => {
        // Merge with temporary orders
        const mergedOrders = [...newOrders, ...Array.from(temporaryOrders.current.values())];
        const uniqueOrders = Array.from(new Map(mergedOrders.map(order => [order.tokenNumber, order])).values());

        setData(prev => ({
            ...prev,
            orders: uniqueOrders,
            lastUpdated: new Date(),
            errors: { ...prev.errors, orders: null },
        }));
    }, []);

    const updatePendingOrdersIncrementally = useCallback((newPending: PendingOrder[]) => {
        // Merge with temporary pending orders
        const mergedPending = [...newPending, ...Array.from(temporaryPendingOrders.current.values())];
        const uniquePending = Array.from(new Map(mergedPending.map(order => [order.tokenNumber, order])).values());

        setData(prev => ({
            ...prev,
            pendingOrders: uniquePending,
            lastUpdated: new Date(),
            errors: { ...prev.errors, pending: null },
        }));
    }, []);

    // Load menu items with fallback strategies
    const loadMenuItemsInBackground = useCallback(async (useStreaming: boolean = true) => {
        setData(prev => ({
            ...prev,
            loading: { ...prev.loading, menu: true, all: true },
            progress: { ...prev.progress, menu: 0 }
        }));

        try {
            if (useStreaming && socketService.isConnected()) {
                socketService.requestStreamedData('menu');
            } else {
                console.log('Using regular API for menu items');
                const menuItems = await menuApi.getAllMenuItems();
                updateMenuIncrementally(menuItems);
                setData(prev => ({
                    ...prev,
                    progress: { ...prev.progress, menu: 100 }
                }));
            }
        } catch (error) {
            console.error('Background menu load failed:', error);
            setData(prev => ({
                ...prev,
                errors: { ...prev.errors, menu: 'Failed to load menu items' }
            }));
        } finally {
            setTimeout(() => {
                setData(prev => ({
                    ...prev,
                    loading: { ...prev.loading, menu: false, all: prev.loading.orders || prev.loading.pending }
                }));
            }, 500);
        }
    }, [updateMenuIncrementally]);

    // Load orders in background
    const loadOrdersInBackground = useCallback(async (useStreaming: boolean = true) => {
        setData(prev => ({
            ...prev,
            loading: { ...prev.loading, orders: true, all: true },
            progress: { ...prev.progress, orders: 0 }
        }));

        try {
            if (useStreaming && socketService.isConnected()) {
                socketService.requestStreamedData('orders');
            } else {
                const orders = await orderApi.getAllOrders();
                updateOrdersIncrementally(orders);
                setData(prev => ({
                    ...prev,
                    progress: { ...prev.progress, orders: 100 }
                }));
            }
        } catch (error) {
            console.error('Background orders load failed:', error);
            setData(prev => ({
                ...prev,
                errors: { ...prev.errors, orders: 'Failed to load orders' }
            }));
        } finally {
            setTimeout(() => {
                setData(prev => ({
                    ...prev,
                    loading: { ...prev.loading, orders: false, all: prev.loading.menu || prev.loading.pending }
                }));
            }, 500);
        }
    }, [updateOrdersIncrementally]);

    // Load pending orders in background
    const loadPendingOrdersInBackground = useCallback(async (useStreaming: boolean = true) => {
        setData(prev => ({
            ...prev,
            loading: { ...prev.loading, pending: true, all: true },
            progress: { ...prev.progress, pending: 0 }
        }));

        try {
            if (useStreaming && socketService.isConnected()) {
                socketService.requestStreamedData('pending');
            } else {
                const pendingOrders = await orderApi.getPendingOrders();
                updatePendingOrdersIncrementally(pendingOrders);
                setData(prev => ({
                    ...prev,
                    progress: { ...prev.progress, pending: 100 }
                }));
            }
        } catch (error) {
            console.error('Background pending orders load failed:', error);
            setData(prev => ({
                ...prev,
                errors: { ...prev.errors, pending: 'Failed to load pending orders' }
            }));
        } finally {
            setTimeout(() => {
                setData(prev => ({
                    ...prev,
                    loading: { ...prev.loading, pending: false, all: prev.loading.menu || prev.loading.orders }
                }));
            }, 500);
        }
    }, [updatePendingOrdersIncrementally]);

    // Refresh all data using your existing refreshApi
    const refreshAllData = useCallback(async () => {
        console.log('Refreshing all data in background...');

        setData(prev => ({
            ...prev,
            loading: { menu: true, orders: true, pending: true, all: true },
            progress: { menu: 0, orders: 0, pending: 0 },
        }));

        try {
            const refreshedData = await refreshApi.refreshAllData();

            // Update data incrementally to avoid UI blocking
            if (refreshedData.menuItems) {
                updateMenuIncrementally(refreshedData.menuItems);
                setData(prev => ({ ...prev, progress: { ...prev.progress, menu: 100 } }));
            }

            if (refreshedData.pendingOrders) {
                updatePendingOrdersIncrementally(refreshedData.pendingOrders);
                setData(prev => ({ ...prev, progress: { ...prev.progress, pending: 100 } }));
            }

            if (refreshedData.recentOrders) {
                updateOrdersIncrementally(refreshedData.recentOrders);
                setData(prev => ({ ...prev, progress: { ...prev.progress, orders: 100 } }));
            }

            console.log('All data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing all data:', error);
            // Fallback to individual loads
            await Promise.allSettled([
                loadMenuItemsInBackground(false),
                loadOrdersInBackground(false),
                loadPendingOrdersInBackground(false),
            ]);
        } finally {
            setTimeout(() => {
                setData(prev => ({
                    ...prev,
                    loading: { menu: false, orders: false, pending: false, all: false },
                }));
            }, 1000);
        }
    }, [loadMenuItemsInBackground, loadOrdersInBackground, loadPendingOrdersInBackground, updateMenuIncrementally, updateOrdersIncrementally, updatePendingOrdersIncrementally]);

    // Order management functions that work during loading
    const createOrder = useCallback((order: Order) => {
        queueOrderOperation({
            type: 'create',
            data: order,
            timestamp: Date.now()
        });
    }, [queueOrderOperation]);

    const updateOrder = useCallback((order: Order) => {
        queueOrderOperation({
            type: 'update',
            data: order,
            timestamp: Date.now()
        });
    }, [queueOrderOperation]);

    const deleteOrder = useCallback((token: string) => {
        queueOrderOperation({
            type: 'delete',
            data: { token },
            timestamp: Date.now()
        });
    }, [queueOrderOperation]);

    const completeOrder = useCallback((order: Order) => {
        queueOrderOperation({
            type: 'complete',
            data: { order },
            timestamp: Date.now()
        });
    }, [queueOrderOperation]);

    // Setup socket listeners for streaming data
    useEffect(() => {
        // Menu items streaming
        socketService.onStreamData('menu', (menuItems: MenuItem[]) => {
            updateMenuIncrementally(menuItems);
        });

        socketService.onStreamProgress('menu', (progress: number) => {
            setData(prev => ({ ...prev, progress: { ...prev.progress, menu: progress } }));
        });

        // Orders streaming
        socketService.onStreamData('orders', (orders: Order[]) => {
            updateOrdersIncrementally(orders);
        });

        socketService.onStreamProgress('orders', (progress: number) => {
            setData(prev => ({ ...prev, progress: { ...prev.progress, orders: progress } }));
        });

        // Pending orders streaming
        socketService.onStreamData('pending', (pendingOrders: PendingOrder[]) => {
            updatePendingOrdersIncrementally(pendingOrders);
        });

        socketService.onStreamProgress('pending', (progress: number) => {
            setData(prev => ({ ...prev, progress: { ...prev.progress, pending: progress } }));
        });

        // Real-time updates for immediate changes
        socketService.onNewOrder((order: Order) => {
            createOrder(order);
        });

        socketService.onOrderUpdate((order: Order) => {
            updateOrder(order);
        });

        socketService.onOrderComplete((data: { token: string; order: Order }) => {
            completeOrder(data.order);
        });

        socketService.onOrderCancel((data: { token: string }) => {
            deleteOrder(data.token);
        });

        // Real-time menu updates
        socketService.onMenuItemAdded((item: MenuItem) => {
            setData(prev => ({
                ...prev,
                menuItems: [...prev.menuItems, item],
                lastUpdated: new Date(),
            }));
        });

        socketService.onMenuItemUpdated((item: MenuItem) => {
            setData(prev => ({
                ...prev,
                menuItems: prev.menuItems.map(i => i.id === item.id ? item : i),
                lastUpdated: new Date(),
            }));
        });

        socketService.onMenuItemDeleted((id: string) => {
            setData(prev => ({
                ...prev,
                menuItems: prev.menuItems.filter(i => i.id !== id),
                lastUpdated: new Date(),
            }));
        });

        return () => {
            socketService.removeAllListeners();
        };
    }, [updateMenuIncrementally, updateOrdersIncrementally, updatePendingOrdersIncrementally, createOrder, updateOrder, deleteOrder, completeOrder]);

    // Initial background load
    useEffect(() => {
        const loadInitialData = async () => {
            console.log('Starting initial background data load...');

            // Start with critical data first, then load the rest
            await loadMenuItemsInBackground();

            // Load other data in background without blocking
            setTimeout(() => {
                loadOrdersInBackground();
                loadPendingOrdersInBackground();
            }, 1000);
        };

        loadInitialData();
    }, [loadMenuItemsInBackground, loadOrdersInBackground, loadPendingOrdersInBackground]);

    return {
        ...data,
        loadMenuItemsInBackground,
        loadOrdersInBackground,
        loadPendingOrdersInBackground,
        refreshAllData,
        updateMenuIncrementally,
        updateOrdersIncrementally,
        updatePendingOrdersIncrementally,
        // Order management functions
        createOrder,
        updateOrder,
        deleteOrder,
        completeOrder,
        // Queue status
        hasPendingOperations: orderOperationsQueue.current.length > 0,
    };
};