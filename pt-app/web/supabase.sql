-- 짐노트: Supabase SQL Editor 에 붙여 넣고 Run.
-- 트레이너 계정마다 기록 한 줄(data = 앱 상태 전체 JSON). 행 단위 보안으로 본인 줄만 읽고 쓸 수 있다.
create table if not exists public.notebooks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.notebooks enable row level security;
drop policy if exists "own notebook select" on public.notebooks;
drop policy if exists "own notebook insert" on public.notebooks;
drop policy if exists "own notebook update" on public.notebooks;
drop policy if exists "own notebook delete" on public.notebooks;
create policy "own notebook select" on public.notebooks for select using (auth.uid() = user_id);
create policy "own notebook insert" on public.notebooks for insert with check (auth.uid() = user_id);
create policy "own notebook update" on public.notebooks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notebook delete" on public.notebooks for delete using (auth.uid() = user_id);
