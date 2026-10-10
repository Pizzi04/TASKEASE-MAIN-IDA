-- Correzioni dall'analisi bug: segnalazioni, foto, archivio fiscale, ultimo accesso,
-- pulizia messaggi, chiusura lavori, concorrenza, data italiana, filtro contatti, sospensioni.

-- 1-2. Chi viene segnalato lo decide il database, non chi segnala.
create or replace function public.segnalazioni_ricava_segnalato()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  io uuid := auth.uid();
  n bigint;
  chi uuid;
  c uuid;
  p uuid;
begin
  -- Senza utente (servizio interno) si fida di chi inserisce
  if io is null then return new; end if;
  if new.oggetto_tipo = 'profilo' then
    if new.oggetto_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select u.id into chi from public.profili u where u.id = new.oggetto_id::uuid;
    end if;
  elsif new.oggetto_id ~ '^[0-9]{1,18}$' then
    n := new.oggetto_id::bigint;
    if new.oggetto_tipo = 'giudizio' then
      select g.cliente into chi from public.giudizi g where g.prenotazione = n;
    elsif new.oggetto_tipo = 'post' then
      select b.autore into chi from public.bacheca b where b.id = n;
    elsif new.oggetto_tipo = 'messaggio' then
      select m.autore into chi from public.messaggi m
      join public.prenotazioni b on b.id = m.prenotazione
      where m.id = n and io in (b.cliente, b.professionista);
    elsif new.oggetto_tipo = 'prenotazione' then
      select b.cliente, b.professionista into c, p from public.prenotazioni b where b.id = n;
      chi := case when io = c then p when io = p then c end;
    end if;
  end if;
  if chi is null then
    raise exception 'oggetto della segnalazione non trovato' using errcode = '42501';
  end if;
  new.segnalato := chi;
  return new;
end $$;
revoke execute on function public.segnalazioni_ricava_segnalato() from public, anon, authenticated;

create trigger segnalazioni_segnalato before insert on public.segnalazioni
  for each row execute function public.segnalazioni_ricava_segnalato();

-- 4. Le foto devono stare nella propria cartella
alter policy "bacheca pubblica la tua" on public.bacheca
  with check ((autore = (select auth.uid())) and (not public.e_sospeso_interno(autore))
    and (foto is null or foto like ((select auth.uid())::text || '/%')));
alter policy "profilo: modifico il mio" on public.profili
  with check (((select auth.uid()) = id) and (foto is null or foto like (id::text || '/%')));

-- 7. Archivio fiscale: quando si cancella l'account i dati di profilo e P.IVA
-- sono già spariti al momento del trigger su dati_fiscali. Archiviamo prima, dal profilo.
create or replace function public.archivia_da_profilo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.archivio_fiscale (utente, nome, codice_fiscale, data_nascita, residenza, partita_iva)
  select d.id, old.nome, d.codice_fiscale, d.data_nascita, d.residenza, p.partita_iva
  from public.dati_fiscali d
  left join public.professionisti p on p.id = d.id
  where d.id = old.id;
  return old;
end $$;
revoke execute on function public.archivia_da_profilo() from public, anon, authenticated;
create trigger profili_archivia before delete on public.profili
  for each row execute function public.archivia_da_profilo();

create or replace function public.archivia_dati_fiscali()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Già archiviato in questa stessa cancellazione dal trigger sul profilo
  if exists (select 1 from public.archivio_fiscale a where a.utente = old.id and a.archiviato_il = now()) then
    return old;
  end if;
  insert into public.archivio_fiscale (utente, nome, codice_fiscale, data_nascita, residenza, partita_iva)
  select old.id, u.nome, old.codice_fiscale, old.data_nascita, old.residenza, p.partita_iva
  from (select 1) x
  left join public.profili u on u.id = old.id
  left join public.professionisti p on p.id = old.id;
  return old;
end $$;

-- 6. Ultimo accesso vero (la sessione si rinnova senza nuovo login)
alter table public.profili add column if not exists ultimo_accesso timestamptz default now();
create or replace function public.segna_accesso()
returns void language sql security definer set search_path = '' as $$
  update public.profili set ultimo_accesso = now()
  where id = (select auth.uid()) and (ultimo_accesso is null or ultimo_accesso < now() - interval '12 hours')
$$;
revoke execute on function public.segna_accesso() from public, anon;
grant execute on function public.segna_accesso() to authenticated;

-- 8. Pulizia messaggi senza limite di 1000 prenotazioni
create or replace function public.pulisci_messaggi_vecchi()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from public.messaggi m
  using public.prenotazioni b
  where m.prenotazione = b.id
    and b.stato in ('completata', 'annullata', 'rifiutata')
    and b.aggiornato_il < now() - interval '365 days';
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.pulisci_messaggi_vecchi() from public, anon, authenticated;
grant execute on function public.pulisci_messaggi_vecchi() to service_role;

-- 9. "Lavoro fatto" solo dopo la fine prevista
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
  passata := (b.giorno + b.ora) at time zone 'Europe/Rome' <= now();
  finita := (b.giorno + b.ora) at time zone 'Europe/Rome' + make_interval(hours => coalesce(b.ore, 1)) <= now();
  nuovo := case
    when p_azione = 'conferma' and io = b.professionista and b.stato = 'richiesta' and not b.controproposta and not passata then 'confermata'
    when p_azione = 'accetta_orario' and io = b.cliente and b.stato = 'richiesta' and b.controproposta and not passata then 'confermata'
    when p_azione = 'rifiuta' and io = b.professionista and b.stato = 'richiesta' then 'rifiutata'
    when p_azione = 'annulla' and (b.stato = 'richiesta' or (b.stato = 'confermata' and not passata)) then 'annullata'
    when p_azione = 'completa' and b.stato = 'confermata' and finita then 'completata'
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

