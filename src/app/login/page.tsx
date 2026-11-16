import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { areaInicial, obterSessao } from "@/lib/auth";
import { Alerta } from "@/components/ui/basicos";
import { CabecalhoFormulario } from "@/components/conta/cabecalho-formulario";
import { destinoSeguro } from "@/components/conta/destino";
import { FormLogin } from "@/components/conta/form-login";
import { LayoutAutenticacao } from "@/components/conta/layout-autenticacao";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre no BuffetHub para acompanhar orçamentos, propostas, contratos e mensagens.",
};

type Busca = { next?: string | string[]; erro?: string | string[] };

// T2.0 Login (UC02)
export default async function PaginaLogin(props: { searchParams: Promise<Busca> }) {
  const busca = await props.searchParams;
  const next = destinoSeguro(busca.next) ?? undefined;
  const erroLink = busca.erro === "link";

  const sessao = await obterSessao();
  if (sessao) redirect(next ?? areaInicial(sessao.tipo));

  return (
    <LayoutAutenticacao
      titulo="Bem-vindo de volta"
      texto="Entre para acompanhar seus orçamentos, responder propostas, assinar contratos e conversar com os buffets."
    >
      <CabecalhoFormulario Icone={LogIn} titulo="Entrar" subtitulo="Use o e-mail e a senha que você cadastrou." />

      {erroLink && (
        <Alerta tipo="erro" titulo="Link inválido ou expirado" className="mb-6">
          Se você estava trocando a senha, peça um novo link em “Esqueci minha senha”. Se estava confirmando o
          e-mail, tente entrar normalmente.
        </Alerta>
      )}
      {next && !erroLink && (
        <Alerta tipo="info" className="mb-6">
          Entre na sua conta para continuar de onde parou.
        </Alerta>
      )}

      <FormLogin next={next} />
    </LayoutAutenticacao>
  );
}
