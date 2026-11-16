import "server-only";
import { cache } from "react";
import { criarClientePublico, criarClienteServidor } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/formatos";
import type { Avaliacao, BuffetBusca, Evento, MidiaPortfolio, Pacote, StatusData } from "@/lib/database.types";

export type DataIndisponivel = { data: string; status: Exclude<StatusData, "Livre"> };

export type PerfilBuffet = {
  buffet: BuffetBusca;
  midias: MidiaPortfolio[];
  pacotes: Pacote[];
  avaliacoes: Avaliacao[];
  indisponiveis: DataIndisponivel[];
};

export type ResultadoPerfil =
  | { situacao: "ok"; perfil: PerfilBuffet }
  | { situacao: "nao-encontrado" }
  | { situacao: "erro" };

export type EventoReutilizavel = Evento & { jaSolicitado: boolean };

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idValido(id: string) {
  return FORMATO_UUID.test(id);
}

/** UC07: perfil público do buffet (dados, portfólio, pacotes ativos, avaliações e datas ocupadas a partir de hoje). */
export const buscarPerfilBuffet = cache(async (id: string): Promise<ResultadoPerfil> => {
  if (!idValido(id)) return { situacao: "nao-encontrado" };
  const sb = criarClientePublico();
  const [buffet, midias, pacotes, avaliacoes, datas] = await Promise.all([
    sb.from("vw_buffet_busca").select("*").eq("id", id).maybeSingle(),
    sb.from("midia_portfolio").select("*").eq("buffet_id", id).order("criada_em"),
    sb.from("pacote").select("*").eq("buffet_id", id).eq("ativo", true).order("preco_por_pessoa"),
    sb.from("avaliacao").select("*").eq("buffet_id", id).order("data", { ascending: false }),
    sb.from("disponibilidade").select("data, status").eq("buffet_id", id).neq("status", "Livre").gte("data", hojeISO()).order("data"),
  ]);
  if (buffet.error || midias.error || pacotes.error || avaliacoes.error || datas.error) return { situacao: "erro" };
  if (!buffet.data) return { situacao: "nao-encontrado" };
  return {
    situacao: "ok",
    perfil: {
      buffet: buffet.data,
      midias: midias.data,
      pacotes: pacotes.data,
      avaliacoes: avaliacoes.data,
      indisponiveis: datas.data as DataIndisponivel[],
    },
  };
});

/**
 * UC09 A1: eventos futuros do cliente que podem ser reaproveitados no pedido.
 * Marca os que já têm solicitação ativa para este buffet, porque o banco recusa pedido repetido.
 */
export async function listarEventosReutilizaveis(clienteId: string, buffetId: string): Promise<EventoReutilizavel[]> {
  const sb = await criarClienteServidor();
  const { data: eventos } = await sb
    .from("evento")
    .select("*")
    .eq("cliente_id", clienteId)
    .gt("data", hojeISO())
    .order("data");
  if (!eventos?.length) return [];
  const { data: pedidos } = await sb
    .from("solicitacao_orcamento")
    .select("evento_id")
    .eq("buffet_id", buffetId)
    .neq("status", "Cancelada")
    .in("evento_id", eventos.map((e) => e.id));
  const jaPedidos = new Set((pedidos ?? []).map((p) => p.evento_id));
  return eventos.map((e) => ({ ...e, jaSolicitado: jaPedidos.has(e.id) }));
}
