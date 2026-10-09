create or replace function public.cambia_stato_prenotazione(p_id bigint, p_azione text, p_motivo text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  b public.prenotazioni%rowtype;
  io uuid := auth.uid();
  nuovo text;
  passata boolean;
  v_motivo text := left(nullif(btrim(p_motivo), ''), 300);
begin
  select * into b from public.prenotazioni where id = p_id for update;
  if not found or io is null or io not in (b.cliente, b.professionista) then
    raise exception 'prenotazione non trovata' using errcode = 'P0002';
  end if;
  passata := (b.giorno + b.ora) at time zone 'Europe/Rome' <= now();
  nuovo := case
    when p_azione = 'conferma' and io = b.professionista and b.stato = 'richiesta' and not b.controproposta and not passata then 'confermata'
    when p_azione = 'accetta_orario' and io = b.cliente and b.stato = 'richiesta' and b.controproposta and not passata then 'confermata'
    when p_azione = 'rifiuta' and io = b.professionista and b.stato = 'richiesta' then 'rifiutata'
    when p_azione = 'annulla' and (b.stato = 'richiesta' or (b.stato = 'confermata' and not passata)) then 'annullata'
    when p_azione = 'completa' and b.stato = 'confermata' and passata then 'completata'
    when p_azione = 'non_presentato' and io = b.cliente and b.stato = 'confermata' and passata then 'annullata'
  end;
  if nuovo is null then
    raise exception 'azione non permessa' using errcode = 'P0001';
  end if;
  if p_azione = 'non_presentato' then
    insert into public.segnalazioni (autore, tipo, oggetto_tipo, oggetto_id, segnalato, motivo, testo)
    values (io, 'problema_lavoro', 'prenotazione', p_id::text, b.professionista, 'Nessuno si è presentato', v_motivo);
    v_motivo := 'Il cliente segnala che nessuno si è presentato.';
  end if;
  update public.prenotazioni set stato = nuovo, motivo = v_motivo where id = p_id;
  return nuovo;
end $$;
revoke all on function public.cambia_stato_prenotazione(bigint, text, text) from public, anon;
grant execute on function public.cambia_stato_prenotazione(bigint, text, text) to authenticated;
