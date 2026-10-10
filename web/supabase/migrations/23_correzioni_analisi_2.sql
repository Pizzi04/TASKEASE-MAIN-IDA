-- Seconda analisi bug: diventare professionista solo con i controlli, sospensione che blocca davvero,
-- divieto di contatti anche via API, iscrizioni push limitate, consensi non falsificabili, piccoli margini.

-- 1. Si diventa professionista solo da diventa_professionista, che controlla età, codice fiscale e termini
revoke insert on public.professionisti from authenticated;
revoke insert on public.dati_fiscali from authenticated;

create or replace function public.diventa_professionista(p_bio text, p_competenze text[], p_zone text[], p_tariffa integer,
  p_su_preventivo boolean, p_tipo text, p_partita_iva text, p_abilitazione boolean, p_assicurazione boolean,
  p_codice_fiscale text, p_data_nascita date, p_residenza text, p_versione_termini text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  io uuid := auth.uid();
  oggi date := (now() at time zone 'Europe/Rome')::date;
begin
  if io is null or not exists (select 1 from public.profili where id = io) then
    raise exception 'accesso richiesto' using errcode = '42501';
  end if;
  if privato.e_sospeso(io) then
    raise exception 'account sospeso' using errcode = '42501';
  end if;
  if p_data_nascita is null or p_data_nascita > oggi - interval '18 years' or p_data_nascita < oggi - interval '110 years' then
    raise exception 'servono 18 anni' using errcode = 'P0001';
  end if;
  if not public.cf_valido(upper(coalesce(p_codice_fiscale, ''))) then
    raise exception 'codice fiscale non valido' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_residenza, ''))) not between 6 and 200 then
    raise exception 'residenza non valida' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_versione_termini, ''))) not between 1 and 20 then
    raise exception 'termini non accettati' using errcode = 'P0001';
  end if;
  if public.ha_contatti(coalesce(p_bio, '')) then
    raise exception 'niente contatti nella presentazione' using errcode = '23514';
  end if;
  insert into public.professionisti (id, bio, competenze, zone, tariffa_oraria, su_preventivo, tipo, partita_iva,
    abilitazione_impianti, assicurazione_rc)
  values (io, coalesce(p_bio, ''), p_competenze, p_zone, p_tariffa, coalesce(p_su_preventivo, false), p_tipo,
    nullif(p_partita_iva, ''), coalesce(p_abilitazione, false), coalesce(p_assicurazione, false));
  insert into public.dati_fiscali (id, codice_fiscale, data_nascita, residenza, dichiarazione_fiscale)
  values (io, upper(p_codice_fiscale), p_data_nascita, btrim(p_residenza), true);
  insert into public.consensi (utente, documento, versione) values (io, 'termini_professionisti', btrim(p_versione_termini));
  update public.profili set ruolo = 'worker' where id = io;
end $$;
revoke execute on function public.diventa_professionista(text, text[], text[], integer, boolean, text, text, boolean, boolean, text, date, text, text) from public, anon;
grant execute on function public.diventa_professionista(text, text[], text[], integer, boolean, text, text, boolean, boolean, text, date, text, text) to authenticated;

