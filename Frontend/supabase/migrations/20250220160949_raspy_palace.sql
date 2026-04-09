/*
  # Authentication Setup

  1. Security
    - Enable Row Level Security (RLS) on auth.users
    - Add policies for user management
    
  Note: Most of the auth setup is handled automatically by Supabase.
  This migration adds additional security measures and policies.
*/

-- Enable RLS on auth schema tables (if not already enabled)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data
CREATE POLICY "Users can read own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);