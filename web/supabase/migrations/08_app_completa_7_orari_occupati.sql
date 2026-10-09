-- Orari già presi di un professionista (senza dire da chi né per cosa), per non proporli nel modulo di prenotazione.
create function public.orari_occupati(p_professionista uuid) returns table (giorno date, ora time)
language sql stable security definer set search_path = '' as $$
  select giorno, ora from public.prenotazioni
  where professionista = p_professionista and stato in ('richiesta','confermata')
    and giorno between current_date and current_date + 30
$$;
revoke all on function public.orari_occupati(uuid) from public, anon;
grant execute on function public.orari_occupati(uuid) to authenticated;
