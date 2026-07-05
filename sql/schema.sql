-- ═══════════════════════════════════════════════════════════════
-- Homing In — Supabase schema
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════

-- One shared list of houses. Each row stores a whole house object as JSON,
-- so there are no columns to map and new fields just work.
create table if not exists public.houses (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock the table down, then allow ONLY signed-in users (your 3 accounts)
-- to read and write. Everyone shares the same list — it's a joint house hunt.
alter table public.houses enable row level security;

drop policy if exists "shared access for signed-in users" on public.houses;
create policy "shared access for signed-in users"
  on public.houses
  for all
  to authenticated
  using (true)
  with check (true);

-- Turn on realtime so your phone and laptop stay in sync automatically.
do $$
begin
  alter publication supabase_realtime add table public.houses;
exception
  when duplicate_object then null;
end $$;
