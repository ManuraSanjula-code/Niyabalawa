import { pool } from './database/postgres';

async function resetTokens() {
  try {
    const timezone = process.env.TOKEN_TIMEZONE || 'Asia/Kolkata';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    
    // Delete today's tokens
    const result = await pool.query(
      'DELETE FROM token_log WHERE date = $1',
      [today]
    );
    
    console.log(`✅ Deleted ${result.rowCount} tokens for today (${today})`);
    console.log('🔄 Token counter will start from 1 for the next order');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting tokens:', error);
    process.exit(1);
  }
}

resetTokens();
