-- Create plates table for storing detected license plate data
CREATE TABLE plates (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  image_url TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  letters TEXT NOT NULL,
  numbers TEXT NOT NULL,
  bbox FLOAT8[] NULL,
  notes TEXT NULL,
  location TEXT NULL,
  vehicle_type TEXT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_plates_user_id ON plates(user_id);
CREATE INDEX idx_plates_timestamp ON plates(timestamp DESC);
CREATE INDEX idx_plates_plate_number ON plates(plate_number);

-- Enable Row Level Security (RLS)
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own plates
CREATE POLICY "Users can view their own plates"
  ON plates FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own plates
CREATE POLICY "Users can insert their own plates"
  ON plates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own plates
CREATE POLICY "Users can update their own plates"
  ON plates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own plates
CREATE POLICY "Users can delete their own plates"
  ON plates FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_plates_updated_at
BEFORE UPDATE ON plates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
