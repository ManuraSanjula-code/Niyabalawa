// services/socket.ts
import { io, Socket } from 'socket.io-client';
import type { Order, PendingOrder, MenuItem } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface StreamChunk {
    chunk: any[];
    total: number;
    current: number;
    type: 'menu' | 'orders' | 'pending';
}

class EnhancedSocketService {
    private socket: Socket | null = null;
    private frontendId: string;
    private chunkBuffers: Map<string, any[]> = new Map();
    private streamCallbacks: Map<string, (data: any) => void> = new Map();

    constructor() {
        this.frontendId = `frontend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    connect(): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to backend server');
            this.socket?.emit('identify', this.frontendId);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from backend server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        // Stream data handlers
        this.socket.on('stream_data_start', (data: { type: string; total: number }) => {
            console.log(`📦 Starting stream for ${data.type}, total: ${data.total}`);
            this.chunkBuffers.set(data.type, []);
        });

        this.socket.on('stream_data_chunk', (chunk: StreamChunk) => {
            this.handleDataChunk(chunk);
        });

        this.socket.on('stream_data_end', (data: { type: string }) => {
            console.log(`✅ Stream completed for ${data.type}`);
            this.processCompleteStream(data.type);
        });

        return this.socket;
    }

    private handleDataChunk(chunk: StreamChunk) {
        const { type, chunk: data, current, total } = chunk;

        if (!this.chunkBuffers.has(type)) {
            this.chunkBuffers.set(type, []);
        }

        const buffer = this.chunkBuffers.get(type)!;
        buffer.push(...data);

        // Progress callback
        if (this.streamCallbacks.has(`${type}_progress`)) {
            const progress = Math.round((current / total) * 100);
            this.streamCallbacks.get(`${type}_progress`)!(progress);
        }

        // Process chunk immediately for better UX
        if (this.streamCallbacks.has(`${type}_chunk`)) {
            this.streamCallbacks.get(`${type}_chunk`)!(data);
        }

        console.log(`📦 Received chunk ${current}/${total} for ${type}`);
    }

    private processCompleteStream(type: string) {
        const buffer = this.chunkBuffers.get(type);
        if (buffer && this.streamCallbacks.has(type)) {
            this.streamCallbacks.get(type)!(buffer);
        }
        this.chunkBuffers.delete(type);
    }

    // Request streamed data
    requestStreamedData(type: 'menu' | 'orders' | 'pending'): void {
        this.socket?.emit('request_stream_data', { type });
    }

    // Register callbacks for different stream events
    onStreamData(type: string, callback: (data: any) => void): void {
        this.streamCallbacks.set(type, callback);
    }

    onStreamProgress(type: string, callback: (progress: number) => void): void {
        this.streamCallbacks.set(`${type}_progress`, callback);
    }

    onStreamChunk(type: string, callback: (chunk: any[]) => void): void {
        this.streamCallbacks.set(`${type}_chunk`, callback);
    }

    // Real-time order events
    onNewOrder(callback: (order: Order) => void): void {
        this.socket?.on('new_order', callback);
    }

    onOrderUpdate(callback: (order: Order) => void): void {
        this.socket?.on('order_updated', callback);
    }

    onOrderComplete(callback: (data: { token: string; order: Order }) => void): void {
        this.socket?.on('order_completed', callback);
    }

    onOrderCancel(callback: (data: { token: string }) => void): void {
        this.socket?.on('order_cancelled', callback);
    }

    // Menu item events
    onMenuItemAdded(callback: (item: MenuItem) => void): void {
        this.socket?.on('menu_item_added', callback);
    }

    onMenuItemUpdated(callback: (item: MenuItem) => void): void {
        this.socket?.on('menu_item_updated', callback);
    }

    onMenuItemDeleted(callback: (id: string) => void): void {
        this.socket?.on('menu_item_deleted', callback);
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    removeAllListeners(): void {
        this.socket?.removeAllListeners();
        this.streamCallbacks.clear();
    }

    getFrontendId(): string {
        return this.frontendId;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const socketService = new EnhancedSocketService();