-- BuffetHub: visão de toda a negociação (solicitação → proposta → contrato → pagamento → avaliação) numa linha.
-- security_invoker: cada usuário só enxerga as linhas que as regras de RLS das tabelas permitem.

create view public.vw_negociacao with (security_invoker = true) as
select
  s.id as solicitacao_id,
  s.status as status_solicitacao,
  s.data_solicitacao,
  s.observacoes,
  s.buffet_id,
  b.nome_fantasia as buffet_nome,
  (select m.url from public.midia_portfolio m where m.buffet_id = b.usuario_id and m.tipo = 'foto'
     order by m.criada_em limit 1) as buffet_capa_url,
  e.id as evento_id,
  e.cliente_id,
  u.nome as cliente_nome,
  e.tipo_evento,
  e.data as data_evento,
  e.local,
  e.num_convidados,
  e.servicos_desejados,
  s.pacote_id,
  pc.nome as pacote_nome,
  pc.preco_por_pessoa as pacote_preco_por_pessoa,
  p.id as proposta_id,
  p.valor_total,
  p.descricao as proposta_descricao,
  p.validade as proposta_validade,
  p.status as status_proposta,
  p.criada_em as proposta_criada_em,
  c.id as contrato_id,
  c.status as status_contrato,
  c.data_criacao as contrato_criado_em,
  c.data_assinatura,
  pg.codigo_transacao,
  pg.metodo as pagamento_metodo,
  pg.data_pagamento,
  av.id as avaliacao_id,
  av.nota as avaliacao_nota
from public.solicitacao_orcamento s
join public.evento e on e.id = s.evento_id
join public.buffet b on b.usuario_id = s.buffet_id
left join public.usuario u on u.id = e.cliente_id
left join public.pacote pc on pc.id = s.pacote_id
left join public.proposta p on p.solicitacao_id = s.id
left join public.contrato c on c.proposta_id = p.id
left join lateral (
  select codigo_transacao, metodo, data_pagamento from public.pagamento
   where contrato_id = c.id and status = 'Aprovado' order by data_pagamento desc limit 1
) pg on true
left join public.avaliacao av on av.contrato_id = c.id;

grant select on public.vw_negociacao to authenticated;
