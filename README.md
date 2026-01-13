# Egg Crate Tracker

Track who ate which egg in a shared crate. Built with Next.js, Tailwind, and Supabase.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create `.env.local` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Table

Create a table named `eggs` with these columns:

- `id` (uuid, primary key)
- `crate_id` (text)
- `position` (int)
- `eaten_by` (text, nullable)
- `eaten_at` (timestamptz, nullable)

The app seeds 30 rows on first load for `crate_id = "default"`.
