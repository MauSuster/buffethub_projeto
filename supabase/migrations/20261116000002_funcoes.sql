-- BuffetHub: regras de negócio (camada Model no banco). Cada função valida quem chama com auth.uid().

alter table public.avaliacao add column autor_nome text;

-- ---------------------------------------------------------------- utilitários internos
create function public.notificar(p_usuario uuid, p_texto text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notificacao (usuario_id, texto, link) values (p_usuario, p_texto, p_link);
$$;

create function public.formatar_moeda(p_valor numeric)
returns text language sql immutable set search_path = public as $$
  select 'R$ ' || translate(to_char(p_valor, 'FM999,999,990.00'), ',.', '.,');
$$;

create function public.exigir_login() returns uuid
language plpgsql stable set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Faça login para continuar.';
  end if;
  return auth.uid();
end $$;

-- ---------------------------------------------------------------- UC01: perfil criado junto com a conta
create function public.criar_perfil_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if m->>'tipo' is null then
    return new;
  end if;
  insert into public.usuario (id, tipo, nome, email, telefone)
  values (new.id, (m->>'tipo')::public.tipo_usuario, trim(m->>'nome'), new.email,
          nullif(trim(coalesce(m->>'telefone', '')), ''));
  if m->>'tipo' = 'cliente' then
    insert into public.cliente (usuario_id, cpf)
    values (new.id, regexp_replace(coalesce(m->>'cpf', ''), '[^0-9]', '', 'g'));
  else
    insert into public.buffet (usuario_id, cnpj, nome_fantasia)
    values (new.id, regexp_replace(coalesce(m->>'cnpj', ''), '[^0-9]', '', 'g'),
            trim(coalesce(nullif(m->>'nome_fantasia', ''), m->>'nome')));
  end if;
  return new;
end $$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_usuario();

-- ---------------------------------------------------------------- funções usadas nas regras de segurança (RLS)
create function public.participa_solicitacao(p_solicitacao uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.solicitacao_orcamento s
    join public.evento e on e.id = s.evento_id
    where s.id = p_solicitacao and auth.uid() in (s.buffet_id, e.cliente_id));
$$;

create function public.participa_proposta(p_proposta uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.proposta p
    join public.solicitacao_orcamento s on s.id = p.solicitacao_id
    join public.evento e on e.id = s.evento_id
    where p.id = p_proposta and auth.uid() in (s.buffet_id, e.cliente_id));
$$;

create function public.participa_contrato(p_contrato uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.contrato c
    join public.proposta p on p.id = c.proposta_id
    join public.solicitacao_orcamento s on s.id = p.solicitacao_id
    join public.evento e on e.id = s.evento_id
    where c.id = p_contrato and auth.uid() in (s.buffet_id, e.cliente_id));
$$;

create function public.buffet_ve_evento(p_evento uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.solicitacao_orcamento s
                 where s.evento_id = p_evento and s.buffet_id = auth.uid());
$$;

create function public.cliente_do_evento(p_evento uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select cliente_id from public.evento where id = p_evento;
$$;

-- Dados pessoais: o próprio usuário, buffets (são públicos) e quem já negocia ou conversa com ele
create function public.pode_ver_usuario(p_alvo uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_alvo = auth.uid()
      or exists (select 1 from public.buffet b where b.usuario_id = p_alvo)
      or exists (select 1 from public.solicitacao_orcamento s join public.evento e on e.id = s.evento_id
                 where (s.buffet_id = auth.uid() and e.cliente_id = p_alvo)
                    or (s.buffet_id = p_alvo and e.cliente_id = auth.uid()))
      or exists (select 1 from public.mensagem m
                 where (m.remetente_id = auth.uid() and m.destinatario_id = p_alvo)
                    or (m.remetente_id = p_alvo and m.destinatario_id = auth.uid()));
$$;

-- UC03: cliente pode escrever para qualquer buffet; buffet só para quem já pediu orçamento a ele
create function public.pode_conversar(p_destinatario uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.cliente where usuario_id = auth.uid())
      then exists (select 1 from public.buffet where usuario_id = p_destinatario)
    when exists (select 1 from public.buffet where usuario_id = auth.uid())
      then exists (select 1 from public.solicitacao_orcamento s join public.evento e on e.id = s.evento_id
                   where s.buffet_id = auth.uid() and e.cliente_id = p_destinatario)
               or exists (select 1 from public.mensagem m
                          where m.remetente_id = p_destinatario and m.destinatario_id = auth.uid())
    else false end;
$$;

-- ---------------------------------------------------------------- atualizações automáticas por data
-- Proposta Pendente vencida vira Expirada; contrato Pago com evento já realizado vira Concluído
create function public.atualizar_status_por_data()
returns void language sql security definer set search_path = public as $$
  update public.proposta set status = 'Expirada'
   where status = 'Pendente' and validade < current_date;
  update public.contrato c set status = 'Concluído'
    from public.proposta p, public.solicitacao_orcamento s, public.evento e
   where c.status = 'Pago' and p.id = c.proposta_id and s.id = p.solicitacao_id
     and e.id = s.evento_id and e.data < current_date;
$$;

-- ---------------------------------------------------------------- UC09: Cadastrar Evento
create function public.cadastrar_evento(
  p_tipo_evento text, p_data date, p_local text, p_num_convidados integer, p_servicos_desejados text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  perform public.exigir_login();
  if not exists (select 1 from public.cliente where usuario_id = auth.uid()) then
    raise exception 'Somente clientes podem cadastrar eventos.';
  end if;
  if coalesce(trim(p_tipo_evento), '') = '' or coalesce(trim(p_local), '') = ''
     or p_data is null or p_num_convidados is null then
    raise exception 'Preencha todos os campos obrigatórios do evento.';
  end if;
  if p_data <= current_date then
    raise exception 'A data do evento precisa ser uma data futura.';
  end if;
  if p_num_convidados <= 0 then
    raise exception 'Informe um número de convidados maior que zero.';
  end if;
  insert into public.evento (cliente_id, tipo_evento, data, local, num_convidados, servicos_desejados)
  values (auth.uid(), trim(p_tipo_evento), p_data, trim(p_local), p_num_convidados,
          nullif(trim(coalesce(p_servicos_desejados, '')), ''))
  returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------- UC08: Solicitar Orçamento («include» UC09)
create function public.solicitar_orcamento(
  p_buffet_id uuid, p_evento_id uuid, p_pacote_id uuid default null, p_observacoes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_evento public.evento;
  v_buffet public.buffet;
  v_id uuid;
begin
  perform public.exigir_login();
  select * into v_evento from public.evento where id = p_evento_id and cliente_id = auth.uid();
  if not found then
    raise exception 'Evento não encontrado.';
  end if;
  select * into v_buffet from public.buffet where usuario_id = p_buffet_id;
  if not found then
    raise exception 'Buffet não encontrado.';
  end if;
  if v_evento.data <= current_date then
    raise exception 'A data do evento precisa ser uma data futura.';
  end if;
  if v_buffet.capacidade_maxima is not null and v_evento.num_convidados > v_buffet.capacidade_maxima then
    raise exception 'Este buffet atende no máximo % convidados.', v_buffet.capacidade_maxima;
  end if;
  if exists (select 1 from public.disponibilidade d
             where d.buffet_id = p_buffet_id and d.data = v_evento.data and d.status <> 'Livre') then
    raise exception 'O buffet não está disponível nesta data.';
  end if;
  if p_pacote_id is not null and not exists (
       select 1 from public.pacote where id = p_pacote_id and buffet_id = p_buffet_id and ativo) then
    raise exception 'Pacote inválido para este buffet.';
  end if;
  if exists (select 1 from public.solicitacao_orcamento
             where evento_id = p_evento_id and buffet_id = p_buffet_id and status <> 'Cancelada') then
    raise exception 'Você já pediu orçamento deste buffet para este evento.';
  end if;

  insert into public.solicitacao_orcamento (evento_id, buffet_id, pacote_id, observacoes)
  values (p_evento_id, p_buffet_id, p_pacote_id, nullif(trim(coalesce(p_observacoes, '')), ''))
  returning id into v_id;

  perform public.notificar(p_buffet_id,
    'Nova solicitação de orçamento: ' || v_evento.tipo_evento || ' em ' || to_char(v_evento.data, 'DD/MM/YYYY') || '.',
    '/anfitriao/solicitacoes');
  return v_id;
end $$;

create function public.cancelar_solicitacao(p_solicitacao_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_buffet uuid;
begin
  perform public.exigir_login();
  update public.solicitacao_orcamento s set status = 'Cancelada'
    from public.evento e
   where s.id = p_solicitacao_id and e.id = s.evento_id and e.cliente_id = auth.uid() and s.status = 'Pendente'
  returning s.buffet_id into v_buffet;
  if v_buffet is null then
    raise exception 'Só é possível cancelar solicitações pendentes.';
  end if;
  perform public.notificar(v_buffet, 'Um cliente cancelou uma solicitação de orçamento.', '/anfitriao/solicitacoes');
end $$;

-- ---------------------------------------------------------------- UC20: buffet responde enviando proposta
create function public.responder_solicitacao(
  p_solicitacao_id uuid, p_valor_total numeric, p_descricao text, p_validade date)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_sol public.solicitacao_orcamento;
  v_evento public.evento;
  v_nome text;
  v_id uuid;
begin
  perform public.exigir_login();
  select * into v_sol from public.solicitacao_orcamento where id = p_solicitacao_id and buffet_id = auth.uid();
  if not found then
    raise exception 'Solicitação não encontrada.';
  end if;
  if v_sol.status <> 'Pendente' then
    raise exception 'Esta solicitação já foi respondida ou cancelada.';
  end if;
  if p_valor_total is null or p_valor_total <= 0 then
    raise exception 'Informe um valor total maior que zero.';
  end if;
  if coalesce(trim(p_descricao), '') = '' then
    raise exception 'Descreva o que está incluído na proposta.';
  end if;
  select * into v_evento from public.evento where id = v_sol.evento_id;
  if p_validade is null or p_validade < current_date or p_validade > v_evento.data then
    raise exception 'A validade precisa ficar entre hoje e a data do evento.';
  end if;

  insert into public.proposta (solicitacao_id, valor_total, descricao, validade)
  values (p_solicitacao_id, p_valor_total, trim(p_descricao), p_validade)
  returning id into v_id;
  update public.solicitacao_orcamento set status = 'Respondida' where id = p_solicitacao_id;

  select nome_fantasia into v_nome from public.buffet where usuario_id = auth.uid();
  perform public.notificar(v_evento.cliente_id,
    'Você recebeu uma proposta de ' || v_nome || ' (' || public.formatar_moeda(p_valor_total) || ').',
    '/cliente/solicitacoes');
  return v_id;
end $$;

-- ---------------------------------------------------------------- UC11: aceitar ou recusar proposta
create function public.aceitar_proposta(p_proposta_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_prop public.proposta;
  v_sol public.solicitacao_orcamento;
  v_evento public.evento;
  v_buffet public.buffet;
  v_cliente_nome text;
  v_cpf text;
  v_pacote text;
  v_contrato uuid;
begin
  perform public.exigir_login();
  select p.* into v_prop from public.proposta p
    join public.solicitacao_orcamento s on s.id = p.solicitacao_id
    join public.evento e on e.id = s.evento_id
   where p.id = p_proposta_id and e.cliente_id = auth.uid();
  if not found then
    raise exception 'Proposta não encontrada.';
  end if;
  if v_prop.status <> 'Pendente' then
    raise exception 'Esta proposta não está mais pendente.';
  end if;
  if v_prop.validade < current_date then
    raise exception 'Esta proposta expirou.';
  end if;
  select * into v_sol from public.solicitacao_orcamento where id = v_prop.solicitacao_id;
  select * into v_evento from public.evento where id = v_sol.evento_id;
  select * into v_buffet from public.buffet where usuario_id = v_sol.buffet_id;
  if exists (select 1 from public.disponibilidade d
             where d.buffet_id = v_buffet.usuario_id and d.data = v_evento.data and d.status <> 'Livre') then
    raise exception 'A data do evento não está mais disponível neste buffet.';
  end if;

  select u.nome, c.cpf into v_cliente_nome, v_cpf
    from public.usuario u join public.cliente c on c.usuario_id = u.id where u.id = auth.uid();
  select nome into v_pacote from public.pacote where id = v_sol.pacote_id;

  update public.proposta set status = 'Aceita' where id = p_proposta_id;
  insert into public.contrato (proposta_id, termos)
  values (p_proposta_id,
    'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE BUFFET' || E'\n\n' ||
    'CONTRATANTE: ' || v_cliente_nome || ', CPF ' || v_cpf || '.' || E'\n' ||
    'CONTRATADA: ' || v_buffet.nome_fantasia || ', CNPJ ' || v_buffet.cnpj || '.' || E'\n\n' ||
    'EVENTO: ' || v_evento.tipo_evento || ' no dia ' || to_char(v_evento.data, 'DD/MM/YYYY') ||
    ', em ' || v_evento.local || ', para ' || v_evento.num_convidados || ' convidados.' || E'\n' ||
    'PACOTE: ' || coalesce(v_pacote, 'definido na proposta') || '.' || E'\n' ||
    'SERVIÇOS INCLUÍDOS: ' || v_prop.descricao || E'\n\n' ||
    'VALOR TOTAL: ' || public.formatar_moeda(v_prop.valor_total) || ', pago pela plataforma BuffetHub.' || E'\n\n' ||
    'CLÁUSULAS:' || E'\n' ||
    '1. A data do evento fica reservada no calendário da CONTRATADA após a confirmação do pagamento.' || E'\n' ||
    '2. A CONTRATADA se compromete a prestar os serviços descritos acima na data e local combinados.' || E'\n' ||
    '3. Alterações de data, local ou número de convidados devem ser combinadas entre as partes pela plataforma.' || E'\n' ||
    '4. Este contrato é assinado eletronicamente pela CONTRATANTE, com registro de nome, data e hora.')
  returning id into v_contrato;

  perform public.notificar(v_buffet.usuario_id,
    v_cliente_nome || ' aceitou sua proposta. O contrato foi gerado e aguarda assinatura.',
    '/anfitriao/solicitacoes');
  return v_contrato;
end $$;

create function public.recusar_proposta(p_proposta_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_buffet uuid;
begin
  perform public.exigir_login();
  update public.proposta p set status = 'Recusada'
    from public.solicitacao_orcamento s, public.evento e
   where p.id = p_proposta_id and s.id = p.solicitacao_id and e.id = s.evento_id
     and e.cliente_id = auth.uid() and p.status = 'Pendente'
  returning s.buffet_id into v_buffet;
  if v_buffet is null then
    raise exception 'Só é possível recusar propostas pendentes.';
  end if;
  perform public.notificar(v_buffet, 'Um cliente recusou sua proposta.', '/anfitriao/solicitacoes');
end $$;

-- ---------------------------------------------------------------- UC13: Assinar Contrato (aceite eletrônico)
create function public.assinar_contrato(p_contrato_id uuid, p_nome text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_status public.status_contrato;
  v_buffet uuid;
  v_nome text;
begin
  perform public.exigir_login();
  select c.id, c.status, s.buffet_id into v_id, v_status, v_buffet
    from public.contrato c
    join public.proposta p on p.id = c.proposta_id
    join public.solicitacao_orcamento s on s.id = p.solicitacao_id
    join public.evento e on e.id = s.evento_id
   where c.id = p_contrato_id and e.cliente_id = auth.uid();
  if v_id is null then
    raise exception 'Contrato não encontrado.';
  end if;
  if v_status <> 'Aguardando assinatura' then
    raise exception 'Este contrato já foi assinado.';
  end if;
  select nome into v_nome from public.usuario where id = auth.uid();
  if lower(trim(coalesce(p_nome, ''))) <> lower(trim(v_nome)) then
    raise exception 'Digite seu nome completo exatamente como está no cadastro.';
  end if;
  update public.contrato
     set status = 'Assinado', assinado = true, data_assinatura = now(), assinado_por = trim(p_nome)
   where id = p_contrato_id;
  perform public.notificar(v_buffet, v_nome || ' assinou o contrato.', '/anfitriao/solicitacoes');
end $$;

-- ---------------------------------------------------------------- UC14: Realizar Pagamento (gateway SIMULADO)
-- Cartão terminado em 0002 é recusado (para testar o fluxo de exceção); Pix, boleto e outros cartões são aprovados.
create function public.pagar_contrato(p_contrato_id uuid, p_metodo public.metodo_pagamento, p_numero_cartao text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_status_contrato public.status_contrato;
  v_valor numeric;
  v_buffet uuid;
  v_cliente uuid;
  v_data date;
  v_cartao text := regexp_replace(coalesce(p_numero_cartao, ''), '[^0-9]', '', 'g');
  v_status public.status_pagamento;
  v_codigo text := 'SIM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12));
  v_pagamento uuid;
begin
  perform public.exigir_login();
  select c.id, c.status, p.valor_total, s.buffet_id, e.cliente_id, e.data
    into v_id, v_status_contrato, v_valor, v_buffet, v_cliente, v_data
    from public.contrato c
    join public.proposta p on p.id = c.proposta_id
    join public.solicitacao_orcamento s on s.id = p.solicitacao_id
    join public.evento e on e.id = s.evento_id
   where c.id = p_contrato_id and e.cliente_id = auth.uid();
  if v_id is null then
    raise exception 'Contrato não encontrado.';
  end if;
  if v_status_contrato = 'Aguardando assinatura' then
    raise exception 'Assine o contrato antes de pagar.';
  end if;
  if v_status_contrato <> 'Assinado' then
    raise exception 'Este contrato já está pago.';
  end if;
  if p_metodo is null then
    raise exception 'Escolha uma forma de pagamento.';
  end if;
  if p_metodo = 'Cartão' and length(v_cartao) not between 13 and 19 then
    raise exception 'Número do cartão inválido.';
  end if;

  v_status := case when p_metodo = 'Cartão' and right(v_cartao, 4) = '0002' then 'Recusado' else 'Aprovado' end;

  if v_status = 'Aprovado' and exists (
       select 1 from public.disponibilidade d
        where d.buffet_id = v_buffet and d.data = v_data and d.status <> 'Livre') then
    raise exception 'A data do evento não está mais disponível. Nenhum valor foi cobrado.';
  end if;

  insert into public.pagamento (contrato_id, valor, metodo, status, codigo_transacao)
  values (p_contrato_id, v_valor, p_metodo, v_status, v_codigo)
  returning id into v_pagamento;

  if v_status = 'Aprovado' then
    update public.contrato set status = 'Pago' where id = p_contrato_id;
    insert into public.disponibilidade (buffet_id, data, status) values (v_buffet, v_data, 'Reservada')
      on conflict (buffet_id, data) do update set status = 'Reservada';
    perform public.notificar(v_buffet,
      'Pagamento aprovado (' || public.formatar_moeda(v_valor) || '). A data ' || to_char(v_data, 'DD/MM/YYYY') ||
      ' foi reservada no seu calendário.', '/anfitriao/calendario');
    perform public.notificar(v_cliente, 'Pagamento aprovado. Sua reserva está confirmada!', '/cliente/reservas');
  end if;

  return jsonb_build_object('pagamento_id', v_pagamento, 'status', v_status, 'codigo_transacao', v_codigo,
                            'valor', v_valor);
end $$;

-- ---------------------------------------------------------------- UC15: Avaliar Buffet (só após o evento)
create function public.avaliar_buffet(p_contrato_id uuid, p_nota integer, p_comentario text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_status public.status_contrato;
  v_buffet uuid;
  v_nome text;
  v_id uuid;
begin
  perform public.exigir_login();
  perform public.atualizar_status_por_data();
  select c.status, s.buffet_id into v_status, v_buffet
    from public.contrato c
    join public.proposta p on p.id = c.proposta_id
    join public.solicitacao_orcamento s on s.id = p.solicitacao_id
    join public.evento e on e.id = s.evento_id
   where c.id = p_contrato_id and e.cliente_id = auth.uid();
  if v_buffet is null then
    raise exception 'Contrato não encontrado.';
  end if;
  if v_status <> 'Concluído' then
    raise exception 'Você só pode avaliar depois que o evento acontecer.';
  end if;
  if exists (select 1 from public.avaliacao where contrato_id = p_contrato_id) then
    raise exception 'Você já avaliou este evento.';
  end if;
  if p_nota is null or p_nota not between 1 and 5 then
    raise exception 'Escolha uma nota de 1 a 5.';
  end if;
  select split_part(nome, ' ', 1) || coalesce(' ' || left(nullif(split_part(nome, ' ', 2), ''), 1) || '.', '')
    into v_nome from public.usuario where id = auth.uid();
  insert into public.avaliacao (cliente_id, buffet_id, contrato_id, nota, comentario, autor_nome)
  values (auth.uid(), v_buffet, p_contrato_id, p_nota, nullif(trim(coalesce(p_comentario, '')), ''), v_nome)
  returning id into v_id;
  perform public.notificar(v_buffet, 'Você recebeu uma nova avaliação (' || p_nota || ' de 5).', '/anfitriao/dados');
  return v_id;
end $$;

-- ---------------------------------------------------------------- UC19: Gerenciar Calendário
create function public.definir_disponibilidade(p_data date, p_status public.status_data)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.exigir_login();
  if not exists (select 1 from public.buffet where usuario_id = auth.uid()) then
    raise exception 'Somente buffets podem alterar o calendário.';
  end if;
  if p_status not in ('Livre', 'Bloqueada') then
    raise exception 'Datas só podem ser marcadas como Livre ou Bloqueada.';
  end if;
  if p_data < current_date then
    raise exception 'Não é possível alterar datas passadas.';
  end if;
  if exists (select 1 from public.disponibilidade
             where buffet_id = auth.uid() and data = p_data and status = 'Reservada') then
    raise exception 'Esta data já está reservada por um contrato pago.';
  end if;
  if p_status = 'Livre' then
    delete from public.disponibilidade where buffet_id = auth.uid() and data = p_data;
  else
    insert into public.disponibilidade (buffet_id, data, status) values (auth.uid(), p_data, 'Bloqueada')
      on conflict (buffet_id, data) do update set status = 'Bloqueada';
  end if;
end $$;

-- ---------------------------------------------------------------- UC03: Enviar Mensagens
create function public.avisar_nova_mensagem()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nome text;
  v_tipo public.tipo_usuario;
begin
  select coalesce(b.nome_fantasia, u.nome) into v_nome
    from public.usuario u left join public.buffet b on b.usuario_id = u.id where u.id = new.remetente_id;
  select tipo into v_tipo from public.usuario where id = new.destinatario_id;
  perform public.notificar(new.destinatario_id, 'Nova mensagem de ' || v_nome || '.',
    case when v_tipo = 'buffet' then '/anfitriao/mensagens?com=' else '/cliente/mensagens?com=' end || new.remetente_id);
  return new;
end $$;

create trigger ao_enviar_mensagem
  after insert on public.mensagem
  for each row execute function public.avisar_nova_mensagem();

create function public.marcar_mensagens_lidas(p_outro uuid)
returns void language sql security definer set search_path = public as $$
  update public.mensagem set lida = true
   where destinatario_id = auth.uid() and remetente_id = p_outro and not lida;
$$;

create function public.minhas_conversas()
returns table (outro_id uuid, outro_nome text, outro_tipo public.tipo_usuario,
               ultima_mensagem text, ultima_data timestamptz, nao_lidas integer)
language sql stable security definer set search_path = public as $$
  with minhas as (
    select case when m.remetente_id = auth.uid() then m.destinatario_id else m.remetente_id end as outro, m.*
      from public.mensagem m
     where auth.uid() in (m.remetente_id, m.destinatario_id)
  ), ultimas as (
    select distinct on (outro) outro, conteudo, data_envio from minhas order by outro, data_envio desc
  )
  select u.id, coalesce(b.nome_fantasia, u.nome), u.tipo, ul.conteudo, ul.data_envio,
         (select count(*) from minhas mi where mi.outro = u.id and mi.destinatario_id = auth.uid() and not mi.lida)::integer
    from ultimas ul
    join public.usuario u on u.id = ul.outro
    left join public.buffet b on b.usuario_id = u.id
   order by ul.data_envio desc;
$$;
