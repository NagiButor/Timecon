-- Вставь целиком в Supabase: SQL Editor -> New query -> Run

create table if not exists public.timecon_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at bigint not null default 0
);

alter table public.timecon_state enable row level security;

create policy "own state select" on public.timecon_state
  for select to authenticated using (auth.uid() = user_id);

create policy "own state insert" on public.timecon_state
  for insert to authenticated with check (auth.uid() = user_id);

create policy "own state update" on public.timecon_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
