"use client";

import Link from "next/link";
import { CalendarHeart, HandCoins, LoaderCircle, MapPin, Search, Sparkles, Star, Store } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { useEnviarBusca } from "@/components/busca/enviar-busca";
import { hrefBusca } from "@/components/busca/parametros";
import { cn } from "@/lib/cn";
import { moeda } from "@/lib/formatos";
import type { FiltrosBusca, OpcoesFiltro } from "@/models/busca";

type Props = { filtros: FiltrosBusca; opcoes: OpcoesFiltro; compacto: boolean };

function Segmento({
  id,
  rotulo,
  Icone,
  divisor,
  children,
}: {
  id: string;
  rotulo: string;
  Icone: typeof Search;
  divisor?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex min-w-0 cursor-text items-center gap-3 rounded-xl px-4 py-2.5 transition hover:bg-slate-50 focus-within:bg-slate-50",
        divisor &&
          "md:before:absolute md:before:left-0 md:before:top-1/2 md:before:h-9 md:before:w-px md:before:-translate-y-1/2 md:before:bg-slate-200",
      )}
    >
      <Icone className="size-5 shrink-0 text-brand-500" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{rotulo}</span>
        {children}
      </span>
    </label>
  );
}

const CAMPO = "w-full min-w-0 bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400";

export function HeroBusca({ filtros, opcoes, compacto }: Props) {
  const { enviar, pendente } = useEnviarBusca();
  const tipos = filtros.tipo && !opcoes.tipos.includes(filtros.tipo) ? [...opcoes.tipos, filtros.tipo] : opcoes.tipos;
  const cidades =
    filtros.cidade && !opcoes.cidades.includes(filtros.cidade) ? [...opcoes.cidades, filtros.cidade] : opcoes.cidades;

  return (
    <section className="hero-gradient relative isolate overflow-hidden text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 -z-10 size-96 rounded-full bg-accent-400/25 blur-3xl"
      />
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 sm:px-6",
          compacto ? "py-8 sm:py-10" : "pb-14 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20",
        )}
      >
        {!compacto && (
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-50 ring-1 ring-inset ring-white/20 backdrop-blur">
            <Sparkles className="size-3.5 text-accent-300" />
            Compare preços, cardápios e avaliações em um só lugar
          </p>
        )}
        <h1
          className={cn(
            "max-w-3xl font-extrabold tracking-tight text-balance",
            compacto ? "text-2xl sm:text-3xl" : "text-4xl leading-[1.05] sm:text-5xl lg:text-6xl",
          )}
        >
          {compacto ? (
            "Encontre o buffet ideal para o seu evento"
          ) : (
            <>
              O buffet perfeito para o seu{" "}
              <span className="bg-gradient-to-r from-accent-200 to-accent-400 bg-clip-text text-transparent">
                grande dia
              </span>
            </>
          )}
        </h1>
        {!compacto && (
          <p className="mt-5 max-w-2xl text-base text-brand-100 sm:text-lg">
            Pesquise buffets para casamentos, aniversários, formaturas e eventos corporativos, compare lado a lado e
            peça seu orçamento sem sair de casa.
          </p>
        )}

        <form
          action="/"
          method="get"
          role="search"
          aria-label="Buscar buffets"
          onSubmit={(e) => {
            e.preventDefault();
            enviar(e.currentTarget);
          }}
          className={cn(
            "grid gap-1 rounded-2xl bg-white p-2 text-slate-800 shadow-2xl shadow-brand-950/40 ring-1 ring-white/30 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-0",
            compacto ? "mt-5" : "mt-8",
          )}
        >
          <Segmento id="hero-q" rotulo="O que você procura" Icone={Search}>
            <input
              id="hero-q"
              name="q"
              type="search"
              defaultValue={filtros.q}
              maxLength={80}
              placeholder="Nome do buffet, bairro ou cidade"
              className={CAMPO}
            />
          </Segmento>
          <Segmento id="hero-cidade" rotulo="Cidade" Icone={MapPin} divisor>
            <select id="hero-cidade" name="cidade" defaultValue={filtros.cidade ?? ""} className={cn(CAMPO, "cursor-pointer")}>
              <option value="">Todas as cidades</option>
              {cidades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Segmento>
          <Segmento id="hero-tipo" rotulo="Tipo de evento" Icone={CalendarHeart} divisor>
            <select id="hero-tipo" name="tipo" defaultValue={filtros.tipo ?? ""} className={cn(CAMPO, "cursor-pointer")}>
              <option value="">Qualquer evento</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Segmento>
          {filtros.convidados && <input type="hidden" name="convidados" value={filtros.convidados} />}
          {filtros.precoMin != null && <input type="hidden" name="preco_min" value={filtros.precoMin} />}
          {filtros.precoMax != null && <input type="hidden" name="preco_max" value={filtros.precoMax} />}
          {filtros.estilos?.map((e) => (
            <input key={e} type="hidden" name="estilo" value={e} />
          ))}
          <Botao type="submit" variante="destaque" tamanho="lg" disabled={pendente} className="h-14 md:ml-2 md:px-7">
            {pendente ? <LoaderCircle className="size-5 animate-spin" /> : <Search className="size-5" />}
            {pendente ? "Buscando…" : "Buscar"}
          </Botao>
        </form>

        {!compacto && (
          <>
            {opcoes.tipos.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                <span className="mr-1 text-brand-100/90">Explore por evento:</span>
                {opcoes.tipos.slice(0, 6).map((t) => (
                  <Link
                    key={t}
                    href={hrefBusca({ tipo: t })}
                    scroll={false}
                    className="rounded-full bg-white/10 px-3 py-1 font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur transition hover:bg-white/20"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}
            <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-2 sm:gap-4">
              <Numero Icone={Store} valor={String(opcoes.totalBuffets)} rotulo="buffets cadastrados" />
              <Numero Icone={Star} valor={String(opcoes.totalAvaliacoes)} rotulo="avaliações de clientes" />
              <Numero
                Icone={HandCoins}
                valor={opcoes.precoDe != null ? moeda(opcoes.precoDe).replace(",00", "") : "—"}
                rotulo="menor preço por pessoa"
              />
            </dl>
          </>
        )}
      </div>
    </section>
  );
}

function Numero({ Icone, valor, rotulo }: { Icone: typeof Search; valor: string; rotulo: string }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl bg-white/10 p-3 ring-1 ring-inset ring-white/15 backdrop-blur sm:p-4">
      <dt className="mt-0.5 text-xs leading-tight text-brand-100 sm:text-sm">{rotulo}</dt>
      <dd className="flex items-center gap-2 text-lg font-extrabold tracking-tight sm:text-2xl">
        <Icone className="hidden size-5 text-accent-300 sm:block" aria-hidden />
        {valor}
      </dd>
    </div>
  );
}
