-- Migration: Update token_number format to include date prefix
-- This prevents duplicate key violations when resetting token counters

-- Step 1: First, drop the unique constraint temporarily
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_token_number_key;

-- Step 2: Update existing token numbers to include date prefix
-- This assumes created_at date corresponds to the token date
UPDATE orders 
SET token_number = TO_CHAR(created_at, 'YYYY-MM-DD') || '-' || token_number
WHERE token_number NOT LIKE '%-%-%';

-- Step 3: Re-add the unique constraint
ALTER TABLE orders ADD CONSTRAINT orders_token_number_key UNIQUE (token_number);

-- Verify the migration
SELECT 
    COUNT(*) as total_orders,
    COUNT(DISTINCT DATE(created_at)) as distinct_dates,
    MIN(token_number) as first_token,
    MAX(token_number) as last_token
FROM orders;

COMMENT ON COLUMN orders.token_number IS 'Token number with date prefix (format: YYYY-MM-DD-N) for uniqueness across days';