-- 10. Due conferme nello stesso istante: la seconda aspetta la prima
create or replace function public.controlla_sovrapposizione()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stato in ('richiesta', 'confermata') then
    perform pg_advisory_xact_lock(hashtext(new.professionista::text || new.giorno::text));
    if exists (
      select 1 from public.prenotazioni p
      where p.professionista = new.professionista
        and p.giorno = new.giorno
        and p.id <> coalesce(new.id, -1)
        and p.stato = 'confermata'
        and int4range(extract(hour from p.ora)::int, extract(hour from p.ora)::int + coalesce(p.ore, 1))
         && int4range(extract(hour from new.ora)::int, extract(hour from new.ora)::int + coalesce(new.ore, 1))
    ) then
      raise exception 'orario sovrapposto a un lavoro confermato' using errcode = 'TE409';
    end if;
  end if;
  return new;
end $$;

-- 11. "Oggi" è quello italiano, non quello del server (UTC)
alter policy "prenotazioni crea come cliente" on public.prenotazioni
  with check ((cliente = (select auth.uid())) and (stato = 'richiesta')
    and (((giorno + ora) at time zone 'Europe/Rome') >= (now() + interval '1 hour'))
    and (giorno <= ((now() at time zone 'Europe/Rome')::date + 30))
    and (not public.e_sospeso_interno(cliente)) and (not public.e_sospeso_interno(professionista))
    and (not public.bloccati_tra(cliente, professionista))
    and (exists (select 1 from public.professionisti p join public.profili u on u.id = p.id
      where p.id = prenotazioni.professionista and p.disponibile and not u.in_pausa
        and p.tariffa_oraria = prenotazioni.tariffa_oraria and prenotazioni.competenza = any (p.competenze)))
    and ((post is null) or (exists (select 1 from public.bacheca b where b.id = prenotazioni.post and b.autore = prenotazioni.cliente))));

alter policy "dati fiscali crea i propri, maggiorenne" on public.dati_fiscali
  with check ((id = (select auth.uid())) and (data_nascita <= ((now() at time zone 'Europe/Rome')::date - interval '18 years')));

create or replace function public.proponi_orario(p_id bigint, p_giorno date, p_ora time)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b public.prenotazioni%rowtype;
begin
  select * into b from public.prenotazioni where id = p_id for update;
  if not found or b.professionista <> (select auth.uid()) or b.stato <> 'richiesta' then
    raise exception 'prenotazione non trovata' using errcode = 'P0002';
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

create or replace function public.orari_occupati(p_professionista uuid)
returns table(giorno date, ora time) language sql stable security definer set search_path = '' as $$
  select distinct p.giorno, (p.ora + make_interval(hours => h))::time
  from public.prenotazioni p
  cross join lateral generate_series(0, case when p.stato = 'confermata' then coalesce(p.ore, 1) - 1 else 0 end) as h
  where p.professionista = p_professionista
    and p.stato in ('richiesta', 'confermata')
    and p.giorno between (now() at time zone 'Europe/Rome')::date and (now() at time zone 'Europe/Rome')::date + 30
    and extract(hour from p.ora) + h <= 17
$$;

-- 12. Filtro contatti uguale a quello dell'app: blocca telefoni ed email, non misure e prezzi
create or replace function public.ha_contatti(t text)
returns boolean language sql immutable set search_path = '' as $$
  select t ~* '(?:\+|\y00)39[\s.-]?\d{2,4}[\s.-]?\d{3,4}'
      or t ~* '(?<![\d,.])3\d{2}(?:[\s./-]?\d{3}[\s.-]?\d{3,4}|[\s./-]?\d{6,7})(?!\d|,\d|\s*(?:mm|cm|m|mt|kg|g|€|euro|eur)\y)'
      or t ~* '(?<![\d,.])0\d{1,3}[\s./-]?\d{5,8}(?!\d|,\d|\s*(?:mm|cm|m|kg|€|euro)\y)'
      or t ~ '\d{9,}'
      or t ~* '[a-z0-9_.+-]+@[a-z0-9_-]+\.[a-z]{2,}'
$$;

-- 13. Lo stato di sospensione non si può più chiedere per chiunque via API
create schema if not exists privato;
revoke all on schema privato from public;
grant usage on schema privato to authenticated, anon, service_role;

create or replace function privato.e_sospeso(u uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select sospeso from public.profili where id = u), false)
$$;
revoke execute on function privato.e_sospeso(uuid) from public;
grant execute on function privato.e_sospeso(uuid) to authenticated, anon, service_role;

do $$
declare r record; q text; c text; s text;
begin
  for r in select * from pg_policies where schemaname = 'public'
    and (coalesce(qual, '') || coalesce(with_check, '')) like '%e_sospeso_interno(%'
  loop
    q := regexp_replace(r.qual, '(public\.)?e_sospeso_interno\(', 'privato.e_sospeso(', 'g');
    c := regexp_replace(r.with_check, '(public\.)?e_sospeso_interno\(', 'privato.e_sospeso(', 'g');
    s := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if q is not null then s := s || ' using (' || q || ')'; end if;
    if c is not null then s := s || ' with check (' || c || ')'; end if;
    execute s;
  end loop;
end $$;

create or replace function public.e_sospeso(u uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case when u = (select auth.uid()) or public.e_admin() then privato.e_sospeso(u) else false end
$$;

revoke execute on function public.e_sospeso_interno(uuid) from public, anon, authenticated;
