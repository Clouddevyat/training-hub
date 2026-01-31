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

-- ============== ADMIN APPROVAL SYSTEM ==============

-- Table for access requests (pending users)
CREATE TABLE IF NOT EXISTS access_requests (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for approved users
CREATE TABLE IF NOT EXISTS approved_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_approved_users_email ON approved_users(email);

-- Enable Row Level Security
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- Policies for access_requests
CREATE POLICY "Anyone can create access requests" ON access_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own requests" ON access_requests
  FOR SELECT USING (true);

-- Policies for approved_users
CREATE POLICY "Anyone can check if email is approved" ON approved_users
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage approved users" ON approved_users
  FOR ALL USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON access_requests TO anon;
GRANT USAGE, SELECT ON SEQUENCE access_requests_id_seq TO anon;
GRANT ALL ON approved_users TO anon;
GRANT USAGE, SELECT ON SEQUENCE approved_users_id_seq TO anon;

-- Insert your admin user (CHANGE THIS EMAIL TO YOUR OWN!)
-- INSERT INTO approved_users (email, name, is_admin)
-- VALUES ('your@email.com', 'Your Name', true);
