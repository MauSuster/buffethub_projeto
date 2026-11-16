import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/acoes";
import type { Avaliacao, Buffet, Disponibilidade, MidiaPortfolio, Negociacao, Pacote, StatusData } from "@/lib/database.types";

export type Resultado<T> = { dados: T; erro: string | null };

const ERRO_CARREGAR = "Não foi possível carregar os dados. Tente novamente.";

/** Vence propostas e conclui contratos cujo evento já passou, para as telas mostrarem o status certo. */
export async function atualizarStatusPorData() {
  const sb = await criarClienteServidor();
  await sb.rpc("atualizar_status_por_data");
}

export type PerfilBuffet = { buffet: Buffet; email: string; telefone: string | null };

export async function obterPerfilBuffet(buffetId: string): Promise<Resultado<PerfilBuffet | null>> {
  const sb = await criarClienteServidor();
  const [buffet, usuario] = await Promise.all([
    sb.from("buffet").select("*").eq("usuario_id", buffetId).maybeSingle(),
    sb.from("usuario").select("email, telefone").eq("id", buffetId).maybeSingle(),
  ]);
  const erro = buffet.error ?? usuario.error;
  if (erro) return { dados: null, erro: traduzirErro(erro, ERRO_CARREGAR) };
  if (!buffet.data) return { dados: null, erro: null };
  return {
    dados: { buffet: buffet.data, email: usuario.data?.email ?? "", telefone: usuario.data?.telefone ?? null },
    erro: null,
  };
}

export async function listarFotos(buffetId: string): Promise<Resultado<MidiaPortfolio[]>> {
  const sb = await criarClienteServidor();
  const { data, error } = await sb.from("midia_portfolio").select("*").eq("buffet_id", buffetId).order("criada_em");
  return { dados: data ?? [], erro: error ? traduzirErro(error, ERRO_CARREGAR) : null };
}

export async function listarPacotes(buffetId: string): Promise<Resultado<Pacote[]>> {
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("pacote")
    .select("*")
    .eq("buffet_id", buffetId)
    .order("ativo", { ascending: false })
    .order("criado_em");
  return { dados: data ?? [], erro: error ? traduzirErro(error, ERRO_CARREGAR) : null };
}

export type ResumoAvaliacoes = { notaMedia: number | null; total: number };

export async function obterResumoAvaliacoes(buffetId: string): Promise<Resultado<ResumoAvaliacoes>> {
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("vw_buffet_busca")
    .select("nota_media, total_avaliacoes")
    .eq("id", buffetId)
    .maybeSingle();
  return {
    dados: { notaMedia: data?.nota_media == null ? null : Number(data.nota_media), total: data?.total_avaliacoes ?? 0 },
    erro: error ? traduzirErro(error, ERRO_CARREGAR) : null,
  };
}

export async function listarAvaliacoes(buffetId: string, limite = 5): Promise<Resultado<Avaliacao[]>> {
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("avaliacao")
    .select("*")
    .eq("buffet_id", buffetId)
    .order("data", { ascending: false })
    .limit(limite);
  return { dados: data ?? [], erro: error ? traduzirErro(error, ERRO_CARREGAR) : null };
}

/** UC20: todas as solicitações recebidas pelo buffet, da mais recente para a mais antiga. */
export async function listarNegociacoes(buffetId: string): Promise<Resultado<Negociacao[]>> {
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("vw_negociacao")
    .select("*")
    .eq("buffet_id", buffetId)
    .order("data_solicitacao", { ascending: false });
  return { dados: data ?? [], erro: error ? traduzirErro(error, ERRO_CARREGAR) : null };
}

/** Solicitações cujo evento cai entre as duas datas (para o calendário mostrar reservas e pedidos do mês). */
export async function listarNegociacoesNoPeriodo(
  buffetId: string,
  inicio: string,
  fim: string,
): Promise<Resultado<Negociacao[]>> {
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("vw_negociacao")
    .select("*")
    .eq("buffet_id", buffetId)
    .gte("data_evento", inicio)
    .lte("data_evento", fim)
    .order("data_evento");
  return { dados: data ?? [], erro: error ? traduzirErro(error, ERRO_CARREGAR) : null };
}

export async function obterNegociacao(buffetId: string, solicitacaoId: string): Promise<Negociacao | null> {
  const sb = await criarClienteServidor();
  const { data } = await sb
    .from("vw_negociacao")
    .select("*")
    .eq("buffet_id", buffetId)
    .eq("solicitacao_id", solicitacaoId)
    .maybeSingle();
  return data ?? null;
}

export type DataCalendario = Pick<Disponibilidade, "data" | "status">;

/** Datas com status no período. Data sem linha na tabela = Livre. */
export async function listarDisponibilidade(
  buffetId: string,
  inicio: string,
  fim: string,
): Promise<Resultado<DataCalendario[]>> {
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("disponibilidade")
    .select("data, status")
    .eq("buffet_id", buffetId)
    .gte("data", inicio)
    .lte("data", fim);
  return { dados: data ?? [], erro: error ? traduzirErro(error, ERRO_CARREGAR) : null };
}

