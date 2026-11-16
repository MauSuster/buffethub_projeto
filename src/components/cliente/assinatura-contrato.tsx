"use client";

import { useActionState, useState } from "react";
import { FileSignature, PenLine } from "lucide-react";
import { Botao, BotaoEnviar } from "@/components/ui/botao";
import { Entrada } from "@/components/ui/campos";
import { MensagemAcao } from "@/components/ui/basicos";
import { cn } from "@/lib/cn";
import { estadoInicial } from "@/lib/acoes";
import { assinarContratoAcao } from "@/controllers/cliente";

/** UC13: assinatura eletrônica com o nome completo do cadastro e o aceite dos termos. */
export function AssinaturaContrato({ contratoId, nomeCadastro }: { contratoId: string; nomeCadastro: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, assinar] = useActionState(assinarContratoAcao.bind(null, contratoId), estadoInicial);

  if (!aberto) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Leia os termos com atenção. Depois de assinar, você já pode fazer o pagamento para reservar a data.
        </p>
        <Botao onClick={() => setAberto(true)} className="w-full">
          <FileSignature className="size-4" /> Assinar contrato
        </Botao>
      </div>
    );
  }

  return (
    <form action={assinar} className="space-y-4">
      <MensagemAcao estado={estado} />
      <Entrada
        name="nome"
        rotulo="Nome completo"
        placeholder="Digite seu nome completo"
        autoComplete="name"
        required
        autoFocus
        defaultValue={estado.valores?.nome}
        erro={estado.erros?.nome}
        dica={`Igual ao seu cadastro: ${nomeCadastro}`}
      />
      <div className="space-y-1.5">
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 text-sm text-slate-700 transition hover:border-brand-300",
            estado.erros?.aceite ? "border-red-300" : "border-slate-200",
          )}
        >
          <input
            type="checkbox"
            name="aceite"
            defaultChecked={estado.valores?.aceite === "on"}
            className="mt-0.5 size-4 shrink-0 accent-brand-600"
          />
          <span>
            <strong className="font-semibold text-slate-900">Li e concordo</strong> com os termos deste contrato e confirmo a
            assinatura eletrônica com meu nome, data e hora.
          </span>
        </label>
        {estado.erros?.aceite && <p className="text-xs font-medium text-red-600">{estado.erros.aceite}</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <BotaoEnviar textoEnviando="Assinando..." className="sm:flex-1">
          <PenLine className="size-4" /> Assinar
        </BotaoEnviar>
        <Botao type="button" variante="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
