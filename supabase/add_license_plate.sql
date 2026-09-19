-- ============================================
-- Add license_plate column to invoices
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS license_plate TEXT;
