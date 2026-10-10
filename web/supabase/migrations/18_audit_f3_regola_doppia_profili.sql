-- "profili visibili" (profilo_visibile) comprende già il proprio profilo: questa regola è un doppione.
-- La spegniamo invece di cancellarla (la cancellazione richiede una conferma manuale): l'effetto è lo stesso.
alter policy "profilo: leggo il mio" on public.profili using (false);
