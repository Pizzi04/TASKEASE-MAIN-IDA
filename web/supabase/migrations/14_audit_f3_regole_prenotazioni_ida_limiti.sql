-- ===== F3-01 / F3-08: chi può fare cosa e quando =====
-- Prima dell'orario: conferma, rifiuto, annullamento. Dopo l'orario: niente annullamenti né conferme;
-- il lavoro lo segna fatto il professionista O il cliente; il cliente può dire "non si è presentato".
create or replace function public.cambia_stato_prenotazione(p_id bigint, p_azione text, p_motivo text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  b public.prenotazioni%rowtype;
  io uuid := auth.uid();
  nuovo text;
  passata boolean;
  motivo text := left(nullif(btrim(p_motivo), ''), 300);
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
    motivo := 'Il cliente segnala che nessuno si è presentato.';
    insert into public.segnalazioni (autore, tipo, oggetto_tipo, oggetto_id, segnalato, motivo, testo)
    values (io, 'problema_lavoro', 'prenotazione', p_id::text, b.professionista, 'Nessuno si è presentato', left(nullif(btrim(p_motivo), ''), 1000));
  end if;
  update public.prenotazioni set stato = nuovo, motivo = motivo where id = p_id;
  return nuovo;
end $$;

-- Lavori confermati passati da 48 ore senza che nessuno li segni: completati da soli (così il cliente può giudicare).
-- Richieste mai accettate e ormai passate: chiuse, così non restano "in attesa" per sempre.
create function public.chiudi_prenotazioni_scadute() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.prenotazioni set stato = 'completata', motivo = 'Segnato come fatto in automatico dopo 48 ore.'
  where stato = 'confermata' and (giorno + ora) at time zone 'Europe/Rome' <= now() - interval '48 hours';
  update public.prenotazioni set stato = 'annullata', motivo = 'Scaduta: nessuna risposta prima dell''orario.'
  where stato = 'richiesta' and (giorno + ora) at time zone 'Europe/Rome' <= now();
end $$;
revoke all on function public.chiudi_prenotazioni_scadute() from public, anon, authenticated;
select cron.schedule('prenotazioni-scadute', '*/30 * * * *', $$select public.chiudi_prenotazioni_scadute()$$);

-- ===== F3-02: nell'IDA conta solo l'ultimo giudizio di ogni cliente =====
create or replace function public.ricalcola_ida(p uuid) returns void
language sql security definer set search_path = '' as $$
  with ultimi as (
    select distinct on (coalesce(cliente::text, 'g' || prenotazione::text)) punteggio, creato_il
    from public.giudizi where professionista = p and not nascosto
    order by coalesce(cliente::text, 'g' || prenotazione::text), creato_il desc
  ), pesati as (
    select punteggio,
      case when creato_il >= now() - interval '12 months' then 1.0
           when creato_il >= now() - interval '24 months' then 0.5 else 0 end as peso
    from ultimi
  )
  update public.professionisti set
    ida = (select round(sum(punteggio * peso) / nullif(sum(peso), 0))::integer from pesati),
    giudizi = (select count(*)::integer from pesati where peso > 0)
  where id = p
$$;
revoke all on function public.ricalcola_ida(uuid) from public, anon, authenticated;

-- ===== F3-03: un sospeso non giudica =====
alter policy "giudizi del cliente su lavoro completato" on public.giudizi
  with check (
    cliente = (select auth.uid())
    and not public.e_sospeso(cliente)
    and exists (select 1 from public.prenotazioni b
                where b.id = prenotazione and b.cliente = giudizi.cliente
                  and b.professionista = giudizi.professionista and b.stato = 'completata')
  );

-- ===== F3-04: limiti di frequenza =====
create function public.limite_superato(messaggio text) returns void
language plpgsql set search_path = '' as $$
begin
  raise exception '%', messaggio using errcode = 'P0003';
end $$;

create function public.limita_prenotazioni() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.prenotazioni where cliente = new.cliente and stato = 'richiesta') >= 5 then
    perform public.limite_superato('troppe richieste in attesa');
  end if;
  if (select count(*) from public.prenotazioni where cliente = new.cliente and professionista = new.professionista and stato = 'richiesta') >= 2 then
    perform public.limite_superato('troppe richieste alla stessa persona');
  end if;
  return new;
end $$;
create trigger prenotazioni_limite before insert on public.prenotazioni for each row execute function public.limita_prenotazioni();

