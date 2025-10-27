import { pool } from './postgres';
import * as fs from 'fs';
import * as path from 'path';

async function runTokenFormatMigration() {
  try {
    console.log('🔄 Running token format migration...');
    console.log('⚠️  This will update all existing token numbers to include date prefix\n');
    
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, 'migrate_token_format.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.toLowerCase().includes('select')) {
        // For SELECT statements, show the results
        const result = await pool.query(statement);
        console.log('\n📊 Migration verification:');
        console.table(result.rows);
      } else {
        // For other statements, just execute
        await pool.query(statement);
        const action = statement.substring(0, 50).replace(/\s+/g, ' ');
        console.log(`✅ Executed: ${action}...`);
      }
    }
    
    console.log('\n✅ Token format migration completed successfully!');
    console.log('📝 All token numbers now have date prefix (YYYY-MM-DD-N format)');
    console.log('🔄 Token counter can now be reset without conflicts\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n⚠️  If the migration failed, your database may be in an inconsistent state.');
    console.error('Please check the error above and fix manually if needed.\n');
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runTokenFormatMigration();
}

export { runTokenFormatMigration };
