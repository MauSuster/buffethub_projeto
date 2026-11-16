import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Ícone + título + subtítulo no topo dos formulários de conta. */
export function CabecalhoFormulario({
  Icone,
  titulo,
  subtitulo,
  etapa,
  cor = "brand",
}: {
  Icone: LucideIcon;
  titulo: string;
  subtitulo?: React.ReactNode;
  etapa?: string;
  cor?: "brand" | "verde" | "ambar";
}) {
  const cores = {
    brand: "bg-brand-50 text-brand-600 ring-brand-100",
    verde: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    ambar: "bg-amber-50 text-amber-600 ring-amber-100",
  };
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <span className={cn("grid size-12 place-items-center rounded-2xl ring-1 ring-inset", cores[cor])}>
          <Icone className="size-6" />
        </span>
        {etapa && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{etapa}</span>
        )}
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{titulo}</h1>
      {subtitulo && <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitulo}</p>}
    </div>
  );
}