create function public.limita_bacheca() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.bacheca where autore = new.autore and creato_il > now() - interval '24 hours') >= 5 then
    perform public.limite_superato('troppi post oggi');
  end if;
  return new;
end $$;
create trigger bacheca_limite before insert on public.bacheca for each row execute function public.limita_bacheca();

create function public.limita_messaggi() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.messaggi where autore = new.autore and creato_il > now() - interval '1 minute') >= 20 then
    perform public.limite_superato('troppi messaggi');
  end if;
  return new;
end $$;
create trigger messaggi_limite before insert on public.messaggi for each row execute function public.limita_messaggi();

create function public.limita_segnalazioni() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.autore is not null and (select count(*) from public.segnalazioni where autore = new.autore and creato_il > now() - interval '24 hours') >= 10 then
    perform public.limite_superato('troppe segnalazioni oggi');
  end if;
  return new;
end $$;
create trigger segnalazioni_limite before insert on public.segnalazioni for each row execute function public.limita_segnalazioni();
-- Una sola segnalazione aperta per stessa persona e stesso contenuto
create unique index segnalazioni_una_aperta on public.segnalazioni (autore, oggetto_tipo, oggetto_id) where stato = 'aperta';

-- Contatore anonimo: tetto giornaliero per evento (oltre si ignora, senza errori)
create or replace function public.registra_evento(p_nome text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_nome in ('apertura','accesso_avviato','accesso_riuscito','profilo_creato','ricerca','scheda_vista',
                'prenotazione_avviata','prenotazione_inviata','post_pubblicato','proposta_inviata',
                'professionista_creato','app_installata')
     and (select count(*) from public.eventi where giorno = current_date and nome = p_nome) < 20000 then
    insert into public.eventi (nome) values (p_nome);
  end if;
end $$;

revoke all on function public.limita_prenotazioni(), public.limita_bacheca(), public.limita_messaggi(),
  public.limita_segnalazioni(), public.limite_superato(text) from public, anon, authenticated;

-- ===== F3-09: massimo 20 foto per persona =====
alter policy "foto: carico nella mia cartella" on storage.objects
  with check (
    bucket_id = 'foto'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select count(*) from storage.objects o where o.bucket_id = 'foto' and (storage.foldername(o.name))[1] = (select auth.uid())::text) < 20
  );

