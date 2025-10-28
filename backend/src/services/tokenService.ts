import { pool } from '../database/postgres';
import { TokenResponse } from '../types';

export class TokenService {
    private tokenPrefix: string;
    private tokenPadding: number;
    private lastProcessedDate: string | null = null;
    private timezone: string;

    constructor() {
        this.tokenPrefix = process.env.TOKEN_PREFIX || 'T';
        this.tokenPadding = parseInt(process.env.TOKEN_PADDING || '4');
        this.timezone = process.env.TOKEN_TIMEZONE || 'Asia/Kolkata';
        this.initializeDateTracking();
    }

    /**
     * Get today's date string in YYYY-MM-DD for the configured timezone.
     */
    private getTodayDateString(): string {
        try {
            // Use en-CA to get ISO-like YYYY-MM-DD format
            return new Date().toLocaleDateString('en-CA', { timeZone: this.timezone });
        } catch {
            // Fallback to UTC date if locale/timezone APIs are unavailable
            return new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Initialize date tracking by checking the last processed date
     */
    private async initializeDateTracking(): Promise<void> {
        try {
            // Get the most recent date from token_counter to determine last processed date
            const result = await pool.query(
                `SELECT date FROM token_counter ORDER BY date DESC LIMIT 1`
            );

            if (result.rows.length > 0) {
                this.lastProcessedDate = result.rows[0].date;
                console.log(`📅 Last processed date: ${this.lastProcessedDate}`);
            } else {
                console.log('📅 No previous token data found. Starting fresh.');
            }
        } catch (error) {
            console.error('❌ Error initializing date tracking:', error);
        }
    }

    /**
     * Check if we need to reset counters for a new day
     */
    private async checkAndResetForNewDay(currentDate: string): Promise<void> {
        // If we don't have a last processed date or it's different from current date
        if (!this.lastProcessedDate || this.lastProcessedDate !== currentDate) {
            console.log(`🔄 Day change detected: ${this.lastProcessedDate} -> ${currentDate}`);

            // Ensure counter exists for current date starting from 0
            await pool.query(
                `INSERT INTO token_counter (date, current_count)
         VALUES ($1, 0)
         ON CONFLICT (date) 
         DO NOTHING`,
                [currentDate]
            );

            this.lastProcessedDate = currentDate;
            console.log(`✅ Ready for new day: ${currentDate}`);
        }
    }

    /**
     * Generate a new sequential token number with robust day change detection
     */
    async generateToken(frontendId?: string): Promise<TokenResponse> {
        const client = await pool.connect();
        try {
            const today = this.getTodayDateString();

            // Always check if we need to reset for new day (ensures counter row exists)
            await this.checkAndResetForNewDay(today);

            // Use a transaction and FOR UPDATE to safely increment the counter and avoid race conditions.
            await client.query('BEGIN');

            // Lock the counter row for today
            const selectRes = await client.query(
                `SELECT current_count FROM token_counter WHERE date = $1 FOR UPDATE`,
                [today]
            );
            // Determine max used token for today from orders to avoid duplication
            const maxRes = await client.query(
                `SELECT COALESCE(MAX((substring(token_number from '(\\d+)$'))::int), 0) AS max_used
                     FROM orders
                     WHERE token_number LIKE $1 || '%'`,
                [today]
            );

            const maxUsed = parseInt(maxRes.rows[0].max_used, 10) || 0;

            // If counter row doesn't exist, create it initialized to maxUsed
            if (selectRes.rows.length === 0) {
                await client.query(
                    `INSERT INTO token_counter (date, current_count, created_at, updated_at)
                     VALUES ($1, $2, NOW(), NOW())`,
                    [today, maxUsed]
                );
            } else {
                const currentCount = parseInt(selectRes.rows[0].current_count, 10) || 0;
                if (currentCount < maxUsed) {
                    // Bring the counter up to the max used to avoid duplicates
                    await client.query(
                        `UPDATE token_counter SET current_count = $1, updated_at = NOW() WHERE date = $2`,
                        [maxUsed, today]
                    );
                    console.warn(`⚠️ token_counter for ${today} was behind maxUsed (${currentCount} < ${maxUsed}). Bumped to ${maxUsed}.`);
                }
            }

            // Now increment and return the new count (this will be max(current, maxUsed) + 1)
            const updated = await client.query(
                `UPDATE token_counter
                 SET current_count = token_counter.current_count + 1, updated_at = NOW()
                 WHERE date = $1
                 RETURNING current_count`,
                [today]
            );

            const tokenNumber = updated.rows[0].current_count as number;

            await client.query('COMMIT');

            // Display token is just the number (1, 2, 3, etc.)
            const displayToken = tokenNumber.toString();

            // Store token with date prefix to ensure uniqueness in database (e.g., "2025-10-27@1")
            const dbToken = `${today}@${tokenNumber}`;

            // Log token generation for audit trail (best-effort)
            try {
                await pool.query(
                    `INSERT INTO token_log (token_number, frontend_id, date)
         VALUES ($1, $2, $3)`,
                    [displayToken, frontendId || 'unknown', today]
                );
            } catch (e) {
                console.warn('⚠️ Failed to write token_log:', e);
            }

            console.log(`✅ Generated token: ${displayToken} (DB: ${dbToken}, Frontend: ${frontendId || 'unknown'})`);

            return {
                tokenNumber: dbToken, // Used for database storage (unique)
                displayToken, // Used for display to users (1, 2, 3, etc.)
                date: today,
            };
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // noop
            }
            console.error('❌ Error generating token:', error);
            throw new Error('Failed to generate token');
        } finally {
            client.release();
        }
    }

    /**
     * Force reset counter for today (emergency recovery)
     */
    private async forceResetForToday(today: string): Promise<void> {
        try {
            console.log(`🔄 Force resetting counter for today: ${today}`);

            await pool.query(
                `INSERT INTO token_counter (date, current_count)
         VALUES ($1, 0)
         ON CONFLICT (date) 
         DO UPDATE SET 
           current_count = 0,
           updated_at = NOW()`,
                [today]
            );

            this.lastProcessedDate = today;
            console.log(`✅ Force reset completed for: ${today}`);
        } catch (error) {
            console.error('❌ Error in force reset:', error);
            throw error;
        }
    }

    /**
     * Get current token count for today
     */
    async getCurrentTokenCount(): Promise<number> {
        try {
            const today = this.getTodayDateString();

            // Ensure we have the latest date tracking
            await this.checkAndResetForNewDay(today);

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
    async getTokenHistory(date?: string): Promise<Array<{ token_number: string; frontend_id: string; generated_at: string }>> {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];

            const result = await pool.query(
                `SELECT token_number, frontend_id, generated_at
         FROM token_log
         WHERE date = $1
         ORDER BY generated_at DESC`,
                [targetDate]
            );

            return result.rows as Array<{ token_number: string; frontend_id: string; generated_at: string }>;
        } catch (error) {
            console.error('❌ Error getting token history:', error);
            return [];
        }
    }

    /**
     * Reset token counter (usually for new day) - ORIGINAL METHOD NAME KEPT
     * Now with proper day change detection for local Windows environment
     */
    async resetTokenCounter(): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];

