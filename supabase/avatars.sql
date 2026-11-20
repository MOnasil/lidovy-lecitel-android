-- Úložiště profilových fotek: veřejně čitelné, každý přihlášený zapisuje jen svůj soubor <id>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 524288,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "avatar: nahrat vlastni" on storage.objects;
drop policy if exists "avatar: zmenit vlastni" on storage.objects;
drop policy if exists "avatar: smazat vlastni" on storage.objects;
drop policy if exists "avatar: cist vlastni" on storage.objects;

create policy "avatar: nahrat vlastni" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');
create policy "avatar: zmenit vlastni" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg')
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');
create policy "avatar: smazat vlastni" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');
-- přepsání (upsert) potřebuje i čtení vlastního souboru přes API
create policy "avatar: cist vlastni" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');
