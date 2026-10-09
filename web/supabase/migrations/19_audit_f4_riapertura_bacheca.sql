-- Riaprendo una richiesta chiusa o scaduta, torna visibile per altri 14 giorni
create function public.riapri_bacheca() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.stato = 'aperta' and old.stato is distinct from 'aperta' then
    new.scade_il := now() + interval '14 days';
  end if;
  return new;
end $$;
revoke all on function public.riapri_bacheca() from public, anon, authenticated;
create trigger bacheca_riapri before update of stato on public.bacheca for each row execute function public.riapri_bacheca();
