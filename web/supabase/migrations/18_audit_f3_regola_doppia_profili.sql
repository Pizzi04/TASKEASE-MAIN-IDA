-- DA APPLICARE A MANO (Supabase → SQL Editor): la cancellazione di regole richiede conferma manuale.
-- "profili visibili" comprende già il proprio profilo: questa regola è un doppione.
drop policy if exists "profilo: leggo il mio" on public.profili;
