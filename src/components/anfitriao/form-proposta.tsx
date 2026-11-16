"use client";

import { useActionState } from "react";
import { CalendarX2, CheckCircle2, Send } from "lucide-react";
import { estadoInicial } from "@/lib/acoes";
import type { StatusData } from "@/lib/database.types";
import { data as dataBR } from "@/lib/formatos";
import { enviarProposta } from "@/controllers/anfitriao";
import { AreaTexto, Entrada } from "@/components/ui/campos";
import { BotaoEnviar } from "@/components/ui/botao";
import { MensagemAcao } from "@/components/ui/basicos";
import { valorParaCampo } from "./constantes";

type Props = {
  solicitacaoId: string;
  estimativa: number | null;
  descricaoSugerida: string;
  hoje: string;
  dataEvento: string;
  validadePadrao: string;
  situacaoData: StatusData;
};

/** UC20: formulário de proposta (valor total, descrição e validade). */
export function FormProposta({ solicitacaoId, estimativa, descricaoSugerida, hoje, dataEvento, validadePadrao, situacaoData }: Props) {
  const [estado, acao] = useActionState(enviarProposta, estadoInicial);
  const erros = estado.erros ?? {};
  const dataLivre = situacaoData === "Livre";

  return (
    <form action={acao} className="space-y-4" noValidate>
      <input type="hidden" name="solicitacao_id" value={solicitacaoId} />
      <MensagemAcao estado={estado} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada
          rotulo="Valor total (R$)"
          name="valor_total"
          inputMode="decimal"
          required
          placeholder="0,00"
          defaultValue={estado.valores?.valor_total ?? valorParaCampo(estimativa)}
          dica={estimativa != null ? "Preenchido com a estimativa do pacote. Ajuste se precisar." : undefined}
          erro={erros.valor_total}
        />
        <Entrada
          rotulo="Validade da proposta"
          name="validade"
          type="date"
          required
          min={hoje}
          max={dataEvento}
          defaultValue={estado.valores?.validade ?? validadePadrao}
          dica={`Entre hoje e ${dataBR(dataEvento)}, a data do evento.`}
          erro={erros.validade}
        />
      </div>
      <AreaTexto
        rotulo="Descrição"
        name="descricao"
        required
        rows={4}
        maxLength={2000}
        placeholder="O que está incluído na proposta: cardápio, serviços, equipe, horários..."
        defaultValue={estado.valores?.descricao ?? descricaoSugerida}
        erro={erros.descricao}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {dataLivre ? (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-5" /> Data livre no calendário
          </p>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-red-600">
            <CalendarX2 className="size-5" /> Data {situacaoData === "Reservada" ? "reservada" : "bloqueada"} no calendário
          </p>
        )}
        <BotaoEnviar tamanho="lg" textoEnviando="Enviando..." disabled={!dataLivre}>
          <Send className="size-4" /> Enviar proposta
        </BotaoEnviar>
      </div>
    </form>
  );
}
