import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function Secao({
  id,
  titulo,
  subtitulo,
  Icone,
  acao,
  className,
  children,
}: {
  id: string;
  titulo: string;
  subtitulo?: string;
  Icone: LucideIcon;
  acao?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={cn("card scroll-mt-24 p-5 sm:p-7", className)}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icone className="size-5" />
          </span>
          <div>
            <h2 id={`${id}-titulo`} className="text-lg font-bold tracking-tight text-slate-900">
              {titulo}
            </h2>
            {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
          </div>
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}

/** Divide um texto separado por vírgulas ("Decoração, DJ, garçons") em itens com a primeira letra maiúscula. */
export function separarItens(texto: string | null | undefined) {
  if (!texto) return [];
  const vistos = new Set<string>();
  return texto
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .filter((t) => {
      const chave = t.toLowerCase();
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
}

export function formatarNota(nota: number) {
  return nota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
