import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/acoes";
import type {
  Contrato,
  MetodoPagamento,
  Negociacao,
  ResultadoPagamento,
  StatusContrato,
} from "@/lib/database.types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idValido(id: string) {
  return UUID.test(id);
}

/** Vence propostas e conclui contratos cujo evento já passou, para as telas mostrarem o status certo. */
export async function atualizarStatusPorData() {
  const sb = await criarClienteServidor();
  await sb.rpc("atualizar_status_por_data");
}

/** UC10: todas as negociações do cliente (solicitação, proposta, contrato, pagamento e avaliação). */
export async function listarNegociacoes(clienteId: string): Promise<{ negociacoes: Negociacao[]; erro: string | null }> {
  await atualizarStatusPorData();
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .from("vw_negociacao")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("data_solicitacao", { ascending: false });
  if (error) return { negociacoes: [], erro: traduzirErro(error, "Não foi possível carregar seus dados. Tente novamente.") };
  return { negociacoes: data ?? [], erro: null };
}

export type DetalheContrato = { contrato: Contrato; negociacao: Negociacao };

/** UC12: contrato com os termos + dados da negociação. Só devolve se o contrato for do cliente logado. */
export async function obterContrato(
  contratoId: string,
  clienteId: string,
): Promise<{ detalhe: DetalheContrato | null; erro: string | null }> {
  if (!idValido(contratoId)) return { detalhe: null, erro: null };
  await atualizarStatusPorData();
  const sb = await criarClienteServidor();
  const [contrato, negociacao] = await Promise.all([
    sb
      .from("contrato")
      .select("id, proposta_id, termos, data_criacao, status, assinado, data_assinatura, assinado_por")
      .eq("id", contratoId)
      .maybeSingle(),
    sb.from("vw_negociacao").select("*").eq("contrato_id", contratoId).eq("cliente_id", clienteId).maybeSingle(),
  ]);
  const erro = contrato.error ?? negociacao.error;
  if (erro) return { detalhe: null, erro: "Não foi possível abrir o contrato. Tente novamente." };
  if (!contrato.data || !negociacao.data) return { detalhe: null, erro: null };
  return { detalhe: { contrato: contrato.data, negociacao: negociacao.data }, erro: null };
}

export async function obterStatusContrato(contratoId: string): Promise<StatusContrato | null> {
  const sb = await criarClienteServidor();
  const { data } = await sb.from("contrato").select("status").eq("id", contratoId).maybeSingle();
  return data?.status ?? null;
}

export async function cancelarSolicitacao(solicitacaoId: string) {
  const sb = await criarClienteServidor();
  return sb.rpc("cancelar_solicitacao", { p_solicitacao_id: solicitacaoId });
}

/** UC11: aceitar gera o contrato e devolve o id dele. */
export async function aceitarProposta(propostaId: string) {
  const sb = await criarClienteServidor();
  return sb.rpc("aceitar_proposta", { p_proposta_id: propostaId });
}

export async function recusarProposta(propostaId: string) {
  const sb = await criarClienteServidor();
  return sb.rpc("recusar_proposta", { p_proposta_id: propostaId });
}

/** UC13: o banco confere se o nome digitado é igual ao do cadastro. */
export async function assinarContrato(contratoId: string, nome: string) {
  const sb = await criarClienteServidor();
  return sb.rpc("assinar_contrato", { p_contrato_id: contratoId, p_nome: nome });
}

/**
 * UC14: pagamento simulado. O número do cartão é o único dado do cartão que vai para o banco.
 * O tempo limite representa o gateway que não responde (RNF05); quem chama confere depois se o pagamento entrou.
 */
export async function pagarContrato(
  contratoId: string,
  metodo: MetodoPagamento,
  numeroCartao: string | null,
  tempoLimiteMs: number,
): Promise<{ resultado: ResultadoPagamento | null; erro: { message: string } | null; semResposta: boolean }> {
  const sb = await criarClienteServidor();
  const { data, error } = await sb
    .rpc("pagar_contrato", { p_contrato_id: contratoId, p_metodo: metodo, p_numero_cartao: numeroCartao })
    .abortSignal(AbortSignal.timeout(tempoLimiteMs));
  if (error) return { resultado: null, erro: error, semResposta: /abort|timeout/i.test(error.message ?? "") };
  return { resultado: data as unknown as ResultadoPagamento, erro: null, semResposta: false };
}

/** UC15: só contrato Concluído e uma única vez. */
export async function avaliarBuffet(contratoId: string, nota: number, comentario: string | null) {
  const sb = await criarClienteServidor();
  return sb.rpc("avaliar_buffet", { p_contrato_id: contratoId, p_nota: nota, p_comentario: comentario });
}
