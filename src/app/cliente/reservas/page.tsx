import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart, FileText, MapPin, MessageSquare, PartyPopper, Search, Star, Store } from "lucide-react";
import { exigirCliente } from "@/lib/auth";
import { hojeISO, moeda } from "@/lib/formatos";
import type { Negociacao } from "@/lib/database.types";
import { listarNegociacoes } from "@/models/cliente";
import { Alerta, Estrelas, Selo, SeloStatus, TituloPagina, Vazio } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { BlocoData } from "@/components/cliente/bloco-data";
import { FormAvaliacao } from "@/components/cliente/form-avaliacao";
import { diasEntre } from "@/components/cliente/utilidades";

export const metadata: Metadata = { title: "Minhas reservas" };

const ROTULO_NOTA = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

function contagemRegressiva(dias: number) {
  if (dias <= 0) return "É hoje!";
  if (dias === 1) return "É amanhã";
  return `Faltam ${dias} dias`;
}

function Cabecalho({ n }: { n: Negociacao }) {
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/buffet/${n.buffet_id}`} className="text-lg font-bold text-slate-900 hover:text-brand-700">
          {n.buffet_nome}
        </Link>
        {n.status_contrato && <SeloStatus status={n.status_contrato} />}
      </div>
      <p className="text-sm font-medium text-slate-700">
        {n.tipo_evento} · {n.num_convidados} convidados
      </p>
      <p className="flex items-start gap-1.5 text-sm text-slate-500">
        <MapPin className="mt-0.5 size-3.5 shrink-0" /> {n.local}
      </p>
    </div>
  );
}

function CartaoProximo({ n, hoje }: { n: Negociacao; hoje: string }) {
  const dias = diasEntre(hoje, n.data_evento);
  return (
    <article className="card flex flex-col gap-4 p-4 transition hover:shadow-lift sm:flex-row sm:items-center sm:p-5">
      <div className="flex items-center gap-4 sm:contents">
        <BlocoData iso={n.data_evento} />
        <Cabecalho n={n} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <Selo cor={dias <= 7 ? "amarelo" : "azul"}>
          <CalendarHeart className="size-3" /> {contagemRegressiva(dias)}
        </Selo>
        <p className="text-sm text-slate-500">
          Pago: <strong className="text-slate-800">{moeda(n.valor_total)}</strong>
        </p>
        <div className="flex gap-1">
          <BotaoLink href={`/cliente/contratos/${n.contrato_id}`} variante="fantasma" tamanho="sm">
            <FileText className="size-3.5" /> Contrato
          </BotaoLink>
          <BotaoLink href={`/cliente/mensagens?com=${n.buffet_id}`} variante="fantasma" tamanho="sm">
            <MessageSquare className="size-3.5" /> Mensagem
          </BotaoLink>
        </div>
      </div>
    </article>
  );
}

function CartaoRealizado({ n }: { n: Negociacao }) {
  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <BlocoData iso={n.data_evento} apagado />
        <Cabecalho n={n} />
      </div>
      <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
        {n.avaliacao_id && n.avaliacao_nota ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sua avaliação</p>
              <div className="mt-1 flex items-center gap-2">
                <Estrelas nota={n.avaliacao_nota} tamanho="md" />
                <span className="text-sm font-semibold text-slate-700">
                  {n.avaliacao_nota}/5 · {ROTULO_NOTA[n.avaliacao_nota]}
                </span>
              </div>
            </div>
            <BotaoLink href={`/buffet/${n.buffet_id}`} variante="secundario" tamanho="sm">
              <Store className="size-3.5" /> Ver no perfil do buffet
            </BotaoLink>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <Star className="size-4 fill-accent-400 text-accent-400" /> Avalie o buffet
            </h3>
            {n.contrato_id && <FormAvaliacao contratoId={n.contrato_id} buffetNome={n.buffet_nome} />}
          </div>
        )}
      </div>
    </article>
  );
}

// T7.3 Minhas reservas (UC15 Avaliar Buffet)
export default async function PaginaReservas() {
  const sessao = await exigirCliente("/cliente/reservas");
  const { negociacoes, erro } = await listarNegociacoes(sessao.id);
  const hoje = hojeISO();

  const proximos = negociacoes
    .filter((n) => n.status_contrato === "Pago")
    .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
  const realizados = negociacoes
    .filter((n) => n.status_contrato === "Concluído")
    .sort((a, b) => b.data_evento.localeCompare(a.data_evento));
  const semAvaliacao = realizados.filter((n) => !n.avaliacao_id).length;

  return (
    <div className="space-y-8">
      <TituloPagina titulo="Minhas reservas" subtitulo="Seus eventos confirmados e os que já aconteceram." />

      {erro ? (
        <Alerta tipo="erro" titulo="Não foi possível carregar suas reservas">
          {erro}
        </Alerta>
      ) : proximos.length === 0 && realizados.length === 0 ? (
        <Vazio
          Icone={PartyPopper}
          titulo="Você ainda não tem reservas"
          texto="Quando você pagar um contrato, o evento aparece aqui com a data reservada. Depois do evento, é só avaliar o buffet."
          acao={
            <div className="flex flex-wrap justify-center gap-2">
              <BotaoLink href="/cliente/contratos">
                <FileText className="size-4" /> Meus contratos
              </BotaoLink>
              <BotaoLink href="/" variante="secundario">
                <Search className="size-4" /> Buscar buffets
              </BotaoLink>
            </div>
          }
        />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              Próximos eventos
              <span className="rounded-full bg-brand-50 px-2 text-xs font-bold text-brand-700">{proximos.length}</span>
            </h2>
            {proximos.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-6 text-center text-sm text-slate-500">
                Nenhum evento reservado no momento.
              </p>
            ) : (
              proximos.map((n) => <CartaoProximo key={n.solicitacao_id} n={n} hoje={hoje} />)
            )}
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              Eventos realizados
              <span className="rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-600">{realizados.length}</span>
            </h2>
            {semAvaliacao > 0 && (
              <Alerta tipo="info">
                {semAvaliacao === 1
                  ? "Você tem 1 evento para avaliar. Sua opinião ajuda outros clientes a escolher."
                  : `Você tem ${semAvaliacao} eventos para avaliar. Sua opinião ajuda outros clientes a escolher.`}
              </Alerta>
            )}
            {realizados.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-6 text-center text-sm text-slate-500">
                Depois que o evento acontecer, ele aparece aqui para você avaliar o buffet.
              </p>
            ) : (
              realizados.map((n) => <CartaoRealizado key={n.solicitacao_id} n={n} />)
            )}
          </section>
        </>
      )}
    </div>
  );
}
