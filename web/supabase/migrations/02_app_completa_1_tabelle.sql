-- TaskEase: tutte le tabelle dell'app. Sicurezza e funzioni nelle migrazioni successive.

-- Elenchi chiusi condivisi (stessi valori dell'anteprima)
create function public.competenze_valide() returns text[] language sql immutable as $$
  select array['Idraulica','Elettricità','Piccoli lavori (senza impianti)','Tuttofare','Riparazioni',
    'Piastrelle e pavimenti','Muratura e cartongesso','Imbiancatura','Pulizie','Montaggio mobili',
    'Giardino','Tecnologia / PC','Ripetizioni','Consegne','Traslochi']::text[]
$$;
create function public.zone_valide() returns text[] language sql immutable as $$
  select array['Centro','Saffi','Cava','Ronco','Villafranca','Bussecchio','Vecchiazzano',
    'Altra zona di Forlì','Cesena e dintorni']::text[]
$$;
-- Testo che contiene un telefono o un'email (vietati nei contenuti pubblici)
create function public.ha_contatti(t text) returns boolean language sql immutable as $$
  select t ~ '(\+?\d[\d\s.-]{7,}\d)' or t ~* '[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}'
$$;

-- Profili: stato dell'account
alter table public.profili
  add column in_pausa boolean not null default false,
  add column sospeso boolean not null default false,
  add column foto text check (foto is null or char_length(foto) <= 200);

-- Amministratori (si aggiungono a mano dal pannello Supabase)
create table public.amministratori (
  utente uuid primary key references auth.users (id) on delete cascade,
  creato_il timestamptz not null default now()
);

-- Scheda pubblica del professionista
create table public.professionisti (
  id uuid primary key references public.profili (id) on delete cascade,
  bio text not null default '' check (char_length(bio) <= 300),
  competenze text[] not null check (cardinality(competenze) between 1 and 15 and competenze <@ public.competenze_valide()),
  zone text[] not null check (cardinality(zone) between 1 and 9 and zone <@ public.zone_valide()),
  tariffa_oraria integer not null check (tariffa_oraria between 5 and 200),
  su_preventivo boolean not null default false,
  tipo text not null check (tipo in ('privato','piva')),
  partita_iva text check (partita_iva is null or partita_iva ~ '^\d{11}$'),
  abilitazione_impianti boolean not null default false,
  assicurazione_rc boolean not null default false,
  disponibile boolean not null default true,
  -- Scritti solo dal database o dagli amministratori:
  verificato boolean not null default false,
  ida integer check (ida between 20 and 100),
  giudizi integer not null default 0,
  lavori integer not null default 0,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  check ((tipo = 'piva') = (partita_iva is not null)),
  -- Idraulica ed elettricità: solo con Partita IVA e abilitazione dichiarata
  check (not (competenze && array['Idraulica','Elettricità']::text[]) or (tipo = 'piva' and abilitazione_impianti))
);
create index professionisti_competenze_idx on public.professionisti using gin (competenze);
create index professionisti_zone_idx on public.professionisti using gin (zone);
create trigger professionisti_aggiornato_il before update on public.professionisti
  for each row execute function public.tocca_aggiornato_il();

-- Dati fiscali del professionista: privati (solo lui e gli amministratori)
create table public.dati_fiscali (
  id uuid primary key references public.professionisti (id) on delete cascade,
  codice_fiscale text not null check (codice_fiscale ~ '^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$'),
  data_nascita date not null,
  residenza text not null check (char_length(btrim(residenza)) between 6 and 200),
  dichiarazione_fiscale boolean not null check (dichiarazione_fiscale),
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
create trigger dati_fiscali_aggiornato_il before update on public.dati_fiscali
  for each row execute function public.tocca_aggiornato_il();

-- Verifica dell'identità: di persona o in videochiamata, senza conservare copie del documento
create table public.verifiche (
  id bigint generated always as identity primary key,
  professionista uuid not null references public.professionisti (id) on delete cascade,
  preferenza text not null check (preferenza in ('videochiamata','di persona')),
  disponibilita text not null default '' check (char_length(disponibilita) <= 200),
  stato text not null default 'in_attesa' check (stato in ('in_attesa','verificata','respinta')),
  motivazione text check (motivazione is null or char_length(motivazione) <= 500),
  deciso_da uuid references auth.users (id) on delete set null,
  deciso_il timestamptz,
  creato_il timestamptz not null default now()
);
create unique index verifiche_una_in_attesa on public.verifiche (professionista) where stato = 'in_attesa';

-- Bacheca: richieste pubbliche in zona
create table public.bacheca (
  id bigint generated always as identity primary key,
  autore uuid not null references public.profili (id) on delete cascade,
  titolo text not null check (char_length(btrim(titolo)) between 5 and 100),
  dettagli text not null default '' check (char_length(dettagli) <= 600),
  zona text not null check (zona = any (public.zone_valide())),
  competenza text check (competenza is null or competenza = any (public.competenze_valide())),
  foto text check (foto is null or char_length(foto) <= 200),
  stato text not null default 'aperta' check (stato in ('aperta','chiusa','rimossa')),
  risposte integer not null default 0,
  scade_il timestamptz not null default now() + interval '14 days',
  creato_il timestamptz not null default now(),
  check (not public.ha_contatti(titolo || ' ' || dettagli))
);
create index bacheca_aperte_idx on public.bacheca (zona, creato_il desc) where stato = 'aperta';

-- Proposte dei professionisti a una richiesta in bacheca
create table public.proposte (
  id bigint generated always as identity primary key,
  post bigint not null references public.bacheca (id) on delete cascade,
  professionista uuid not null references public.professionisti (id) on delete cascade,
  messaggio text not null check (char_length(btrim(messaggio)) between 5 and 300),
  creato_il timestamptz not null default now(),
  unique (post, professionista)
);

-- Prenotazioni
create table public.prenotazioni (
  id bigint generated always as identity primary key,
  cliente uuid not null references public.profili (id) on delete cascade,
  professionista uuid not null references public.professionisti (id) on delete cascade,
  competenza text not null check (competenza = any (public.competenze_valide())),
  descrizione text not null check (char_length(btrim(descrizione)) between 8 and 500),
  indirizzo text not null check (char_length(btrim(indirizzo)) between 4 and 200),
  zona text not null check (zona = any (public.zone_valide())),
  giorno date not null,
  ora time not null check (ora in ('09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00')),
  ore smallint check (ore is null or ore between 1 and 8),
  tariffa_oraria integer not null check (tariffa_oraria between 5 and 200),
  post bigint references public.bacheca (id) on delete set null,
  stato text not null default 'richiesta' check (stato in ('richiesta','confermata','rifiutata','annullata','completata')),
  motivo text check (motivo is null or char_length(motivo) <= 300),
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  check (cliente <> professionista)
);
create index prenotazioni_cliente_idx on public.prenotazioni (cliente, giorno desc);
create index prenotazioni_professionista_idx on public.prenotazioni (professionista, giorno desc);
-- Un orario per professionista non si prenota due volte
create unique index prenotazioni_orario_libero on public.prenotazioni (professionista, giorno, ora)
  where stato in ('richiesta','confermata');
create trigger prenotazioni_aggiornato_il before update on public.prenotazioni
  for each row execute function public.tocca_aggiornato_il();

-- Giudizi IDA v1.0: 5 voci da 1 a 5, pesi 0.20/0.30/0.20/0.15/0.15 → punteggio da 20 a 100
create table public.giudizi (
  prenotazione bigint primary key references public.prenotazioni (id) on delete cascade,
  cliente uuid not null references public.profili (id) on delete cascade,
  professionista uuid not null references public.professionisti (id) on delete cascade,
  puntualita smallint not null check (puntualita between 1 and 5),
  qualita smallint not null check (qualita between 1 and 5),
  parola smallint not null check (parola between 1 and 5),
  pulizia smallint not null check (pulizia between 1 and 5),
  comunicazione smallint not null check (comunicazione between 1 and 5),
  punteggio integer generated always as (
    round((puntualita * 0.20 + qualita * 0.30 + parola * 0.20 + pulizia * 0.15 + comunicazione * 0.15) * 20)::integer
  ) stored,
  commento text check (commento is null or char_length(commento) <= 500),
  nascosto boolean not null default false,
  creato_il timestamptz not null default now()
);
create index giudizi_professionista_idx on public.giudizi (professionista, creato_il desc);

-- Chat di una prenotazione
create table public.messaggi (
  id bigint generated always as identity primary key,
  prenotazione bigint not null references public.prenotazioni (id) on delete cascade,
  autore uuid not null references public.profili (id) on delete cascade,
  testo text not null check (char_length(btrim(testo)) between 1 and 1000),
  letto_il timestamptz,
  creato_il timestamptz not null default now()
);
create index messaggi_prenotazione_idx on public.messaggi (prenotazione, creato_il);

create table public.preferiti (
  utente uuid not null references public.profili (id) on delete cascade,
  professionista uuid not null references public.professionisti (id) on delete cascade,
  creato_il timestamptz not null default now(),
  primary key (utente, professionista)
);

create table public.blocchi (
  utente uuid not null references public.profili (id) on delete cascade,
  bloccato uuid not null references public.profili (id) on delete cascade,
  creato_il timestamptz not null default now(),
  primary key (utente, bloccato),
  check (utente <> bloccato)
);
create index blocchi_bloccato_idx on public.blocchi (bloccato);

-- Notifiche dentro l'app (scritte solo dal database)
create table public.notifiche (
  id bigint generated always as identity primary key,
  utente uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  testo text not null,
  link text not null default '/',
  letta boolean not null default false,
  creato_il timestamptz not null default now()
);
create index notifiche_utente_idx on public.notifiche (utente, creato_il desc);

-- Segnalazioni (DSA art. 16) e problemi con un lavoro
create table public.segnalazioni (
  id bigint generated always as identity primary key,
  autore uuid references auth.users (id) on delete set null,
  tipo text not null check (tipo in ('problema_lavoro','contenuto')),
  oggetto_tipo text not null check (oggetto_tipo in ('profilo','giudizio','post','messaggio','prenotazione')),
  oggetto_id text not null check (char_length(oggetto_id) <= 40),
  segnalato uuid references auth.users (id) on delete set null,
  motivo text not null check (char_length(motivo) between 3 and 80),
  testo text check (testo is null or char_length(testo) <= 1000),
  stato text not null default 'aperta' check (stato in ('aperta','accolta','respinta')),
  azione text check (azione is null or azione in ('nessuna','contenuto_nascosto','account_sospeso')),
  motivazione text check (motivazione is null or char_length(motivazione) <= 1000),
  deciso_da uuid references auth.users (id) on delete set null,
  deciso_il timestamptz,
  creato_il timestamptz not null default now()
);
create index segnalazioni_aperte_idx on public.segnalazioni (creato_il) where stato = 'aperta';
create index segnalazioni_autore_idx on public.segnalazioni (autore);

-- Misurazione senza dati personali: solo nome dell'evento e giorno
create table public.eventi (
  id bigint generated always as identity primary key,
  nome text not null,
  giorno date not null default current_date
);
create index eventi_giorno_idx on public.eventi (giorno, nome);

-- Motivi di chi lascia (anonimi)
create table public.uscite (
  id bigint generated always as identity primary key,
  motivo text not null check (char_length(motivo) <= 80),
  giorno date not null default current_date
);
