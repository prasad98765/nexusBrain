-- Migration: Add flow_data column to script_settings table
-- Date: 2025-01-08
-- Description: Adds a JSON column to store Flow Builder data

-- Add the flow_data column if it doesn't exist
ALTER TABLE script_settings 
ADD COLUMN IF NOT EXISTS flow_data JSON;

-- Add a comment for documentation
COMMENT ON COLUMN script_settings.flow_data IS 'Stores Flow Builder visual workflow data as JSON';
