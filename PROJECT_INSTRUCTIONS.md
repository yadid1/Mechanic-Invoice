# Mechanic Invoice — Project Instructions

## Overview
Invoice and receipt management app for **Alamillas Carburetors** (920 W 1st St, Santa Ana, CA 92703 | (714) 667-5228). Built with Next.js, Supabase, and Tailwind CSS. Deployed on Vercel.

The shop owner uses this to create invoices, generate branded PDFs, track expenses, and view revenue/profit dashboards.

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **PDF Generation:** jsPDF (client-side)
- **Charts:** Recharts
- **Hosting:** Vercel (planned)

## Project Structure
```
src/
├── app/
│   ├── layout.tsx                 # Root layout with branded header + Nav
│   ├── page.tsx                   # Home — renders InvoiceForm
│   ├── globals.css                # Tailwind + custom CSS variables (brand colors)
│   ├── invoices/
│   │   ├── page.tsx               # Invoice list with search/filter + clickable rows
│   │   └── [id]/page.tsx          # Invoice detail view + PDF re-download
│   ├── expenses/
│   │   └── page.tsx               # Expense form + expense list
│   └── dashboard/
│       └── page.tsx               # Revenue/expense/profit charts (weekly/monthly/yearly)
├── components/
│   ├── InvoiceForm.tsx            # Main invoice creation form (saves to Supabase + generates PDF)
│   └── Nav.tsx                    # Header navigation links
└── lib/
    ├── supabase.ts                # Supabase client (reads from env vars)
    └── generateInvoicePDF.ts      # Branded PDF generation with jsPDF
```

## Database Schema (Supabase)

### Tables
**invoices**
- `id` UUID (PK, auto-generated)
- `customer_name` TEXT
- `customer_phone` TEXT
- `car_model` TEXT
- `date` DATE
- `total` DECIMAL(10,2)
- `warranty` TEXT (nullable)
- `notes` TEXT (nullable)
- `created_at` TIMESTAMPTZ

**line_items**
- `id` UUID (PK, auto-generated)
- `invoice_id` UUID (FK → invoices.id, CASCADE delete)
- `description` TEXT
- `price` DECIMAL(10,2)

**expenses**
- `id` UUID (PK, auto-generated)
- `date` DATE
- `category` TEXT (Parts, Tools & Equipment, Rent, Utilities, Insurance, Supplies, Vendor / Wholesale, Marketing, Other)
- `vendor` TEXT (nullable)
- `description` TEXT
- `amount` DECIMAL(10,2)
- `created_at` TIMESTAMPTZ

### Row Level Security
All tables have RLS enabled with open policies (allow all). These need to be replaced with auth-based policies in Phase 5.

### SQL Files
- `supabase/schema.sql` — Creates invoices + line_items tables
- `supabase/expenses.sql` — Creates expenses table

## Environment Variables
Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
```

## Completed Phases
1. **Project setup** — Next.js + Tailwind + TypeScript
2. **Invoice form** — Customer info, car model, date, dynamic line items, warranty selection, notes
3. **PDF generation** — Branded PDF with jsPDF (auto-downloads on submit)
4. **Supabase DB** — Invoices + line items stored in Supabase, invoices list page
5. *(skipped for now)* **Auth** — Password login for shop owner
6. **Expense tracking** — Add/delete expenses with categories and vendor tracking
7. **Dashboard** — Revenue vs expenses bar chart, profit trend line chart, weekly/monthly/yearly toggle

## Remaining Work
- **Phase 5: Authentication** — Supabase Auth with email/password login. Lock down RLS policies so only authenticated users can read/write. Add login page, protect all routes.
- **Deployment to Vercel** — Connect GitHub repo, set env vars in Vercel dashboard, deploy.

## Key Design Decisions
- PDF generation is **client-side** (jsPDF) — no server-side rendering needed
- Supabase client uses fallback values so builds don't fail without env vars
- Invoice form still generates PDF even if Supabase save fails (graceful degradation)
- All data queries happen client-side via Supabase JS SDK (no API routes needed)
- Brand colors defined as CSS custom properties: `--primary: #1e40af`, `--primary-light: #3b82f6`, `--accent: #dc2626`

## Expense Categories
Parts, Tools & Equipment, Rent, Utilities, Insurance, Supplies, Vendor / Wholesale, Marketing, Other

## Warranty Options
None, 6 Months, 1 Year, 2 Years, Custom (free text)
