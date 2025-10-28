import { pool } from './postgres';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Running token length increase migration...');

    // Read the SQL migration file
    const sqlFile = path.join(__dirname, 'increase_token_length.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Token length increased successfully!');
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