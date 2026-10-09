-- Per la manutenzione notturna (account inattivi da 24 mesi): come prepara_eliminazione, ma per un utente dato.
-- Solo il server con la chiave segreta (service_role) può chiamarla.
create function public.prepara_eliminazione_di(p_utente uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.prenotazioni set stato = 'annullata', motivo = 'L''altra persona ha chiuso l''account.'
  where p_utente in (cliente, professionista) and stato in ('richiesta','confermata');
  insert into public.uscite (motivo) values ('Account inattivo da 24 mesi');
end $$;
revoke all on function public.prepara_eliminazione_di(uuid) from public, anon, authenticated;
grant execute on function public.prepara_eliminazione_di(uuid) to service_role;
