import type { FiltrosBusca } from "@/models/busca";

export type ParamsBusca = Record<string, string | string[] | undefined>;
export type CampoNumerico = "convidados" | "preco_min" | "preco_max";
export type ValoresNumericos = Record<CampoNumerico, string>;
export type ErrosFiltro = Partial<Record<CampoNumerico | "faixa", string>>;

export const MIN_COMPARAR = 2;
export const MAX_COMPARAR = 4;

const MAX_CONVIDADOS = 100000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function primeiro(valor: string | string[] | undefined) {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return (v ?? "").trim();
}

function texto(valor: string | string[] | undefined) {
  return primeiro(valor).replace(/[{}"\\]/g, "").slice(0, 80) || undefined;
}

function lista(valor: string | string[] | undefined) {
  const itens = (Array.isArray(valor) ? valor : valor ? [valor] : [])
    .map((v) => v.replace(/[{}"\\]/g, "").trim().slice(0, 60))
    .filter(Boolean);
  return [...new Set(itens)].slice(0, 12);
}

/** Aceita "120", "120,50" ou "120.50". */
export function lerValor(textoValor: string) {
  const limpo = textoValor.trim().replace(/^R\$\s*/i, "").replace(",", ".");
  return /^\d{1,7}(\.\d{1,2})?$/.test(limpo) ? Number(limpo) : null;
}

/**
 * UC05 E1 (filtro inválido): convidados é um número inteiro maior que zero e
 * o preço mínimo não pode ser maior que o máximo.
 */
export function validarNumeros(v: ValoresNumericos) {
  const erros: ErrosFiltro = {};
  let convidados: number | undefined;
  let precoMin: number | undefined;
  let precoMax: number | undefined;

  if (v.convidados) {
    const n = Number(v.convidados.replace(",", "."));
    if (!/^-?\d+([.,]\d+)?$/.test(v.convidados)) erros.convidados = "Digite um número de convidados válido.";
    else if (n <= 0) erros.convidados = "O número de convidados deve ser maior que zero.";
    else if (!Number.isInteger(n)) erros.convidados = "Use um número inteiro de convidados.";
    else if (n > MAX_CONVIDADOS) erros.convidados = "Número de convidados muito alto.";
    else convidados = n;
  }
  if (v.preco_min) {
    const n = lerValor(v.preco_min);
    if (n === null) erros.preco_min = "Preço mínimo inválido. Use só números, ex.: 80.";
    else precoMin = n;
  }
  if (v.preco_max) {
    const n = lerValor(v.preco_max);
    if (n === null) erros.preco_max = "Preço máximo inválido. Use só números, ex.: 150.";
    else precoMax = n;
  }
  if (precoMin != null && precoMax != null && precoMin > precoMax) {
    erros.faixa = "O preço mínimo não pode ser maior que o máximo.";
    precoMin = undefined;
    precoMax = undefined;
  }
  return { erros, convidados, precoMin, precoMax };
}

/** Lê os filtros da URL. Valores inválidos ficam de fora da busca e voltam como erro para a tela. */
export function lerFiltros(params: ParamsBusca) {
  const brutos: ValoresNumericos = {
    convidados: primeiro(params.convidados).slice(0, 12),
    preco_min: primeiro(params.preco_min).slice(0, 12),
    preco_max: primeiro(params.preco_max).slice(0, 12),
  };
  const { erros, convidados, precoMin, precoMax } = validarNumeros(brutos);
  const estilos = lista(params.estilo);
  const filtros: FiltrosBusca = {
    q: texto(params.q),
    cidade: texto(params.cidade),
    tipo: texto(params.tipo),
    convidados,
    precoMin,
    precoMax,
    estilos: estilos.length ? estilos : undefined,
  };
  return { filtros, erros, brutos };
}

export function paraQuery(f: FiltrosBusca) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.cidade) p.set("cidade", f.cidade);
  if (f.tipo) p.set("tipo", f.tipo);
  if (f.convidados) p.set("convidados", String(f.convidados));
  if (f.precoMin != null) p.set("preco_min", String(f.precoMin));
  if (f.precoMax != null) p.set("preco_max", String(f.precoMax));
  f.estilos?.forEach((e) => p.append("estilo", e));
  return p.toString();
}

export function hrefBusca(f: FiltrosBusca) {
  const qs = paraQuery(f);
  return qs ? `/?${qs}` : "/";
}

/** Quantos filtros do painel estão ativos (o texto da busca não conta). */
export function contarFiltros(f: FiltrosBusca) {
  return [
    f.tipo,
    f.cidade,
    f.convidados,
    f.precoMin != null || f.precoMax != null,
    f.estilos?.length,
  ].filter(Boolean).length;
}

/** Ids da comparação vindos de ?ids=a,b,c (só UUIDs válidos, sem repetição). */
export function lerIdsComparacao(valor: string | string[] | undefined) {
  const bruto = Array.isArray(valor) ? valor.join(",") : (valor ?? "");
  const ids = bruto
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => UUID.test(s));
  return [...new Set(ids)];
}
