"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirCliente } from "@/lib/auth";
import { campo, traduzirErro, valoresDoForm, type EstadoAcao } from "@/lib/acoes";
import { hojeISO, somenteDigitos } from "@/lib/formatos";
import type { MetodoPagamento } from "@/lib/database.types";
import * as modelo from "@/models/cliente";

export type EstadoPagamento = EstadoAcao & { recusado?: boolean };

const METODOS: MetodoPagamento[] = ["Pix", "Cartão", "Boleto"];
const TEMPO_LIMITE_GATEWAY_MS = 3000;

function revalidarPainel() {
  revalidatePath("/cliente", "layout");
  revalidatePath("/pagamento/[contratoId]", "page");
}

export async function cancelarSolicitacaoAcao(solicitacaoId: string): Promise<EstadoAcao> {
  await exigirCliente("/cliente/solicitacoes");
  const { error } = await modelo.cancelarSolicitacao(solicitacaoId);
  if (error) return { mensagem: traduzirErro(error, "Não foi possível cancelar a solicitação.") };
  revalidarPainel();
  return { ok: true, mensagem: "Solicitação cancelada. O buffet foi avisado." };
}

export async function aceitarPropostaAcao(propostaId: string): Promise<EstadoAcao> {
  await exigirCliente("/cliente/solicitacoes");
  const { data: contratoId, error } = await modelo.aceitarProposta(propostaId);
  if (error || !contratoId) {
    const mensagem = traduzirErro(error, "Não foi possível aceitar a proposta.");
    // UC11 E2: a data foi ocupada; a tela sugere conversar com o buffet
    const dataIndisponivel = /não está mais disponível/i.test(mensagem);
    return { mensagem, erros: dataIndisponivel ? { data: mensagem } : undefined };
  }
  revalidarPainel();
  redirect(`/cliente/contratos/${contratoId}?aceita=1`);
}

export async function recusarPropostaAcao(propostaId: string): Promise<EstadoAcao> {
  await exigirCliente("/cliente/solicitacoes");
  const { error } = await modelo.recusarProposta(propostaId);
  if (error) return { mensagem: traduzirErro(error, "Não foi possível recusar a proposta.") };
  revalidarPainel();
  return { ok: true, mensagem: "Proposta recusada. O buffet foi avisado." };
}

export async function assinarContratoAcao(contratoId: string, _estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  await exigirCliente(`/cliente/contratos/${contratoId}`);
  const nome = campo(form, "nome").replace(/\s+/g, " ");
  const aceite = form.get("aceite") === "on";
  const erros: Record<string, string> = {};
  if (nome.split(" ").length < 2) erros.nome = "Digite seu nome completo.";
  if (!aceite) erros.aceite = "Marque “Li e concordo com os termos” para assinar.";
  if (Object.keys(erros).length) return { erros, valores: valoresDoForm(form) };

  const { error } = await modelo.assinarContrato(contratoId, nome);
  if (error) {
    const mensagem = traduzirErro(error, "Não foi possível assinar o contrato.");
    if (/nome/i.test(mensagem)) return { erros: { nome: mensagem }, valores: valoresDoForm(form) };
    return { mensagem, valores: valoresDoForm(form) };
  }
  revalidarPainel();
  redirect(`/cliente/contratos/${contratoId}?assinado=1`);
}

function validadeCartaoOk(validade: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(validade);
  if (!m) return false;
  const mes = Number(m[1]);
  const ano = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  const [anoAtual, mesAtual] = hojeISO().split("-").map(Number);
  return ano > anoAtual || (ano === anoAtual && mes >= mesAtual);
}

function validarCartao(form: FormData) {
  const erros: Record<string, string> = {};
  const numero = somenteDigitos(campo(form, "numero_cartao"));
  const nome = campo(form, "nome_cartao");
  const validade = campo(form, "validade_cartao");
  const cvv = somenteDigitos(campo(form, "cvv"));
  if (numero.length < 13 || numero.length > 19) erros.numero_cartao = "Informe um número de cartão válido.";
  if (nome.length < 3) erros.nome_cartao = "Informe o nome impresso no cartão.";
  if (!validadeCartaoOk(validade)) erros.validade_cartao = "Validade inválida ou vencida (use MM/AA).";
  if (cvv.length < 3 || cvv.length > 4) erros.cvv = "Código de segurança inválido.";
  return { numero, erros };
}

export async function pagarContratoAcao(contratoId: string, _estado: EstadoPagamento, form: FormData): Promise<EstadoPagamento> {
  await exigirCliente(`/pagamento/${contratoId}`);
  const metodo = campo(form, "metodo") as MetodoPagamento;
  if (!METODOS.includes(metodo)) return { mensagem: "Escolha uma forma de pagamento." };

  let numeroCartao: string | null = null;
  if (metodo === "Cartão") {
    const { numero, erros } = validarCartao(form);
    if (Object.keys(erros).length) return { erros, mensagem: "Confira os dados do cartão." };
    numeroCartao = numero;
  }

  const { resultado, erro, semResposta } = await modelo.pagarContrato(contratoId, metodo, numeroCartao, TEMPO_LIMITE_GATEWAY_MS);

  if (semResposta) {
    // UC14 E1: o banco pode ter concluído o pagamento depois do tempo limite
    if ((await modelo.obterStatusContrato(contratoId)) === "Pago") {
      revalidarPainel();
      redirect(`/pagamento/${contratoId}?sucesso=1`);
    }
    return { mensagem: "O gateway de pagamento não respondeu a tempo. Nenhum valor foi cobrado. Tente novamente." };
  }
  if (erro) {
    const mensagem = traduzirErro(erro, "Não foi possível concluir o pagamento. Tente novamente.");
    if (/já está pago/i.test(mensagem)) redirect(`/pagamento/${contratoId}`);
    if (/assine o contrato/i.test(mensagem)) redirect(`/cliente/contratos/${contratoId}`);
    return { mensagem };
  }
  if (resultado?.status === "Aprovado") {
    revalidarPainel();
    redirect(`/pagamento/${contratoId}?sucesso=1`);
  }
  return {
    recusado: true,
    mensagem: "O pagamento foi recusado pela operadora do cartão. Tente outro cartão ou pague com Pix ou boleto.",
  };
}

export async function avaliarBuffetAcao(contratoId: string, _estado: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  await exigirCliente("/cliente/reservas");
  const nota = Number(campo(form, "nota"));
  const comentario = campo(form, "comentario");
  const erros: Record<string, string> = {};
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) erros.nota = "Escolha uma nota de 1 a 5 estrelas.";
  if (comentario.length > 1000) erros.comentario = "O comentário pode ter no máximo 1000 caracteres.";
  if (Object.keys(erros).length) return { erros, valores: valoresDoForm(form) };

  const { error } = await modelo.avaliarBuffet(contratoId, nota, comentario || null);
  if (error) return { mensagem: traduzirErro(error, "Não foi possível enviar a avaliação."), valores: valoresDoForm(form) };
  revalidarPainel();
  revalidatePath("/buffet/[id]", "page");
  revalidatePath("/");
  return { ok: true, mensagem: "Obrigado! Sua avaliação já aparece no perfil do buffet." };
}
