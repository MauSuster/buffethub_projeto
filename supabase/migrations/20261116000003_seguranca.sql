-- BuffetHub: segurança (RLS + permissões). Escritas sensíveis só acontecem pelas funções da migração 002.

alter table public.usuario enable row level security;
alter table public.cliente enable row level security;
alter table public.buffet enable row level security;
alter table public.midia_portfolio enable row level security;
alter table public.pacote enable row level security;
alter table public.disponibilidade enable row level security;
alter table public.evento enable row level security;
alter table public.solicitacao_orcamento enable row level security;
alter table public.proposta enable row level security;
alter table public.contrato enable row level security;
alter table public.pagamento enable row level security;
alter table public.avaliacao enable row level security;
alter table public.mensagem enable row level security;
alter table public.notificacao enable row level security;

-- Permissões de tabela: começa sem nada e libera só o necessário
revoke all on all tables in schema public from anon, authenticated;

grant select on public.buffet, public.midia_portfolio, public.pacote, public.disponibilidade,
                public.avaliacao, public.vw_buffet_busca to anon, authenticated;
grant select on public.usuario, public.cliente, public.evento, public.solicitacao_orcamento,
                public.proposta, public.contrato, public.pagamento, public.mensagem, public.notificacao
  to authenticated;

grant update (nome, telefone) on public.usuario to authenticated;
grant update (preferencias) on public.cliente to authenticated;
grant update (nome_fantasia, descricao, endereco, cidade, latitude, longitude, capacidade_maxima,
              estilo_culinaria, tipos_evento, servicos) on public.buffet to authenticated;
grant insert, update, delete on public.midia_portfolio, public.pacote to authenticated;
grant insert on public.mensagem to authenticated;
grant update (lida) on public.notificacao to authenticated;
grant delete on public.notificacao to authenticated;

-- usuario / cliente / buffet
create policy "usuario: ver quem pode" on public.usuario for select to authenticated
  using (public.pode_ver_usuario(id));
create policy "usuario: editar o próprio" on public.usuario for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "cliente: ver quem pode" on public.cliente for select to authenticated
  using (public.pode_ver_usuario(usuario_id));
create policy "cliente: editar o próprio" on public.cliente for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create policy "buffet: público" on public.buffet for select to anon, authenticated using (true);
create policy "buffet: editar o próprio" on public.buffet for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

-- portfólio e pacotes: leitura pública, escrita só do dono
create policy "midia: pública" on public.midia_portfolio for select to anon, authenticated using (true);
create policy "midia: dono insere" on public.midia_portfolio for insert to authenticated
  with check (buffet_id = (select auth.uid()));
create policy "midia: dono altera" on public.midia_portfolio for update to authenticated
  using (buffet_id = (select auth.uid())) with check (buffet_id = (select auth.uid()));
create policy "midia: dono apaga" on public.midia_portfolio for delete to authenticated
  using (buffet_id = (select auth.uid()));

create policy "pacote: ativos são públicos" on public.pacote for select to anon, authenticated
  using (ativo or buffet_id = (select auth.uid()));
create policy "pacote: dono insere" on public.pacote for insert to authenticated
  with check (buffet_id = (select auth.uid()));
create policy "pacote: dono altera" on public.pacote for update to authenticated
  using (buffet_id = (select auth.uid())) with check (buffet_id = (select auth.uid()));
create policy "pacote: dono apaga" on public.pacote for delete to authenticated
  using (buffet_id = (select auth.uid()));

-- calendário: leitura pública (perfil mostra datas livres); escrita pela função definir_disponibilidade
create policy "disponibilidade: pública" on public.disponibilidade for select to anon, authenticated using (true);

-- negociação: só as duas partes enxergam
create policy "evento: cliente dono ou buffet consultado" on public.evento for select to authenticated
  using (cliente_id = (select auth.uid()) or public.buffet_ve_evento(id));
