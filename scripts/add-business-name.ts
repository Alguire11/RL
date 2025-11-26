import { pool } from '../server/db.js';

async function addBusinessNameColumn() {
    try {
        console.log('Adding business_name column to users table...');

        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS business_name VARCHAR;
    `);

        console.log('✅ Successfully added business_name column!');

        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_business_name 
      ON users(business_name) 
      WHERE business_name IS NOT NULL;
    `);

        console.log('✅ Successfully created index!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addBusinessNameColumn();
