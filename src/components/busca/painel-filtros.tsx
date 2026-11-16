"use client";

import { useState, type FormEvent } from "react";
import { Check, ChevronDown, LoaderCircle, SlidersHorizontal } from "lucide-react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Entrada, Selecao } from "@/components/ui/campos";
import { useEnviarBusca } from "@/components/busca/enviar-busca";
import {
  contarFiltros,
  validarNumeros,
  type ErrosFiltro,
  type ValoresNumericos,
} from "@/components/busca/parametros";
import { cn } from "@/lib/cn";
import { moeda } from "@/lib/formatos";
import type { FiltrosBusca, OpcoesFiltro } from "@/models/busca";

type Props = {
  filtros: FiltrosBusca;
  brutos: ValoresNumericos;
  erros: ErrosFiltro;
  opcoes: OpcoesFiltro;
};

const ORDEM_CAMPOS = ["convidados", "preco_min", "preco_max"] as const;

function incluir(lista: string[], valor?: string) {
  return valor && !lista.includes(valor) ? [...lista, valor] : lista;
}

function CampoPreco({
  nome,
  rotulo,
  placeholder,
  valor,
  invalido,
}: {
  nome: string;
  rotulo: string;
  placeholder: string;
  valor: string;
  invalido: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-400">
        R$
      </span>
      <input
        id={`filtro-${nome}`}
        name={nome}
        inputMode="decimal"
        autoComplete="off"
        aria-label={rotulo}
        aria-invalid={invalido}
        defaultValue={valor}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border bg-white pl-9 pr-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4",
          invalido
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 focus:border-brand-500 focus:ring-brand-100",
        )}
      />
    </div>
  );
}

export function PainelFiltros({ filtros, brutos, erros: errosIniciais, opcoes }: Props) {
  const { enviar, pendente } = useEnviarBusca();
  const [erros, setErros] = useState<ErrosFiltro>(errosIniciais);
  const [aberto, setAberto] = useState(() => Object.keys(errosIniciais).length > 0);
  const ativos = contarFiltros(filtros);

  const tipos = incluir(opcoes.tipos, filtros.tipo);
  const cidades = incluir(opcoes.cidades, filtros.cidade);
  const estilos = (filtros.estilos ?? []).reduce(incluir, opcoes.estilos);
  const errosPreco = [erros.preco_min, erros.preco_max, erros.faixa].filter(Boolean);

  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const valor = (nome: string) => String(dados.get(nome) ?? "").trim();
    const { erros: novos } = validarNumeros({
      convidados: valor("convidados"),
      preco_min: valor("preco_min"),
      preco_max: valor("preco_max"),
    });
    setErros(novos);
    const primeiroInvalido = ORDEM_CAMPOS.find((c) => novos[c] || (c !== "convidados" && novos.faixa));
    if (primeiroInvalido) {
      form.querySelector<HTMLInputElement>(`[name="${primeiroInvalido}"]`)?.focus();
      return;
    }
    setAberto(false);
    enviar(form);
  }

  return (
    <aside aria-label="Filtros da busca" className="lg:self-start">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="painel-filtros"
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-soft lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-brand-600" />
          Filtros
          {ativos > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
              {ativos}
            </span>
          )}
        </span>
        <ChevronDown className={cn("size-4 text-slate-400 transition", aberto && "rotate-180")} />
      </button>

      <form
        id="painel-filtros"
        action="/"
        method="get"
        noValidate
        onSubmit={aoEnviar}
        className={cn("card mt-3 space-y-5 p-5 lg:mt-0 lg:block", aberto ? "block" : "hidden")}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <SlidersHorizontal className="hidden size-4 text-brand-600 lg:block" />
            Filtros
          </h2>
          {ativos > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {ativos} {ativos === 1 ? "ativo" : "ativos"}
            </span>
          )}
        </div>

        {filtros.q && <input type="hidden" name="q" value={filtros.q} />}

        <Selecao id="filtro-tipo" name="tipo" rotulo="Tipo de evento" defaultValue={filtros.tipo ?? ""}>
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Selecao>

        <Selecao id="filtro-cidade" name="cidade" rotulo="Localização" defaultValue={filtros.cidade ?? ""}>
          <option value="">Todas as cidades</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Selecao>

        <Entrada
          id="filtro-convidados"
          name="convidados"
          rotulo="Nº de convidados"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ex.: 120"
          defaultValue={brutos.convidados}
          erro={erros.convidados}
          dica="Mostra só buffets com capacidade para esse público."
        />

        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 block text-sm font-medium text-slate-700">Faixa de preço por pessoa</legend>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <CampoPreco
              nome="preco_min"
              rotulo="Preço mínimo por pessoa"
              placeholder="mín."
              valor={brutos.preco_min}
              invalido={!!(erros.preco_min || erros.faixa)}
            />
            <span className="text-slate-400">–</span>
            <CampoPreco
              nome="preco_max"
              rotulo="Preço máximo por pessoa"
              placeholder="máx."
              valor={brutos.preco_max}
              invalido={!!(erros.preco_max || erros.faixa)}
            />
          </div>
          {errosPreco.length > 0 ? (
            errosPreco.map((m) => (
              <p key={m} className="text-xs font-medium text-red-600">
                {m}
              </p>
            ))
          ) : opcoes.precoDe != null && opcoes.precoAte != null ? (
            <p className="text-xs text-slate-500">
              Os buffets cobram de {moeda(opcoes.precoDe)} a {moeda(opcoes.precoAte)} por pessoa.
            </p>
          ) : null}
        </fieldset>

        {estilos.length > 0 && (
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-slate-700">Estilo de culinária</legend>
            <div className="flex flex-wrap gap-2">
              {estilos.map((estilo) => (
                <label
                  key={estilo}
                  className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition select-none hover:border-brand-400 has-checked:border-brand-600 has-checked:bg-brand-600 has-checked:text-white has-focus-visible:ring-4 has-focus-visible:ring-brand-100"
                >
                  <input
                    type="checkbox"
                    name="estilo"
                    value={estilo}
                    defaultChecked={filtros.estilos?.includes(estilo)}
                    className="sr-only"
                  />
                  <Check className="hidden size-3.5 group-has-checked:block" strokeWidth={3} />
                  {estilo}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="space-y-2 border-t border-slate-100 pt-5">
          <Botao type="submit" disabled={pendente} className="w-full">
            {pendente && <LoaderCircle className="size-4 animate-spin" />}
            {pendente ? "Aplicando…" : "Aplicar filtros"}
          </Botao>
          <BotaoLink href="/" scroll={false} variante="fantasma" className="w-full">
            Limpar filtros
          </BotaoLink>
        </div>
      </form>
    </aside>
  );
}
