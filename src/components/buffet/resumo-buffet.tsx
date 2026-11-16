import Link from "next/link";
import { ArrowLeft, ChefHat, MapPin, Users } from "lucide-react";
import { Estrelas, Foto } from "@/components/ui/basicos";
import { formatarNota } from "@/components/buffet/secao";
import { moeda } from "@/lib/formatos";
import type { BuffetBusca } from "@/lib/database.types";

export function ResumoBuffet({ buffet }: { buffet: BuffetBusca }) {
  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <Foto src={buffet.capa_url} alt={buffet.nome_fantasia} className="aspect-[16/10] w-full" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          Orçamento para
        </span>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{buffet.nome_fantasia}</h2>
          {buffet.nota_media != null ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <Estrelas nota={buffet.nota_media} />
              <b className="text-slate-900">{formatarNota(buffet.nota_media)}</b>
              <span>({buffet.total_avaliacoes})</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Ainda sem avaliações</p>
          )}
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {buffet.cidade && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-slate-400" /> {buffet.cidade}
            </li>
          )}
          {buffet.capacidade_maxima != null && (
            <li className="flex items-center gap-2">
              <Users className="size-4 shrink-0 text-slate-400" /> Até {buffet.capacidade_maxima} convidados
            </li>
          )}
          {buffet.estilo_culinaria && (
            <li className="flex items-center gap-2">
              <ChefHat className="size-4 shrink-0 text-slate-400" /> Culinária {buffet.estilo_culinaria.toLowerCase()}
            </li>
          )}
        </ul>
        {buffet.preco_min != null && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            A partir de <b className="text-base">{moeda(buffet.preco_min)}</b> por pessoa
          </p>
        )}
        <Link href={`/buffet/${buffet.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="size-4" /> Voltar ao perfil
        </Link>
      </div>
    </div>
  );
}
