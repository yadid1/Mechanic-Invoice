-- ============================================
-- Auth RLS Policies
-- Run this in Supabase SQL Editor AFTER creating your user account
-- This replaces the open "allow all" policies with auth-only policies
-- ============================================

-- Drop old open policies
DROP POLICY IF EXISTS "Allow all on invoices" ON invoices;
DROP POLICY IF EXISTS "Allow all on line_items" ON line_items;
DROP POLICY IF EXISTS "Allow all on expenses" ON expenses;

-- Invoices: only authenticated users
CREATE POLICY "Auth users can read invoices" ON invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can insert invoices" ON invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users can update invoices" ON invoices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete invoices" ON invoices
  FOR DELETE USING (auth.role() = 'authenticated');

-- Line items: only authenticated users
CREATE POLICY "Auth users can read line_items" ON line_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can insert line_items" ON line_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete line_items" ON line_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Expenses: only authenticated users
CREATE POLICY "Auth users can read expenses" ON expenses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can insert expenses" ON expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete expenses" ON expenses
  FOR DELETE USING (auth.role() = 'authenticated');
