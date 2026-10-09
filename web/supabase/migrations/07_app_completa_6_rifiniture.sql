-- Le funzioni dei trigger non si chiamano da fuori
revoke execute on function public.dopo_giudizio(), public.dopo_messaggio(), public.dopo_prenotazione(),
  public.dopo_proposta() from public, anon, authenticated;

-- search_path fisso anche sulle funzioni di elenco
alter function public.competenze_valide() set search_path = '';
alter function public.zone_valide() set search_path = '';
alter function public.ha_contatti(text) set search_path = '';

-- Si può sapere solo dei blocchi che ti riguardano
create or replace function public.bloccati_tra(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) in (a, b)
    and exists (select 1 from public.blocchi where (utente = a and bloccato = b) or (utente = b and bloccato = a))
$$;

-- Indici sulle chiavi esterne
create index bacheca_autore_idx on public.bacheca (autore);
create index giudizi_cliente_idx on public.giudizi (cliente);
create index messaggi_autore_idx on public.messaggi (autore);
create index preferiti_professionista_idx on public.preferiti (professionista);
create index prenotazioni_post_idx on public.prenotazioni (post);
create index proposte_professionista_idx on public.proposte (professionista);
create index segnalazioni_deciso_da_idx on public.segnalazioni (deciso_da);
create index segnalazioni_segnalato_idx on public.segnalazioni (segnalato);
create index verifiche_deciso_da_idx on public.verifiche (deciso_da);
