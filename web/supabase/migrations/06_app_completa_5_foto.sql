-- Foto profilo e foto della bacheca: lettura pubblica, ognuno scrive solo nella sua cartella (<id utente>/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foto', 'foto', true, 3145728, array['image/jpeg','image/png','image/webp']);

create policy "foto: carico nella mia cartella" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'foto' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "foto: sostituisco le mie" on storage.objects
  for update to authenticated
  using (bucket_id = 'foto' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'foto' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "foto: tolgo le mie" on storage.objects
  for delete to authenticated
  using (bucket_id = 'foto' and (storage.foldername(name))[1] = (select auth.uid())::text);
