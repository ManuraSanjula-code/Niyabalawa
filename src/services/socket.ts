import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private frontendId: string;

  constructor() {
    // Generate a unique frontend ID for this instance
    this.frontendId = `frontend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Connect to the Socket.IO server
   */
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
      // Identify this frontend instance
      this.socket?.emit('identify', this.frontendId);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to new order events
   */
  onNewOrder(callback: (order: any) => void): void {
    this.socket?.on('new_order', callback);
  }

  /**
   * Subscribe to order update events
   */
  onOrderUpdate(callback: (order: any) => void): void {
    this.socket?.on('order_updated', callback);
  }

  /**
   * Subscribe to order completion events
   */
  onOrderComplete(callback: (data: { token: string; order: any }) => void): void {
    this.socket?.on('order_completed', callback);
  }

  /**
   * Subscribe to order cancellation events
   */
  onOrderCancel(callback: (data: { token: string }) => void): void {
    this.socket?.on('order_cancelled', callback);
  }

  /**
   * Request pending orders count
   */
  requestPendingOrders(): void {
    this.socket?.emit('request_pending_orders');
  }

  /**
   * Unsubscribe from all events
   */
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  /**
   * Get the frontend ID
   */
  getFrontendId(): string {
    return this.frontendId;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create a singleton instance
export const socketService = new SocketService();

export default socketService;