export async function statusDaData(buffetId: string, data: string): Promise<StatusData> {
  const sb = await criarClienteServidor();
  const { data: linha } = await sb
    .from("disponibilidade")
    .select("status")
    .eq("buffet_id", buffetId)
    .eq("data", data)
    .maybeSingle();
  return linha?.status ?? "Livre";
}

export type DadosBuffet = Pick<
  Buffet,
  | "nome_fantasia"
  | "descricao"
  | "endereco"
  | "cidade"
  | "latitude"
  | "longitude"
  | "capacidade_maxima"
  | "estilo_culinaria"
  | "tipos_evento"
  | "servicos"
>;

/** UC17: grava só as colunas que o banco libera para o próprio buffet e o telefone de contato. */
export async function salvarDadosBuffet(buffetId: string, dados: DadosBuffet, telefone: string | null) {
  const sb = await criarClienteServidor();
  const { data, error } = await sb.from("buffet").update(dados).eq("usuario_id", buffetId).select("usuario_id");
  if (error) return traduzirErro(error, "Não foi possível salvar os dados do buffet.");
  if (!data?.length) return "Buffet não encontrado.";
  const contato = await sb.from("usuario").update({ telefone }).eq("id", buffetId);
  if (contato.error) return traduzirErro(contato.error, "Os dados foram salvos, mas o telefone não foi atualizado.");
  return null;
}

/** UC17: registra no portfólio uma foto que já foi enviada para o bucket "portfolio". */
export async function registrarFoto(buffetId: string, caminho: string) {
  const sb = await criarClienteServidor();
  const { data: publica } = sb.storage.from("portfolio").getPublicUrl(caminho);
  const { error } = await sb
    .from("midia_portfolio")
    .insert({ buffet_id: buffetId, url: publica.publicUrl, caminho_storage: caminho, tipo: "foto" });
  return error ? traduzirErro(error, "Não foi possível salvar a foto no portfólio.") : null;
}

/** Remove o arquivo do Storage (quando a foto foi enviada pelo painel) e a linha do portfólio. */
export async function removerFoto(buffetId: string, fotoId: string) {
  const sb = await criarClienteServidor();
  const { data: foto, error } = await sb
    .from("midia_portfolio")
    .select("id, caminho_storage")
    .eq("id", fotoId)
    .eq("buffet_id", buffetId)
    .maybeSingle();
  if (error) return traduzirErro(error, "Não foi possível remover a foto.");
  if (!foto) return "Foto não encontrada.";
  if (foto.caminho_storage) {
    const arquivo = await sb.storage.from("portfolio").remove([foto.caminho_storage]);
    if (arquivo.error) return traduzirErro(arquivo.error, "Não foi possível apagar o arquivo da foto.");
  }
  const apagada = await sb.from("midia_portfolio").delete().eq("id", fotoId).eq("buffet_id", buffetId);
  return apagada.error ? traduzirErro(apagada.error, "Não foi possível remover a foto.") : null;
}

export type DadosPacote = Pick<Pacote, "nome" | "itens_cardapio" | "preco_por_pessoa" | "servicos_adicionais" | "ativo">;

export async function criarPacote(buffetId: string, dados: DadosPacote) {
  const sb = await criarClienteServidor();
  const { error } = await sb.from("pacote").insert({ buffet_id: buffetId, ...dados });
  return error ? traduzirErro(error, "Não foi possível criar o pacote.") : null;
}

export async function atualizarPacote(buffetId: string, pacoteId: string, dados: Partial<DadosPacote>) {
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("pacote")
    .update(dados)
    .eq("id", pacoteId)
    .eq("buffet_id", buffetId)
    .select("id");
  if (error) return traduzirErro(error, "Não foi possível salvar o pacote.");
  return data?.length ? null : "Pacote não encontrado.";
}

export async function excluirPacote(buffetId: string, pacoteId: string) {
  const sb = await criarClienteServidor();
  const { data, error } = await sb.from("pacote").delete().eq("id", pacoteId).eq("buffet_id", buffetId).select("id");
  if (error) return traduzirErro(error, "Não foi possível excluir o pacote.");
  return data?.length ? null : "Pacote não encontrado.";
}

/** UC19: a função do banco confere data futura e se a data não está reservada. */
export async function definirDisponibilidade(data: string, status: "Livre" | "Bloqueada") {
  const sb = await criarClienteServidor();
  const { error } = await sb.rpc("definir_disponibilidade", { p_data: data, p_status: status });
  return error ? traduzirErro(error, "Não foi possível alterar a data.") : null;
}

/** UC20: cria a proposta, marca a solicitação como Respondida e avisa o cliente. */
export async function responderSolicitacao(solicitacaoId: string, valorTotal: number, descricao: string, validade: string) {
  const sb = await criarClienteServidor();
  const { error } = await sb.rpc("responder_solicitacao", {
    p_solicitacao_id: solicitacaoId,
    p_valor_total: valorTotal,
    p_descricao: descricao,
    p_validade: validade,
  });
  return error ? traduzirErro(error, "Não foi possível enviar a proposta.") : null;
}
