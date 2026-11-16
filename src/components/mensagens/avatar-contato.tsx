import { cn } from "@/lib/cn";
import { iniciais } from "@/lib/formatos";
import type { TipoUsuario } from "@/lib/database.types";

/** Avatar com as iniciais: azul para clientes, âmbar para buffets. */
export function AvatarContato({ nome, tipo, className }: { nome: string; tipo: TipoUsuario; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold shadow-sm",
        tipo === "buffet"
          ? "bg-gradient-to-br from-accent-300 to-accent-500 text-brand-950"
          : "bg-gradient-to-br from-brand-500 to-brand-700 text-white",
        className,
      )}
    >
      {iniciais(nome) || "?"}
    </span>
  );
}
