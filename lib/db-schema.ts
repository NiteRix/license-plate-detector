// Database schema for future implementation
// This file defines the structure for storing detected plates in your database

export interface PlateRecord {
  id: string
  userId: string
  plateNumber: string
  imageUrl: string
  confidence: number
  arrivalTime: string
  detectedAt: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  password: string // In production, this should be hashed
  createdAt: string
}

// SQL Schema Example (for Supabase, PostgreSQL, or similar):
/*
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plates Table
CREATE TABLE plates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plate_number VARCHAR(20) NOT NULL,
  image_url TEXT,
  confidence FLOAT NOT NULL DEFAULT 0,
  arrival_time TIMESTAMP NOT NULL,
  detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_plates_user_id ON plates(user_id);
CREATE INDEX idx_plates_arrival_time ON plates(arrival_time);
CREATE INDEX idx_plates_plate_number ON plates(plate_number);
*/
