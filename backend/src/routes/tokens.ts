import { Router, Request, Response } from 'express';
import { tokenService } from '../services/tokenService';
import { DatabaseErrorHandler } from '../database/errorHandler';

const router = Router();

/**
 * GET /api/tokens/current
 * Get current token count
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    const count = await tokenService.getCurrentTokenCount();
    res.json({ count });
  } catch (error) {
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'get token count');
    res.status(errorResponse.status).json(errorResponse.response);
  }
});

/**
 * GET /api/tokens/history
 * Get token generation history for today or specific date
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const history = await tokenService.getTokenHistory(date);
    res.json(history);
  } catch (error) {
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'get token history');
    res.status(errorResponse.status).json(errorResponse.response);
  }
});

/**
 * POST /api/tokens/reset
 * Reset token counter (admin only)
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    await tokenService.resetTokenCounter();
    console.log('✅ Token counter reset endpoint completed successfully');
    res.status(200).json({ 
      message: 'Token counter reset successfully',
      success: true 
    });
    res.status(200).json({ 
      message: 'Token counter reset successfully',
      success: true 
    });
  } catch (error) {
    const errorResponse = DatabaseErrorHandler.handleRouteError(error, 'reset token counter');
    res.status(errorResponse.status).json({
      ...errorResponse.response,
      success: false
    });
  }
});

export default router;
