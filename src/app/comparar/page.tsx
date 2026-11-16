import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { TituloPagina } from "@/components/ui/basicos";
import { LinkVoltarBusca } from "@/components/busca/acoes-comparacao";
import { EsqueletoComparacao } from "@/components/busca/esqueletos";
import { lerIdsComparacao, MAX_COMPARAR, MIN_COMPARAR, type ParamsBusca } from "@/components/busca/parametros";
import { AvisoQuantidade, TabelaComparacao } from "@/components/busca/tabela-comparacao";

export const metadata: Metadata = {
  title: "Comparar buffets",
  description: "Compare de 2 a 4 buffets lado a lado: preço por pessoa, avaliações, capacidade, serviços e pacotes.",
};

export default async function CompararPage({ searchParams }: { searchParams: Promise<ParamsBusca> }) {
  const ids = lerIdsComparacao((await searchParams).ids);
  const quantidadeValida = ids.length >= MIN_COMPARAR && ids.length <= MAX_COMPARAR;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <TituloPagina
        titulo="Comparar buffets"
        subtitulo={`De ${MIN_COMPARAR} a ${MAX_COMPARAR} buffets lado a lado: preço, avaliações, capacidade, serviços e pacotes.`}
        acoes={
          <LinkVoltarBusca comoBotao="secundario">
            <ArrowLeft className="size-4" /> Voltar à busca
          </LinkVoltarBusca>
        }
      />
      {quantidadeValida ? (
        <Suspense key={ids.join(",")} fallback={<EsqueletoComparacao colunas={ids.length} />}>
          <TabelaComparacao ids={ids} />
        </Suspense>
      ) : (
        <AvisoQuantidade
          texto={
            ids.length > MAX_COMPARAR
              ? `Você escolheu ${ids.length} buffets. Deixe no máximo ${MAX_COMPARAR} para ver a comparação.`
              : undefined
          }
        />
      )}
    </div>
  );
}
