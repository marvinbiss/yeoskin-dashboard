-- Add before/after image columns to routines table
ALTER TABLE routines
  ADD COLUMN IF NOT EXISTS before_after_1_before_url text,
  ADD COLUMN IF NOT EXISTS before_after_1_after_url text,
  ADD COLUMN IF NOT EXISTS before_after_2_before_url text,
  ADD COLUMN IF NOT EXISTS before_after_2_after_url text;
