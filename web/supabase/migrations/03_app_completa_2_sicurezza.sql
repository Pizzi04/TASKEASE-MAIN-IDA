-- Telefono = almeno 9 cifre di fila (con spazi, punti o trattini): le date non contano.
create or replace function public.ha_contatti(t text) returns boolean language sql immutable as $$
  select t ~ '(\+?\d[\s.-]?){9,}' or t ~* '[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}'
$$;

-- ---------- Funzioni di supporto (leggono senza passare dalle regole, restituiscono solo sì/no) ----------
create function public.e_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.amministratori where utente = (select auth.uid()))
$$;

create function public.e_sospeso(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select sospeso from public.profili where id = u), false)
$$;

create function public.bloccati_tra(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.blocchi where (utente = a and bloccato = b) or (utente = b and bloccato = a))
$$;

create function public.e_parte(p bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.prenotazioni where id = p and (select auth.uid()) in (cliente, professionista))
$$;

create function public.profilo_visibile(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select u = (select auth.uid())
    or exists (select 1 from public.amministratori where utente = (select auth.uid()))
    or exists (select 1 from public.professionisti where id = u)
    or exists (select 1 from public.prenotazioni b
               where (b.cliente = (select auth.uid()) and b.professionista = u)
                  or (b.professionista = (select auth.uid()) and b.cliente = u))
    or exists (select 1 from public.bacheca where autore = u and stato = 'aperta')
$$;

revoke all on function public.e_admin(), public.e_sospeso(uuid), public.bloccati_tra(uuid, uuid),
  public.e_parte(bigint), public.profilo_visibile(uuid) from public, anon;
grant execute on function public.e_admin(), public.e_sospeso(uuid), public.bloccati_tra(uuid, uuid),
  public.e_parte(bigint), public.profilo_visibile(uuid) to authenticated;

-- ---------- Nessun accesso per chi non ha fatto l'accesso ----------
revoke all on public.profili, public.consensi, public.amministratori, public.professionisti, public.dati_fiscali,
  public.verifiche, public.bacheca, public.proposte, public.prenotazioni, public.giudizi, public.messaggi,
  public.preferiti, public.blocchi, public.notifiche, public.segnalazioni, public.eventi, public.uscite from anon;

-- Per chi ha fatto l'accesso si parte da zero e si concedono solo le colonne che servono.
revoke insert, update, delete on public.profili, public.consensi, public.amministratori, public.professionisti,
  public.dati_fiscali, public.verifiche, public.bacheca, public.proposte, public.prenotazioni, public.giudizi,
  public.messaggi, public.preferiti, public.blocchi, public.notifiche, public.segnalazioni, public.eventi,
  public.uscite from authenticated;
revoke select on public.amministratori, public.eventi, public.uscite from authenticated;

alter table public.amministratori enable row level security;
alter table public.professionisti enable row level security;
alter table public.dati_fiscali enable row level security;
alter table public.verifiche enable row level security;
alter table public.bacheca enable row level security;
alter table public.proposte enable row level security;
alter table public.prenotazioni enable row level security;
alter table public.giudizi enable row level security;
alter table public.messaggi enable row level security;
alter table public.preferiti enable row level security;
alter table public.blocchi enable row level security;
alter table public.notifiche enable row level security;
alter table public.segnalazioni enable row level security;
alter table public.eventi enable row level security;
alter table public.uscite enable row level security;

-- ---------- Profili ----------
grant insert (id, nome, zona, ruolo) on public.profili to authenticated;
grant update (nome, zona, ruolo, in_pausa, foto) on public.profili to authenticated;
grant insert on public.consensi to authenticated;
create policy "profili visibili" on public.profili
  for select to authenticated using (public.profilo_visibile(id));

-- ---------- Professionisti ----------
grant insert (id, bio, competenze, zone, tariffa_oraria, su_preventivo, tipo, partita_iva, abilitazione_impianti, assicurazione_rc, disponibile)
  on public.professionisti to authenticated;
grant update (bio, competenze, zone, tariffa_oraria, su_preventivo, tipo, partita_iva, abilitazione_impianti, assicurazione_rc, disponibile)
  on public.professionisti to authenticated;
create policy "professionisti visibili" on public.professionisti
  for select to authenticated using (id = (select auth.uid()) or public.e_admin() or not public.e_sospeso(id));
create policy "professionisti crea la propria" on public.professionisti
  for insert to authenticated with check (id = (select auth.uid()) and not public.e_sospeso(id));
create policy "professionisti modifica la propria" on public.professionisti
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- Dati fiscali ----------
grant select, insert (id, codice_fiscale, data_nascita, residenza, dichiarazione_fiscale) on public.dati_fiscali to authenticated;
grant update (residenza) on public.dati_fiscali to authenticated;
create policy "dati fiscali propri o admin" on public.dati_fiscali
  for select to authenticated using (id = (select auth.uid()) or public.e_admin());
create policy "dati fiscali crea i propri, maggiorenne" on public.dati_fiscali
  for insert to authenticated with check (id = (select auth.uid()) and data_nascita <= current_date - interval '18 years');
create policy "dati fiscali modifica i propri" on public.dati_fiscali
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- Verifiche ----------
grant insert (professionista, preferenza, disponibilita) on public.verifiche to authenticated;
create policy "verifiche proprie o admin" on public.verifiche
  for select to authenticated using (professionista = (select auth.uid()) or public.e_admin());
create policy "verifiche chiedi la tua" on public.verifiche
  for insert to authenticated with check (professionista = (select auth.uid()));

-- ---------- Bacheca ----------
grant insert (autore, titolo, dettagli, zona, competenza, foto) on public.bacheca to authenticated;
grant update (stato) on public.bacheca to authenticated;
create policy "bacheca visibile" on public.bacheca
  for select to authenticated using (
    autore = (select auth.uid()) or public.e_admin()
    or (stato = 'aperta' and scade_il > now() and not public.e_sospeso(autore)
        and not public.bloccati_tra(autore, (select auth.uid())))
  );
create policy "bacheca pubblica la tua" on public.bacheca
  for insert to authenticated with check (autore = (select auth.uid()) and not public.e_sospeso(autore));
create policy "bacheca apri o chiudi la tua" on public.bacheca
  for update to authenticated using (autore = (select auth.uid()) and stato <> 'rimossa')
  with check (autore = (select auth.uid()) and stato in ('aperta','chiusa'));

-- ---------- Proposte ----------
grant insert (post, professionista, messaggio), delete on public.proposte to authenticated;
create policy "proposte visibili a chi le fa e a chi ha chiesto" on public.proposte
  for select to authenticated using (
    professionista = (select auth.uid()) or public.e_admin()
    or exists (select 1 from public.bacheca b where b.id = post and b.autore = (select auth.uid()))
  );
create policy "proposte su richieste aperte di altri" on public.proposte
  for insert to authenticated with check (
    professionista = (select auth.uid()) and not public.e_sospeso(professionista)
    and exists (select 1 from public.bacheca b where b.id = post and b.stato = 'aperta' and b.scade_il > now()
                and b.autore <> professionista and not public.bloccati_tra(b.autore, professionista))
  );
create policy "proposte ritira la tua" on public.proposte
  for delete to authenticated using (professionista = (select auth.uid()));

-- ---------- Prenotazioni ----------
grant insert (cliente, professionista, competenza, descrizione, indirizzo, zona, giorno, ora, ore, tariffa_oraria, post)
  on public.prenotazioni to authenticated;
create policy "prenotazioni delle parti" on public.prenotazioni
  for select to authenticated using ((select auth.uid()) in (cliente, professionista) or public.e_admin());
create policy "prenotazioni crea come cliente" on public.prenotazioni
  for insert to authenticated with check (
    cliente = (select auth.uid())
    and stato = 'richiesta'
    and (giorno + ora) at time zone 'Europe/Rome' >= now() + interval '1 hour'
    and giorno <= current_date + 30
    and not public.e_sospeso(cliente)
    and not public.bloccati_tra(cliente, professionista)
    and exists (
      select 1 from public.professionisti p join public.profili u on u.id = p.id
      where p.id = professionista and p.disponibile and not u.in_pausa and not u.sospeso
        and p.tariffa_oraria = prenotazioni.tariffa_oraria and prenotazioni.competenza = any (p.competenze)
    )
    and (post is null or exists (select 1 from public.bacheca b where b.id = post and b.autore = cliente))
  );

-- ---------- Giudizi ----------
grant insert (prenotazione, cliente, professionista, puntualita, qualita, parola, pulizia, comunicazione, commento)
  on public.giudizi to authenticated;
create policy "giudizi visibili" on public.giudizi
  for select to authenticated using (
    not nascosto or (select auth.uid()) in (cliente, professionista) or public.e_admin()
  );
create policy "giudizi del cliente su lavoro completato" on public.giudizi
  for insert to authenticated with check (
    cliente = (select auth.uid())
    and exists (select 1 from public.prenotazioni b
                where b.id = prenotazione and b.cliente = giudizi.cliente
                  and b.professionista = giudizi.professionista and b.stato = 'completata')
  );

-- ---------- Messaggi ----------
grant insert (prenotazione, autore, testo) on public.messaggi to authenticated;
create policy "messaggi delle parti" on public.messaggi
  for select to authenticated using (public.e_parte(prenotazione));
create policy "messaggi scrivi nella tua prenotazione" on public.messaggi
  for insert to authenticated with check (
    autore = (select auth.uid()) and not public.e_sospeso(autore)
    and exists (select 1 from public.prenotazioni b
                where b.id = prenotazione and autore in (b.cliente, b.professionista)
                  and b.stato in ('richiesta','confermata','completata')
                  and not public.bloccati_tra(b.cliente, b.professionista))
  );

-- ---------- Preferiti e blocchi ----------
grant insert (utente, professionista), delete on public.preferiti to authenticated;
create policy "preferiti propri" on public.preferiti
  for all to authenticated using (utente = (select auth.uid())) with check (utente = (select auth.uid()));

grant insert (utente, bloccato), delete on public.blocchi to authenticated;
create policy "blocchi propri" on public.blocchi
  for all to authenticated using (utente = (select auth.uid())) with check (utente = (select auth.uid()));

-- ---------- Notifiche ----------
grant update (letta), delete on public.notifiche to authenticated;
create policy "notifiche proprie" on public.notifiche
  for select to authenticated using (utente = (select auth.uid()));
create policy "notifiche segna lette" on public.notifiche
  for update to authenticated using (utente = (select auth.uid())) with check (utente = (select auth.uid()));
create policy "notifiche cancella le tue" on public.notifiche
  for delete to authenticated using (utente = (select auth.uid()));

-- ---------- Segnalazioni ----------
grant insert (autore, tipo, oggetto_tipo, oggetto_id, segnalato, motivo, testo) on public.segnalazioni to authenticated;
create policy "segnalazioni proprie o admin" on public.segnalazioni
  for select to authenticated using (autore = (select auth.uid()) or public.e_admin());
create policy "segnalazioni invia" on public.segnalazioni
  for insert to authenticated with check (autore = (select auth.uid()) and coalesce(segnalato <> autore, true));
