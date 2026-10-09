-- Audit fase 8: la funzione del trigger sulle sovrapposizioni non si chiama dall'API (/rest/v1/rpc)
revoke execute on function public.controlla_sovrapposizione() from public, anon, authenticated;
