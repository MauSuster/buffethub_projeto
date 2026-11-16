import { Sparkles } from "lucide-react";
import { Estrelas } from "@/components/ui/basicos";
import { cn } from "@/lib/cn";

/** "Rua X, 100 - Vila Mariana" → "Vila Mariana" */
export function bairroDe(endereco: string | null) {
  if (!endereco) return null;
  const partes = endereco.split(" - ");
  return partes.length > 1 ? partes[partes.length - 1].trim() : null;
}

export function localizacao(endereco: string | null, cidade: string | null) {
  return [bairroDe(endereco), cidade].filter(Boolean).join(", ") || "Localização não informada";
}

/** "Decoração, DJ, garçons" → ["Decoração", "DJ", "Garçons"] */
export function listaServicos(servicos: string | null) {
  return (servicos ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export function formatarNota(nota: number) {
  return Number(nota).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function NotaBuffet({
  nota,
  total,
  className,
}: {
  nota: number | null;
  total: number;
  className?: string;
}) {
  if (nota == null || total === 0) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-sm text-slate-500", className)}>
        <Sparkles className="size-4 text-accent-500" />
        Novo · ainda sem avaliações
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm", className)}>
      <Estrelas nota={Number(nota)} />
      <strong className="font-bold text-slate-900">{formatarNota(nota)}</strong>
      <span className="text-slate-500">
        ({total} {total === 1 ? "avaliação" : "avaliações"})
      </span>
    </span>
  );
}
