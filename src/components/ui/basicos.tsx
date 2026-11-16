import { AlertCircle, CheckCircle2, Info, Star, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { iniciais } from "@/lib/formatos";
import type { EstadoAcao } from "@/lib/acoes";

/** Caixa branca com borda e sombra suave. */
export function Cartao({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

/** Título de página com subtítulo e ações à direita. */
export function TituloPagina({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: string; acoes?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

const CORES_SELO = {
  cinza: "bg-slate-100 text-slate-700 ring-slate-200",
  azul: "bg-brand-50 text-brand-700 ring-brand-200",
  verde: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amarelo: "bg-amber-50 text-amber-800 ring-amber-200",
  vermelho: "bg-red-50 text-red-700 ring-red-200",
  roxo: "bg-violet-50 text-violet-700 ring-violet-200",
};
export type CorSelo = keyof typeof CORES_SELO;

export function Selo({ cor = "cinza", className, children }: { cor?: CorSelo; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", CORES_SELO[cor], className)}>
      {children}
    </span>
  );
}

/** Cor padrão de cada status do sistema (solicitação, proposta, contrato, pagamento, data). */
const COR_STATUS: Record<string, CorSelo> = {
  Pendente: "amarelo",
  Respondida: "azul",
  Cancelada: "cinza",
  Aceita: "verde",
  Recusada: "vermelho",
  Expirada: "cinza",
  "Aguardando assinatura": "amarelo",
  Assinado: "azul",
  Pago: "verde",
  Concluído: "roxo",
  Aprovado: "verde",
  Recusado: "vermelho",
  Estornado: "cinza",
  Livre: "verde",
  Bloqueada: "cinza",
  Reservada: "azul",
};

export function SeloStatus({ status }: { status: string }) {
  return <Selo cor={COR_STATUS[status] ?? "cinza"}>{status}</Selo>;
}

const ESTILO_ALERTA: Record<string, { classe: string; Icone: LucideIcon }> = {
  info: { classe: "border-brand-200 bg-brand-50 text-brand-800", Icone: Info },
  sucesso: { classe: "border-emerald-200 bg-emerald-50 text-emerald-800", Icone: CheckCircle2 },
  erro: { classe: "border-red-200 bg-red-50 text-red-700", Icone: AlertCircle },
  aviso: { classe: "border-amber-200 bg-amber-50 text-amber-800", Icone: TriangleAlert },
};

export function Alerta({ tipo = "info", titulo, children, className }: {
  tipo?: "info" | "sucesso" | "erro" | "aviso";
  titulo?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { classe, Icone } = ESTILO_ALERTA[tipo];
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", classe, className)}>
      <Icone className="mt-0.5 size-4 shrink-0" />
      <div>
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children}
      </div>
    </div>
  );
}

/** Mostra a mensagem geral de uma Server Action (sucesso ou erro). */
export function MensagemAcao({ estado, className }: { estado: EstadoAcao; className?: string }) {
  if (!estado.mensagem) return null;
  return (
    <Alerta tipo={estado.ok ? "sucesso" : "erro"} className={className}>
      {estado.mensagem}
    </Alerta>
  );
}

/** Estado vazio: ícone, título, texto e uma ação opcional. */
export function Vazio({ Icone = Info, titulo, texto, acao }: {
  Icone?: LucideIcon;
  titulo: string;
  texto?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icone className="size-6" />
      </div>
      <p className="font-semibold text-slate-800">{titulo}</p>
      {texto && <p className="mt-1 max-w-md text-sm text-slate-500">{texto}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

/** Nota em estrelas (somente leitura). */
export function Estrelas({ nota, tamanho = "sm" }: { nota: number; tamanho?: "sm" | "md" }) {
  const classe = tamanho === "md" ? "size-5" : "size-4";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(classe, i <= Math.round(nota) ? "fill-accent-400 text-accent-400" : "fill-slate-200 text-slate-200")} />
      ))}
    </span>
  );
}

export function Avatar({ nome, className }: { nome: string; className?: string }) {
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white", className)}>
      {iniciais(nome)}
    </span>
  );
}

/** Imagem com fundo degradê quando não há foto. */
export function Foto({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (!src) {
    return <div className={cn("bg-gradient-to-br from-brand-200 via-brand-100 to-accent-100", className)} aria-label={alt} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn("object-cover", className)} loading="lazy" />;
}
