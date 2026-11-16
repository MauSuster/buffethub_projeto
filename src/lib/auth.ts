import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { TipoUsuario } from "@/lib/database.types";

export type Sessao = {
  id: string;
  email: string;
  tipo: TipoUsuario;
  nome: string;
  /** Nome mostrado no topo: nome fantasia para buffet, primeiro nome para cliente. */
  nomeExibicao: string;
};

/** Usuário logado (ou null). Pode ser chamado várias vezes na mesma requisição: o resultado é reaproveitado. */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: usuario } = await supabase
    .from("usuario")
    .select("id, tipo, nome, email")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!usuario) return null;
  let nomeExibicao = usuario.nome.split(" ")[0];
  if (usuario.tipo === "buffet") {
    const { data: buffet } = await supabase
      .from("buffet")
      .select("nome_fantasia")
      .eq("usuario_id", usuario.id)
      .maybeSingle();
    nomeExibicao = buffet?.nome_fantasia ?? usuario.nome;
  }
  return { id: usuario.id, email: usuario.email, tipo: usuario.tipo, nome: usuario.nome, nomeExibicao };
});

/** Página inicial de cada tipo de usuário depois do login. */
export function areaInicial(tipo: TipoUsuario) {
  return tipo === "buffet" ? "/anfitriao" : "/cliente";
}

/** Exige cliente logado; senão manda para o login (ou para o painel do anfitrião, se for buffet). */
export async function exigirCliente(voltarPara = "/cliente"): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect(`/login?next=${encodeURIComponent(voltarPara)}`);
  if (sessao.tipo !== "cliente") redirect("/anfitriao");
  return sessao;
}

/** Exige buffet logado; senão manda para o login (ou para a área do cliente). */
export async function exigirBuffet(voltarPara = "/anfitriao"): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect(`/login?next=${encodeURIComponent(voltarPara)}`);
  if (sessao.tipo !== "buffet") redirect("/cliente");
  return sessao;
}
