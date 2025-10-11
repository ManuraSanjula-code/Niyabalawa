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
    frontendId?: string
  ): Promise<Order> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate token
      const tokenResponse = await tokenService.generateToken(frontendId);

      // Determine initial status based on order type
      const status = orderType === 'dine-in' ? 'pending' : 'paid';

      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders (token_number, order_type, status, items, total, frontend_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [tokenResponse.displayToken, orderType, status, JSON.stringify(items), total, frontendId]
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

      return this.formatOrder(order);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating order:', error);
      throw new Error('Failed to create order');
    } finally {
      client.release();
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

      return result.rows.map(this.formatOrder);
    } catch (error) {
      console.error('❌ Error getting pending orders:', error);
      return [];
    }
  }

  /**
   * Get order by token number
   */
  async getOrderByToken(tokenNumber: string): Promise<Order | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM orders WHERE token_number = $1`,
        [tokenNumber]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatOrder(result.rows[0]);
    } catch (error) {
      console.error('❌ Error getting order by token:', error);
      return null;
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

      // Update order
      const result = await client.query(
        `UPDATE orders
         SET items = $1, total = $2, updated_at = NOW()
         WHERE token_number = $3
         RETURNING *`,
        [JSON.stringify(items), total, tokenNumber]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

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
         WHERE token_number = $1
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
         WHERE token_number = $1
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
        `SELECT id FROM orders WHERE token_number = $1`,
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
         WHERE created_at >= $1 AND created_at < $2
         ORDER BY created_at DESC`,
        [startDate, endDate]
      );

      return result.rows.map(this.formatOrder);
    } catch (error) {
      console.error('❌ Error getting orders by date range:', error);
      return [];
    }
  }

  /**
   * Format database order to Order type
   */
  private formatOrder(dbOrder: Record<string, unknown>): Order {
    return {
      id: dbOrder.id as string,
      tokenNumber: dbOrder.token_number as string,
      orderType: dbOrder.order_type as 'dine-in' | 'take-away',
      status: dbOrder.status as 'pending' | 'paid' | 'completed' | 'cancelled',
      items: dbOrder.items as CartItem[],
      total: parseFloat(dbOrder.total as string),
      createdAt: new Date(dbOrder.created_at as string),
      updatedAt: new Date(dbOrder.updated_at as string),
      completedAt: dbOrder.completed_at ? new Date(dbOrder.completed_at as string) : undefined,
      frontendId: dbOrder.frontend_id as string | undefined,
    };
  }
}

export const orderService = new OrderService();
