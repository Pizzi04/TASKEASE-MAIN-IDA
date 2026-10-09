-- 1) IDA: ultimi 12 mesi contano per intero, da 12 a 24 mesi a metà, oltre non contano.
create or replace function public.ricalcola_ida(p uuid) returns void
language sql security definer set search_path = '' as $$
  with pesati as (
    select punteggio,
      case when creato_il >= now() - interval '12 months' then 1.0
           when creato_il >= now() - interval '24 months' then 0.5 else 0 end as peso
    from public.giudizi where professionista = p and not nascosto
  )
  update public.professionisti set
    ida = (select round(sum(punteggio * peso) / nullif(sum(peso), 0))::integer from pesati),
    giudizi = (select count(*)::integer from pesati where peso > 0)
  where id = p
$$;
revoke all on function public.ricalcola_ida(uuid) from public, anon, authenticated;

-- 2) Diritto di replica: chi riceve il giudizio risponde una volta.
alter table public.giudizi
  add column risposta text check (risposta is null or char_length(btrim(risposta)) between 2 and 500),
  add column risposta_il timestamptz;

create function public.rispondi_giudizio(p_prenotazione bigint, p_testo text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if char_length(btrim(coalesce(p_testo, ''))) < 2 then
    raise exception 'risposta troppo corta' using errcode = 'P0001';
  end if;
  update public.giudizi set risposta = left(btrim(p_testo), 500), risposta_il = now()
  where prenotazione = p_prenotazione and professionista = (select auth.uid()) and risposta is null;
  if not found then raise exception 'non puoi rispondere a questo giudizio' using errcode = 'P0001'; end if;
end $$;
revoke all on function public.rispondi_giudizio(bigint, text) from public, anon;
grant execute on function public.rispondi_giudizio(bigint, text) to authenticated;

-- Giudizi pubblici con solo nome e iniziale di chi li ha scritti
create function public.giudizi_di(p_professionista uuid)
returns table (prenotazione bigint, punteggio integer, puntualita smallint, qualita smallint, parola smallint,
  pulizia smallint, comunicazione smallint, commento text, risposta text, creato_il timestamptz, autore text, competenza text)
language sql stable security definer set search_path = '' as $$
  select g.prenotazione, g.punteggio, g.puntualita, g.qualita, g.parola, g.pulizia, g.comunicazione,
    g.commento, g.risposta, g.creato_il,
    split_part(u.nome, ' ', 1) || coalesce(' ' || nullif(left(split_part(u.nome, ' ', 2), 1), '') || '.', ''),
    b.competenza
  from public.giudizi g
  join public.profili u on u.id = g.cliente
  join public.prenotazioni b on b.id = g.prenotazione
  where g.professionista = p_professionista and not g.nascosto
  order by g.creato_il desc
  limit 100
$$;
revoke all on function public.giudizi_di(uuid) from public, anon;
grant execute on function public.giudizi_di(uuid) to authenticated;

-- 3) Chi lavora può proporre un altro orario; il cliente accetta o annulla.
alter table public.prenotazioni add column controproposta boolean not null default false;

create or replace function public.cambia_stato_prenotazione(p_id bigint, p_azione text, p_motivo text default null)
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
    when p_azione = 'conferma' and io = b.professionista and b.stato = 'richiesta' and not b.controproposta then 'confermata'
    when p_azione = 'accetta_orario' and io = b.cliente and b.stato = 'richiesta' and b.controproposta then 'confermata'
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

create function public.proponi_orario(p_id bigint, p_giorno date, p_ora time) returns void
language plpgsql security definer set search_path = '' as $$
declare
  b public.prenotazioni%rowtype;
begin
  select * into b from public.prenotazioni where id = p_id for update;
  if not found or b.professionista <> (select auth.uid()) or b.stato <> 'richiesta' then
    raise exception 'prenotazione non trovata' using errcode = 'P0002';
  end if;
  if p_ora not in ('09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00')
     or (p_giorno + p_ora) at time zone 'Europe/Rome' < now() + interval '1 hour'
     or p_giorno > current_date + 30 then
    raise exception 'orario non valido' using errcode = 'P0001';
  end if;
  update public.prenotazioni set giorno = p_giorno, ora = p_ora, controproposta = true where id = p_id;
  perform public.notifica(b.cliente, 'prenotazione',
    public.primo_nome(b.professionista) || ' propone un altro orario: ' || to_char(p_giorno, 'DD/MM') || ' alle ' || to_char(p_ora, 'HH24:MI') || '.',
    '/prenotazioni/' || p_id);
end $$;
revoke all on function public.proponi_orario(bigint, date, time) from public, anon;
grant execute on function public.proponi_orario(bigint, date, time) to authenticated;

-- 4) L'indirizzo lo vede chi lavora solo dopo aver confermato.
create table public.indirizzi (
  prenotazione bigint primary key references public.prenotazioni (id) on delete cascade,
  cliente uuid not null references public.profili (id) on delete cascade,
  indirizzo text not null check (char_length(btrim(indirizzo)) between 4 and 200)
);
create index indirizzi_cliente_idx on public.indirizzi (cliente);
alter table public.indirizzi enable row level security;
revoke all on public.indirizzi from anon;
revoke insert, update, delete on public.indirizzi from authenticated;
grant insert (prenotazione, cliente, indirizzo) on public.indirizzi to authenticated;
create policy "indirizzo: cliente sempre, professionista dopo la conferma" on public.indirizzi
  for select to authenticated using (
    cliente = (select auth.uid())
    or exists (select 1 from public.prenotazioni b where b.id = prenotazione
               and b.professionista = (select auth.uid()) and b.stato in ('confermata','completata'))
  );
create policy "indirizzo: lo scrive il cliente" on public.indirizzi
  for insert to authenticated with check (
    cliente = (select auth.uid())
    and exists (select 1 from public.prenotazioni b where b.id = prenotazione and b.cliente = (select auth.uid()))
  );
-- La colonna nella prenotazione non serve più: si lascia vuota.
alter table public.prenotazioni alter column indirizzo drop not null;
revoke insert on public.prenotazioni from authenticated;
grant insert (cliente, professionista, competenza, descrizione, zona, giorno, ora, ore, tariffa_oraria, post)
  on public.prenotazioni to authenticated;
