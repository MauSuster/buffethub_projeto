"use client";

import { useActionState, useState } from "react";
import { Send, Star } from "lucide-react";
import { BotaoEnviar } from "@/components/ui/botao";
import { AreaTexto } from "@/components/ui/campos";
import { MensagemAcao } from "@/components/ui/basicos";
import { cn } from "@/lib/cn";
import { estadoInicial } from "@/lib/acoes";
import { avaliarBuffetAcao } from "@/controllers/cliente";

const ROTULOS = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

/** UC15: nota de 1 a 5 (obrigatória) e comentário opcional. */
export function FormAvaliacao({ contratoId, buffetNome }: { contratoId: string; buffetNome: string }) {
  const [estado, avaliar] = useActionState(avaliarBuffetAcao.bind(null, contratoId), estadoInicial);
  const [nota, setNota] = useState(0);
  const [destaque, setDestaque] = useState(0);
  const visivel = destaque || nota;

  return (
    <form action={avaliar} className="space-y-4">
      <MensagemAcao estado={estado} />
      <div>
        <p className="text-sm font-medium text-slate-700">
          Como foi o seu evento com {buffetNome}? <span className="text-red-500">*</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Nota de 1 a 5 estrelas" className="flex gap-1" onMouseLeave={() => setDestaque(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nota === n}
                aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"} – ${ROTULOS[n]}`}
                onClick={() => setNota(n)}
                onMouseEnter={() => setDestaque(n)}
                onFocus={() => setDestaque(n)}
                onBlur={() => setDestaque(0)}
                className="rounded-lg p-1 transition hover:scale-110 focus-visible:outline-2"
              >
                <Star
                  className={cn(
                    "size-8 transition",
                    n <= visivel ? "fill-accent-400 text-accent-400" : "fill-slate-100 text-slate-300",
                  )}
                />
              </button>
            ))}
          </div>
          <span className={cn("text-sm font-semibold", visivel ? "text-accent-700" : "text-slate-400")}>
            {visivel ? ROTULOS[visivel] : "Escolha uma nota"}
          </span>
        </div>
        <input type="hidden" name="nota" value={nota || ""} />
        {estado.erros?.nota && <p className="mt-1.5 text-xs font-medium text-red-600">{estado.erros.nota}</p>}
      </div>
      <AreaTexto
        name="comentario"
        rotulo="Comentário (opcional)"
        placeholder="Conte como foi a comida, o atendimento e a organização..."
        maxLength={1000}
        rows={3}
        defaultValue={estado.valores?.comentario}
        erro={estado.erros?.comentario}
        dica="Sua avaliação aparece no perfil do buffet com seu primeiro nome."
      />
      <BotaoEnviar textoEnviando="Enviando...">
        <Send className="size-4" /> Enviar avaliação
      </BotaoEnviar>
    </form>
  );
}
