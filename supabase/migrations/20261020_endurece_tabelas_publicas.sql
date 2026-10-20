-- Correcoes da auditoria de seguranca de 19/10/2026 (passos 5 a 7).
-- Aplicada em 20/10/2026 no projeto meatbfomblpicftrzcsy via apply_migration.
--
-- Ensaiada antes numa transacao revertida: cadastro novo segue criando perfil
-- (gatilho handle_new_user), e o INSERT de pageview que o app faz segue passando.
--
-- Verificada depois, simulando um usuario comum: nao edita o proprio perfil,
-- nao altera nem apaga perfil alheio, pageview com data retroativa e regravado
-- com a data de hoje. Com a chave anon do bundle, POST em profiles e pageviews
-- para em "permission denied" — antes mesmo do RLS.

-- 5. profiles: o app nunca atualiza esta tabela; so o gatilho handle_new_user
--    escreve, com privilegio de dono. A policy so servia para o usuario reescrever
--    o proprio e-mail e a propria data de cadastro.
drop policy "Users can update own profile" on public.profiles;

-- 6. pageviews: data e metadata decididos pelo servidor. Antes, qualquer conta
--    gravava pageview com data retroativa e jsonb arbitrario. O app
--    (usePageview.ts) nunca manda nenhum dos dois.
create function public.pageviews_dados_do_servidor() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.created_at := now();
  new.metadata   := null;
  return new;
end
$$;

revoke execute on function public.pageviews_dados_do_servidor() from public, anon, authenticated;

create trigger pageviews_dados_do_servidor
  before insert on public.pageviews
  for each row execute function public.pageviews_dados_do_servidor();

-- 7. Privilegios de tabela: o banco deixa de depender so do RLS. Se uma migracao
--    futura desligar o RLS de uma tabela, a chave anon nao passa a escrever nela.
--    TRUNCATE nunca e coberto por RLS.
revoke truncate, trigger, references on public.profiles, public.pageviews from anon, authenticated;
revoke insert, update, delete on public.profiles, public.pageviews from anon;
revoke insert, update, delete on public.profiles from authenticated;
revoke update, delete on public.pageviews from authenticated;
-- Ficam: SELECT dos dois papeis (o RLS filtra) e INSERT de authenticated em
-- pageviews, que e o unico uso que o app faz.
--
-- ATENCAO para tabela nova: o Supabase da, por privilegio padrao, todos os
-- privilegios a anon e authenticated em qualquer tabela criada em public. Esta
-- migracao nao muda isso. Toda tabela nova precisa do mesmo tratamento.
