-- Lidový léčitel – tabulka profilů pro vlastní Supabase (projekt crgjrtpjjkeubnqihuiy)
-- Spusťte jednou v Supabase: SQL Editor → New query → vložit → Run.
-- Každý přihlášený uživatel vidí a mění jen svůj vlastní řádek (Row Level Security).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  flags text[] not null default '{}',      -- zaškrtnuté nemoci, alergie, "fav:" apod.
  meds text[] not null default '{}',       -- vybrané léky (klíče z katalogu v aplikaci)
  meds_other text not null default '',     -- jiné léky vlastními slovy
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint display_name_len check (char_length(display_name) <= 80),
  constraint meds_other_len check (char_length(meds_other) <= 1000)
);

alter table public.profiles enable row level security;

drop policy if exists "profil: cist vlastni" on public.profiles;
drop policy if exists "profil: vlozit vlastni" on public.profiles;
drop policy if exists "profil: menit vlastni" on public.profiles;
drop policy if exists "profil: smazat vlastni" on public.profiles;

create policy "profil: cist vlastni" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profil: vlozit vlastni" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profil: menit vlastni" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profil: smazat vlastni" on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

-- Nepřihlášení nemají k tabulce žádný přístup.
revoke all on public.profiles from anon;
grant select, insert, update, delete on public.profiles to authenticated;

-- Čas poslední změny se doplní sám.
create or replace function public.profiles_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.profiles_touch();

-- Po registraci se profil založí sám (se jménem zadaným při registraci).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
