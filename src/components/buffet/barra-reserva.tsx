import Link from "next/link";
import { CalendarCheck, ChefHat, ClipboardList, MessageSquare, Send, Store, Users } from "lucide-react";
import { BotaoLink } from "@/components/ui/botao";
import { Alerta, Estrelas } from "@/components/ui/basicos";
import { formatarNota } from "@/components/buffet/secao";
import { moeda } from "@/lib/formatos";
import type { BuffetBusca, TipoUsuario } from "@/lib/database.types";

export type Visitante = { tipo: TipoUsuario | null; dono: boolean };

function Preco({ preco }: { preco: number | null }) {
  if (preco == null) {
    return <p className="text-lg font-bold text-slate-900">Preço sob consulta</p>;
  }
  return (
    <p className="text-slate-600">
      <span className="text-sm">A partir de </span>
      <span className="text-3xl font-extrabold tracking-tight text-brand-700">{moeda(preco)}</span>
      <span className="text-sm">/pessoa</span>
    </p>
  );
}

const PASSOS = [
  "Envie os dados do seu evento",
  "O buffet responde com uma proposta",
  "Aceite, assine e pague pela plataforma",
];

export function CartaoReserva({ buffet, visitante }: { buffet: BuffetBusca; visitante: Visitante }) {
  const souBuffet = visitante.tipo === "buffet";
  return (
    <div className="card space-y-5 p-6">
      <div>
        <Preco preco={buffet.preco_min} />
        {buffet.nota_media != null && (
          <a href="#avaliacoes" className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-700">
            <Estrelas nota={buffet.nota_media} />
            <b className="text-slate-900">{formatarNota(buffet.nota_media)}</b>
            <span>
              ({buffet.total_avaliacoes} {buffet.total_avaliacoes === 1 ? "avaliação" : "avaliações"})
            </span>
          </a>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="size-3.5" /> Capacidade
          </dt>
          <dd className="mt-0.5 font-semibold text-slate-900">
            {buffet.capacidade_maxima ? `Até ${buffet.capacidade_maxima} pessoas` : "Sob consulta"}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <ChefHat className="size-3.5" /> Culinária
          </dt>
          <dd className="mt-0.5 truncate font-semibold text-slate-900">{buffet.estilo_culinaria ?? "Variada"}</dd>
        </div>
      </dl>

      {souBuffet ? (
        visitante.dono ? (
          <div className="space-y-3">
            <Alerta tipo="info" titulo="Este é o seu buffet">
              É assim que os clientes veem o seu perfil.
            </Alerta>
            <BotaoLink href="/anfitriao/dados" variante="secundario" className="w-full">
              <Store className="size-4" /> Editar dados do buffet
            </BotaoLink>
          </div>
        ) : (
          <Alerta tipo="aviso" titulo="Você entrou como buffet">
            Pedidos de orçamento e mensagens são feitos por contas de cliente.
          </Alerta>
        )
      ) : (
        <div className="space-y-2.5">
          <BotaoLink href={`/buffet/${buffet.id}/orcamento`} variante="destaque" tamanho="lg" className="w-full">
            <Send className="size-4" /> Solicitar orçamento
          </BotaoLink>
          <BotaoLink href={`/cliente/mensagens?com=${buffet.id}`} variante="secundario" className="w-full">
            <MessageSquare className="size-4" /> Enviar mensagem
          </BotaoLink>
          {visitante.tipo == null && (
            <p className="text-center text-xs text-slate-500">
              É preciso{" "}
              <Link href={`/login?next=${encodeURIComponent(`/buffet/${buffet.id}`)}`} className="font-semibold text-brand-700 hover:underline">
                entrar
              </Link>{" "}
              para solicitar. Ver o perfil é livre.
            </p>
          )}
        </div>
      )}

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <ClipboardList className="size-3.5" /> Como funciona
        </p>
        <ol className="space-y-2 text-sm text-slate-600">
          {PASSOS.map((passo, i) => (
            <li key={passo} className="flex items-start gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">{i + 1}</span>
              {passo}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function BarraReservaMovel({ buffet, visitante }: { buffet: BuffetBusca; visitante: Visitante }) {
  if (visitante.tipo === "buffet") return null;
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(15_23_42/0.25)] backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          {buffet.preco_min != null ? (
            <>
              <p className="text-xs text-slate-500">A partir de</p>
              <p className="truncate font-extrabold text-brand-700">
                {moeda(buffet.preco_min)}
                <span className="text-xs font-medium text-slate-500">/pessoa</span>
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-700">Preço sob consulta</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <BotaoLink href={`/cliente/mensagens?com=${buffet.id}`} variante="secundario" className="px-3" aria-label="Enviar mensagem">
            <MessageSquare className="size-4" />
          </BotaoLink>
          <BotaoLink href={`/buffet/${buffet.id}/orcamento`} variante="destaque">
            <CalendarCheck className="size-4" /> Solicitar orçamento
          </BotaoLink>
        </div>
      </div>
    </div>
  );
}
