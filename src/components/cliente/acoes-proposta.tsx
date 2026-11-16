"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, MessageSquare, X } from "lucide-react";
import { Botao, BotaoEnviar } from "@/components/ui/botao";
import { Alerta, MensagemAcao } from "@/components/ui/basicos";
import { estadoInicial } from "@/lib/acoes";
import { moeda } from "@/lib/formatos";
import { aceitarPropostaAcao, recusarPropostaAcao } from "@/controllers/cliente";

type Modo = "inicio" | "aceitar" | "recusar";

/** UC11: aceitar ou recusar a proposta, sempre com confirmação na própria tela. */
export function AcoesProposta({ propostaId, buffetId, buffetNome, valor }: {
  propostaId: string;
  buffetId: string;
  buffetNome: string;
  valor: number;
}) {
  const [modo, setModo] = useState<Modo>("inicio");
  const [estadoAceite, aceitar] = useActionState(aceitarPropostaAcao.bind(null, propostaId), estadoInicial);
  const [estadoRecusa, recusar] = useActionState(recusarPropostaAcao.bind(null, propostaId), estadoInicial);
  const dataIndisponivel = !!estadoAceite.erros?.data;

  return (
    <div className="space-y-3">
      {dataIndisponivel ? (
        <Alerta tipo="erro" titulo="Não foi possível aceitar">
          <p>{estadoAceite.mensagem}</p>
          <Link href={`/cliente/mensagens?com=${buffetId}`} className="mt-1 inline-flex items-center gap-1 font-semibold underline">
            <MessageSquare className="size-3.5" /> Falar com o buffet
          </Link>
        </Alerta>
      ) : (
        <MensagemAcao estado={estadoAceite} />
      )}
      <MensagemAcao estado={estadoRecusa} />

      {modo === "inicio" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao onClick={() => setModo("aceitar")} className="sm:flex-1">
            <Check className="size-4" /> Aceitar proposta
          </Botao>
          <Botao variante="secundario" onClick={() => setModo("recusar")} className="sm:flex-1">
            <X className="size-4" /> Recusar
          </Botao>
        </div>
      )}

      {modo === "aceitar" && (
        <form action={aceitar} className="rounded-xl border border-brand-200 bg-brand-50/70 p-4">
          <p className="text-sm font-semibold text-brand-900">Confirmar o aceite da proposta?</p>
          <p className="mt-1 text-sm text-brand-800">
            Você aceita a proposta de <strong>{buffetNome}</strong> no valor de <strong>{moeda(valor)}</strong>. O contrato será
            gerado na hora para você ler e assinar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BotaoEnviar textoEnviando="Gerando contrato...">Sim, aceitar</BotaoEnviar>
            <Botao type="button" variante="fantasma" onClick={() => setModo("inicio")}>
              Voltar
            </Botao>
          </div>
        </form>
      )}

      {modo === "recusar" && (
        <form action={recusar} className="rounded-xl border border-red-200 bg-red-50/70 p-4">
          <p className="text-sm font-semibold text-red-800">Tem certeza que deseja recusar?</p>
          <p className="mt-1 text-sm text-red-700">
            A proposta de {buffetNome} ficará como recusada e o buffet será avisado. Essa ação não pode ser desfeita.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BotaoEnviar variante="perigo" textoEnviando="Recusando...">
              Sim, recusar
            </BotaoEnviar>
            <Botao type="button" variante="fantasma" onClick={() => setModo("inicio")}>
              Voltar
            </Botao>
          </div>
        </form>
      )}
    </div>
  );
}
