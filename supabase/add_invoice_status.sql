-- ============================================
-- Add status column to invoices for draft/completed workflow
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE invoices ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';

-- Update index for filtering by status
CREATE INDEX idx_invoices_status ON invoices(status);
