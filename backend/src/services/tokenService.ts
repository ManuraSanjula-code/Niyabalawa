import { redisHelpers } from '../database/redis';
import { pool } from '../database/postgres';
import { TokenResponse } from '../types';

export class TokenService {
  private tokenPrefix: string;
  private tokenPadding: number;

  constructor() {
    this.tokenPrefix = process.env.TOKEN_PREFIX || 'T';
    this.tokenPadding = parseInt(process.env.TOKEN_PADDING || '4');
  }

  /**
   * Generate a new sequential token number
   * Uses Redis for atomic increment to ensure unique tokens across all frontends
   * Falls back to database if Redis is unavailable
   */
  async generateToken(frontendId?: string): Promise<TokenResponse> {
    try {
      let tokenNumber: number;
      
      // Try Redis first for atomic increment
      try {
        tokenNumber = await redisHelpers.incrementTokenCounter();
      } catch (redisError) {
        // Fallback to database counter
        console.warn('⚠️  Redis unavailable, using database counter');
        const today = new Date().toISOString().split('T')[0];
        const result = await pool.query(
          `SELECT COALESCE(MAX(CAST(token_number AS INTEGER)), 0) + 1 as next_token
           FROM token_log
           WHERE date = $1`,
          [today]
        );
        tokenNumber = result.rows[0].next_token;
      }
      
      // Simple number format (1, 2, 3, etc.)
      const displayToken = tokenNumber.toString();
      
      const today = new Date().toISOString().split('T')[0];

      // Log token generation for audit trail
      await pool.query(
        `INSERT INTO token_log (token_number, frontend_id, date)
         VALUES ($1, $2, $3)`,
        [displayToken, frontendId || 'unknown', today]
      );

      console.log(`✅ Generated token: ${displayToken} (Frontend: ${frontendId || 'unknown'})`);

      return {
        tokenNumber: tokenNumber.toString(),
        displayToken,
        date: today,
      };
    } catch (error) {
      console.error('❌ Error generating token:', error);
      throw new Error('Failed to generate token');
    }
  }

  /**
   * Get current token count for today
   */
  async getCurrentTokenCount(): Promise<number> {
    try {
      const count = await redisHelpers.getTokenCounter();
      return count;
    } catch (error) {
      console.error('❌ Error getting token count:', error);
      return 0;
    }
  }

  /**
   * Get token generation history for a specific date
   */
  async getTokenHistory(date?: string): Promise<any[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const result = await pool.query(
        `SELECT token_number, frontend_id, generated_at
         FROM token_log
         WHERE date = $1
         ORDER BY generated_at DESC`,
        [targetDate]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Error getting token history:', error);
      return [];
    }
  }

  /**
   * Reset token counter (usually for new day)
   */
  async resetTokenCounter(): Promise<void> {
    try {
      await redisHelpers.resetTokenCounter();
      console.log('✅ Token counter reset');
    } catch (error) {
      console.error('❌ Error resetting token counter:', error);
      throw error;
    }
  }
}

export const tokenService = new TokenService();
