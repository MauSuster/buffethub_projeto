import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { Vazio } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Vazio
        Icone={SearchX}
        titulo="Página não encontrada"
        texto="O endereço pode estar errado ou o conteúdo não está mais disponível."
        acao={<BotaoLink href="/">Voltar para a busca</BotaoLink>}
      />
    </div>
  );
}
