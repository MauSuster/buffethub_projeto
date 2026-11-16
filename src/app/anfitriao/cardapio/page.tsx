import { Suspense } from "react";
import { exigirBuffet } from "@/lib/auth";
import { TituloPagina } from "@/components/ui/basicos";
import { ErroCarregamento, EsqueletoCartoes } from "@/components/anfitriao/estados";
import { GerenciarPacotes } from "@/components/anfitriao/pacotes";
import * as modelo from "@/models/anfitriao";

export const metadata = { title: "Cardápio e preços" };

// T8.2 Cardápio e Preços (UC18)
export default function CardapioPrecos() {
  return (
    <>
      <TituloPagina
        titulo="Cardápio e preços"
        subtitulo="Monte os pacotes que aparecem no seu perfil, com itens, preço por pessoa e serviços adicionais."
      />
      <Suspense fallback={<EsqueletoCartoes />}>
        <Conteudo />
      </Suspense>
    </>
  );
}

async function Conteudo() {
  const sessao = await exigirBuffet("/anfitriao/cardapio");
  const pacotes = await modelo.listarPacotes(sessao.id);
  if (pacotes.erro) return <ErroCarregamento mensagem={pacotes.erro} />;
  return <GerenciarPacotes pacotes={pacotes.dados} />;
}
