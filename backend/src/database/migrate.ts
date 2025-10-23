import { pool } from './postgres';

const migrateDatabase = async () => {
  try {
    console.log('🔧 Starting database migration...');

    // Drop the old constraint
    console.log('📝 Dropping old category constraint...');
    await pool.query(`
      ALTER TABLE menu_items 
      DROP CONSTRAINT IF EXISTS menu_items_category_check;
    `);

    // Add the new constraint with dessert and drinks
    console.log('📝 Adding new category constraint...');
    await pool.query(`
      ALTER TABLE menu_items 
      ADD CONSTRAINT menu_items_category_check 
      CHECK (category IN ('main', 'rice', 'addon', 'dessert', 'drinks'));
    `);

    // Make half_price and full_price nullable (for addon, dessert, drinks)
    console.log('📝 Making price columns nullable for single-price items...');
    await pool.query(`
      ALTER TABLE menu_items 
      ALTER COLUMN half_price DROP NOT NULL,
      ALTER COLUMN full_price DROP NOT NULL;
    `);

    // Add a price column for single-price items
    console.log('📝 Adding price column for single-price items...');
    await pool.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
    `);

    console.log('✅ Database migration completed successfully!');
    console.log('✨ Categories now supported: main, rice, addon, dessert, drinks');
    console.log('✨ Main & Rice: half_price + full_price');
    console.log('✨ Addon, Dessert, Drinks: single price');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabase();
}

export { migrateDatabase };