            console.log('🔄 Resetting token counter for TODAY:', today);

            // Determine the maximum token already used today (if any) to avoid creating duplicates.
            const maxRes = await pool.query(
                `SELECT COALESCE(MAX((substring(token_number from '(\\d+)$'))::int), 0) AS max_used
                 FROM orders
                 WHERE token_number LIKE $1 || '%'`,
                [today]
            );

            const maxUsed = parseInt(maxRes.rows[0].max_used, 10) || 0;

            // If there are existing tokens for today, set the counter to the max used value so next generated token will be maxUsed+1.
            const setTo = maxUsed;

            const result = await pool.query(
                `INSERT INTO token_counter (date, current_count)
         VALUES ($1, $2)
         ON CONFLICT (date) 
         DO UPDATE SET 
           current_count = $2,
           updated_at = NOW()
         RETURNING date, current_count`,
                [today, setTo]
            );

            this.lastProcessedDate = today;
            if (maxUsed > 0) {
                console.log(`⚠️ Existing ${maxUsed} tokens found for today — counter set to ${setTo} to avoid duplicates. Next token will be ${setTo + 1}`);
            } else {
                console.log('✅ Token counter reset successfully for today:', result.rows[0]);
                console.log('📅 Today tokens will start from 1');
            }
        } catch (error) {
            console.error('❌ Error resetting token counter:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to reset token counter. Database error.');
        }
    }

    /**
     * Get the current date being processed
     */
    getCurrentProcessingDate(): string | null {
        return this.lastProcessedDate;
    }
}

export const tokenService = new TokenService();