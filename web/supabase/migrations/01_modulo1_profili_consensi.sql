-- Modulo 1: profilo dell'utente e consensi (Termini e privacy).
-- Il numero di telefono NON si duplica qui: resta in auth.users, verificato via SMS.

create table public.profili (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 2 and 60),
  zona text not null check (zona in ('Centro','Saffi','Cava','Ronco','Villafranca','Bussecchio','Vecchiazzano','Altra zona di Forlì','Cesena e dintorni')),
  ruolo text not null default 'client' check (ruolo in ('client','worker')),
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
comment on table public.profili is 'Profilo di chi usa TaskEase: nome, zona, modalità scelta. Il telefono sta in auth.users.';

create table public.consensi (
  id bigint generated always as identity primary key,
  utente uuid not null references auth.users (id) on delete cascade,
  documento text not null,
  versione text not null,
  accettato_il timestamptz not null default now()
);
create index consensi_utente_idx on public.consensi (utente);
comment on table public.consensi is 'Quando e quale versione di Termini/privacy ha accettato ogni utente (non si modificano, si aggiungono).';

-- aggiornato_il si aggiorna da solo
create function public.tocca_aggiornato_il() returns trigger
language plpgsql set search_path = '' as $$
begin new.aggiornato_il := now(); return new; end; $$;
create trigger profili_aggiornato_il before update on public.profili
for each row execute function public.tocca_aggiornato_il();

-- Sicurezza: ognuno vede e cambia solo il proprio profilo e i propri consensi
alter table public.profili enable row level security;
alter table public.consensi enable row level security;

create policy "profilo: leggo il mio" on public.profili for select to authenticated using ((select auth.uid()) = id);
create policy "profilo: creo il mio" on public.profili for insert to authenticated with check ((select auth.uid()) = id);
create policy "profilo: modifico il mio" on public.profili for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "consensi: leggo i miei" on public.consensi for select to authenticated using ((select auth.uid()) = utente);
create policy "consensi: aggiungo i miei" on public.consensi for insert to authenticated with check ((select auth.uid()) = utente);
-- nessuna policy di update/delete sui consensi: restano come prova
