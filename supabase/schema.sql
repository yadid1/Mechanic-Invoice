-- ============================================
-- Mechanic Invoice Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- Invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  car_model TEXT,
  date DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  warranty TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Line items table (linked to invoices)
CREATE TABLE line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Index for fast lookups by invoice
CREATE INDEX idx_line_items_invoice_id ON line_items(invoice_id);

-- Index for date-range revenue queries (weekly/monthly/yearly)
CREATE INDEX idx_invoices_date ON invoices(date);

-- ============================================
-- Row Level Security (RLS)
-- For now, allow all operations (we'll lock it down with auth in Phase 5)
-- ============================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;

-- Temporary open policies (replaced with auth policies in Phase 5)
CREATE POLICY "Allow all on invoices" ON invoices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on line_items" ON line_items
  FOR ALL USING (true) WITH CHECK (true);
