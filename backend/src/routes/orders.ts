import { Router, Request, Response } from 'express';
import { orderService } from '../services/orderService';

const router = Router();

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { orderType, items, total, frontendId } = req.body;

    if (!orderType || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order = await orderService.createOrder(orderType, items, total, frontendId);

    // Emit socket event (will be handled by socket.io in server.ts)
    const io = req.app.get('io');
    if (io) {
      io.emit('order_created', order);
      if (orderType === 'dine-in') {
        io.emit('pending_orders_updated');
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * GET /api/orders/all
 * Get all orders with optional status filter
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const { status, limit } = req.query;
    const orders = await orderService.getAllOrders(
      status as string | undefined,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(orders);
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

/**
 * GET /api/orders/pending
 * Get all pending orders
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getPendingOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error getting pending orders:', error);
    res.status(500).json({ error: 'Failed to get pending orders' });
  }
});

/**
 * GET /api/orders/:tokenNumber
 * Get order by token number
 */
router.get('/:tokenNumber', async (req: Request, res: Response) => {
  try {
    const { tokenNumber } = req.params;
    const order = await orderService.getOrderByToken(tokenNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

/**
 * PUT /api/orders/:tokenNumber
 * Update order items and total
 */
router.put('/:tokenNumber', async (req: Request, res: Response) => {
  try {
    const { tokenNumber } = req.params;
    const { items, total } = req.body;

    if (!items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order = await orderService.updateOrder(tokenNumber, items, total);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('order_updated', order);
      io.emit('pending_orders_updated');
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/**
 * POST /api/orders/:tokenNumber/complete
 * Mark order as paid/completed
 */
router.post('/:tokenNumber/complete', async (req: Request, res: Response) => {
  try {
    const { tokenNumber } = req.params;
    const order = await orderService.completeOrder(tokenNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('order_completed', order);
      io.emit('pending_orders_updated');
    }

    res.json(order);
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

/**
 * DELETE /api/orders/:tokenNumber
 * Cancel an order (soft delete - marks as cancelled)
 */
router.delete('/:tokenNumber', async (req: Request, res: Response) => {
  try {
    const { tokenNumber } = req.params;
    const order = await orderService.cancelOrder(tokenNumber);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('order_cancelled', order);
      io.emit('pending_orders_updated');
    }

    res.json(order);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

/**
 * DELETE /api/orders/:tokenNumber/permanent
 * Permanently delete an order from database
 */
router.delete('/:tokenNumber/permanent', async (req: Request, res: Response) => {
  try {
    const { tokenNumber } = req.params;
    const deleted = await orderService.deleteOrder(tokenNumber);

    if (!deleted) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('order_deleted', { tokenNumber });
      io.emit('pending_orders_updated');
    }

    res.json({ message: 'Order deleted successfully', tokenNumber });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

/**
 * DELETE /api/orders
 * Delete all orders (for testing/reset purposes)
 * Add a confirmation query parameter for safety
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const { confirm } = req.query;

    if (confirm !== 'yes') {
      return res.status(400).json({ 
        error: 'Please confirm deletion by adding ?confirm=yes to the URL' 
      });
    }

    const deletedCount = await orderService.deleteAllOrders();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('all_orders_deleted');
      io.emit('pending_orders_updated');
    }

    res.json({ 
      message: 'All orders deleted successfully', 
      deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all orders:', error);
    res.status(500).json({ error: 'Failed to delete all orders' });
  }
});

/**
 * GET /api/orders/date/:date
 * Get orders for a specific date (YYYY-MM-DD)
 */
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;

    const orders = await orderService.getOrdersByDateRange(startDate, endDate);
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders by date:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

export default router;
