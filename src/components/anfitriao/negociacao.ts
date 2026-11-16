import type { Negociacao } from "@/lib/database.types";
import type { CorSelo } from "@/components/ui/basicos";

export type Situacao = { rotulo: string; cor: CorSelo };

type Campos = Pick<Negociacao, "status_solicitacao" | "status_proposta" | "status_contrato">;

/** Em que pé está a negociação, do ponto de vista do buffet. */
export function situacaoNegociacao(n: Campos): Situacao {
  if (n.status_solicitacao === "Cancelada") return { rotulo: "Cancelada pelo cliente", cor: "cinza" };
  if (n.status_solicitacao === "Pendente") return { rotulo: "Aguardando sua proposta", cor: "amarelo" };
  if (n.status_contrato === "Concluído") return { rotulo: "Evento realizado", cor: "roxo" };
  if (n.status_contrato === "Pago") return { rotulo: "Pago · data reservada", cor: "verde" };
  if (n.status_contrato === "Assinado") return { rotulo: "Assinado · aguardando pagamento", cor: "azul" };
  if (n.status_contrato === "Aguardando assinatura") return { rotulo: "Aguardando assinatura", cor: "amarelo" };
  if (n.status_proposta === "Recusada") return { rotulo: "Proposta recusada", cor: "vermelho" };
  if (n.status_proposta === "Expirada") return { rotulo: "Proposta expirada", cor: "cinza" };
  return { rotulo: "Aguardando o cliente", cor: "azul" };
}

/** Preço por pessoa do pacote de interesse × convidados (null se o cliente não escolheu pacote). */
export function estimativa(n: Pick<Negociacao, "pacote_preco_por_pessoa" | "num_convidados">) {
  if (n.pacote_preco_por_pessoa == null) return null;
  return Number(n.pacote_preco_por_pessoa) * n.num_convidados;
}

export function primeiroNome(nome: string | null | undefined) {
  return (nome ?? "Cliente").trim().split(/\s+/)[0];
}
