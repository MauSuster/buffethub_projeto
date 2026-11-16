import "server-only";
import { criarClientePublico } from "@/lib/supabase/server";
import type { BuffetBusca, Pacote } from "@/lib/database.types";

export type FiltrosBusca = {
  q?: string;
  cidade?: string;
  tipo?: string;
  convidados?: number;
  precoMin?: number;
  precoMax?: number;
  estilos?: string[];
};

export type OpcoesFiltro = {
  tipos: string[];
  cidades: string[];
  estilos: string[];
  totalBuffets: number;
  totalAvaliacoes: number;
  precoDe: number | null;
  precoAte: number | null;
};

export type PacoteResumo = Pick<Pacote, "id" | "nome" | "preco_por_pessoa">;
export type BuffetComparado = BuffetBusca & { pacotes: PacoteResumo[] };

export type Resultado<T> = { dados: T; erro: string | null };

const ERRO_BUSCA = "Não foi possível carregar os buffets agora. Tente novamente em instantes.";

const PALAVRAS_IGNORADAS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
  "e", "para", "pra", "com", "buffet", "buffets",
]);

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function ordenarPtBr(lista: Iterable<string>) {
  return [...new Set(lista)].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

/**
 * Texto livre da busca (UC04): cada palavra digitada precisa aparecer no nome, endereço (bairro), cidade,
 * descrição, estilo ou tipos de evento do buffet, sem diferenciar maiúsculas e acentos
 * ("buffets em sao paulo" encontra "São Paulo").
 */
function atendeTexto(buffet: BuffetBusca, texto: string) {
  const palavras = semAcento(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p && !PALAVRAS_IGNORADAS.has(p));
  if (palavras.length === 0) return true;
  const alvo = semAcento(
    [
      buffet.nome_fantasia,
      buffet.endereco,
      buffet.cidade,
      buffet.descricao,
      buffet.estilo_culinaria,
      buffet.tipos_evento.join(" "),
    ].join(" "),
  );
  return palavras.every((p) => alvo.includes(p));
}

/** UC04 + UC05: buffets da busca pública com os filtros aplicados. */
export async function buscarBuffets(filtros: FiltrosBusca): Promise<Resultado<BuffetBusca[]>> {
  let consulta = criarClientePublico().from("vw_buffet_busca").select("*");
  if (filtros.cidade) consulta = consulta.eq("cidade", filtros.cidade);
  if (filtros.tipo) consulta = consulta.contains("tipos_evento", [filtros.tipo]);
  if (filtros.convidados) consulta = consulta.gte("capacidade_maxima", filtros.convidados);
  if (filtros.precoMin != null) consulta = consulta.gte("preco_min", filtros.precoMin);
  if (filtros.precoMax != null) consulta = consulta.lte("preco_min", filtros.precoMax);
  if (filtros.estilos?.length) consulta = consulta.in("estilo_culinaria", filtros.estilos);

  const { data, error } = await consulta.order("nome_fantasia");
  if (error) return { dados: [], erro: ERRO_BUSCA };
  const buffets = (data ?? []).map((b) => ({ ...b, tipos_evento: b.tipos_evento ?? [] }));
  return { dados: filtros.q ? buffets.filter((b) => atendeTexto(b, filtros.q!)) : buffets, erro: null };
}

/** Valores dos filtros (tipos de evento, cidades, estilos) e números do topo, tirados dos buffets cadastrados. */
export async function opcoesFiltro(): Promise<Resultado<OpcoesFiltro>> {
  const { data, error } = await criarClientePublico()
    .from("vw_buffet_busca")
    .select("cidade, estilo_culinaria, tipos_evento, preco_min, total_avaliacoes");
  const linhas = data ?? [];
  const precos = linhas.map((l) => l.preco_min).filter((p): p is number => p != null).map(Number);
  return {
    dados: {
      tipos: ordenarPtBr(linhas.flatMap((l) => l.tipos_evento ?? [])),
      cidades: ordenarPtBr(linhas.map((l) => l.cidade ?? "")),
      estilos: ordenarPtBr(linhas.map((l) => l.estilo_culinaria ?? "")),
      totalBuffets: linhas.length,
      totalAvaliacoes: linhas.reduce((t, l) => t + (l.total_avaliacoes ?? 0), 0),
      precoDe: precos.length ? Math.min(...precos) : null,
      precoAte: precos.length ? Math.max(...precos) : null,
    },
    erro: error ? ERRO_BUSCA : null,
  };
}

/** UC06: buffets escolhidos, na mesma ordem dos ids, com os pacotes ativos de cada um. */
export async function buscarParaComparar(ids: string[]): Promise<Resultado<BuffetComparado[]>> {
  const sb = criarClientePublico();
  const [buffets, pacotes] = await Promise.all([
    sb.from("vw_buffet_busca").select("*").in("id", ids),
    sb
      .from("pacote")
      .select("id, nome, preco_por_pessoa, buffet_id")
      .in("buffet_id", ids)
      .eq("ativo", true)
      .order("preco_por_pessoa"),
  ]);
  if (buffets.error || pacotes.error) return { dados: [], erro: ERRO_BUSCA };

  const porId = new Map((buffets.data ?? []).map((b) => [b.id, b]));
  const dados = ids
    .map((id) => porId.get(id))
    .filter((b): b is BuffetBusca => !!b)
    .map((b) => ({
      ...b,
      tipos_evento: b.tipos_evento ?? [],
      pacotes: (pacotes.data ?? [])
        .filter((p) => p.buffet_id === b.id)
        .map(({ id, nome, preco_por_pessoa }) => ({ id, nome, preco_por_pessoa: Number(preco_por_pessoa) })),
    }));
  return { dados, erro: null };
}
