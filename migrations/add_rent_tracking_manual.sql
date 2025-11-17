-- Migration: Add rent update tracking to properties table
-- This allows limiting rent price updates to 3 times per month

-- Add rent_update_count column with default 0
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS rent_update_count INTEGER DEFAULT 0;

-- Add last_rent_update_month column to track which month the updates were made
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS last_rent_update_month VARCHAR;

-- Comment on columns for documentation
COMMENT ON COLUMN properties.rent_update_count IS 'Number of times rent has been updated in the current month (resets monthly)';
COMMENT ON COLUMN properties.last_rent_update_month IS 'Month of last rent update in YYYY-MM format';

