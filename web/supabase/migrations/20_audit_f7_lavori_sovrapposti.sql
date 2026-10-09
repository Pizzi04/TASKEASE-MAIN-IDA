-- Audit fase 7: due lavori dello stesso professionista non possono accavallarsi.
-- Prima si controllava solo l'ora d'inizio: un lavoro 9:00 × 4 ore e uno alle 10:00 si potevano confermare entrambi.
-- Codice TE409 (non P0004: in Postgres è "assert_failure" e non si può intercettare).

create or replace function public.controlla_sovrapposizione()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stato in ('richiesta', 'confermata') and exists (
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
  return new;
end $$;

create trigger prenotazioni_sovrapposte
  before insert or update of stato, giorno, ora, ore on public.prenotazioni
  for each row execute function public.controlla_sovrapposizione();

-- Gli orari occupati coprono tutta la durata del lavoro, non solo l'ora d'inizio
create or replace function public.orari_occupati(p_professionista uuid)
returns table(giorno date, ora time)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct p.giorno, (p.ora + make_interval(hours => h))::time
  from public.prenotazioni p
  cross join lateral generate_series(0, case when p.stato = 'confermata' then coalesce(p.ore, 1) - 1 else 0 end) as h
  where p.professionista = p_professionista
    and p.stato in ('richiesta', 'confermata')
    and p.giorno between current_date and current_date + 30
    and extract(hour from p.ora) + h <= 17
$$;

-- Nomi senza caratteri invisibili o di inversione del testo (U+202E faceva apparire "Carla" come "alraC")
alter table public.profili add constraint profili_nome_visibile
  check (nome !~ '[​‎‏‪-‮⁠⁦-⁩﻿]');
