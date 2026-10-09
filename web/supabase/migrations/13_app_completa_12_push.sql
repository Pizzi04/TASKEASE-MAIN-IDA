-- Iscrizioni alle notifiche push del telefono (una per dispositivo)
create table public.push_iscrizioni (
  id bigint generated always as identity primary key,
  utente uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  creato_il timestamptz not null default now()
);
create index push_iscrizioni_utente_idx on public.push_iscrizioni (utente);
alter table public.push_iscrizioni enable row level security;
revoke all on public.push_iscrizioni from anon;
revoke insert, update, delete on public.push_iscrizioni from authenticated;
grant insert (utente, endpoint, p256dh, auth), delete on public.push_iscrizioni to authenticated;
create policy "push: le mie" on public.push_iscrizioni
  for select to authenticated using (utente = (select auth.uid()));
create policy "push: mi iscrivo" on public.push_iscrizioni
  for insert to authenticated with check (utente = (select auth.uid()));
create policy "push: mi disiscrivo" on public.push_iscrizioni
  for delete to authenticated using (utente = (select auth.uid()));
