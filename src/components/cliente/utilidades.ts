import type { Negociacao } from "@/lib/database.types";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Diferença em dias entre duas datas AAAA-MM-DD (positivo quando `ate` é depois de `de`). */
export function diasEntre(de: string, ate: string) {
  const a = Date.UTC(+de.slice(0, 4), +de.slice(5, 7) - 1, +de.slice(8, 10));
  const b = Date.UTC(+ate.slice(0, 4), +ate.slice(5, 7) - 1, +ate.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function somarDias(iso: string, dias: number) {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + dias));
  return d.toISOString().slice(0, 10);
}

export function partesData(iso: string) {
  return { dia: iso.slice(8, 10), mes: MESES[+iso.slice(5, 7) - 1], ano: iso.slice(0, 4) };
}

/** "faltam 12 dias", "amanhã", "hoje" */
export function prazoAte(iso: string, hoje: string) {
  const dias = diasEntre(hoje, iso);
  if (dias < 0) return dias === -1 ? "ontem" : `há ${-dias} dias`;
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

export function numeroContrato(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/** Número pseudoaleatório estável a partir de um texto (mesmo resultado no servidor e no navegador). */
export function geradorDeterministico(semente: string) {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

export type Aba = "todas" | "aguardando" | "propostas" | "encerradas";

export const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "aguardando", rotulo: "Aguardando resposta" },
  { id: "propostas", rotulo: "Propostas recebidas" },
  { id: "encerradas", rotulo: "Encerradas" },
];

export function abaDaNegociacao(n: Negociacao): Exclude<Aba, "todas"> {
  if (n.status_solicitacao === "Cancelada") return "encerradas";
  if (n.status_proposta === "Recusada" || n.status_proposta === "Expirada") return "encerradas";
  if (n.status_solicitacao === "Pendente") return "aguardando";
  return "propostas";
}

/** Ordem da lista: primeiro o que depende do cliente, depois o que está em andamento. */
export function prioridade(n: Negociacao) {
  if (n.status_proposta === "Pendente") return 0;
  if (n.status_contrato === "Aguardando assinatura" || n.status_contrato === "Assinado") return 1;
  if (n.status_solicitacao === "Pendente") return 2;
  if (n.status_contrato === "Pago") return 3;
  return 4;
}

/** Data no formato DD/MM/AAAA; para data e hora usa o fuso de São Paulo. */
export function dataLocal(iso: string | null | undefined) {
  if (!iso) return "—";
  if (iso.length <= 10) return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
