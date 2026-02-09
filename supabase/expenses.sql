-- ============================================
-- Expenses Table Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date-range profit queries
CREATE INDEX idx_expenses_date ON expenses(date);

-- RLS (open for now, locked down in Phase 5)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on expenses" ON expenses
  FOR ALL USING (true) WITH CHECK (true);
