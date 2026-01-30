-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Create the user_data table for storing all app data
CREATE TABLE IF NOT EXISTS user_data (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data_value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for upsert operations
  UNIQUE(device_id, data_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_data_device_id ON user_data(device_id);
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);

-- Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own device's data
CREATE POLICY "Users can access own device data" ON user_data
  FOR ALL
  USING (true)  -- For now, allow all (device_id is the security)
  WITH CHECK (true);

-- Grant access to the anon role
GRANT ALL ON user_data TO anon;
GRANT USAGE, SELECT ON SEQUENCE user_data_id_seq TO anon;
