import { pool } from './postgres';

const migrateEditTracking = async () => {
  try {
    console.log('🔧 Running edit tracking migration...');

    // Add original_items and is_edited columns to orders table
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS original_items JSONB,
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
    `);

    console.log('✅ Edit tracking migration completed successfully!');
    console.log('   - Added original_items column (JSONB)');
    console.log('   - Added is_edited column (BOOLEAN)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Edit tracking migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateEditTracking();
}

export { migrateEditTracking };