create policy "solicitacao: partes" on public.solicitacao_orcamento for select to authenticated
  using (buffet_id = (select auth.uid()) or public.cliente_do_evento(evento_id) = (select auth.uid()));
create policy "proposta: partes" on public.proposta for select to authenticated
  using (public.participa_solicitacao(solicitacao_id));
create policy "contrato: partes" on public.contrato for select to authenticated
  using (public.participa_proposta(proposta_id));
create policy "pagamento: partes" on public.pagamento for select to authenticated
  using (public.participa_contrato(contrato_id));

create policy "avaliacao: pública" on public.avaliacao for select to anon, authenticated using (true);

-- mensagens e notificações
create policy "mensagem: remetente e destinatário" on public.mensagem for select to authenticated
  using ((select auth.uid()) in (remetente_id, destinatario_id));
create policy "mensagem: enviar" on public.mensagem for insert to authenticated
  with check (remetente_id = (select auth.uid()) and public.pode_conversar(destinatario_id));

create policy "notificacao: dono vê" on public.notificacao for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "notificacao: dono marca como lida" on public.notificacao for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "notificacao: dono apaga" on public.notificacao for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- Funções internas não podem ser chamadas pela API
revoke execute on function public.notificar(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.criar_perfil_usuario() from public, anon, authenticated;
revoke execute on function public.avisar_nova_mensagem() from public, anon, authenticated;

-- Funções de negócio exigem login
revoke execute on function public.cadastrar_evento(text, date, text, integer, text) from public, anon;
revoke execute on function public.solicitar_orcamento(uuid, uuid, uuid, text) from public, anon;
revoke execute on function public.cancelar_solicitacao(uuid) from public, anon;
revoke execute on function public.responder_solicitacao(uuid, numeric, text, date) from public, anon;
revoke execute on function public.aceitar_proposta(uuid) from public, anon;
revoke execute on function public.recusar_proposta(uuid) from public, anon;
revoke execute on function public.assinar_contrato(uuid, text) from public, anon;
revoke execute on function public.pagar_contrato(uuid, public.metodo_pagamento, text) from public, anon;
revoke execute on function public.avaliar_buffet(uuid, integer, text) from public, anon;
revoke execute on function public.definir_disponibilidade(date, public.status_data) from public, anon;
revoke execute on function public.marcar_mensagens_lidas(uuid) from public, anon;
revoke execute on function public.minhas_conversas() from public, anon;
revoke execute on function public.atualizar_status_por_data() from public, anon;
revoke execute on function public.participa_solicitacao(uuid) from public, anon;
revoke execute on function public.participa_proposta(uuid) from public, anon;
revoke execute on function public.participa_contrato(uuid) from public, anon;
revoke execute on function public.buffet_ve_evento(uuid) from public, anon;
revoke execute on function public.cliente_do_evento(uuid) from public, anon;
revoke execute on function public.pode_ver_usuario(uuid) from public, anon;
revoke execute on function public.pode_conversar(uuid) from public, anon;

grant execute on function public.cadastrar_evento(text, date, text, integer, text),
  public.solicitar_orcamento(uuid, uuid, uuid, text), public.cancelar_solicitacao(uuid),
  public.responder_solicitacao(uuid, numeric, text, date), public.aceitar_proposta(uuid),
  public.recusar_proposta(uuid), public.assinar_contrato(uuid, text),
  public.pagar_contrato(uuid, public.metodo_pagamento, text), public.avaliar_buffet(uuid, integer, text),
  public.definir_disponibilidade(date, public.status_data), public.marcar_mensagens_lidas(uuid),
  public.minhas_conversas(), public.atualizar_status_por_data(),
  public.participa_solicitacao(uuid), public.participa_proposta(uuid), public.participa_contrato(uuid),
  public.buffet_ve_evento(uuid), public.cliente_do_evento(uuid), public.pode_ver_usuario(uuid),
  public.pode_conversar(uuid)
  to authenticated;
