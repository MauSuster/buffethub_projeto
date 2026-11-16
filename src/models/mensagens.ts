import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/acoes";
import type { Conversa, Mensagem, Notificacao } from "@/lib/database.types";
import type { Contato } from "@/components/mensagens/tipos";

/** Conversas do usuário logado (uma por pessoa), da mais recente para a mais antiga. */
export async function listarConversas(): Promise<Conversa[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("minhas_conversas");
  if (error) throw new Error(traduzirErro(error, "Não foi possível carregar suas conversas."));
  return data ?? [];
}

/** Últimas mensagens trocadas entre os dois usuários, em ordem de envio. */
export async function listarMensagens(meuId: string, outroId: string, limite = 300): Promise<Mensagem[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("mensagem")
    .select("*")
    .or(
      `and(remetente_id.eq.${meuId},destinatario_id.eq.${outroId}),and(remetente_id.eq.${outroId},destinatario_id.eq.${meuId})`,
    )
    .order("data_envio", { ascending: false })
    .limit(limite);
  if (error) throw new Error(traduzirErro(error, "Não foi possível carregar as mensagens."));
  return (data ?? []).reverse();
}

/** Nome e tipo de quem está do outro lado. Buffets são públicos; clientes só aparecem para quem já negocia ou conversa com eles. */
export async function buscarContato(id: string): Promise<Contato | null> {
  const supabase = await criarClienteServidor();
  const { data: buffet } = await supabase
    .from("buffet")
    .select("usuario_id, nome_fantasia")
    .eq("usuario_id", id)
    .maybeSingle();
  if (buffet) return { id, nome: buffet.nome_fantasia, tipo: "buffet" };
  const { data: usuario } = await supabase.from("usuario").select("id, nome, tipo").eq("id", id).maybeSingle();
  if (usuario) return { id, nome: usuario.nome, tipo: usuario.tipo };
  return null;
}

export async function inserirMensagem(remetenteId: string, destinatarioId: string, conteudo: string) {
  const supabase = await criarClienteServidor();
  return supabase
    .from("mensagem")
    .insert({ remetente_id: remetenteId, destinatario_id: destinatarioId, conteudo })
    .select("*")
    .single();
}

export async function marcarMensagensLidas(outroId: string) {
  const supabase = await criarClienteServidor();
  return supabase.rpc("marcar_mensagens_lidas", { p_outro: outroId });
}

/** Ao abrir a conversa, o aviso "Nova mensagem de ..." daquela pessoa deixa de contar como não lido. */
export async function marcarNotificacoesDaConversa(usuarioId: string, outroId: string) {
  const supabase = await criarClienteServidor();
  return supabase
    .from("notificacao")
    .update({ lida: true })
    .eq("usuario_id", usuarioId)
    .eq("lida", false)
    .like("link", `%/mensagens?com=${outroId}`);
}

export async function listarNotificacoes(usuarioId: string, limite = 10) {
  const supabase = await criarClienteServidor();
  const [lista, contagem] = await Promise.all([
    supabase
      .from("notificacao")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("criada_em", { ascending: false })
      .limit(limite),
    supabase
      .from("notificacao")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuarioId)
      .eq("lida", false),
  ]);
  if (lista.error) throw new Error(traduzirErro(lista.error, "Não foi possível carregar as notificações."));
  const itens: Notificacao[] = lista.data ?? [];
  return { itens, naoLidas: contagem.count ?? itens.filter((n) => !n.lida).length };
}

export async function marcarNotificacaoLida(usuarioId: string, notificacaoId: string) {
  const supabase = await criarClienteServidor();
  return supabase.from("notificacao").update({ lida: true }).eq("id", notificacaoId).eq("usuario_id", usuarioId);
}

export async function marcarTodasNotificacoesLidas(usuarioId: string) {
  const supabase = await criarClienteServidor();
  return supabase.from("notificacao").update({ lida: true }).eq("usuario_id", usuarioId).eq("lida", false);
}
