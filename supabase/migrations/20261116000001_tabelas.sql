-- BuffetHub: tabelas do banco (DER da documentação, seção 1.5.3)

create type public.tipo_usuario as enum ('cliente', 'buffet');
create type public.status_solicitacao as enum ('Pendente', 'Respondida', 'Cancelada');
create type public.status_proposta as enum ('Pendente', 'Aceita', 'Recusada', 'Expirada');
create type public.status_contrato as enum ('Aguardando assinatura', 'Assinado', 'Pago', 'Concluído');
create type public.status_pagamento as enum ('Pendente', 'Aprovado', 'Recusado', 'Estornado');
create type public.status_data as enum ('Livre', 'Bloqueada', 'Reservada');
create type public.metodo_pagamento as enum ('Pix', 'Cartão', 'Boleto');
create type public.tipo_midia as enum ('foto', 'video');

-- Usuario (classe abstrata): uma linha por conta do Supabase Auth
create table public.usuario (
  id uuid primary key references auth.users (id) on delete cascade,
  tipo public.tipo_usuario not null,
  nome text not null check (length(trim(nome)) > 1),
  email text not null,
  telefone text,
  data_cadastro timestamptz not null default now()
);

create table public.cliente (
  usuario_id uuid primary key references public.usuario (id) on delete cascade,
  cpf text not null unique check (cpf ~ '^[0-9]{11}$'),
  preferencias text
);

create table public.buffet (
  usuario_id uuid primary key references public.usuario (id) on delete cascade,
  cnpj text not null unique check (cnpj ~ '^[0-9]{14}$'),
  nome_fantasia text not null check (length(trim(nome_fantasia)) > 1),
  descricao text,
  endereco text,
  cidade text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  capacidade_maxima integer check (capacidade_maxima > 0),
  estilo_culinaria text,
  tipos_evento text[] not null default '{}',
  servicos text
);

create table public.midia_portfolio (
  id uuid primary key default gen_random_uuid(),
  buffet_id uuid not null references public.buffet (usuario_id) on delete cascade,
  url text not null,
  caminho_storage text,
  tipo public.tipo_midia not null default 'foto',
  descricao text,
  criada_em timestamptz not null default now()
);

create table public.pacote (
  id uuid primary key default gen_random_uuid(),
  buffet_id uuid not null references public.buffet (usuario_id) on delete cascade,
  nome text not null check (length(trim(nome)) > 1),
  itens_cardapio text not null,
  preco_por_pessoa numeric(10, 2) not null check (preco_por_pessoa > 0),
  servicos_adicionais text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Data sem linha aqui = Livre
create table public.disponibilidade (
  id uuid primary key default gen_random_uuid(),
  buffet_id uuid not null references public.buffet (usuario_id) on delete cascade,
  data date not null,
  status public.status_data not null,
  unique (buffet_id, data)
);

create table public.evento (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.cliente (usuario_id) on delete cascade,
  tipo_evento text not null,
  data date not null,
  local text not null,
  num_convidados integer not null check (num_convidados > 0),
  servicos_desejados text,
  criado_em timestamptz not null default now()
);

create table public.solicitacao_orcamento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.evento (id) on delete cascade,
  buffet_id uuid not null references public.buffet (usuario_id) on delete cascade,
  pacote_id uuid references public.pacote (id) on delete set null,
  data_solicitacao timestamptz not null default now(),
  observacoes text,
  status public.status_solicitacao not null default 'Pendente'
);

create table public.proposta (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null unique references public.solicitacao_orcamento (id) on delete cascade,
  valor_total numeric(12, 2) not null check (valor_total > 0),
  descricao text not null,
  validade date not null,
  status public.status_proposta not null default 'Pendente',
  criada_em timestamptz not null default now()
);

create table public.contrato (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null unique references public.proposta (id) on delete cascade,
  termos text not null,
  data_criacao timestamptz not null default now(),
  status public.status_contrato not null default 'Aguardando assinatura',
  assinado boolean not null default false,
  data_assinatura timestamptz,
  assinado_por text
);

create table public.pagamento (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contrato (id) on delete cascade,
  valor numeric(12, 2) not null check (valor > 0),
  metodo public.metodo_pagamento not null,
  status public.status_pagamento not null default 'Pendente',
  data_pagamento timestamptz not null default now(),
  codigo_transacao text not null
);

create table public.avaliacao (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.cliente (usuario_id) on delete cascade,
  buffet_id uuid not null references public.buffet (usuario_id) on delete cascade,
  contrato_id uuid not null unique references public.contrato (id) on delete cascade,
  nota integer not null check (nota between 1 and 5),
  comentario text,
  data timestamptz not null default now()
);

create table public.mensagem (
  id uuid primary key default gen_random_uuid(),
  remetente_id uuid not null references public.usuario (id) on delete cascade,
  destinatario_id uuid not null references public.usuario (id) on delete cascade,
  conteudo text not null check (length(trim(conteudo)) > 0 and length(conteudo) <= 2000),
  data_envio timestamptz not null default now(),
  lida boolean not null default false,
  check (remetente_id <> destinatario_id)
);

-- Avisos dentro do site (RNF29)
create table public.notificacao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario (id) on delete cascade,
  texto text not null,
  link text,
  lida boolean not null default false,
  criada_em timestamptz not null default now()
);

create index on public.midia_portfolio (buffet_id);
create index on public.pacote (buffet_id);
create index on public.evento (cliente_id);
create index on public.solicitacao_orcamento (evento_id);
create index on public.solicitacao_orcamento (buffet_id, status);
create index on public.pagamento (contrato_id);
create index on public.avaliacao (buffet_id);
create index on public.mensagem (destinatario_id, lida);
create index on public.mensagem (remetente_id);
create index on public.notificacao (usuario_id, lida);
create index on public.buffet (cidade);

-- Busca de buffets (T4.0): dados do buffet + menor preço, nota média e foto de capa
create view public.vw_buffet_busca with (security_invoker = true) as
select
  b.usuario_id as id,
  b.nome_fantasia,
  b.descricao,
  b.endereco,
  b.cidade,
  b.latitude,
  b.longitude,
  b.capacidade_maxima,
  b.estilo_culinaria,
  b.tipos_evento,
  b.servicos,
  (select min(p.preco_por_pessoa) from public.pacote p where p.buffet_id = b.usuario_id and p.ativo) as preco_min,
  (select round(avg(a.nota)::numeric, 1) from public.avaliacao a where a.buffet_id = b.usuario_id) as nota_media,
  (select count(*) from public.avaliacao a where a.buffet_id = b.usuario_id)::integer as total_avaliacoes,
  (select m.url from public.midia_portfolio m where m.buffet_id = b.usuario_id and m.tipo = 'foto'
     order by m.criada_em limit 1) as capa_url
from public.buffet b;
