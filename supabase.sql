-- Run this in Supabase Dashboard > SQL Editor.
-- Row Level Security ensures each signed-in user can access only their own library.
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  item_type text not null default 'Movie' check (item_type in ('Movie','TV/Web Series','Anime','Book','Manga','Game')),
  year integer,
  genres text[] not null default '{}',
  platform text not null default '',
  status text not null default 'To Watch' check (status in ('To Watch','Watching','Completed','On Hold','Dropped','Wishlist','Playing','Reading')),
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 10)),
  poster_url text not null default '',
  synopsis text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists library_items_user_id_idx on public.library_items(user_id);
create index if not exists library_items_type_idx on public.library_items(item_type);
alter table public.library_items enable row level security;

drop policy if exists "Users can view their own library items" on public.library_items;
create policy "Users can view their own library items"
on public.library_items for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert their own library items" on public.library_items;
create policy "Users can insert their own library items"
on public.library_items for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own library items" on public.library_items;
create policy "Users can update their own library items"
on public.library_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own library items" on public.library_items;
create policy "Users can delete their own library items"
on public.library_items for delete to authenticated using (auth.uid() = user_id);
