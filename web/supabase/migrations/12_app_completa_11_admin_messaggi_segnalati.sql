-- L'amministratore legge un messaggio solo se qualcuno l'ha segnalato (le chat restano private)
create policy "messaggi segnalati visibili agli admin" on public.messaggi
  for select to authenticated using (
    public.e_admin()
    and exists (select 1 from public.segnalazioni s where s.oggetto_tipo = 'messaggio' and s.oggetto_id = messaggi.id::text)
  );
