import { pool } from './postgres';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Running token_counter table migration...');
    
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, 'add_token_counter_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Token counter table created successfully!');
    console.log('✅ Migration completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };
