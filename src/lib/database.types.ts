// Tipos do banco Supabase (espelham supabase/migrations). Atualize aqui se mudar uma tabela.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TipoUsuario = "cliente" | "buffet";
export type StatusSolicitacao = "Pendente" | "Respondida" | "Cancelada";
export type StatusProposta = "Pendente" | "Aceita" | "Recusada" | "Expirada";
export type StatusContrato = "Aguardando assinatura" | "Assinado" | "Pago" | "Concluído";
export type StatusPagamento = "Pendente" | "Aprovado" | "Recusado" | "Estornado";
export type StatusData = "Livre" | "Bloqueada" | "Reservada";
export type MetodoPagamento = "Pix" | "Cartão" | "Boleto";
export type TipoMidia = "foto" | "video";

type Tabela<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: {
    foreignKeyName: string;
    columns: string[];
    isOneToOne?: boolean;
    referencedRelation: string;
    referencedColumns: string[];
  }[];
};

export type Usuario = {
  id: string;
  tipo: TipoUsuario;
  nome: string;
  email: string;
  telefone: string | null;
  data_cadastro: string;
};
export type Cliente = { usuario_id: string; cpf: string; preferencias: string | null };
export type Buffet = {
  usuario_id: string;
  cnpj: string;
  nome_fantasia: string;
  descricao: string | null;
  endereco: string | null;
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
  capacidade_maxima: number | null;
  estilo_culinaria: string | null;
  tipos_evento: string[];
  servicos: string | null;
};
export type MidiaPortfolio = {
  id: string;
  buffet_id: string;
  url: string;
  caminho_storage: string | null;
  tipo: TipoMidia;
  descricao: string | null;
  criada_em: string;
};
export type Pacote = {
  id: string;
  buffet_id: string;
  nome: string;
  itens_cardapio: string;
  preco_por_pessoa: number;
  servicos_adicionais: string | null;
  ativo: boolean;
  criado_em: string;
};
export type Disponibilidade = { id: string; buffet_id: string; data: string; status: StatusData };
export type Evento = {
  id: string;
  cliente_id: string;
  tipo_evento: string;
  data: string;
  local: string;
  num_convidados: number;
  servicos_desejados: string | null;
  criado_em: string;
};
export type SolicitacaoOrcamento = {
  id: string;
  evento_id: string;
  buffet_id: string;
  pacote_id: string | null;
  data_solicitacao: string;
  observacoes: string | null;
  status: StatusSolicitacao;
};
export type Proposta = {
  id: string;
  solicitacao_id: string;
  valor_total: number;
  descricao: string;
  validade: string;
  status: StatusProposta;
  criada_em: string;
};
export type Contrato = {
  id: string;
  proposta_id: string;
  termos: string;
  data_criacao: string;
  status: StatusContrato;
  assinado: boolean;
  data_assinatura: string | null;
  assinado_por: string | null;
};
export type Pagamento = {
  id: string;
  contrato_id: string;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusPagamento;
  data_pagamento: string;
  codigo_transacao: string;
};
export type Avaliacao = {
  id: string;
  cliente_id: string;
  buffet_id: string;
  contrato_id: string;
  nota: number;
  comentario: string | null;
  data: string;
  autor_nome: string | null;
};
export type Mensagem = {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  data_envio: string;
  lida: boolean;
};
export type Notificacao = {
  id: string;
  usuario_id: string;
  texto: string;
  link: string | null;
  lida: boolean;
  criada_em: string;
};
export type BuffetBusca = {
  id: string;
  nome_fantasia: string;
  descricao: string | null;
  endereco: string | null;
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
  capacidade_maxima: number | null;
  estilo_culinaria: string | null;
  tipos_evento: string[];
  servicos: string | null;
  preco_min: number | null;
  nota_media: number | null;
  total_avaliacoes: number;
  capa_url: string | null;
};
export type Negociacao = {
  solicitacao_id: string;
  status_solicitacao: StatusSolicitacao;
  data_solicitacao: string;
  observacoes: string | null;
  buffet_id: string;
  buffet_nome: string;
  buffet_capa_url: string | null;
  evento_id: string;
  cliente_id: string;
  cliente_nome: string | null;
  tipo_evento: string;
  data_evento: string;
  local: string;
  num_convidados: number;
  servicos_desejados: string | null;
  pacote_id: string | null;
  pacote_nome: string | null;
  pacote_preco_por_pessoa: number | null;
  proposta_id: string | null;
  valor_total: number | null;
  proposta_descricao: string | null;
  proposta_validade: string | null;
  status_proposta: StatusProposta | null;
  proposta_criada_em: string | null;
  contrato_id: string | null;
  status_contrato: StatusContrato | null;
  contrato_criado_em: string | null;
  data_assinatura: string | null;
  codigo_transacao: string | null;
  pagamento_metodo: MetodoPagamento | null;
  data_pagamento: string | null;
  avaliacao_id: string | null;
  avaliacao_nota: number | null;
};
export type Conversa = {
  outro_id: string;
  outro_nome: string;
  outro_tipo: TipoUsuario;
  ultima_mensagem: string;
  ultima_data: string;
  nao_lidas: number;
};
export type ResultadoPagamento = {
  pagamento_id: string;
  status: StatusPagamento;
  codigo_transacao: string;
  valor: number;
};