-- 2. Chi è sospeso non lavora: niente conferme, controproposte, "fatto"; può solo annullare
create or replace function public.cambia_stato_prenotazione(p_id bigint, p_azione text, p_motivo text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  b public.prenotazioni%rowtype;
  io uuid := auth.uid();
  nuovo text;
  passata boolean;
  finita boolean;
  v_motivo text := left(nullif(btrim(p_motivo), ''), 300);
begin
  select * into b from public.prenotazioni where id = p_id for update;
  if not found or io is null or io not in (b.cliente, b.professionista) then
    raise exception 'prenotazione non trovata' using errcode = 'P0002';
  end if;
  if p_azione <> 'annulla' and privato.e_sospeso(io) then
    raise exception 'account sospeso' using errcode = '42501';
  end if;
  passata := (b.giorno + b.ora) at time zone 'Europe/Rome' <= now();
  finita := (b.giorno + b.ora) at time zone 'Europe/Rome' + make_interval(hours => coalesce(b.ore, 1)) <= now();
  nuovo := case
    when p_azione = 'conferma' and io = b.professionista and b.stato = 'richiesta' and not b.controproposta and not passata then 'confermata'
    when p_azione = 'accetta_orario' and io = b.cliente and b.stato = 'richiesta' and b.controproposta and not passata then 'confermata'
    when p_azione = 'rifiuta' and io = b.professionista and b.stato = 'richiesta' then 'rifiutata'
    when p_azione = 'annulla' and (b.stato = 'richiesta' or (b.stato = 'confermata' and not passata)) then 'annullata'
    when p_azione = 'completa' and b.stato = 'confermata' and finita then 'completata'
    -- Mezz'ora di margine: un ritardo non è un "non si è presentato"
    when p_azione = 'non_presentato' and io = b.cliente and b.stato = 'confermata'
      and (b.giorno + b.ora) at time zone 'Europe/Rome' + interval '30 minutes' <= now() then 'annullata'
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

create or replace function public.proponi_orario(p_id bigint, p_giorno date, p_ora time)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b public.prenotazioni%rowtype;
begin
  select * into b from public.prenotazioni where id = p_id for update;
  if not found or b.professionista <> (select auth.uid()) or b.stato <> 'richiesta' then
    raise exception 'prenotazione non trovata' using errcode = 'P0002';
  end if;
  if privato.e_sospeso(b.professionista) then
    raise exception 'account sospeso' using errcode = '42501';
  end if;
  if p_ora not in ('09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00')
     or (p_giorno + p_ora) at time zone 'Europe/Rome' < now() + interval '1 hour'
     or p_giorno > (now() at time zone 'Europe/Rome')::date + 30 then
    raise exception 'orario non valido' using errcode = 'P0001';
  end if;
  update public.prenotazioni set giorno = p_giorno, ora = p_ora, controproposta = true where id = p_id;
  perform public.notifica(b.cliente, 'prenotazione',
    public.primo_nome(b.professionista) || ' propone un altro orario: ' || to_char(p_giorno, 'DD/MM') || ' alle ' || to_char(p_ora, 'HH24:MI') || '.',
    '/prenotazioni/' || p_id);
end $$;

alter policy "professionisti modifica la propria" on public.professionisti
  with check ((id = (select auth.uid())) and (not privato.e_sospeso(id)));

-- Sospendere annulla anche le prenotazioni aperte, avvisando l'altra persona
create or replace function public.decidi_segnalazione(p_id bigint, p_esito text, p_azione text, p_motivazione text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  s public.segnalazioni%rowtype;
  prof uuid;
  b record;
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
    for b in
      update public.prenotazioni set stato = 'annullata', motivo = 'Annullata: l’account dell’altra persona è stato sospeso.'
      where stato in ('richiesta', 'confermata') and s.segnalato in (cliente, professionista)
      returning id, cliente, professionista
    loop
      perform public.notifica(case when b.cliente = s.segnalato then b.professionista else b.cliente end, 'prenotazione',
        'Una tua prenotazione è stata annullata: l’account dell’altra persona è stato sospeso.', '/prenotazioni/' || b.id);
    end loop;
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

-- 3. Niente telefono o email nei testi pubblici, anche scrivendo direttamente al database
-- (not valid: le righe già presenti non vengono ricontrollate, le nuove e le modifiche sì)
alter table public.professionisti add constraint professionisti_bio_senza_contatti check (not public.ha_contatti(bio)) not valid;
alter table public.proposte add constraint proposte_senza_contatti check (not public.ha_contatti(messaggio)) not valid;
alter table public.giudizi add constraint giudizi_commento_senza_contatti check (commento is null or not public.ha_contatti(commento)) not valid;
alter table public.giudizi add constraint giudizi_risposta_senza_contatti check (risposta is null or not public.ha_contatti(risposta)) not valid;
alter table public.prenotazioni add constraint prenotazioni_descrizione_senza_contatti check (not public.ha_contatti(descrizione)) not valid;

-- 4. Iscrizioni push: solo da prendi_push, solo verso servizi push veri, al massimo 5 dispositivi
revoke insert on public.push_iscrizioni from authenticated;
alter table public.push_iscrizioni add constraint push_servizio_noto check (
  endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]*\.push\.apple\.com|[a-z0-9.-]*\.notify\.windows\.com)/'
) not valid;

