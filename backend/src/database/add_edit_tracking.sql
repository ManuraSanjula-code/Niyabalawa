-- Add columns to track order edits
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS original_items JSONB,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN orders.original_items IS 'Stores the original items before any edits were made';
COMMENT ON COLUMN orders.is_edited IS 'Flag to indicate if the order has been edited';
