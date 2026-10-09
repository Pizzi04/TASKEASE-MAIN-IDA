-- Prima di eliminare l'account: avvisa le controparti delle prenotazioni attive e registra il motivo (anonimo).
-- La cancellazione vera la fa il server dell'app con la chiave segreta (auth.admin.deleteUser).
create function public.prepara_eliminazione(p_motivo text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  io uuid := auth.uid();
  b record;
begin
  if io is null then raise exception 'accesso richiesto' using errcode = '42501'; end if;
  for b in select * from public.prenotazioni
           where io in (cliente, professionista) and stato in ('richiesta','confermata') loop
    perform public.notifica(case when io = b.cliente then b.professionista else b.cliente end, 'prenotazione',
      'La prenotazione del ' || to_char(b.giorno, 'DD/MM') || ' è annullata: l''altra persona ha chiuso l''account.', '/prenotazioni');
  end loop;
  if p_motivo is not null and char_length(p_motivo) <= 80 then
    insert into public.uscite (motivo) values (p_motivo);
  end if;
end $$;
revoke all on function public.prepara_eliminazione(text) from public, anon;
grant execute on function public.prepara_eliminazione(text) to authenticated;
