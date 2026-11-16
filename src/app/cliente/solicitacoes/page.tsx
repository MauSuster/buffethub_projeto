import type { Metadata } from "next";
import { ClipboardList, Inbox, Search } from "lucide-react";
import { exigirCliente } from "@/lib/auth";
import { hojeISO } from "@/lib/formatos";
import { listarNegociacoes } from "@/models/cliente";
import { Alerta, TituloPagina, Vazio } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { AbasSolicitacoes } from "@/components/cliente/abas-solicitacoes";
import { CartaoSolicitacao } from "@/components/cliente/cartao-solicitacao";
import { ABAS, abaDaNegociacao, prioridade, type Aba } from "@/components/cliente/utilidades";

export const metadata: Metadata = { title: "Solicitações e propostas" };

const VAZIO_POR_ABA: Record<Aba, { titulo: string; texto: string }> = {
  todas: {
    titulo: "Você ainda não pediu orçamentos",
    texto: "Encontre um buffet, informe os dados do seu evento e peça um orçamento. As propostas aparecem aqui.",
  },
  aguardando: {
    titulo: "Nenhuma solicitação aguardando resposta",
    texto: "Quando você pedir um orçamento, ele fica aqui até o buffet enviar a proposta.",
  },
  propostas: {
    titulo: "Você ainda não recebeu propostas.",
    texto: "Assim que um buffet responder ao seu pedido, a proposta aparece aqui para você aceitar ou recusar.",
  },
  encerradas: {
    titulo: "Nada encerrado por aqui",
    texto: "Solicitações canceladas e propostas recusadas ou vencidas ficam guardadas nesta aba.",
  },
};

// T7.1 Solicitações e propostas (UC10 e UC11)
export default async function PaginaSolicitacoes(props: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const sessao = await exigirCliente("/cliente/solicitacoes");
  const params = await props.searchParams;
  const abaParam = typeof params.aba === "string" ? params.aba : "todas";
  const aba: Aba = ABAS.some((a) => a.id === abaParam) ? (abaParam as Aba) : "todas";
  const nova = params.nova === "1";

  const { negociacoes, erro } = await listarNegociacoes(sessao.id);
  const hoje = hojeISO();

  const contagem: Record<Aba, number> = { todas: negociacoes.length, aguardando: 0, propostas: 0, encerradas: 0 };
  for (const n of negociacoes) contagem[abaDaNegociacao(n)]++;

  const lista = negociacoes
    .filter((n) => aba === "todas" || abaDaNegociacao(n) === aba)
    .sort((a, b) => prioridade(a) - prioridade(b) || b.data_solicitacao.localeCompare(a.data_solicitacao));

  const propostasParaDecidir = negociacoes.filter((n) => n.status_proposta === "Pendente").length;
  const vazio = VAZIO_POR_ABA[aba];

  return (
    <div className="space-y-6">
      <TituloPagina
        titulo="Solicitações e propostas"
        subtitulo="Acompanhe seus pedidos de orçamento e responda às propostas dos buffets."
        acoes={
          <BotaoLink href="/" variante="secundario">
            <Search className="size-4" /> Buscar buffets
          </BotaoLink>
        }
      />

      {nova && (
        <Alerta tipo="sucesso" titulo="Solicitação enviada com sucesso.">
          O buffet foi avisado e vai responder com uma proposta. Você recebe um aviso assim que ela chegar.
        </Alerta>
      )}

      {propostasParaDecidir > 0 && aba !== "propostas" && (
        <Alerta tipo="aviso" titulo={propostasParaDecidir === 1 ? "Você tem 1 proposta para decidir" : `Você tem ${propostasParaDecidir} propostas para decidir`}>
          Confira o valor e a validade e escolha entre aceitar ou recusar.
        </Alerta>
      )}

      <AbasSolicitacoes ativa={aba} contagem={contagem} />

      {erro ? (
        <Alerta tipo="erro" titulo="Não foi possível carregar suas solicitações">
          {erro}
        </Alerta>
      ) : lista.length === 0 ? (
        <Vazio
          Icone={aba === "propostas" ? Inbox : ClipboardList}
          titulo={vazio.titulo}
          texto={vazio.texto}
          acao={
            <BotaoLink href="/" variante="primario">
              <Search className="size-4" /> Buscar buffets
            </BotaoLink>
          }
        />
      ) : (
        <div className="space-y-4">
          {lista.map((n) => (
            <CartaoSolicitacao key={n.solicitacao_id} n={n} hoje={hoje} />
          ))}
        </div>
      )}
    </div>
  );
}
