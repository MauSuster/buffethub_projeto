import { CalendarCheck, FileSignature, Search, Sparkles, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/cn";

type Destaque = { Icone: LucideIcon; titulo: string; texto: string };

const DESTAQUES_PADRAO: Destaque[] = [
  { Icone: Search, titulo: "Busque e compare", texto: "Preço por pessoa, capacidade, cardápio e avaliações lado a lado." },
  { Icone: FileSignature, titulo: "Proposta e contrato on-line", texto: "Peça orçamento, aceite a proposta e assine sem sair de casa." },
  { Icone: CalendarCheck, titulo: "Data garantida", texto: "O pagamento confirma a reserva no calendário do buffet." },
];

/** Telas de conta (T1.0, T2.0, T3.0): painel com a proposta do produto + formulário. No celular só o formulário. */
export function LayoutAutenticacao({
  titulo,
  texto,
  destaques = DESTAQUES_PADRAO,
  largo = false,
  children,
}: {
  titulo: string;
  texto: string;
  destaques?: Destaque[];
  largo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-14">
      <div
        className={cn(
          "mx-auto grid overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white shadow-lift",
          largo ? "max-w-6xl lg:grid-cols-[5fr_7fr]" : "max-w-5xl lg:grid-cols-2",
        )}
      >
        <aside className="hero-gradient relative hidden flex-col justify-between gap-10 overflow-hidden p-10 text-white lg:flex xl:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-accent-400/25 blur-3xl" />

          <div className="relative">
            <Logo claro />
            <span className="mt-10 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-50 ring-1 ring-white/20 backdrop-blur">
              <Sparkles className="size-3.5 text-accent-300" />
              Marketplace de buffets
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">{titulo}</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-brand-100">{texto}</p>
          </div>

          <ul className="relative space-y-5">
            {destaques.map(({ Icone, titulo: t, texto: d }) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                  <Icone className="size-5 text-accent-300" />
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-brand-100">{d}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="relative rounded-2xl bg-white/10 px-5 py-4 text-sm font-medium text-brand-50 ring-1 ring-white/15 backdrop-blur">
            “Encontre, compare e contrate o buffet ideal para o seu evento — tudo em um só lugar.”
          </p>
        </aside>

        <div className="px-5 py-8 sm:px-10 sm:py-12 xl:px-14">{children}</div>
      </div>
    </div>
  );
}
