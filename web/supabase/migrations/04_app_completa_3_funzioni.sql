-- ---------- Notifiche ----------
create function public.notifica(u uuid, tipo text, testo text, link text) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifiche (utente, tipo, testo, link) values (u, tipo, testo, link)
$$;
revoke all on function public.notifica(uuid, text, text, text) from public, anon, authenticated;

create function public.primo_nome(u uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(split_part((select nome from public.profili where id = u), ' ', 1), 'Qualcuno')
$$;
revoke all on function public.primo_nome(uuid) from public, anon, authenticated;

-- ---------- IDA ----------
create function public.ricalcola_ida(p uuid) returns void
language sql security definer set search_path = '' as $$
  update public.professionisti set
    ida = (select round(avg(punteggio))::integer from public.giudizi where professionista = p and not nascosto),
    giudizi = (select count(*)::integer from public.giudizi where professionista = p and not nascosto)
  where id = p
$$;
revoke all on function public.ricalcola_ida(uuid) from public, anon, authenticated;

create function public.dopo_giudizio() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.ricalcola_ida(new.professionista);
  perform public.notifica(new.professionista, 'giudizio',
    public.primo_nome(new.cliente) || ' ti ha dato un giudizio: ' || new.punteggio || '/100.', '/lavoro');
  return null;
end $$;
create trigger giudizi_dopo after insert on public.giudizi for each row execute function public.dopo_giudizio();

-- ---------- Prenotazioni ----------
create function public.dopo_prenotazione() returns trigger
language plpgsql security definer set search_path = '' as $$
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
      perform public.notifica(case when (select auth.uid()) = new.cliente then new.professionista else new.cliente end,
        'prenotazione', 'Annullata la prenotazione del ' || to_char(new.giorno, 'DD/MM') || coalesce(': ' || new.motivo, '.'), '/prenotazioni/' || new.id);
    elsif new.stato = 'completata' then
      update public.professionisti set lavori = lavori + 1 where id = new.professionista;
      perform public.notifica(new.cliente, 'giudizio', 'Lavoro finito. Com''è andata con ' || public.primo_nome(new.professionista) || '? Lascia il giudizio IDA.', '/prenotazioni/' || new.id || '/giudizio');
    end if;
  end if;
  return null;
end $$;
create trigger prenotazioni_dopo after insert or update of stato on public.prenotazioni
  for each row execute function public.dopo_prenotazione();

create function public.cambia_stato_prenotazione(p_id bigint, p_azione text, p_motivo text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  b public.prenotazioni%rowtype;
  io uuid := auth.uid();
  nuovo text;
begin
  select * into b from public.prenotazioni where id = p_id for update;
  if not found or io is null or io not in (b.cliente, b.professionista) then
    raise exception 'prenotazione non trovata' using errcode = 'P0002';
  end if;
  nuovo := case
    when p_azione = 'conferma' and io = b.professionista and b.stato = 'richiesta' then 'confermata'
    when p_azione = 'rifiuta' and io = b.professionista and b.stato = 'richiesta' then 'rifiutata'
    when p_azione = 'annulla' and b.stato in ('richiesta','confermata') then 'annullata'
    when p_azione = 'completa' and io = b.professionista and b.stato = 'confermata'
      and (b.giorno + b.ora) at time zone 'Europe/Rome' <= now() then 'completata'
  end;
  if nuovo is null then
    raise exception 'azione non permessa' using errcode = 'P0001';
  end if;
  update public.prenotazioni set stato = nuovo, motivo = left(nullif(btrim(p_motivo), ''), 300) where id = p_id;
  return nuovo;
end $$;
revoke all on function public.cambia_stato_prenotazione(bigint, text, text) from public, anon;
grant execute on function public.cambia_stato_prenotazione(bigint, text, text) to authenticated;

-- ---------- Messaggi ----------
create function public.dopo_messaggio() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  altro uuid;
begin
  select case when new.autore = cliente then professionista else cliente end into altro
  from public.prenotazioni where id = new.prenotazione;
  if not exists (select 1 from public.notifiche where utente = altro and tipo = 'messaggio'
                 and link = '/prenotazioni/' || new.prenotazione || '/chat' and not letta) then
    perform public.notifica(altro, 'messaggio', public.primo_nome(new.autore) || ' ti ha scritto.',
      '/prenotazioni/' || new.prenotazione || '/chat');
  end if;
  return null;
end $$;
create trigger messaggi_dopo after insert on public.messaggi for each row execute function public.dopo_messaggio();

create function public.segna_letti(p_prenotazione bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.e_parte(p_prenotazione) then return; end if;
  update public.messaggi set letto_il = now()
    where prenotazione = p_prenotazione and autore <> (select auth.uid()) and letto_il is null;
  update public.notifiche set letta = true
    where utente = (select auth.uid()) and link = '/prenotazioni/' || p_prenotazione || '/chat' and not letta;
end $$;
revoke all on function public.segna_letti(bigint) from public, anon;
grant execute on function public.segna_letti(bigint) to authenticated;

-- ---------- Bacheca ----------
create function public.dopo_proposta() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  a uuid;
begin
  if tg_op = 'INSERT' then
    update public.bacheca set risposte = risposte + 1 where id = new.post returning autore into a;
    perform public.notifica(a, 'proposta', public.primo_nome(new.professionista) || ' ha risposto alla tua richiesta.', '/bacheca/' || new.post);
  else
    update public.bacheca set risposte = greatest(risposte - 1, 0) where id = old.post;
  end if;
  return null;
end $$;
create trigger proposte_dopo after insert or delete on public.proposte for each row execute function public.dopo_proposta();

-- ---------- Diventare professionista (tutto o niente) ----------
create function public.diventa_professionista(
  p_bio text, p_competenze text[], p_zone text[], p_tariffa integer, p_su_preventivo boolean,
  p_tipo text, p_partita_iva text, p_abilitazione boolean, p_assicurazione boolean,
  p_codice_fiscale text, p_data_nascita date, p_residenza text, p_versione_termini text
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  io uuid := auth.uid();
begin
  insert into public.professionisti (id, bio, competenze, zone, tariffa_oraria, su_preventivo, tipo, partita_iva,
    abilitazione_impianti, assicurazione_rc)
  values (io, coalesce(p_bio, ''), p_competenze, p_zone, p_tariffa, coalesce(p_su_preventivo, false), p_tipo,
    nullif(p_partita_iva, ''), coalesce(p_abilitazione, false), coalesce(p_assicurazione, false));
  insert into public.dati_fiscali (id, codice_fiscale, data_nascita, residenza, dichiarazione_fiscale)
  values (io, upper(p_codice_fiscale), p_data_nascita, p_residenza, true);
  insert into public.consensi (utente, documento, versione) values (io, 'termini_professionisti', p_versione_termini);
  update public.profili set ruolo = 'worker' where id = io;
end $$;
revoke all on function public.diventa_professionista(text, text[], text[], integer, boolean, text, text, boolean, boolean, text, date, text, text) from public, anon;
grant execute on function public.diventa_professionista(text, text[], text[], integer, boolean, text, text, boolean, boolean, text, date, text, text) to authenticated;

-- ---------- Amministrazione ----------
create function public.decidi_verifica(p_id bigint, p_esito text, p_motivazione text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v public.verifiche%rowtype;
begin
  if not public.e_admin() then raise exception 'solo amministratori' using errcode = '42501'; end if;
  if p_esito not in ('verificata','respinta') then raise exception 'esito non valido' using errcode = 'P0001'; end if;
  update public.verifiche set stato = p_esito, motivazione = nullif(btrim(p_motivazione), ''),
    deciso_da = auth.uid(), deciso_il = now()
  where id = p_id and stato = 'in_attesa' returning * into v;
  if not found then raise exception 'verifica non trovata' using errcode = 'P0002'; end if;
  update public.professionisti set verificato = (p_esito = 'verificata') where id = v.professionista;
  perform public.notifica(v.professionista, 'verifica',
    case when p_esito = 'verificata' then 'Identità verificata: sul tuo profilo ora c''è il badge.'
         else 'Verifica non riuscita' || coalesce(': ' || nullif(btrim(p_motivazione), ''), '.') || ' Puoi richiederla di nuovo.' end,
    '/lavoro');
end $$;

create function public.decidi_segnalazione(p_id bigint, p_esito text, p_azione text, p_motivazione text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.segnalazioni%rowtype;
  prof uuid;
begin
  if not public.e_admin() then raise exception 'solo amministratori' using errcode = '42501'; end if;
  if p_esito not in ('accolta','respinta') or p_azione not in ('nessuna','contenuto_nascosto','account_sospeso')
     or (p_esito = 'respinta' and p_azione <> 'nessuna') or char_length(btrim(coalesce(p_motivazione, ''))) < 10 then
    raise exception 'decisione non valida: serve una motivazione di almeno 10 caratteri' using errcode = 'P0001';
  end if;
  update public.segnalazioni set stato = p_esito, azione = p_azione, motivazione = btrim(p_motivazione),
    deciso_da = auth.uid(), deciso_il = now()
  where id = p_id and stato = 'aperta' returning * into s;
  if not found then raise exception 'segnalazione non trovata' using errcode = 'P0002'; end if;

  if p_azione = 'contenuto_nascosto' then
    if s.oggetto_tipo = 'giudizio' then
      update public.giudizi set nascosto = true where prenotazione = s.oggetto_id::bigint returning professionista into prof;
      if prof is not null then perform public.ricalcola_ida(prof); end if;
    elsif s.oggetto_tipo = 'post' then
      update public.bacheca set stato = 'rimossa' where id = s.oggetto_id::bigint;
    elsif s.oggetto_tipo = 'messaggio' then
      update public.messaggi set testo = '[messaggio rimosso dalla moderazione]' where id = s.oggetto_id::bigint;
    end if;
  elsif p_azione = 'account_sospeso' and s.segnalato is not null then
    update public.profili set sospeso = true where id = s.segnalato;
    update public.professionisti set disponibile = false where id = s.segnalato;
  end if;

  if s.autore is not null then
    perform public.notifica(s.autore, 'segnalazione',
      'La tua segnalazione è stata ' || p_esito || '. ' || btrim(p_motivazione), '/segnalazioni');
  end if;
  if p_azione <> 'nessuna' and s.segnalato is not null then
    perform public.notifica(s.segnalato, 'moderazione',
      case when p_azione = 'account_sospeso' then 'Il tuo account è stato sospeso. ' else 'Un tuo contenuto è stato nascosto. ' end
      || 'Motivo: ' || btrim(p_motivazione) || ' Puoi contestare la decisione dall''assistenza.', '/assistenza');
  end if;
end $$;

create function public.riattiva_account(p_utente uuid, p_motivazione text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.e_admin() then raise exception 'solo amministratori' using errcode = '42501'; end if;
  update public.profili set sospeso = false where id = p_utente;
  perform public.notifica(p_utente, 'moderazione', 'Il tuo account è di nuovo attivo. ' || coalesce(btrim(p_motivazione), ''), '/');
end $$;

revoke all on function public.decidi_verifica(bigint, text, text), public.decidi_segnalazione(bigint, text, text, text),
  public.riattiva_account(uuid, text) from public, anon;
grant execute on function public.decidi_verifica(bigint, text, text), public.decidi_segnalazione(bigint, text, text, text),
  public.riattiva_account(uuid, text) to authenticated;

-- ---------- Misurazione senza dati personali ----------
create function public.registra_evento(p_nome text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_nome in ('apertura','accesso_avviato','accesso_riuscito','profilo_creato','ricerca','scheda_vista',
                'prenotazione_avviata','prenotazione_inviata','post_pubblicato','proposta_inviata',
                'professionista_creato','app_installata') then
    insert into public.eventi (nome) values (p_nome);
  end if;
end $$;
revoke all on function public.registra_evento(text) from public;
grant execute on function public.registra_evento(text) to anon, authenticated;

create function public.numeri(p_giorni integer default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  dal date := current_date - greatest(1, least(p_giorni, 365));
begin
  if not public.e_admin() then raise exception 'solo amministratori' using errcode = '42501'; end if;
  return jsonb_build_object(
    'dal', dal,
    'iscritti', (select count(*) from public.profili),
    'iscritti_periodo', (select count(*) from public.profili where creato_il >= dal),
    'professionisti', (select count(*) from public.professionisti),
    'professionisti_verificati', (select count(*) from public.professionisti where verificato),
    'prenotazioni_per_stato', (select coalesce(jsonb_object_agg(stato, n), '{}') from
        (select stato, count(*) n from public.prenotazioni where creato_il >= dal group by stato) x),
    'giudizi', (select count(*) from public.giudizi where creato_il >= dal),
    'ida_medio', (select round(avg(punteggio)) from public.giudizi where creato_il >= dal and not nascosto),
    'post_aperti', (select count(*) from public.bacheca where stato = 'aperta' and scade_il > now()),
    'segnalazioni_aperte', (select count(*) from public.segnalazioni where stato = 'aperta'),
    'verifiche_in_attesa', (select count(*) from public.verifiche where stato = 'in_attesa'),
    'clienti_che_tornano', (select count(*) from (select cliente from public.prenotazioni where stato = 'completata'
        group by cliente having count(*) >= 2) x),
    'eventi', (select coalesce(jsonb_object_agg(nome, n), '{}') from
        (select nome, count(*) n from public.eventi where giorno >= dal group by nome) x),
    'uscite', (select coalesce(jsonb_object_agg(motivo, n), '{}') from
        (select motivo, count(*) n from public.uscite where giorno >= dal group by motivo) x)
  );
end $$;
revoke all on function public.numeri(integer) from public, anon;
grant execute on function public.numeri(integer) to authenticated;

-- ---------- Tempo reale per chat e notifiche ----------
alter publication supabase_realtime add table public.messaggi, public.notifiche;
