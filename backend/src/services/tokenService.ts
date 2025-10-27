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
   * Uses PostgreSQL for atomic increment to ensure unique tokens across all frontends
   */
  async generateToken(frontendId?: string): Promise<TokenResponse> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create counter for today
      const counterResult = await pool.query(
        `INSERT INTO token_counter (date, current_count)
         VALUES ($1, 1)
         ON CONFLICT (date) 
         DO UPDATE SET 
           current_count = token_counter.current_count + 1,
           updated_at = NOW()
         RETURNING current_count`,
        [today]
      );
      
      const tokenNumber = counterResult.rows[0].current_count;
      
      // Display token is just the number (1, 2, 3, etc.)
      const displayToken = tokenNumber.toString();
      
      // Store token with date prefix to ensure uniqueness in database (e.g., "2025-10-27-1")
      const dbToken = `${today}-${tokenNumber}`;

      // Log token generation for audit trail
      await pool.query(
        `INSERT INTO token_log (token_number, frontend_id, date)
         VALUES ($1, $2, $3)`,
        [displayToken, frontendId || 'unknown', today]
      );

      console.log(`✅ Generated token: ${displayToken} (DB: ${dbToken}, Frontend: ${frontendId || 'unknown'})`);

      return {
        tokenNumber: dbToken, // Used for database storage (unique)
        displayToken,         // Used for display to users (1, 2, 3, etc.)
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
      const today = new Date().toISOString().split('T')[0];
      const result = await pool.query(
        `SELECT current_count FROM token_counter WHERE date = $1`,
        [today]
      );
      return result.rows[0]?.current_count || 0;
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
   * This prepares the counter for the NEXT day, not today
   */
  async resetTokenCounter(): Promise<void> {
    try {
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];
      
      console.log('🔄 Resetting token counter for NEXT day:', tomorrowDate);
      
      // Reset counter to 0 for tomorrow
      const result = await pool.query(
        `INSERT INTO token_counter (date, current_count)
         VALUES ($1, 0)
         ON CONFLICT (date) 
         DO UPDATE SET 
           current_count = 0,
           updated_at = NOW()
         RETURNING date, current_count`,
        [tomorrowDate]
      );
      
      console.log('✅ Token counter reset successfully for next day:', result.rows[0]);
      console.log('📅 Next day tokens will start from 1');
    } catch (error) {
      console.error('❌ Error resetting token counter:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reset token counter. Database error.');
    }
  }
}

export const tokenService = new TokenService();
