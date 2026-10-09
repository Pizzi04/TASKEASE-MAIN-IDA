-- Prenotazione + indirizzo in un colpo solo, con le regole di sicurezza del chiamante.
create function public.prenota(
  p_professionista uuid, p_competenza text, p_descrizione text, p_indirizzo text, p_zona text,
  p_giorno date, p_ora time, p_ore smallint, p_tariffa integer, p_post bigint default null
) returns bigint language plpgsql security invoker set search_path = '' as $$
declare
  nuovo bigint;
begin
  insert into public.prenotazioni (cliente, professionista, competenza, descrizione, zona, giorno, ora, ore, tariffa_oraria, post)
  values ((select auth.uid()), p_professionista, p_competenza, btrim(p_descrizione), p_zona, p_giorno, p_ora, p_ore, p_tariffa, p_post)
  returning id into nuovo;
  insert into public.indirizzi (prenotazione, cliente, indirizzo) values (nuovo, (select auth.uid()), btrim(p_indirizzo));
  return nuovo;
end $$;
revoke all on function public.prenota(uuid, text, text, text, text, date, time, smallint, integer, bigint) from public, anon;
grant execute on function public.prenota(uuid, text, text, text, text, date, time, smallint, integer, bigint) to authenticated;

-- Ricalcolo notturno: i giudizi invecchiano e pesano meno
create extension if not exists pg_cron;
select cron.schedule('ida-notte', '17 3 * * *', $$select public.ricalcola_ida(id) from public.professionisti where giudizi > 0$$);
