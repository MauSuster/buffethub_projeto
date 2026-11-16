import { useSyncExternalStore } from "react";
import { MAX_COMPARAR } from "@/components/busca/parametros";

export type ItemComparacao = { id: string; nome: string; capa_url: string | null };

const CHAVE = "buffethub:comparacao";
const CHAVE_BUSCA = "buffethub:ultima-busca";
const VAZIA: ItemComparacao[] = [];
const ouvintes = new Set<() => void>();

let bruto: string | null | undefined;
let atual: ItemComparacao[] = VAZIA;
let somenteMemoria = false;

function itemValido(x: unknown): x is ItemComparacao {
  if (!x || typeof x !== "object") return false;
  const item = x as Partial<ItemComparacao>;
  return typeof item.id === "string" && typeof item.nome === "string";
}

function ler(): ItemComparacao[] {
  if (somenteMemoria) return atual;
  let texto: string | null;
  try {
    texto = window.localStorage.getItem(CHAVE);
  } catch {
    somenteMemoria = true;
    return atual;
  }
  if (texto === bruto) return atual;
  bruto = texto;
  try {
    const lista: unknown = JSON.parse(texto ?? "[]");
    atual = Array.isArray(lista) ? lista.filter(itemValido).slice(0, MAX_COMPARAR) : VAZIA;
  } catch {
    atual = VAZIA;
  }
  return atual;
}

function gravar(lista: ItemComparacao[]) {
  atual = lista;
  bruto = JSON.stringify(lista);
  try {
    window.localStorage.setItem(CHAVE, bruto);
  } catch {
    somenteMemoria = true;
  }
  ouvintes.forEach((avisar) => avisar());
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  const outraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) avisar();
  };
  window.addEventListener("storage", outraAba);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("storage", outraAba);
  };
}

const listaServidor = () => VAZIA;

/** Marca ou desmarca um buffet. Devolve false quando já há 4 marcados. */
export function alternarComparacao(item: ItemComparacao) {
  const lista = ler();
  if (lista.some((i) => i.id === item.id)) {
    gravar(lista.filter((i) => i.id !== item.id));
    return true;
  }
  if (lista.length >= MAX_COMPARAR) return false;
  gravar([...lista, item]);
  return true;
}

export function removerDaComparacao(id: string) {
  gravar(ler().filter((i) => i.id !== id));
}

export function limparComparacao() {
  gravar(VAZIA);
}

/** Usa a seleção mostrada na tela de comparação (ex.: link compartilhado). */
export function definirComparacao(itens: ItemComparacao[]) {
  const lista = ler();
  const iguais =
    lista.length === itens.length &&
    lista.every((i, n) => i.id === itens[n].id && i.nome === itens[n].nome && i.capa_url === itens[n].capa_url);
  if (!iguais) gravar(itens.slice(0, MAX_COMPARAR));
}

/** Buffets marcados para comparar (guardados no navegador). */
export function useComparacao() {
  const itens = useSyncExternalStore(assinar, ler, listaServidor);
  return { itens, cheia: itens.length >= MAX_COMPARAR };
}

export function lembrarBusca(consulta: string) {
  try {
    window.sessionStorage.setItem(CHAVE_BUSCA, consulta);
  } catch {}
}

function hrefUltimaBusca() {
  try {
    const consulta = window.sessionStorage.getItem(CHAVE_BUSCA);
    return consulta ? `/?${consulta}` : "/";
  } catch {
    return "/";
  }
}

const semAssinatura = () => () => {};
const hrefServidor = () => "/";

/** Endereço da última busca feita nesta aba, para o "Voltar à busca" manter os filtros. */
export function useHrefUltimaBusca() {
  return useSyncExternalStore(semAssinatura, hrefUltimaBusca, hrefServidor);
}
