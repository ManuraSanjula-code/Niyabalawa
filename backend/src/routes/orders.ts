import { Router, Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { DatabaseErrorHandler } from '../database/errorHandler';

const router = Router();

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { orderType, items, total, frontendId, pagerNumber } = req.body;

    if (!orderType || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order = await orderService.createOrder(orderType, items, total, frontendId, pagerNumber);

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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'create order');
    res.status(errorResponse.status).json(errorResponse.response);
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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'get all orders');
    res.status(errorResponse.status).json(errorResponse.response);
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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'get pending orders');
    res.status(errorResponse.status).json(errorResponse.response);
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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'get order by token');
    res.status(errorResponse.status).json(errorResponse.response);
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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'update order');
    res.status(errorResponse.status).json(errorResponse.response);
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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'complete order');
    res.status(errorResponse.status).json(errorResponse.response);
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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'cancel order');
    res.status(errorResponse.status).json(errorResponse.response);
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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'delete order permanently');
    res.status(errorResponse.status).json(errorResponse.response);
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
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'delete all orders');
    res.status(errorResponse.status).json(errorResponse.response);
  }
});

/**
 * GET /api/orders/date/:date
 * Get orders for a specific date (YYYY-MM-DD)
 */
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    console.log(`📅 Order History request for date: ${date}`);

    // Use server helper that interprets the provided date in Asia/Kolkata timezone
    // and returns all orders whose created_at falls on that India-local date.
    const orders = await orderService.getOrdersByDate(date);

    console.log(`📋 Returning ${orders.length} orders for date ${date}`);
    res.json(orders);
  } catch (error) {
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'get orders by date');
    res.status(errorResponse.status).json(errorResponse.response);
  }
});

/**
 * GET /api/orders/summary/today
 * Get today's order summary with statistics
 */
router.get('/summary/today', async (req: Request, res: Response) => {
  try {
    console.log(`📊 Today's summary request received`);
    const summary = await orderService.getTodayOrderSummary();
    console.log(`📋 Returning summary with ${summary.totalOrders} orders`);
    res.json(summary);
  } catch (error) {
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'get today\'s order summary');
    res.status(errorResponse.status).json(errorResponse.response);
  }
});

/**
 * GET /api/orders/debug/all
 * Debug: Get all orders (temporary)
 */
router.get('/debug/all', async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders();
    console.log(`🐛 Debug: Total orders in DB: ${orders.length}`);
    orders.forEach(o => console.log(`  - ${o.tokenNumber} at ${o.createdAt}`));
    res.json({ total: orders.length, orders });
  } catch (error) {
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'get debug orders');
    res.status(errorResponse.status).json(errorResponse.response);
  }
});

export default router;