create or replace function public.prendi_push(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = '' as $$
declare io uuid := auth.uid();
begin
  if io is null then raise exception 'accesso richiesto' using errcode = '42501'; end if;
  if (select count(*) from public.push_iscrizioni where utente = io and endpoint <> p_endpoint) >= 5 then
    raise exception 'troppi dispositivi: disattiva le notifiche su uno che non usi più' using errcode = 'P0003';
  end if;
  insert into public.push_iscrizioni (utente, endpoint, p256dh, auth)
  values (io, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set utente = excluded.utente, p256dh = excluded.p256dh, auth = excluded.auth, creato_il = now();
end $$;

-- 6. Statistiche: chi non è entrato può segnare solo gli eventi di accesso, con un tetto più basso
create or replace function public.registra_evento(p_nome text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  oggi date := (now() at time zone 'Europe/Rome')::date;
  anonimo boolean := auth.uid() is null;
  tetto int := 20000;
begin
  if anonimo then tetto := 3000; end if;
  if anonimo and p_nome not in ('accesso_avviato', 'app_installata') then return; end if;
  if p_nome in ('apertura','accesso_avviato','accesso_riuscito','profilo_creato','ricerca','scheda_vista',
                'prenotazione_avviata','prenotazione_inviata','post_pubblicato','proposta_inviata',
                'professionista_creato','app_installata')
     and (select count(*) from public.eventi where giorno = oggi and nome = p_nome) < tetto then
    insert into public.eventi (nome) values (p_nome);
  end if;
end $$;

-- 7. Consensi: data e numero li mette il database, e solo per documenti che esistono
revoke insert on public.consensi from authenticated;
grant insert (utente, documento, versione) on public.consensi to authenticated;
alter table public.consensi add constraint consensi_documento_noto
  check (documento in ('termini', 'privacy', 'termini_professionisti')) not valid;

-- 10. Profilo visibile per un annuncio solo se l'annuncio è davvero in vista (non scaduto, nessun blocco)
create or replace function public.profilo_visibile(u uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select u = (select auth.uid())
    or exists (select 1 from public.amministratori where utente = (select auth.uid()))
    or exists (select 1 from public.professionisti where id = u)
    or exists (select 1 from public.prenotazioni b
               where (b.cliente = (select auth.uid()) and b.professionista = u)
                  or (b.professionista = (select auth.uid()) and b.cliente = u))
    or exists (select 1 from public.bacheca
               where autore = u and stato = 'aperta' and scade_il > now()
                 and not public.bloccati_tra(u, (select auth.uid())))
$$;

-- Segnalazioni: un giudizio o una prenotazione di chi ha cancellato l'account si possono ancora segnalare
create or replace function public.segnalazioni_ricava_segnalato()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  io uuid := auth.uid();
  n bigint;
  chi uuid;
  c uuid;
  p uuid;
  trovato boolean := false;
begin
  if io is null then return new; end if;
  if new.oggetto_tipo = 'profilo' then
    if new.oggetto_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select u.id into chi from public.profili u where u.id = new.oggetto_id::uuid;
      trovato := chi is not null;
    end if;
  elsif new.oggetto_id ~ '^[0-9]{1,18}$' then
    n := new.oggetto_id::bigint;
    if new.oggetto_tipo = 'giudizio' then
      select g.cliente, true into chi, trovato from public.giudizi g where g.prenotazione = n;
    elsif new.oggetto_tipo = 'post' then
      select b.autore, true into chi, trovato from public.bacheca b where b.id = n;
    elsif new.oggetto_tipo = 'messaggio' then
      select m.autore, true into chi, trovato from public.messaggi m
      join public.prenotazioni b on b.id = m.prenotazione
      where m.id = n and io in (b.cliente, b.professionista);
    elsif new.oggetto_tipo = 'prenotazione' then
      select b.cliente, b.professionista into c, p from public.prenotazioni b where b.id = n;
      trovato := io in (c, p);
      chi := case when io = c then p when io = p then c end;
    end if;
  end if;
  if not coalesce(trovato, false) then
    raise exception 'oggetto della segnalazione non trovato' using errcode = '42501';
  end if;
  -- null = account cancellato: la segnalazione resta valida, senza persona da sanzionare
  new.segnalato := chi;
  return new;
end $$;