export type Database = {
  public: {
    Tables: {
      usuario: Tabela<Usuario, Omit<Usuario, "data_cadastro"> & { data_cadastro?: string }>;
      cliente: Tabela<Cliente, Cliente>;
      buffet: Tabela<Buffet, Pick<Buffet, "usuario_id" | "cnpj" | "nome_fantasia"> & Partial<Buffet>>;
      midia_portfolio: Tabela<
        MidiaPortfolio,
        Pick<MidiaPortfolio, "buffet_id" | "url"> & Partial<MidiaPortfolio>
      >;
      pacote: Tabela<
        Pacote,
        Pick<Pacote, "buffet_id" | "nome" | "itens_cardapio" | "preco_por_pessoa"> & Partial<Pacote>
      >;
      disponibilidade: Tabela<Disponibilidade, Omit<Disponibilidade, "id"> & { id?: string }>;
      evento: Tabela<
        Evento,
        Omit<Evento, "id" | "criado_em" | "servicos_desejados"> & Partial<Evento>
      >;
      solicitacao_orcamento: Tabela<
        SolicitacaoOrcamento,
        Pick<SolicitacaoOrcamento, "evento_id" | "buffet_id"> & Partial<SolicitacaoOrcamento>
      >;
      proposta: Tabela<
        Proposta,
        Pick<Proposta, "solicitacao_id" | "valor_total" | "descricao" | "validade"> & Partial<Proposta>
      >;
      contrato: Tabela<Contrato, Pick<Contrato, "proposta_id" | "termos"> & Partial<Contrato>>;
      pagamento: Tabela<
        Pagamento,
        Pick<Pagamento, "contrato_id" | "valor" | "metodo" | "codigo_transacao"> & Partial<Pagamento>
      >;
      avaliacao: Tabela<
        Avaliacao,
        Pick<Avaliacao, "cliente_id" | "buffet_id" | "contrato_id" | "nota"> & Partial<Avaliacao>
      >;
      mensagem: Tabela<
        Mensagem,
        Pick<Mensagem, "remetente_id" | "destinatario_id" | "conteudo"> & Partial<Mensagem>
      >;
      notificacao: Tabela<Notificacao, Pick<Notificacao, "usuario_id" | "texto"> & Partial<Notificacao>>;
    };
    Views: {
      vw_buffet_busca: { Row: BuffetBusca; Relationships: [] };
      vw_negociacao: { Row: Negociacao; Relationships: [] };
    };
    Functions: {
      cadastrar_evento: {
        Args: {
          p_tipo_evento: string;
          p_data: string;
          p_local: string;
          p_num_convidados: number;
          p_servicos_desejados?: string | null;
        };
        Returns: string;
      };
      solicitar_orcamento: {
        Args: { p_buffet_id: string; p_evento_id: string; p_pacote_id?: string | null; p_observacoes?: string | null };
        Returns: string;
      };
      cancelar_solicitacao: { Args: { p_solicitacao_id: string }; Returns: undefined };
      responder_solicitacao: {
        Args: { p_solicitacao_id: string; p_valor_total: number; p_descricao: string; p_validade: string };
        Returns: string;
      };
      aceitar_proposta: { Args: { p_proposta_id: string }; Returns: string };
      recusar_proposta: { Args: { p_proposta_id: string }; Returns: undefined };
      assinar_contrato: { Args: { p_contrato_id: string; p_nome: string }; Returns: undefined };
      pagar_contrato: {
        Args: { p_contrato_id: string; p_metodo: MetodoPagamento; p_numero_cartao?: string | null };
        Returns: Json;
      };
      avaliar_buffet: {
        Args: { p_contrato_id: string; p_nota: number; p_comentario?: string | null };
        Returns: string;
      };
      definir_disponibilidade: { Args: { p_data: string; p_status: StatusData }; Returns: undefined };
      marcar_mensagens_lidas: { Args: { p_outro: string }; Returns: undefined };
      minhas_conversas: { Args: Record<string, never>; Returns: Conversa[] };
      atualizar_status_por_data: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: {
      tipo_usuario: TipoUsuario;
      status_solicitacao: StatusSolicitacao;
      status_proposta: StatusProposta;
      status_contrato: StatusContrato;
      status_pagamento: StatusPagamento;
      status_data: StatusData;
      metodo_pagamento: MetodoPagamento;
      tipo_midia: TipoMidia;
    };
    CompositeTypes: Record<string, never>;
  };
};
