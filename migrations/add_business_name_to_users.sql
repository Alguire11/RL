-- Add business_name column to users table for landlords
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_business_name ON users(business_name) WHERE business_name IS NOT NULL;
