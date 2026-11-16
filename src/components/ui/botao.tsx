"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

type Variante = "primario" | "secundario" | "destaque" | "fantasma" | "perigo";
type Tamanho = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-brand-600 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700",
  secundario: "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
  destaque: "bg-accent-400 text-brand-950 shadow-sm shadow-accent-600/30 hover:bg-accent-300",
  fantasma: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  perigo: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
};
const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-6 text-base",
};

export function classesBotao(variante: Variante = "primario", tamanho: Tamanho = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    VARIANTES[variante],
    TAMANHOS[tamanho],
    extra,
  );
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: Tamanho };

export function Botao({ variante, tamanho, className, ...props }: Props) {
  return <button className={classesBotao(variante, tamanho, className)} {...props} />;
}

type PropsLink = React.ComponentProps<typeof Link> & { variante?: Variante; tamanho?: Tamanho };

/** Link com aparência de botão. */
export function BotaoLink({ variante, tamanho, className, ...props }: PropsLink) {
  return <Link className={classesBotao(variante, tamanho, className)} {...props} />;
}

/** Botão de envio de formulário: mostra "carregando" e fica desabilitado enquanto a Server Action roda. */
export function BotaoEnviar({ children, textoEnviando, disabled, ...props }: Props & { textoEnviando?: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending || disabled} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && textoEnviando ? textoEnviando : children}
    </Botao>
  );
}
