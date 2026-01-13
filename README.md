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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
```

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Tables

Create tables named `groups` and `eggs` with these columns:

### groups

- `id` (uuid, primary key)
- `invite_code` (text, unique)
- `member_one_name` (text)
- `member_two_name` (text, nullable)
- `created_at` (timestamptz, default now())

### eggs

- `id` (uuid, primary key)
- `crate_id` (text, references `groups.id`)
- `position` (int)
- `eaten_by` (text, nullable)
- `eaten_at` (timestamptz, nullable)

The app seeds 30 rows for each new group.
