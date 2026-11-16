import { Suspense } from "react";
import { exigirBuffet } from "@/lib/auth";
import { hojeISO } from "@/lib/formatos";
import { TituloPagina } from "@/components/ui/basicos";
import { CalendarioDisponibilidade, type ReservaDia } from "@/components/anfitriao/calendario";
import { ErroCarregamento, EsqueletoCalendario } from "@/components/anfitriao/estados";
import { limitesDoMes, mesValido } from "@/components/anfitriao/datas";
import * as modelo from "@/models/anfitriao";

export const metadata = { title: "Calendário" };

type Busca = Promise<{ mes?: string | string[] }>;

// T8.3 Calendário (UC19)
export default function Calendario({ searchParams }: { searchParams: Busca }) {
  return (
    <>
      <TituloPagina
        titulo="Calendário"
        subtitulo="Marque as datas livres e bloqueadas e acompanhe as datas já reservadas pelos clientes."
      />
      <Suspense fallback={<EsqueletoCalendario />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Conteudo({ searchParams }: { searchParams: Busca }) {
  const sessao = await exigirBuffet("/anfitriao/calendario");
  const { mes: mesBusca } = await searchParams;
  const hoje = hojeISO();
  const pedido = typeof mesBusca === "string" ? mesBusca : undefined;
  const mes = mesValido(pedido) ? pedido : hoje.slice(0, 7);
  const { inicio, fim } = limitesDoMes(mes);

  await modelo.atualizarStatusPorData();
  const [datas, negociacoes] = await Promise.all([
    modelo.listarDisponibilidade(sessao.id, inicio, fim),
    modelo.listarNegociacoesNoPeriodo(sessao.id, inicio, fim),
  ]);
  const erro = datas.erro ?? negociacoes.erro;
  if (erro) return <ErroCarregamento mensagem={erro} />;

  const reservas: ReservaDia[] = negociacoes.dados
    .filter((n) => n.status_contrato === "Pago" || n.status_contrato === "Concluído")
    .map((n) => ({
      data: n.data_evento,
      solicitacaoId: n.solicitacao_id,
      tipoEvento: n.tipo_evento,
      cliente: n.cliente_nome ?? "Cliente",
      convidados: n.num_convidados,
      local: n.local,
    }));

  const contagem = new Map<string, number>();
  for (const n of negociacoes.dados) {
    if (n.status_solicitacao === "Pendente") contagem.set(n.data_evento, (contagem.get(n.data_evento) ?? 0) + 1);
  }
  const pedidos = [...contagem].map(([data, quantidade]) => ({ data, quantidade }));

  return (
    <CalendarioDisponibilidade key={mes} mes={mes} hoje={hoje} datas={datas.dados} reservas={reservas} pedidos={pedidos} />
  );
}
