-- ============================================
-- Add status column to invoices for draft/completed workflow
-- Run this in Supabase SQL Editor
-- ============================================

-- Add status column (skip if already exists)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

-- Allow car_model to be null for draft invoices
ALTER TABLE invoices ALTER COLUMN car_model DROP NOT NULL;

-- Index for filtering by status (skip if already exists)
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
