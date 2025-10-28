-- Migration: Increase token_number column length to support date-prefixed tokens
-- This allows tokens like "2025-10-29@123" (up to 15 characters currently, but future-proof to 25)

-- Alter orders table
ALTER TABLE orders ALTER COLUMN token_number TYPE VARCHAR(25);

-- Alter token_log table
ALTER TABLE token_log ALTER COLUMN token_number TYPE VARCHAR(25);

COMMENT ON COLUMN orders.token_number IS 'Token number with optional date prefix (format: YYYY-MM-DD@N or N) for uniqueness across days';
COMMENT ON COLUMN token_log.token_number IS 'Token number with optional date prefix for audit trail';