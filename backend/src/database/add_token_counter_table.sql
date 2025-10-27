-- Migration: Add token_counter table
-- This table stores the daily token counter state in PostgreSQL instead of Redis

CREATE TABLE IF NOT EXISTS token_counter (
    date DATE PRIMARY KEY,
    current_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_token_counter_date ON token_counter(date);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_token_counter_updated_at ON token_counter;
CREATE TRIGGER update_token_counter_updated_at
    BEFORE UPDATE ON token_counter
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Initialize today's counter if needed
INSERT INTO token_counter (date, current_count)
VALUES (CURRENT_DATE, 0)
ON CONFLICT (date) DO NOTHING;

COMMENT ON TABLE token_counter IS 'Stores daily token counter state for sequential token generation';
COMMENT ON COLUMN token_counter.date IS 'The date for which this counter applies';
COMMENT ON COLUMN token_counter.current_count IS 'Current token count for the day';
