-- BuffetHub: dados de demonstração (pode rodar de novo: apaga e recria as contas @buffethub.test)
-- Contas de teste (todas com a senha BuffetHub@2026):
--   cliente: ana@buffethub.test          buffets: buffet1@buffethub.test ... buffet7@buffethub.test
--   outros clientes (só para as avaliações): bruno@, carla@, diego@buffethub.test

delete from auth.users where email like '%@buffethub.test';

create or replace function pg_temp.criar_conta(p_id uuid, p_email text, p_meta jsonb)
returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
          extensions.crypt('BuffetHub@2026', extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', p_meta, now(), now(), '', '', '', '');
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id::text, p_id,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
end $$;

-- clientes
select pg_temp.criar_conta('a0000000-0000-4000-8000-000000000001', 'ana@buffethub.test',
  '{"tipo":"cliente","nome":"Ana Souza","telefone":"(11) 98888-1001","cpf":"39053344705"}');
select pg_temp.criar_conta('a0000000-0000-4000-8000-000000000002', 'bruno@buffethub.test',
  '{"tipo":"cliente","nome":"Bruno Lima","telefone":"(11) 98888-1002","cpf":"52998224725"}');
select pg_temp.criar_conta('a0000000-0000-4000-8000-000000000003', 'carla@buffethub.test',
  '{"tipo":"cliente","nome":"Carla Mendes","telefone":"(11) 98888-1003","cpf":"11144477735"}');
select pg_temp.criar_conta('a0000000-0000-4000-8000-000000000004', 'diego@buffethub.test',
  '{"tipo":"cliente","nome":"Diego Rocha","telefone":"(11) 98888-1004","cpf":"86288366757"}');
update public.cliente set preferencias = 'Gosto de comida brasileira e decoração em tons claros.'
 where usuario_id = 'a0000000-0000-4000-8000-000000000001';

-- buffets
select pg_temp.criar_conta('b0000000-0000-4000-8000-000000000001', 'buffet1@buffethub.test',
  '{"tipo":"buffet","nome":"Marcos Alves","telefone":"(11) 3333-2001","cnpj":"11222333000181","nome_fantasia":"Buffet Jardim das Festas"}');
select pg_temp.criar_conta('b0000000-0000-4000-8000-000000000002', 'buffet2@buffethub.test',
  '{"tipo":"buffet","nome":"Juliana Prado","telefone":"(11) 3333-2002","cnpj":"22333444000172","nome_fantasia":"Sabor & Arte Eventos"}');
select pg_temp.criar_conta('b0000000-0000-4000-8000-000000000003', 'buffet3@buffethub.test',
  '{"tipo":"buffet","nome":"Renata Costa","telefone":"(11) 3333-2003","cnpj":"33444555000163","nome_fantasia":"Espaço Alegria Kids"}');
select pg_temp.criar_conta('b0000000-0000-4000-8000-000000000004', 'buffet4@buffethub.test',
  '{"tipo":"buffet","nome":"Paolo Ricci","telefone":"(11) 3333-2004","cnpj":"44555666000154","nome_fantasia":"Villa Toscana Recepções"}');
select pg_temp.criar_conta('b0000000-0000-4000-8000-000000000005', 'buffet5@buffethub.test',
  '{"tipo":"buffet","nome":"Sérgio Nunes","telefone":"(11) 4444-2005","cnpj":"55666777000145","nome_fantasia":"Recanto Sabores do Brasil"}');
select pg_temp.criar_conta('b0000000-0000-4000-8000-000000000006', 'buffet6@buffethub.test',
  '{"tipo":"buffet","nome":"Akemi Tanaka","telefone":"(11) 3333-2006","cnpj":"66777888000136","nome_fantasia":"Oriental Fest Buffet"}');
select pg_temp.criar_conta('b0000000-0000-4000-8000-000000000007', 'buffet7@buffethub.test',
  '{"tipo":"buffet","nome":"Rodrigo Farias","telefone":"(11) 3555-2007","cnpj":"77888999000127","nome_fantasia":"Gaúcho Grill Eventos"}');

update public.buffet b set
  descricao = v.descricao, endereco = v.endereco, cidade = v.cidade, latitude = v.lat, longitude = v.lng,
  capacidade_maxima = v.cap, estilo_culinaria = v.estilo, tipos_evento = v.tipos, servicos = v.servicos
from (values
  ('b0000000-0000-4000-8000-000000000001'::uuid,
   'Salão com jardim, iluminação cênica e equipe completa para festas de todos os tamanhos. Mais de 15 anos realizando casamentos e aniversários.',
   'Rua Domingos de Morais, 1500 - Vila Mariana', 'São Paulo', -23.5891, -46.6345, 250, 'Brasileira',
   array['Casamento', 'Aniversário', '15 anos'], 'Decoração, DJ, garçons, bolo e doces, recepcionista'),
  ('b0000000-0000-4000-8000-000000000002'::uuid,
   'Cozinha contemporânea com chef próprio. Ideal para casamentos intimistas e eventos corporativos.',
   'Rua dos Pinheiros, 870 - Pinheiros', 'São Paulo', -23.5614, -46.6826, 150, 'Contemporânea',
   array['Casamento', 'Corporativo', 'Formatura'], 'Chef no evento, open bar, garçons, mobiliário'),
  ('b0000000-0000-4000-8000-000000000003'::uuid,
   'Espaço infantil com brinquedos, monitores e cardápio pensado para crianças e adultos.',
   'Rua Tuiuti, 2100 - Tatuapé', 'São Paulo', -23.5404, -46.5763, 120, 'Brasileira',
   array['Infantil', 'Aniversário'], 'Monitores, brinquedos, animação, decoração temática'),
  ('b0000000-0000-4000-8000-000000000004'::uuid,
   'Casa de recepções no estilo italiano, com salão climatizado e cardápio de massas artesanais.',
   'Avenida Ibirapuera, 3100 - Moema', 'São Paulo', -23.6009, -46.6650, 300, 'Italiana',
   array['Casamento', '15 anos', 'Corporativo'], 'Decoração, banda, garçons, manobrista, cerimonial'),
  ('b0000000-0000-4000-8000-000000000005'::uuid,
   'Comida caseira brasileira em um espaço amplo e arborizado, com ótimo custo-benefício.',
   'Rua das Figueiras, 450 - Jardim', 'Santo André', -23.6639, -46.5383, 200, 'Brasileira',
   array['Aniversário', 'Formatura', 'Corporativo'], 'Garçons, DJ, decoração simples, estacionamento'),
  ('b0000000-0000-4000-8000-000000000006'::uuid,
   'Buffet de culinária japonesa com sushiman ao vivo e ambiente moderno.',
   'Rua Galvão Bueno, 300 - Liberdade', 'São Paulo', -23.5587, -46.6355, 100, 'Japonesa',
   array['Corporativo', 'Aniversário'], 'Sushiman ao vivo, garçons, mesas de apoio'),
  ('b0000000-0000-4000-8000-000000000007'::uuid,
   'Churrasco completo com carnes nobres, saladas e espaço para até 180 pessoas.',
   'Avenida dos Autonomistas, 2200 - Centro', 'Osasco', -23.5329, -46.7917, 180, 'Churrasco',
   array['Aniversário', 'Formatura', 'Corporativo'], 'Churrasqueiro, garçons, DJ, telão')
) as v(id, descricao, endereco, cidade, lat, lng, cap, estilo, tipos, servicos)
where b.usuario_id = v.id;

insert into public.midia_portfolio (buffet_id, url, tipo, descricao) values
  ('b0000000-0000-4000-8000-000000000001', '/demo/salao-1.svg', 'foto', 'Salão principal decorado'),
  ('b0000000-0000-4000-8000-000000000001', '/demo/mesa-1.svg', 'foto', 'Mesa de doces'),
  ('b0000000-0000-4000-8000-000000000001', '/demo/jardim-1.svg', 'foto', 'Jardim para cerimônia'),
  ('b0000000-0000-4000-8000-000000000002', '/demo/salao-2.svg', 'foto', 'Ambiente para jantar'),
  ('b0000000-0000-4000-8000-000000000002', '/demo/prato-1.svg', 'foto', 'Prato do chef'),
  ('b0000000-0000-4000-8000-000000000003', '/demo/kids-1.svg', 'foto', 'Área de brinquedos'),
  ('b0000000-0000-4000-8000-000000000003', '/demo/mesa-2.svg', 'foto', 'Mesa do bolo'),
  ('b0000000-0000-4000-8000-000000000004', '/demo/salao-3.svg', 'foto', 'Salão climatizado'),
  ('b0000000-0000-4000-8000-000000000004', '/demo/prato-2.svg', 'foto', 'Massas artesanais'),
  ('b0000000-0000-4000-8000-000000000005', '/demo/jardim-2.svg', 'foto', 'Espaço arborizado'),
  ('b0000000-0000-4000-8000-000000000005', '/demo/salao-1.svg', 'foto', 'Salão de festas'),
  ('b0000000-0000-4000-8000-000000000006', '/demo/prato-3.svg', 'foto', 'Ilha de sushi'),
  ('b0000000-0000-4000-8000-000000000006', '/demo/salao-2.svg', 'foto', 'Ambiente moderno'),
  ('b0000000-0000-4000-8000-000000000007', '/demo/churrasco-1.svg', 'foto', 'Churrasco completo'),
  ('b0000000-0000-4000-8000-000000000007', '/demo/salao-3.svg', 'foto', 'Salão principal');

insert into public.pacote (id, buffet_id, nome, itens_cardapio, preco_por_pessoa, servicos_adicionais) values
  ('c0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', 'Clássico',
   'Coquetel de entrada, 2 pratos quentes, saladas, sobremesa e bebidas não alcoólicas', 120.00, 'Bolo decorado'),
  ('c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000001', 'Premium',
   'Coquetel completo, 4 pratos quentes, mesa de frios, sobremesas finas e open bar', 185.00, 'Bolo, doces finos e DJ'),
  ('c0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000002', 'Jantar do Chef',
   'Entrada, prato principal assinado pelo chef e sobremesa', 160.00, 'Harmonização de vinhos'),
  ('c0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000002', 'Coquetel Corporativo',
   'Finger foods quentes e frios, mini sobremesas e bebidas', 95.00, 'Mesa de café'),
  ('c0000000-0000-4000-8000-000000000031', 'b0000000-0000-4000-8000-000000000003', 'Festa Kids',
   'Salgadinhos, cachorro-quente, pizza, docinhos e refrigerante', 85.00, 'Animação com personagens'),
  ('c0000000-0000-4000-8000-000000000032', 'b0000000-0000-4000-8000-000000000003', 'Kids Completo',
   'Cardápio infantil e cardápio adulto, docinhos, bolo e bebidas', 110.00, 'Lembrancinhas'),
  ('c0000000-0000-4000-8000-000000000041', 'b0000000-0000-4000-8000-000000000004', 'Trattoria',
   'Antepastos, 3 massas artesanais, carne e tiramisù', 150.00, 'Mesa de queijos'),
  ('c0000000-0000-4000-8000-000000000042', 'b0000000-0000-4000-8000-000000000004', 'Gran Festa',
   'Coquetel, antepastos, 4 massas, 2 carnes, sobremesas e open bar', 220.00, 'Banda ao vivo e cerimonial'),
  ('c0000000-0000-4000-8000-000000000051', 'b0000000-0000-4000-8000-000000000005', 'Caseiro',
   'Arroz, feijão tropeiro, frango, carne assada, saladas e pudim', 80.00, 'Bolo simples'),
  ('c0000000-0000-4000-8000-000000000052', 'b0000000-0000-4000-8000-000000000005', 'Festa Brasileira',
   'Feijoada ou churrasco, acompanhamentos, sobremesas e bebidas', 105.00, 'DJ'),
  ('c0000000-0000-4000-8000-000000000061', 'b0000000-0000-4000-8000-000000000006', 'Sushi Bar',
   'Sushis e sashimis à vontade, yakisoba, entradas e sobremesa', 140.00, 'Sushiman ao vivo'),
  ('c0000000-0000-4000-8000-000000000071', 'b0000000-0000-4000-8000-000000000007', 'Churrasco Tradicional',
   'Picanha, fraldinha, linguiça, frango, saladas, arroz e farofa', 98.00, 'Telão'),
  ('c0000000-0000-4000-8000-000000000072', 'b0000000-0000-4000-8000-000000000007', 'Churrasco Nobre',
   'Cortes nobres, buffet de saladas, guarnições e sobremesas', 140.00, 'DJ e telão');

-- datas bloqueadas pelos buffets
insert into public.disponibilidade (buffet_id, data, status) values
  ('b0000000-0000-4000-8000-000000000001', current_date + 30, 'Bloqueada'),
  ('b0000000-0000-4000-8000-000000000001', current_date + 31, 'Bloqueada'),
  ('b0000000-0000-4000-8000-000000000004', current_date + 21, 'Bloqueada');

-- Histórico já concluído (gera as avaliações) e situações em andamento para a demonstração
create or replace function pg_temp.historico(
  p_cliente uuid, p_buffet uuid, p_pacote uuid, p_tipo text, p_data date, p_convidados integer, p_valor numeric,
  p_ate text, p_nota integer default null, p_comentario text default null)
returns void language plpgsql as $$
declare
  v_evento uuid; v_sol uuid; v_prop uuid; v_contrato uuid; v_nome text;
begin
  insert into public.evento (cliente_id, tipo_evento, data, local, num_convidados, servicos_desejados)
  values (p_cliente, p_tipo, p_data, 'No próprio buffet', p_convidados, 'Decoração e garçons')
  returning id into v_evento;
  insert into public.solicitacao_orcamento (evento_id, buffet_id, pacote_id, observacoes, status, data_solicitacao)
  values (v_evento, p_buffet, p_pacote, 'Gostaria de saber o valor para o pacote escolhido.',
          (case when p_ate = 'solicitacao' then 'Pendente' else 'Respondida' end)::public.status_solicitacao, now() - interval '3 days')
  returning id into v_sol;
  if p_ate = 'solicitacao' then return; end if;

  insert into public.proposta (solicitacao_id, valor_total, descricao, validade, status, criada_em)
  values (v_sol, p_valor, 'Pacote completo com decoração, equipe de garçons e bebidas não alcoólicas.',
          least(p_data, current_date + 15), (case when p_ate = 'proposta' then 'Pendente' else 'Aceita' end)::public.status_proposta,
          now() - interval '2 days')
  returning id into v_prop;
  if p_ate = 'proposta' then return; end if;

  select nome into v_nome from public.usuario where id = p_cliente;
  insert into public.contrato (proposta_id, termos, status, assinado, data_assinatura, assinado_por)
  values (v_prop,
          'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE BUFFET' || E'\n\n' || 'Evento: ' || p_tipo || ' em ' ||
          to_char(p_data, 'DD/MM/YYYY') || ' para ' || p_convidados || ' convidados.' || E'\n' ||
          'Valor total: ' || public.formatar_moeda(p_valor) || '.',
          case p_ate when 'contrato' then 'Aguardando assinatura' when 'pago' then 'Pago' else 'Concluído' end::public.status_contrato,
          p_ate <> 'contrato', case when p_ate <> 'contrato' then now() - interval '1 day' end,
          case when p_ate <> 'contrato' then v_nome end)
  returning id into v_contrato;
  if p_ate = 'contrato' then return; end if;

  insert into public.pagamento (contrato_id, valor, metodo, status, codigo_transacao)
  values (v_contrato, p_valor, 'Pix', 'Aprovado', 'SIM-SEED' || upper(substr(md5(v_contrato::text), 1, 8)));
  insert into public.disponibilidade (buffet_id, data, status) values (p_buffet, p_data, 'Reservada')
    on conflict (buffet_id, data) do update set status = 'Reservada';

  if p_nota is not null then
    insert into public.avaliacao (cliente_id, buffet_id, contrato_id, nota, comentario, autor_nome)
    values (p_cliente, p_buffet, v_contrato, p_nota, p_comentario,
            split_part(v_nome, ' ', 1) || ' ' || left(split_part(v_nome, ' ', 2), 1) || '.');
  end if;
end $$;

select pg_temp.historico('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000012', 'Casamento', current_date - 40, 180, 33300, 'concluido', 5,
  'Festa impecável, equipe muito atenciosa e comida deliciosa.');
select pg_temp.historico('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000011', 'Aniversário', current_date - 25, 90, 10800, 'concluido', 4,
  'Muito bom! Só o som que poderia ser um pouco mais baixo.');
select pg_temp.historico('a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000021', 'Corporativo', current_date - 60, 70, 11200, 'concluido', 5,
  'O jantar do chef surpreendeu todos os convidados.');
select pg_temp.historico('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000041', '15 anos', current_date - 35, 150, 22500, 'concluido', 5,
  'Massas maravilhosas e salão lindo.');
select pg_temp.historico('a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000005',
  'c0000000-0000-4000-8000-000000000052', 'Formatura', current_date - 20, 120, 12600, 'concluido', 4,
  'Ótimo custo-benefício e comida caseira de verdade.');
select pg_temp.historico('a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000007',
  'c0000000-0000-4000-8000-000000000072', 'Aniversário', current_date - 15, 60, 8400, 'concluido', 3,
  'Carnes boas, mas o atendimento demorou no início.');
select pg_temp.historico('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000011', 'Aniversário', current_date + 90, 100, 12000, 'pago');

-- Ana (conta de demonstração): uma situação de cada etapa
select pg_temp.historico('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003',
  'c0000000-0000-4000-8000-000000000031', 'Infantil', current_date + 45, 60, 0.01, 'solicitacao');
select pg_temp.historico('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000012', 'Casamento', current_date + 120, 200, 37000, 'proposta');
select pg_temp.historico('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000021', 'Aniversário', current_date + 75, 50, 8000, 'contrato');
select pg_temp.historico('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000041', 'Aniversário', current_date - 10, 80, 12000, 'concluido');

insert into public.mensagem (remetente_id, destinatario_id, conteudo, data_envio, lida) values
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   'Olá! Vocês fazem cerimônia no jardim também?', now() - interval '2 days', true),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Olá, Ana! Fazemos sim, o jardim comporta até 150 pessoas sentadas.', now() - interval '47 hours', false);
delete from public.notificacao where usuario_id in (
  select id from public.usuario where email like '%@buffethub.test');
insert into public.notificacao (usuario_id, texto, link) values
  ('a0000000-0000-4000-8000-000000000001', 'Você recebeu uma proposta de Buffet Jardim das Festas (R$ 37.000,00).', '/cliente/solicitacoes'),
  ('a0000000-0000-4000-8000-000000000001', 'Nova mensagem de Buffet Jardim das Festas.', '/cliente/mensagens?com=b0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000003', 'Nova solicitação de orçamento: Infantil.', '/anfitriao/solicitacoes');
