import { SearchX } from "lucide-react";
import { Vazio } from "@/components/ui/basicos";
import { BotaoLink } from "@/components/ui/botao";

export default function BuffetNaoEncontrado() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Vazio
        Icone={SearchX}
        titulo="Buffet não encontrado"
        texto="O endereço pode estar errado ou o buffet não está mais disponível no BuffetHub."
        acao={<BotaoLink href="/">Buscar outros buffets</BotaoLink>}
      />
    </div>
  );
}
