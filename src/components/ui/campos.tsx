import { cn } from "@/lib/cn";

const BASE =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4 disabled:bg-slate-100 disabled:text-slate-500";
const OK = "border-slate-300 focus:border-brand-500 focus:ring-brand-100";
const ERRO = "border-red-400 focus:border-red-500 focus:ring-red-100";

type Comum = { rotulo?: string; erro?: string; dica?: string; classeContainer?: string };

function Envolvedor({ id, rotulo, erro, dica, classeContainer, obrigatorio, children }: Comum & {
  id: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", classeContainer)}>
      {rotulo && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {rotulo}
          {obrigatorio && <span className="text-red-500"> *</span>}
        </label>
      )}
      {children}
      {erro ? (
        <p className="text-xs font-medium text-red-600">{erro}</p>
      ) : dica ? (
        <p className="text-xs text-slate-500">{dica}</p>
      ) : null}
    </div>
  );
}

type PropsEntrada = React.InputHTMLAttributes<HTMLInputElement> & Comum;

export function Entrada({ rotulo, erro, dica, classeContainer, className, id, name, ...props }: PropsEntrada) {
  const ident = id ?? name ?? "";
  return (
    <Envolvedor id={ident} rotulo={rotulo} erro={erro} dica={dica} classeContainer={classeContainer} obrigatorio={props.required}>
      <input id={ident} name={name} aria-invalid={!!erro} className={cn(BASE, "h-11", erro ? ERRO : OK, className)} {...props} />
    </Envolvedor>
  );
}

type PropsSelecao = React.SelectHTMLAttributes<HTMLSelectElement> & Comum;

export function Selecao({ rotulo, erro, dica, classeContainer, className, id, name, children, ...props }: PropsSelecao) {
  const ident = id ?? name ?? "";
  return (
    <Envolvedor id={ident} rotulo={rotulo} erro={erro} dica={dica} classeContainer={classeContainer} obrigatorio={props.required}>
      <select id={ident} name={name} aria-invalid={!!erro} className={cn(BASE, "h-11 pr-8", erro ? ERRO : OK, className)} {...props}>
        {children}
      </select>
    </Envolvedor>
  );
}

type PropsArea = React.TextareaHTMLAttributes<HTMLTextAreaElement> & Comum;

export function AreaTexto({ rotulo, erro, dica, classeContainer, className, id, name, ...props }: PropsArea) {
  const ident = id ?? name ?? "";
  return (
    <Envolvedor id={ident} rotulo={rotulo} erro={erro} dica={dica} classeContainer={classeContainer} obrigatorio={props.required}>
      <textarea id={ident} name={name} aria-invalid={!!erro} rows={4} className={cn(BASE, "py-2.5", erro ? ERRO : OK, className)} {...props} />
    </Envolvedor>
  );
}