-- ===== F3-10: carattere di controllo del codice fiscale anche nel database =====
create function public.cf_valido(cf text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  dispari int[] := array[1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23];
  tot int := 0; ch text; v int; i int;
begin
  if cf is null or cf !~ '^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$' then
    return false;
  end if;
  for i in 1..15 loop
    ch := substr(cf, i, 1);
    -- cifra → 0-9, lettera → 0-25 (A=0)
    v := case when ch ~ '\d' then ch::int else ascii(ch) - 65 end;
    if i % 2 = 1 then
      tot := tot + dispari[v + 1];
    else
      tot := tot + v;
    end if;
  end loop;
  return chr(65 + tot % 26) = substr(cf, 16, 1);
end $$;
alter table public.dati_fiscali add constraint dati_fiscali_cf_controllo check (public.cf_valido(codice_fiscale));

-- ===== F3-11: lo stato "sospeso" degli altri non si legge più dal profilo =====
-- La regola di prenotazione usa la funzione invece della colonna
alter policy "prenotazioni crea come cliente" on public.prenotazioni
  with check (
    cliente = (select auth.uid())
    and stato = 'richiesta'
    and (giorno + ora) at time zone 'Europe/Rome' >= now() + interval '1 hour'
    and giorno <= current_date + 30
    and not public.e_sospeso(cliente)
    and not public.bloccati_tra(cliente, professionista)
    and not public.e_sospeso(professionista)
    and exists (
      select 1 from public.professionisti p join public.profili u on u.id = p.id
      where p.id = professionista and p.disponibile and not u.in_pausa
        and p.tariffa_oraria = prenotazioni.tariffa_oraria and prenotazioni.competenza = any (p.competenze)
    )
    and (post is null or exists (select 1 from public.bacheca b where b.id = post and b.autore = cliente))
  );
-- e_sospeso: risponde solo per sé stessi o agli amministratori; le regole interne usano e_sospeso_interno
create function public.e_sospeso_interno(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select sospeso from public.profili where id = u), false)
$$;
create or replace function public.e_sospeso(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case when u = (select auth.uid()) or public.e_admin() then public.e_sospeso_interno(u) else false end
$$;
-- Le regole di sicurezza devono poter chiedere di chiunque: passano a e_sospeso_interno
alter policy "professionisti visibili" on public.professionisti
  using (id = (select auth.uid()) or public.e_admin() or not public.e_sospeso_interno(id));
alter policy "professionisti crea la propria" on public.professionisti
  with check (id = (select auth.uid()) and not public.e_sospeso_interno(id));
alter policy "bacheca visibile" on public.bacheca
  using (
    autore = (select auth.uid()) or public.e_admin()
    or (stato = 'aperta' and scade_il > now() and not public.e_sospeso_interno(autore)
        and not public.bloccati_tra(autore, (select auth.uid())))
  );
alter policy "bacheca pubblica la tua" on public.bacheca
  with check (autore = (select auth.uid()) and not public.e_sospeso_interno(autore));
alter policy "proposte su richieste aperte di altri" on public.proposte
  with check (
    professionista = (select auth.uid()) and not public.e_sospeso_interno(professionista)
    and exists (select 1 from public.bacheca b where b.id = post and b.stato = 'aperta' and b.scade_il > now()
                and b.autore <> professionista and not public.bloccati_tra(b.autore, professionista))
  );
alter policy "messaggi scrivi nella tua prenotazione" on public.messaggi
  with check (
    autore = (select auth.uid()) and not public.e_sospeso_interno(autore)
    and exists (select 1 from public.prenotazioni b
                where b.id = prenotazione and autore in (b.cliente, b.professionista)
                  and b.stato in ('richiesta','confermata','completata')
                  and not public.bloccati_tra(b.cliente, b.professionista))
  );
alter policy "prenotazioni crea come cliente" on public.prenotazioni
  with check (
    cliente = (select auth.uid())
    and stato = 'richiesta'
    and (giorno + ora) at time zone 'Europe/Rome' >= now() + interval '1 hour'
    and giorno <= current_date + 30
    and not public.e_sospeso_interno(cliente)
    and not public.e_sospeso_interno(professionista)
    and not public.bloccati_tra(cliente, professionista)
    and exists (
      select 1 from public.professionisti p join public.profili u on u.id = p.id
      where p.id = professionista and p.disponibile and not u.in_pausa
        and p.tariffa_oraria = prenotazioni.tariffa_oraria and prenotazioni.competenza = any (p.competenze)
    )
    and (post is null or exists (select 1 from public.bacheca b where b.id = post and b.autore = cliente))
  );
alter policy "giudizi del cliente su lavoro completato" on public.giudizi
  with check (
    cliente = (select auth.uid())
    and not public.e_sospeso_interno(cliente)
    and exists (select 1 from public.prenotazioni b
                where b.id = prenotazione and b.cliente = giudizi.cliente
                  and b.professionista = giudizi.professionista and b.stato = 'completata')
  );
revoke all on function public.e_sospeso_interno(uuid) from public, anon;
grant execute on function public.e_sospeso_interno(uuid) to authenticated;

-- La colonna "sospeso" non è più leggibile dagli utenti (se stessi compresi: si usa e_sospeso)
revoke select on public.profili from authenticated;
grant select (id, nome, zona, ruolo, in_pausa, foto, creato_il, aggiornato_il) on public.profili to authenticated;

-- Elenco dei sospesi per il pannello
create function public.account_sospesi()
returns table (id uuid, nome text, zona text, aggiornato_il timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.e_admin() then raise exception 'solo amministratori' using errcode = '42501'; end if;
  return query select p.id, p.nome, p.zona, p.aggiornato_il from public.profili p where p.sospeso order by p.aggiornato_il desc;
end $$;
revoke all on function public.account_sospesi() from public, anon;
grant execute on function public.account_sospesi() to authenticated;

-- ===== F3-05: un dispositivo, un utente: l'iscrizione push passa a chi è collegato ora =====
create function public.prendi_push(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'accesso richiesto' using errcode = '42501'; end if;
  insert into public.push_iscrizioni (utente, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set utente = excluded.utente, p256dh = excluded.p256dh, auth = excluded.auth, creato_il = now();
end $$;
revoke all on function public.prendi_push(text, text, text) from public, anon;
grant execute on function public.prendi_push(text, text, text) to authenticated;

-- ===== F3-12: permessi superflui =====
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t);
  end loop;
end $$;
