import { Suspense } from "react";
import { RotateCcw, SearchX } from "lucide-react";
import { Alerta, Vazio } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";
import { LembrarBusca } from "@/components/busca/acoes-comparacao";
import { BarraComparacao } from "@/components/busca/barra-comparacao";
import { EsqueletoResultados } from "@/components/busca/esqueletos";
import { FiltrosAtivos } from "@/components/busca/filtros-ativos";
import { HeroBusca } from "@/components/busca/hero-busca";
import { PainelFiltros } from "@/components/busca/painel-filtros";
import { contarFiltros, hrefBusca, lerFiltros, paraQuery, type ParamsBusca } from "@/components/busca/parametros";
import { ResultadosBusca } from "@/components/busca/resultados-busca";
import { buscarBuffets, opcoesFiltro, type FiltrosBusca, type Resultado } from "@/models/busca";
import type { BuffetBusca } from "@/lib/database.types";

async function Resultados({
  filtros,
  busca,
}: {
  filtros: FiltrosBusca;
  busca: Promise<Resultado<BuffetBusca[]>>;
}) {
  const { dados: buffets, erro } = await busca;

  if (erro) {
    return (
      <Alerta tipo="erro" titulo="Não foi possível carregar os buffets">
        <p>{erro}</p>
        <BotaoLink href={hrefBusca(filtros)} variante="secundario" tamanho="sm" className="mt-3">
          <RotateCcw className="size-3.5" /> Tentar novamente
        </BotaoLink>
      </Alerta>
    );
  }

  if (buffets.length === 0) {
    const comFiltros = contarFiltros(filtros) > 0;
    return (
      <Vazio
        Icone={SearchX}
        titulo={comFiltros ? "Nenhum buffet encontrado com esses filtros" : "Nenhum buffet encontrado"}
        texto={
          comFiltros
            ? "Tente remover alguns filtros, aumentar a faixa de preço ou escolher outra cidade."
            : "Confira se o nome está certo ou tente buscar por outra palavra, bairro ou cidade."
        }
        acao={
          <BotaoLink href="/" scroll={false} variante="secundario">
            <RotateCcw className="size-4" /> Limpar filtros
          </BotaoLink>
        }
      />
    );
  }

  return <ResultadosBusca buffets={buffets} />;
}

export default async function Home({ searchParams }: { searchParams: Promise<ParamsBusca> }) {
  const { filtros, erros, brutos } = lerFiltros(await searchParams);
  const busca = buscarBuffets(filtros);
  const { dados: opcoes } = await opcoesFiltro();

  const consulta = paraQuery(filtros);
  const chave = `${consulta}|${brutos.convidados}|${brutos.preco_min}|${brutos.preco_max}`;
  const mensagensErro = Object.values(erros);

  return (
    <>
      <HeroBusca key={`hero-${chave}`} filtros={filtros} opcoes={opcoes} compacto={chave !== "|||"} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-8">
          <PainelFiltros key={`filtros-${chave}`} filtros={filtros} brutos={brutos} erros={erros} opcoes={opcoes} />

          <section id="resultados" aria-label="Resultados da busca" className="min-w-0">
            {mensagensErro.length > 0 && (
              <Alerta tipo="aviso" titulo="Alguns filtros foram ignorados" className="mb-5">
                {mensagensErro.join(" ")} Corrija o valor no painel de filtros e aplique de novo.
              </Alerta>
            )}
            <FiltrosAtivos filtros={filtros} />
            <Suspense key={consulta} fallback={<EsqueletoResultados />}>
              <Resultados filtros={filtros} busca={busca} />
            </Suspense>
          </section>
        </div>
      </div>

      <BarraComparacao />
      <LembrarBusca consulta={consulta} />
    </>
  );
}
