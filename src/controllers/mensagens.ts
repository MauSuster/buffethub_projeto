"use server";

import { obterSessao } from "@/lib/auth";
import { traduzirErro } from "@/lib/acoes";
import { inserirMensagem, marcarMensagensLidas, marcarNotificacoesDaConversa } from "@/models/mensagens";
import { LIMITE_MENSAGEM, idValido, type ResultadoEnvio } from "@/components/mensagens/tipos";

/** UC03: envia uma mensagem para o outro usuário (cliente ↔ buffet). */
export async function enviarMensagem(destinatarioId: string, conteudo: string): Promise<ResultadoEnvio> {
  const sessao = await obterSessao();
  if (!sessao) return { ok: false, erro: "Sua sessão expirou. Entre novamente." };

  const texto = typeof conteudo === "string" ? conteudo.trim() : "";
  if (!texto) return { ok: false, erro: "A mensagem não pode ficar em branco." };
  if (texto.length > LIMITE_MENSAGEM) {
    return { ok: false, erro: `A mensagem pode ter no máximo ${LIMITE_MENSAGEM} caracteres.` };
  }
  if (!idValido(destinatarioId) || destinatarioId === sessao.id) {
    return { ok: false, erro: "Conversa inválida." };
  }

  const { data, error } = await inserirMensagem(sessao.id, destinatarioId, texto);
  if (error || !data) {
    // O RLS (pode_conversar) barra o envio: cliente só fala com buffet; buffet só com quem já pediu orçamento a ele.
    if (error?.code === "42501" || /row-level security/i.test(error?.message ?? "")) {
      return {
        ok: false,
        erro:
          sessao.tipo === "buffet"
            ? "Você só pode enviar mensagens para clientes que já pediram orçamento ao seu buffet."
            : "Não é possível enviar mensagens para este usuário.",
      };
    }
    return { ok: false, erro: traduzirErro(error, "A mensagem não foi enviada. Tente novamente.") };
  }
  return { ok: true, mensagem: data };
}

/** Marca como lidas as mensagens recebidas do outro usuário e os avisos dessa conversa. */
export async function marcarConversaLida(outroId: string): Promise<boolean> {
  const sessao = await obterSessao();
  if (!sessao || !idValido(outroId)) return false;
  const [mensagens, avisos] = await Promise.all([
    marcarMensagensLidas(outroId),
    marcarNotificacoesDaConversa(sessao.id, outroId),
  ]);
  return !mensagens.error && !avisos.error;
}
