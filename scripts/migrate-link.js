require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to database...');
  await pool.query('SELECT 1');
  console.log('Connected!');

  console.log('Adding columns...');
  await pool.query(`
    ALTER TABLE "RestaurantOrder" 
    ADD COLUMN IF NOT EXISTS "linkedBarOrderId" TEXT;
  `);

  await pool.query(`
    ALTER TABLE "BarOrder" 
    ADD COLUMN IF NOT EXISTS "linkedRestaurantOrderId" TEXT;
  `);

  console.log('Adding foreign key constraints if not exists...');
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RestaurantOrder_linkedBarOrderId_fkey'
      ) THEN
        ALTER TABLE "RestaurantOrder"
        ADD CONSTRAINT "RestaurantOrder_linkedBarOrderId_fkey"
        FOREIGN KEY ("linkedBarOrderId") REFERENCES "BarOrder"("id") ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'BarOrder_linkedRestaurantOrderId_fkey'
      ) THEN
        ALTER TABLE "BarOrder"
        ADD CONSTRAINT "BarOrder_linkedRestaurantOrderId_fkey"
        FOREIGN KEY ("linkedRestaurantOrderId") REFERENCES "RestaurantOrder"("id") ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  console.log('Migration completed successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
