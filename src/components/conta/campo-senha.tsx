"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  name: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  placeholder?: string;
  autoComplete?: "current-password" | "new-password";
  minLength?: number;
  required?: boolean;
  mostrarForca?: boolean;
  acaoRotulo?: React.ReactNode;
};

const NIVEIS = [
  { rotulo: "Muito fraca", cor: "bg-red-500", texto: "text-red-600" },
  { rotulo: "Fraca", cor: "bg-orange-500", texto: "text-orange-600" },
  { rotulo: "Razoável", cor: "bg-amber-400", texto: "text-amber-700" },
  { rotulo: "Boa", cor: "bg-emerald-400", texto: "text-emerald-700" },
  { rotulo: "Forte", cor: "bg-emerald-600", texto: "text-emerald-700" },
];

function forcaDaSenha(senha: string) {
  if (senha.length < 8) return 0;
  let pontos = 1;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha) || senha.length >= 12) pontos++;
  return pontos;
}

/** Campo de senha com botão de mostrar/ocultar e, opcionalmente, medidor de força. */
export function CampoSenha({
  name,
  rotulo,
  erro,
  dica,
  placeholder = "••••••••",
  autoComplete = "current-password",
  minLength,
  required = true,
  mostrarForca = false,
  acaoRotulo,
}: Props) {
  const [visivel, setVisivel] = useState(false);
  const [valor, setValor] = useState("");
  const nivel = NIVEIS[forcaDaSenha(valor)];
  const pontos = forcaDaSenha(valor);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">
          {rotulo}
          {required && <span className="text-red-500"> *</span>}
        </label>
        {acaoRotulo}
      </div>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visivel ? "text" : "password"}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={72}
          required={required}
          aria-invalid={!!erro}
          className={cn(
            "h-11 w-full rounded-xl border bg-white pl-3.5 pr-11 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4",
            erro ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-brand-500 focus:ring-brand-100",
          )}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-slate-400 transition hover:text-slate-700"
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
        >
          {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {mostrarForca && valor && (
        <div className="flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= pontos ? nivel.cor : "bg-slate-200")} />
            ))}
          </div>
          <span className={cn("w-20 text-right text-xs font-semibold", nivel.texto)}>{nivel.rotulo}</span>
        </div>
      )}
      {erro ? (
        <p className="text-xs font-medium text-red-600">{erro}</p>
      ) : dica ? (
        <p className="text-xs text-slate-500">{dica}</p>
      ) : null}
    </div>
  );
}
