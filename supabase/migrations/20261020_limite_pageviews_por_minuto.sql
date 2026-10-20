-- Limite contra robo com conta: 60 registros de acesso por usuario por minuto.
-- Aplicada em 20/10/2026 no projeto meatbfomblpicftrzcsy via apply_migration.
-- O pico real medido ate 20/10/2026 foi 24 por minuto; 60 da folga de 2,5x.
-- Ensaiada antes numa transacao revertida: 60 aceitos, o 61o recusado, gravar
-- sem usuario recusado. Verificada depois: o INSERT que o app faz segue passando.

-- Sem esta policy, todo INSERT de usuario logado precisa vir com o proprio
-- user_id, e o limite por usuario fica completo. Ela aceitava user_id nulo —
-- um robo logado gravaria sem se identificar. Sem uso desde 24/08/2026: quando
-- a sessao nao carregou, o pedido sai como anon, e ela era so para authenticated.
drop policy "Anonymous pageviews (authenticated)" on public.pageviews;

-- A contagem por usuario e janela de tempo precisa de indice proprio.
create index if not exists idx_pageviews_user_created on public.pageviews (user_id, created_at desc);

-- SECURITY DEFINER e obrigatorio aqui: o usuario nao tem permissao de ler
-- pageviews (nao ha policy de SELECT), entao, rodando com o privilegio dele, a
-- contagem daria sempre zero e o limite nunca dispararia. search_path fixo e
-- EXECUTE revogado, como toda funcao security definer.
-- Contagem e insert nao sao atomicos: rajadas paralelas podem passar um pouco
-- de 60. E freio, nao cerca.
create or replace function public.pageviews_dados_do_servidor() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recentes int;
begin
  new.created_at := now();
  new.metadata   := null;

  select count(*) into recentes
    from public.pageviews
   where user_id = new.user_id
     and created_at > now() - interval '1 minute';

  if recentes >= 60 then
    raise exception 'limite de 60 registros por minuto' using errcode = 'P0001';
  end if;

  return new;
end
$$;

revoke execute on function public.pageviews_dados_do_servidor() from public, anon, authenticated;
