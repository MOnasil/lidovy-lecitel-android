-- Comments sent from the app (written only by the "feedback" Edge Function with the service role).
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  page text,
  text text not null,
  platform text,
  user_email text,
  vyreseno boolean not null default false
);
alter table public.feedback enable row level security;
-- No policies: the app cannot read or write the table directly.
-- New projects do not grant table rights to API roles automatically.
grant select, insert, update, delete on public.feedback to service_role;
