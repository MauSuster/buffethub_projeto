import { cn } from "@/lib/cn";
import { partesData } from "@/components/cliente/utilidades";

/** Data em destaque estilo calendário: dia grande, mês e ano. */
export function BlocoData({ iso, apagado = false, compacto = false, className }: {
  iso: string;
  apagado?: boolean;
  compacto?: boolean;
  className?: string;
}) {
  const { dia, mes, ano } = partesData(iso);
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-2xl text-center",
        compacto ? "w-16 py-2" : "w-20 py-3",
        apagado ? "bg-slate-100 text-slate-500" : "bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm shadow-brand-900/20",
        className,
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">{mes}</span>
      <span className={cn("leading-none font-extrabold", compacto ? "text-2xl" : "text-3xl")}>{dia}</span>
      <span className="mt-0.5 text-[11px] font-medium opacity-70">{ano}</span>
    </div>
  );
}
