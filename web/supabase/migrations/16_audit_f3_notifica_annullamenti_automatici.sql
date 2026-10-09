-- Annullamento fatto dal sistema (nessun utente collegato): avvisa entrambe le parti
create or replace function public.dopo_prenotazione() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  testo_annullo text;
begin
  if tg_op = 'INSERT' then
    perform public.notifica(new.professionista, 'prenotazione',
      public.primo_nome(new.cliente) || ' ti chiede: ' || left(new.descrizione, 60) || ' (' || to_char(new.giorno, 'DD/MM') || ' ore ' || to_char(new.ora, 'HH24:MI') || ').',
      '/prenotazioni/' || new.id);
  elsif new.stato is distinct from old.stato then
    if new.stato = 'confermata' then
      perform public.notifica(new.cliente, 'prenotazione', public.primo_nome(new.professionista) || ' ha confermato il ' || to_char(new.giorno, 'DD/MM') || ' alle ' || to_char(new.ora, 'HH24:MI') || '.', '/prenotazioni/' || new.id);
    elsif new.stato = 'rifiutata' then
      perform public.notifica(new.cliente, 'prenotazione', public.primo_nome(new.professionista) || ' non può venire il ' || to_char(new.giorno, 'DD/MM') || '. Cerca un altro professionista.', '/prenotazioni/' || new.id);
    elsif new.stato = 'annullata' then
      testo_annullo := 'Annullata la prenotazione del ' || to_char(new.giorno, 'DD/MM') || coalesce(': ' || new.motivo, '.');
      if (select auth.uid()) is null then
        if new.cliente is not null then perform public.notifica(new.cliente, 'prenotazione', testo_annullo, '/prenotazioni/' || new.id); end if;
        perform public.notifica(new.professionista, 'prenotazione', testo_annullo, '/prenotazioni/' || new.id);
      else
        perform public.notifica(case when (select auth.uid()) = new.cliente then new.professionista else new.cliente end,
          'prenotazione', testo_annullo, '/prenotazioni/' || new.id);
      end if;
    elsif new.stato = 'completata' then
      update public.professionisti set lavori = lavori + 1 where id = new.professionista;
      if new.cliente is not null then
        perform public.notifica(new.cliente, 'giudizio', 'Lavoro finito. Com''è andata con ' || public.primo_nome(new.professionista) || '? Lascia il giudizio IDA.', '/prenotazioni/' || new.id || '/giudizio');
      end if;
    end if;
  end if;
  return null;
end $$;
revoke all on function public.dopo_prenotazione() from public, anon, authenticated;
