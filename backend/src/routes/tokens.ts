import { Router, Request, Response } from 'express';
import { tokenService } from '../services/tokenService';

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
    console.error('Error getting token count:', error);
    res.status(500).json({ error: 'Failed to get token count' });
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
    console.error('Error getting token history:', error);
    res.status(500).json({ error: 'Failed to get token history' });
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
  } catch (error) {
    console.error('❌ Error in reset token endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset token counter';
    res.status(500).json({ 
      error: errorMessage,
      success: false 
    });
  }
});

export default router;
