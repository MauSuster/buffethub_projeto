import type { Mensagem, TipoUsuario } from "@/lib/database.types";

export const LIMITE_MENSAGEM = 2000;

export type Contato = { id: string; nome: string; tipo: TipoUsuario };

/** Mensagem na tela: as que ainda estão indo para o servidor (envio otimista) ou que falharam ganham um estado. */
export type ItemMensagem = Mensagem & { estado?: "enviando" | "erro"; erro?: string };

export type ResultadoEnvio = { ok: true; mensagem: Mensagem } | { ok: false; erro: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idValido(id: unknown): id is string {
  return typeof id === "string" && UUID.test(id);
}
