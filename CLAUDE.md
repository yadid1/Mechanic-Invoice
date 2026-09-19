# CLAUDE.md — Mechanic Invoice

Read `PROJECT_INSTRUCTIONS.md` first for architecture, schema, and file layout. This file covers **how to work on the repo**.

## Repo & deploy workflow

- The git repo is **this folder** (`Mechanic-Invoice/`), not the parent `Mechanic Invoice CC/` folder.
- Remote: `github.com/yadid1/Mechanic-Invoice`. `gh` is authenticated as `yadid1`.
- The only branch (and GitHub default) is `claude/mechanic-receipt-form-eqq0S`. Work directly on it.
- **Pushing to that branch = production deploy.** Vercel auto-builds on push; check status with
  `gh api repos/yadid1/Mechanic-Invoice/commits/<sha>/status`.
- Always `git pull --ff-only` before starting — the owner also edits from other Claude sessions.
- The owner commits and pushes themselves from the terminal. Don't push unless asked.

## Database changes (Supabase)

- The app writes to fixed columns, so any new field needs a column **before** the code is deployed, or saves will fail in production.
- Pattern: add a `supabase/add_<thing>.sql` file with idempotent SQL (`ADD COLUMN IF NOT EXISTS`), update the schema section in `PROJECT_INSTRUCTIONS.md`, and **tell the owner to paste the SQL into Supabase → SQL Editor**. There is no migration runner; they run it by hand.
- Existing migration files: `schema.sql`, `expenses.sql`, `auth_policies.sql`, `add_invoice_status.sql`, `add_license_plate.sql`.

## Adding a field to invoices (checklist)

A new invoice field touches all of these — miss one and it silently won't show:
1. `supabase/add_<field>.sql` + `PROJECT_INSTRUCTIONS.md` schema
2. `src/components/InvoiceForm.tsx` — state, scan prefill (`useEffect` from sessionStorage), **both** inserts (draft + completed), `invoiceData` for PDF, input
3. `src/app/invoices/[id]/edit/page.tsx` — state, fetch, update, PDF call, input
4. `src/app/invoices/[id]/page.tsx` — interface, PDF call, display
5. `src/app/invoices/page.tsx` — interface, search filter, table + mobile card
6. `src/lib/generateInvoicePDF.ts` — `InvoiceData` interface + rendering
7. `src/app/api/scan-invoice/route.ts` (AI prompt JSON) + `src/app/scan/page.tsx` (interface + preview) if the scanner should extract it

## Verification

- No test suite. Verify with `npx tsc --noEmit` and `npx eslint src` (both slow on first run, ~2 min).
- **Pre-existing, not yours:** `tsc` errors about `@anthropic-ai/sdk` mean `node_modules` is stale → `npm install`. ESLint error in `src/app/dashboard/page.tsx` (`fetchData` before declared) and the unused `router` warning in `InvoiceForm.tsx` were there before.
- To eyeball PDF changes without running the app: write a tiny `tsx` script that imports `generateInvoicePDF` (absolute path), calls `doc.output("arraybuffer")`, writes it to the scratchpad, then `sips -s format png in.pdf --out out.png` and view the PNG. `pdftoppm` is not installed.
- For end-to-end checks, `npm run dev` needs `.env.local` (present, gitignored) and the Supabase column to exist.

## Conventions

- PDF is deliberately **ink-friendly**: black/gray text, thin lines, no filled backgrounds. Keep it that way.
- The smog disclaimer (`SMOG_DISCLAIMER` in `generateInvoicePDF.ts`) is on every invoice on purpose — customers assume carb work = smog pass. Don't make it conditional.
- Optional fields save as `null`, not `""`; display `"—"` when empty.
- License plate input auto-uppercases.
