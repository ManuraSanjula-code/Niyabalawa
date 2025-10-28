import { pool } from './postgres';

const createTables = async () => {
  try {
    console.log('🔧 Creating database tables...');

    // Enable UUID extension
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // Menu Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        half_price DECIMAL(10,2) NOT NULL,
        full_price DECIMAL(10,2) NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('main', 'rice', 'addon','dessert','drinks')),
        kitchen VARCHAR(10) NOT NULL CHECK (kitchen IN ('front', 'back')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        token_number VARCHAR(25) UNIQUE NOT NULL,
        order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine-in', 'take-away')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
        items JSONB NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        frontend_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);

    // Order Items Table (normalized for better querying)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        item_id VARCHAR(50) NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        portion VARCHAR(10),
        category VARCHAR(20),
        rice_type VARCHAR(50),
        rice_price DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Token Log Table (audit trail)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_log (
        id SERIAL PRIMARY KEY,
        token_number VARCHAR(25) NOT NULL,
        generated_at TIMESTAMP DEFAULT NOW(),
        frontend_id VARCHAR(50),
        date DATE NOT NULL DEFAULT CURRENT_DATE
      );
    `);

    // Token Counter Table (for daily counter management)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_counter (
        date DATE PRIMARY KEY,
        current_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(token_number);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_token_log_date ON token_log(date);
      CREATE INDEX IF NOT EXISTS idx_token_counter_date ON token_counter(date);
    `);

    // Create updated_at trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add trigger to orders table
    await pool.query(`
      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const setupDatabase = async () => {
  try {
    await createTables();
    console.log('✅ Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export { createTables };
