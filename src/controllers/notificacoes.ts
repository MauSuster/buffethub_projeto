"use server";

import { obterSessao } from "@/lib/auth";
import {
  listarNotificacoes,
  marcarNotificacaoLida as marcarLida,
  marcarTodasNotificacoesLidas as marcarTodas,
} from "@/models/mensagens";
import { idValido } from "@/components/mensagens/tipos";
import type { Notificacao } from "@/lib/database.types";

export type ResumoNotificacoes = { itens: Notificacao[]; naoLidas: number };

/** Últimos avisos do usuário logado (RNF29) e quantos ainda não foram lidos. */
export async function carregarNotificacoes(): Promise<ResumoNotificacoes | null> {
  const sessao = await obterSessao();
  if (!sessao) return null;
  try {
    return await listarNotificacoes(sessao.id, 10);
  } catch {
    return null;
  }
}

export async function marcarNotificacaoLida(id: string): Promise<boolean> {
  const sessao = await obterSessao();
  if (!sessao || !idValido(id)) return false;
  const { error } = await marcarLida(sessao.id, id);
  return !error;
}

export async function marcarTodasNotificacoesLidas(): Promise<boolean> {
  const sessao = await obterSessao();
  if (!sessao) return false;
  const { error } = await marcarTodas(sessao.id);
  return !error;
}
