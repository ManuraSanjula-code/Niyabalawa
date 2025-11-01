import { pool } from './postgres';

const addPagerNumberColumn = async () => {
  try {
    console.log('🔧 Adding pager_number column to orders table...');

    // Add pager_number column to orders table
    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS pager_number INTEGER
      CHECK (pager_number >= 1 AND pager_number <= 30);
    `);

    console.log('✅ Successfully added pager_number column to orders table');
  } catch (error) {
    console.error('❌ Error adding pager_number column:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  addPagerNumberColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default addPagerNumberColumn;