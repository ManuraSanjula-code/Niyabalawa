import { pool } from '../database/postgres';
import { Order, CartItem } from '../types';
import { tokenService } from './tokenService';

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(
    orderType: 'dine-in' | 'take-away',
    items: CartItem[],
    total: number,
    frontendId?: string,
    pagerNumber?: number
  ): Promise<Order> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

  // Generate token (tokenResponse.tokenNumber is stored in DB, displayToken is shown to users)
  const tokenResponse = await tokenService.generateToken(frontendId);

      // Determine initial status based on order type
      const status = orderType === 'dine-in' ? 'pending' : 'paid';

      // Insert order
      // Store DB-unique token (includes date prefix) to avoid duplicates across days
      const orderResult = await client.query(
        `INSERT INTO orders (token_number, order_type, status, items, total, frontend_id, pager_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [tokenResponse.tokenNumber, orderType, status, JSON.stringify(items), total, frontendId, pagerNumber]
      );

      const order = orderResult.rows[0];

      // Insert order items for better querying
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, item_id, item_name, price, quantity, portion, category, rice_type, rice_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            order.id,
            item.id,
            item.name,
            item.price,
            item.quantity,
            item.portion || null,
            item.category || null,
            item.riceType || null,
            item.ricePrice || 0,
          ]
        );
      }

      await client.query('COMMIT');

  console.log(`✅ Created order ${tokenResponse.displayToken} (${orderType})`);

  // Return order formatted for frontend (tokenNumber will be the display token)
  return this.formatOrder(order, tokenResponse.displayToken);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating order:', error);
      throw new Error('Failed to create order');
    } finally {
      client.release();
    }
  }

  /**
   * Get all orders with optional filtering
   */
  async getAllOrders(status?: string, limit?: number): Promise<Order[]> {
    try {
      let query = 'SELECT * FROM orders';
      const params: (string | number)[] = [];

      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }

  const result = await pool.query(query, params);
        return result.rows.map((r: Record<string, unknown>) => this.formatOrder(r));
    } catch (error) {
      console.error('❌ Error getting all orders:', error);
      throw error; // Re-throw to allow route-level error handling
    }
  }

  /**
   * Get all pending orders (dine-in only)
   */
  async getPendingOrders(): Promise<Order[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM orders
         WHERE status = 'pending'
         ORDER BY created_at DESC`
      );

        return result.rows.map((r: Record<string, unknown>) => this.formatOrder(r));
    } catch (error) {
      console.error('❌ Error getting pending orders:', error);
      throw error; // Re-throw to allow route-level error handling
    }
  }

  /**
   * Get order by token number
   */
  async getOrderByToken(tokenNumber: string): Promise<Order | null> {
    try {
      // Accept either full DB token (with date prefix) or simple display token (e.g., "1")
      const result = await pool.query(
        `SELECT * FROM orders WHERE token_number = $1 OR token_number LIKE '%' || '-' || $1 OR token_number LIKE '%' || '@' || $1`,
        [tokenNumber]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatOrder(result.rows[0]);
    } catch (error) {
      console.error('❌ Error getting order by token:', error);
      throw error; // Re-throw to allow route-level error handling
    }
  }

  /**
   * Update order items and total
   */
  async updateOrder(
    tokenNumber: string,
    items: CartItem[],
    total: number
  ): Promise<Order | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current order to store original items. Accept display or DB token formats.
      const currentOrder = await client.query(
        `SELECT * FROM orders WHERE token_number = $1 OR token_number LIKE '%' || '-' || $1 OR token_number LIKE '%' || '@' || $1`,
        [tokenNumber]
      );

      if (currentOrder.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const currentData = currentOrder.rows[0];
      const originalItems = currentData.original_items || currentData.items;

      // Update order with new items and mark as edited
      const result = await client.query(
        `UPDATE orders
         SET items = $1, total = $2, updated_at = NOW(), original_items = $3, is_edited = true
         WHERE token_number = $4 OR token_number LIKE '%' || '-' || $4 OR token_number LIKE '%' || '@' || $4
         RETURNING *`,
        [JSON.stringify(items), total, JSON.stringify(originalItems), tokenNumber]
      );

      const order = result.rows[0];

      // Delete old order items
      await client.query(
        `DELETE FROM order_items WHERE order_id = $1`,
        [order.id]
      );

      // Insert new order items
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, item_id, item_name, price, quantity, portion, category, rice_type, rice_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            order.id,
            item.id,
            item.name,
            item.price,
            item.quantity,
            item.portion || null,
            item.category || null,
            item.riceType || null,
            item.ricePrice || 0,
          ]
        );
      }

      await client.query('COMMIT');

      console.log(`✅ Updated order ${tokenNumber}`);

      return this.formatOrder(order);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error updating order:', error);
      throw new Error('Failed to update order');
    } finally {
      client.release();
    }
  }

  /**
   * Complete an order (mark as paid)
   */
  async completeOrder(tokenNumber: string): Promise<Order | null> {
    try {
      const result = await pool.query(
        `UPDATE orders
         SET status = 'paid', completed_at = NOW(), updated_at = NOW()
         WHERE token_number = $1 OR token_number LIKE '%' || '-' || $1 OR token_number LIKE '%' || '@' || $1
         RETURNING *`,
        [tokenNumber]
      );

      if (result.rows.length === 0) {
        return null;
      }

      console.log(`✅ Completed order ${tokenNumber}`);

      return this.formatOrder(result.rows[0]);
    } catch (error) {
      console.error('❌ Error completing order:', error);
      throw new Error('Failed to complete order');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(tokenNumber: string): Promise<Order | null> {
    try {
      const result = await pool.query(
        `UPDATE orders
         SET status = 'cancelled', updated_at = NOW()
         WHERE token_number = $1 OR token_number LIKE '%' || '-' || $1 OR token_number LIKE '%' || '@' || $1
         RETURNING *`,
        [tokenNumber]
      );

      if (result.rows.length === 0) {
        return null;
      }

      console.log(`✅ Cancelled order ${tokenNumber}`);

      return this.formatOrder(result.rows[0]);
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      throw new Error('Failed to cancel order');
    }
  }

  /**
   * Delete an order completely (removes from database)
   */
  async deleteOrder(tokenNumber: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get order ID
      const orderResult = await client.query(
        `SELECT id FROM orders WHERE token_number = $1 OR token_number LIKE '%' || '-' || $1 OR token_number LIKE '%' || '@' || $1`,
        [tokenNumber]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const orderId = orderResult.rows[0].id;

      // Delete order items first (foreign key constraint)
      await client.query(
        `DELETE FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      // Delete the order
      await client.query(
        `DELETE FROM orders WHERE id = $1`,
        [orderId]
      );

      await client.query('COMMIT');
      console.log(`✅ Deleted order ${tokenNumber} completely`);

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error deleting order:', error);
      throw new Error('Failed to delete order');
    } finally {
      client.release();
    }
  }

  /**
   * Delete all orders (for testing/reset purposes)
   */
  async deleteAllOrders(): Promise<number> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete all order items first
      await client.query('DELETE FROM order_items');

      // Delete all orders
      const result = await client.query('DELETE FROM orders');

      await client.query('COMMIT');

      const deletedCount = result.rowCount || 0;
      console.log(`✅ Deleted ${deletedCount} orders`);

      return deletedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error deleting all orders:', error);
      throw new Error('Failed to delete all orders');
    } finally {
      client.release();
    }
  }

  /**
   * Get orders by date range
   */
  async getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM orders
         WHERE created_at >= $1 AND created_at <= $2
         ORDER BY created_at DESC`,
        [startDate, endDate]
      );

        return result.rows.map((r: Record<string, unknown>) => this.formatOrder(r));
    } catch (error) {
      console.error('❌ Error getting orders by date range:', error);
      throw error; // Re-throw to allow route-level error handling
    }
  }

  /**
   * Get orders for a specific date interpreted in Asia/Kolkata timezone.
   * This avoids timezone mismatches by converting created_at to India local date
   * and comparing the YYYY-MM-DD string.
   */
  async getOrdersByDate(date: string): Promise<Order[]> {
    try {
      console.log(`🔍 Querying orders for date: ${date} (Asia/Kolkata timezone)`);

      // Convert created_at from UTC to Asia/Kolkata timezone before extracting date
      const result = await pool.query(
        `SELECT * FROM orders
         WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $1::date
         ORDER BY created_at DESC`,
        [date]
      );

      console.log(`📊 Found ${result.rows.length} orders for date ${date}`);

      return result.rows.map((r: Record<string, unknown>) => this.formatOrder(r));
    } catch (error) {
      console.error('❌ Error getting orders by date:', error);
      throw error; // Re-throw to allow route-level error handling
    }
  }

  /**
   * Get today's order summary with statistics
   */
  async getTodayOrderSummary(): Promise<{
    date: string;
    totalOrders: number;
    totalRevenue: number;
    dineInOrders: number;
    takeAwayOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    orders: Order[];
    itemsSummary: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
  }> {
    try {
      // Get today's date in YYYY-MM-DD format (Asia/Kolkata timezone)
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      console.log(`📊 Getting order summary for: ${today}`);

      // Get all orders for today
      const orders = await this.getOrdersByDate(today);

      // Calculate statistics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const dineInOrders = orders.filter(o => o.orderType === 'dine-in').length;
      const takeAwayOrders = orders.filter(o => o.orderType === 'take-away').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const completedOrders = orders.filter(o => o.status === 'paid' || o.status === 'completed').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

      // Calculate item-wise summary
      const itemsMap = new Map<string, { quantity: number; revenue: number }>();
      
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const itemName = item.name || 'Unknown Item';
            const quantity = item.quantity || 1;
            const itemTotal = (item.price || 0) * quantity;
            
            const existing = itemsMap.get(itemName);
            if (existing) {
              existing.quantity += quantity;
              existing.revenue += itemTotal;
            } else {
              itemsMap.set(itemName, { quantity, revenue: itemTotal });
            }
          });
        }
      });

      // Convert items map to array and sort by quantity (descending)
      const itemsSummary = Array.from(itemsMap.entries())
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.quantity - a.quantity);

      console.log(`📊 Summary: ${totalOrders} orders, Rs. ${totalRevenue.toFixed(2)} revenue`);

      return {
        date: today,
        totalOrders,
        totalRevenue,
        dineInOrders,
        takeAwayOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        orders,
        itemsSummary
      };
    } catch (error) {
      console.error('❌ Error getting today\'s order summary:', error);
      throw error;
    }
  }

  /**
   * Format database order to Order type
   */
  /**
   * Format a DB order to the frontend Order shape.
   * If overrideDisplayToken is provided (from generateToken) use it; otherwise
   * try to extract the short display token from the stored token_number.
   */
  private formatOrder(dbOrder: Record<string, unknown>, overrideDisplayToken?: string): Order {
    const rawToken = (dbOrder.token_number as string) || '';

    // If caller provided display token (from tokenService), prefer it
    let displayToken = overrideDisplayToken;

    if (!displayToken) {
      if (rawToken.includes('@')) {
        displayToken = rawToken.split('@').pop() || rawToken;
      } else if (rawToken.includes('-')) {
        displayToken = rawToken.split('-').pop() || rawToken;
      } else {
        displayToken = rawToken;
      }
    }

    return {
      id: dbOrder.id as string,
      // tokenNumber returned to frontend should be the short/display token
      tokenNumber: displayToken || (rawToken as string),
      orderType: dbOrder.order_type as 'dine-in' | 'take-away',
      status: dbOrder.status as 'pending' | 'paid' | 'completed' | 'cancelled',
      items: dbOrder.items as CartItem[],
      total: parseFloat(dbOrder.total as string),
      createdAt: new Date(dbOrder.created_at as string),
      updatedAt: new Date(dbOrder.updated_at as string),
      completedAt: dbOrder.completed_at ? new Date(dbOrder.completed_at as string) : undefined,
      frontendId: dbOrder.frontend_id as string | undefined,
      originalItems: dbOrder.original_items as CartItem[] | undefined,
      isEdited: dbOrder.is_edited as boolean | undefined,
      pagerNumber: dbOrder.pager_number as number | undefined,
    };
  }
}

export const orderService = new OrderService();
