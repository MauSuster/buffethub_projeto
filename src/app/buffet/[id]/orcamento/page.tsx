import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { exigirCliente } from "@/lib/auth";
import { hojeISO } from "@/lib/formatos";
import { buscarPerfilBuffet, idValido, listarEventosReutilizaveis } from "@/models/perfil-buffet";
import { Alerta, TituloPagina } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { FormularioOrcamento } from "@/components/buffet/formulario-orcamento";
import { ResumoBuffet } from "@/components/buffet/resumo-buffet";
import { separarItens } from "@/components/buffet/secao";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pacote?: string | string[]; data?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resultado = await buscarPerfilBuffet(id);
  const nome = resultado.situacao === "ok" ? ` · ${resultado.perfil.buffet.nome_fantasia}` : "";
  return { title: `Solicitar orçamento${nome}` };
}

function amanhaDe(hoje: string) {
  const d = new Date(`${hoje}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function texto(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

// T5.1 Solicitar Orçamento (UC08 + UC09)
export default async function PaginaOrcamento({ params, searchParams }: Props) {
  const { id } = await params;
  const busca = await searchParams;
  const pacotePedido = texto(busca.pacote);
  const dataPedida = texto(busca.data);

  const consulta = new URLSearchParams();
  if (pacotePedido && idValido(pacotePedido)) consulta.set("pacote", pacotePedido);
  if (dataPedida && /^\d{4}-\d{2}-\d{2}$/.test(dataPedida)) consulta.set("data", dataPedida);
  const query = consulta.toString();
  const voltarPara = `/buffet/${id}/orcamento${query ? `?${query}` : ""}`;

  const sessao = await exigirCliente(voltarPara);
  const resultado = await buscarPerfilBuffet(id);
  if (resultado.situacao === "nao-encontrado") notFound();
  if (resultado.situacao === "erro") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Alerta tipo="erro" titulo="Não foi possível abrir o perfil deste buffet.">
          Verifique sua conexão com a internet e tente novamente em instantes.
        </Alerta>
        <div className="mt-6 flex flex-wrap gap-3">
          <BotaoLink href={voltarPara} prefetch={false}>
            Tentar novamente
          </BotaoLink>
          <BotaoLink href="/" variante="secundario">
            Voltar para a busca
          </BotaoLink>
        </div>
      </div>
    );
  }

  const { buffet, pacotes, indisponiveis } = resultado.perfil;
  const eventos = await listarEventosReutilizaveis(sessao.id, buffet.id);
  const amanha = amanhaDe(hojeISO());
  const pacoteInicial = pacotes.some((p) => p.id === pacotePedido) ? pacotePedido : undefined;
  const dataInicial = dataPedida && /^\d{4}-\d{2}-\d{2}$/.test(dataPedida) && dataPedida >= amanha ? dataPedida : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href={`/buffet/${buffet.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-700"
      >
        <ArrowLeft className="size-4" /> Voltar ao perfil do buffet
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ResumoBuffet buffet={buffet} />
        </aside>

        <div className="min-w-0">
          <TituloPagina
            titulo="Solicitar orçamento"
            subtitulo={`Olá, ${sessao.nomeExibicao}! Conte como será o seu evento e o ${buffet.nome_fantasia} responde com uma proposta.`}
          />
          <FormularioOrcamento
            buffetId={buffet.id}
            tiposEvento={buffet.tipos_evento}
            servicosBuffet={separarItens(buffet.servicos)}
            capacidade={buffet.capacidade_maxima}
            pacotes={pacotes.map((p) => ({
              id: p.id,
              nome: p.nome,
              preco_por_pessoa: p.preco_por_pessoa,
              itens_cardapio: p.itens_cardapio,
            }))}
            indisponiveis={indisponiveis}
            eventos={eventos.map((e) => ({
              id: e.id,
              tipo_evento: e.tipo_evento,
              data: e.data,
              local: e.local,
              num_convidados: e.num_convidados,
              servicos_desejados: e.servicos_desejados,
              jaSolicitado: e.jaSolicitado,
            }))}
            amanha={amanha}
            pacoteInicial={pacoteInicial}
            dataInicial={dataInicial}
          />
        </div>
      </div>
    </div>
  );
}
