-- Quando un cliente elimina l'account: le sue prenotazioni passate e i giudizi restano, senza il suo nome.
alter table public.prenotazioni alter column cliente drop not null;
alter table public.prenotazioni drop constraint prenotazioni_cliente_fkey;
alter table public.prenotazioni add constraint prenotazioni_cliente_fkey
  foreign key (cliente) references public.profili (id) on delete set null;

alter table public.giudizi alter column cliente drop not null;
alter table public.giudizi drop constraint giudizi_cliente_fkey;
alter table public.giudizi add constraint giudizi_cliente_fkey
  foreign key (cliente) references public.profili (id) on delete set null;

-- Giudizi pubblici: chi ha eliminato l'account compare come "Utente eliminato"
create or replace function public.giudizi_di(p_professionista uuid)
returns table (prenotazione bigint, punteggio integer, puntualita smallint, qualita smallint, parola smallint,
  pulizia smallint, comunicazione smallint, commento text, risposta text, creato_il timestamptz, autore text, competenza text)
language sql stable security definer set search_path = '' as $$
  select g.prenotazione, g.punteggio, g.puntualita, g.qualita, g.parola, g.pulizia, g.comunicazione,
    g.commento, g.risposta, g.creato_il,
    coalesce(
      split_part(u.nome, ' ', 1) || coalesce(' ' || nullif(left(regexp_replace(u.nome, '^.*\s', ''), 1), left(u.nome, 1)) || '.', ''),
      'Utente eliminato'),
    b.competenza
  from public.giudizi g
  left join public.profili u on u.id = g.cliente
  join public.prenotazioni b on b.id = g.prenotazione
  where g.professionista = p_professionista and not g.nascosto
  order by g.creato_il desc
  limit 100
$$;

-- Prima di eliminare: le prenotazioni attive si annullano (il trigger avvisa l'altra persona)
create or replace function public.prepara_eliminazione(p_motivo text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  io uuid := auth.uid();
begin
  if io is null then raise exception 'accesso richiesto' using errcode = '42501'; end if;
  update public.prenotazioni set stato = 'annullata', motivo = 'L''altra persona ha chiuso l''account.'
  where io in (cliente, professionista) and stato in ('richiesta','confermata');
  if p_motivo is not null and char_length(p_motivo) <= 80 then
    insert into public.uscite (motivo) values (p_motivo);
  end if;
end $$;

-- Dati fiscali: obbligo di conservazione (DAC7) anche dopo l'eliminazione. Archivio non accessibile dall'app.
create table public.archivio_fiscale (
  id bigint generated always as identity primary key,
  utente uuid not null,
  nome text,
  codice_fiscale text not null,
  data_nascita date not null,
  residenza text not null,
  partita_iva text,
  archiviato_il timestamptz not null default now(),
  conservare_fino_al date not null default (current_date + interval '10 years')::date
);
alter table public.archivio_fiscale enable row level security;
revoke all on public.archivio_fiscale from anon, authenticated;

create function public.archivia_dati_fiscali() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.archivio_fiscale (utente, nome, codice_fiscale, data_nascita, residenza, partita_iva)
  select old.id, u.nome, old.codice_fiscale, old.data_nascita, old.residenza, p.partita_iva
  from (select 1) x
  left join public.profili u on u.id = old.id
  left join public.professionisti p on p.id = old.id;
  return old;
end $$;
revoke all on function public.archivia_dati_fiscali() from public, anon, authenticated;
create trigger dati_fiscali_archivia before delete on public.dati_fiscali
  for each row execute function public.archivia_dati_fiscali();
