import Link from "next/link";
import { X } from "lucide-react";
import { hrefBusca } from "@/components/busca/parametros";
import { moeda } from "@/lib/formatos";
import type { FiltrosBusca } from "@/models/busca";

function faixaPreco(min?: number, max?: number) {
  if (min != null && max != null) return `${moeda(min)} a ${moeda(max)} por pessoa`;
  if (min != null) return `A partir de ${moeda(min)} por pessoa`;
  return `Até ${moeda(max)} por pessoa`;
}

/** Filtros aplicados em forma de "chips"; cada um tem um X que remove só aquele filtro. */
export function FiltrosAtivos({ filtros }: { filtros: FiltrosBusca }) {
  const chips: { chave: string; rotulo: string; href: string }[] = [];
  if (filtros.q) chips.push({ chave: "q", rotulo: `“${filtros.q}”`, href: hrefBusca({ ...filtros, q: undefined }) });
  if (filtros.tipo) chips.push({ chave: "tipo", rotulo: filtros.tipo, href: hrefBusca({ ...filtros, tipo: undefined }) });
  if (filtros.cidade)
    chips.push({ chave: "cidade", rotulo: filtros.cidade, href: hrefBusca({ ...filtros, cidade: undefined }) });
  if (filtros.convidados)
    chips.push({
      chave: "convidados",
      rotulo: `${filtros.convidados} convidados ou mais`,
      href: hrefBusca({ ...filtros, convidados: undefined }),
    });
  if (filtros.precoMin != null || filtros.precoMax != null)
    chips.push({
      chave: "preco",
      rotulo: faixaPreco(filtros.precoMin, filtros.precoMax),
      href: hrefBusca({ ...filtros, precoMin: undefined, precoMax: undefined }),
    });
  filtros.estilos?.forEach((estilo) =>
    chips.push({
      chave: `estilo-${estilo}`,
      rotulo: `Culinária ${estilo.toLowerCase()}`,
      href: hrefBusca({ ...filtros, estilos: filtros.estilos?.filter((e) => e !== estilo) }),
    }),
  );
  if (chips.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link
          key={c.chave}
          href={c.href}
          scroll={false}
          aria-label={`Remover filtro: ${c.rotulo}`}
          className="group inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pl-3 pr-1.5 text-sm font-medium text-brand-800 transition hover:border-brand-300 hover:bg-brand-100"
        >
          {c.rotulo}
          <span className="grid size-5 place-items-center rounded-full text-brand-500 transition group-hover:bg-white group-hover:text-brand-700">
            <X className="size-3.5" />
          </span>
        </Link>
      ))}
      {chips.length > 1 && (
        <Link href="/" scroll={false} className="px-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
          Limpar tudo
        </Link>
      )}
    </div>
  );
}
