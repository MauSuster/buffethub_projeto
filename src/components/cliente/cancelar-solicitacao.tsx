"use client";

import { useActionState, useState } from "react";
import { Ban } from "lucide-react";
import { Botao, BotaoEnviar } from "@/components/ui/botao";
import { MensagemAcao } from "@/components/ui/basicos";
import { estadoInicial } from "@/lib/acoes";
import { cancelarSolicitacaoAcao } from "@/controllers/cliente";

export function CancelarSolicitacao({ solicitacaoId }: { solicitacaoId: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, cancelar] = useActionState(cancelarSolicitacaoAcao.bind(null, solicitacaoId), estadoInicial);

  if (!confirmando) {
    return (
      <div className="space-y-2">
        <MensagemAcao estado={estado} />
        <Botao variante="fantasma" tamanho="sm" onClick={() => setConfirmando(true)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
          <Ban className="size-3.5" /> Cancelar solicitação
        </Botao>
      </div>
    );
  }

  return (
    <form action={cancelar} className="w-full rounded-xl border border-red-200 bg-red-50/70 p-4">
      <p className="text-sm font-semibold text-red-800">Cancelar esta solicitação de orçamento?</p>
      <p className="mt-1 text-sm text-red-700">O buffet será avisado e não poderá mais enviar uma proposta para este pedido.</p>
      <MensagemAcao estado={estado} className="mt-3" />
      <div className="mt-3 flex flex-wrap gap-2">
        <BotaoEnviar variante="perigo" tamanho="sm" textoEnviando="Cancelando...">
          Sim, cancelar
        </BotaoEnviar>
        <Botao type="button" variante="fantasma" tamanho="sm" onClick={() => setConfirmando(false)}>
          Manter solicitação
        </Botao>
      </div>
    </form>
  );
}
