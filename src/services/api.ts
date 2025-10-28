import axios from 'axios';
import type { Order, PendingOrder, MenuItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Order API functions
export const orderApi = {
  /**
   * Create a new order and get a token
   */
  async createOrder(order: Omit<Order, 'token' | 'createdAt'>): Promise<Order> {
    const response = await api.post('/orders', order);
    return response.data;
  },

  /**
   * Get all orders with optional status filter
   */
  async getAllOrders(status?: string, limit?: number): Promise<Order[]> {
    const response = await api.get('/orders/all', {
      params: { status, limit }
    });
    return response.data;
  },

  /**
   * Get orders for a specific date (YYYY-MM-DD)
   */
  async getOrdersByDate(date: string): Promise<Order[]> {
    const response = await api.get(`/orders/date/${date}`);
    return response.data;
  },

  /**
   * Get all pending orders
   */
  async getPendingOrders(): Promise<PendingOrder[]> {
    const response = await api.get('/orders/pending');
    return response.data;
  },

  /**
   * Get order by token
   */
  async getOrderByToken(token: string): Promise<Order> {
    const response = await api.get(`/orders/${token}`);
    return response.data;
  },

  /**
   * Update an existing order
   */
  async updateOrder(token: string, order: Partial<Order>): Promise<Order> {
    const response = await api.put(`/orders/${token}`, order);
    return response.data;
  },

  /**
   * Complete an order (mark as paid)
   */
  async completeOrder(token: string): Promise<Order> {
    const response = await api.post(`/orders/${token}/complete`);
    return response.data;
  },

  /**
   * Cancel an order (soft delete - marks as cancelled)
   */
  async cancelOrder(token: string): Promise<Order> {
    const response = await api.delete(`/orders/${token}`);
    return response.data;
  },

  /**
   * Permanently delete an order from database
   */
  async deleteOrder(token: string): Promise<void> {
    await api.delete(`/orders/${token}/permanent`);
  },

  /**
   * Delete all orders (requires confirmation)
   */
  async deleteAllOrders(): Promise<{ deletedCount: number }> {
    const response = await api.delete('/orders?confirm=yes');
    return response.data;
  },
};

// Token API functions
export const tokenApi = {
  /**
   * Get current token count
   */
  async getCurrentTokenCount(): Promise<number> {
    const response = await api.get('/tokens/current');
    return response.data.count;
  },

  /**
   * Get token generation history
   */
  async getTokenHistory(date?: string): Promise<unknown[]> {
    const response = await api.get('/tokens/history', {
      params: { date },
    });
    return response.data;
  },

  /**
   * Reset token counter to 1 (end of day)
   */
  async resetTokenCounter(): Promise<{ message: string }> {
    const response = await api.post('/tokens/reset');
    return response.data;
  },
};

// Menu API functions
export const menuApi = {
  /**
   * Get all menu items
   */
  async getAllMenuItems(): Promise<MenuItem[]> {
    const response = await api.get('/menu');
    return response.data;
  },

  /**
   * Get menu items by category
   */
  async getMenuByCategory(category: string): Promise<MenuItem[]> {
    const response = await api.get(`/menu/${category}`);
    return response.data;
  },

  /**
   * Create a new menu item
   */
  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const response = await api.post('/menu', item);
    return response.data;
  },

  /**
   * Update an existing menu item
   */
  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const response = await api.put(`/menu/${id}`, item);
    return response.data;
  },

  /**
   * Delete a menu item
   */
  async deleteMenuItem(id: string): Promise<void> {
    await api.delete(`/menu/${id}`);
  },
};

export const refreshApi = {
    /**
     * Refresh all data from the server
     * Returns all necessary data in a single call for efficiency
     */
    async refreshAllData(): Promise<{
        menuItems: MenuItem[];
        pendingOrders: PendingOrder[];
        recentOrders: Order[];
        tokenCount: number;
    }> {
        try {
            // Make all API calls in parallel for better performance
            const [menuItems, pendingOrders, recentOrders, tokenCountData] = await Promise.all([
                menuApi.getAllMenuItems(),
                orderApi.getPendingOrders(),
                orderApi.getAllOrders('completed', 10), // Get last 10 completed orders
                tokenApi.getCurrentTokenCount()
            ]);

            return {
                menuItems,
                pendingOrders,
                recentOrders,
                tokenCount: tokenCountData
            };
        } catch (error) {
            console.error('Error refreshing all data:', error);
            throw error;
        }
    },

    /**
     * Refresh menu data only
     */
    async refreshMenuData(): Promise<MenuItem[]> {
        return await menuApi.getAllMenuItems();
    },

    /**
     * Refresh orders data only
     */
    async refreshOrdersData(): Promise<{
        pendingOrders: PendingOrder[];
        recentOrders: Order[];
    }> {
        const [pendingOrders, recentOrders] = await Promise.all([
            orderApi.getPendingOrders(),
            orderApi.getAllOrders('completed', 10)
        ]);

        return { pendingOrders, recentOrders };
    }
};

export default api;
